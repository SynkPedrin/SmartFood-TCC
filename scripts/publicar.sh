#!/bin/sh
# Publica o SmartFood a partir deste Mac: backend e Ollama rodam aqui e ficam
# acessíveis ao site da Vercel por túneis HTTPS da Cloudflare (sem conta).
#
#   sh scripts/publicar.sh
#
# O endereço do túnel muda a cada execução, por isso o script atualiza as
# variáveis da Vercel e republica o site. Enquanto roda, o Mac não entra em
# repouso e um vigia confere a API a cada minuto: se o túnel cair, abre outro e
# republica sozinho. Deixe o terminal aberto: fechar (Ctrl+C) tira o sistema do ar. Rode antes `sh scripts/apresentacao.sh` uma vez
# para instalar as dependências, e pare-o: as duas coisas usam a porta 8100.
set -eu
cd "$(dirname "$0")/.."
site="${SMARTFOOD_VERCEL_URL:-https://smart-food-tcc-4k2l.vercel.app}"
projeto="${SMARTFOOD_VERCEL_PROJECT:-smart-food-tcc-4k2l}"
modelo="${OLLAMA_MODEL:-qwen3.5:9b}"
api_porta=8100
proxy_porta=11435
logs=.publicar
mkdir -p "$logs"

falha() { echo "Erro: $1" >&2; exit 1; }
[ -x backend/.venv/bin/daphne ] || falha "rode antes: sh scripts/apresentacao.sh (instala o backend)"
command -v cloudflared >/dev/null || falha "instale o cloudflared: brew install cloudflared"
command -v vercel >/dev/null || falha "instale a CLI da Vercel: npm i -g vercel"
lsof -iTCP:$api_porta -sTCP:LISTEN >/dev/null 2>&1 && falha "a porta $api_porta está em uso (pare o apresentacao.sh)"
curl -sf http://127.0.0.1:11434/api/tags >/dev/null || falha "Ollama fora do ar: abra o app Ollama"

# Chave do proxy do Ollama, guardada no arquivo privado do backend.
if ! grep -q '^OLLAMA_PROXY_KEY=' backend/.env; then
  echo "OLLAMA_PROXY_KEY=$(openssl rand -hex 32)" >> backend/.env
fi
chave="$(sed -n 's/^OLLAMA_PROXY_KEY=//p' backend/.env | tail -1)"

pids=""
tuneis=""
trap '[ -n "$pids$tuneis" ] && kill $pids $tuneis 2>/dev/null; echo; echo "SmartFood fora do ar."' EXIT
trap 'exit 0' INT TERM

# Repouso do Mac derruba os túneis gratuitos (a Cloudflare apaga o túnel desconectado).
caffeinate -i -s -w $$ &

abrir_tunel() { # $1 = porta local, $2 = nome do log
  cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$1" > "$logs/$2.log" 2>&1 &
  tuneis="$tuneis $!"
}
url_do_tunel() { # $1 = nome do log; espera a Cloudflare informar a URL pública
  for _ in $(seq 1 60); do
    url="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$logs/$1.log" | head -1 || true)"
    [ -n "$url" ] && { echo "$url"; return 0; }
    sleep 1
  done
  return 1
}
definir() { vercel env add "$1" production --value "$2" --force --yes --project "$projeto" >/dev/null 2>&1; }
aquecer() { # carrega o modelo com o mesmo contexto da IA, para a pergunta não esperar
  curl -sf http://127.0.0.1:11434/api/generate -d "{\"model\":\"$modelo\",\"keep_alive\":\"2h\",\"options\":{\"num_ctx\":16384}}" >/dev/null || true
}
api_viva() { curl -sf -m 15 "$api/api/v1/health/" >/dev/null; }
# O proxy responde 404 a GET: qualquer resposta HTTP prova que o túnel da IA está de pé.
ia_viva() { [ "$(curl -s -m 15 -o /dev/null -w '%{http_code}' "$ia/" || true)" = 404 ]; }

publicar() { # abre os túneis, aponta a Vercel para eles e republica; 1 se falhar
  [ -n "$tuneis" ] && kill $tuneis 2>/dev/null
  tuneis=""
  abrir_tunel $api_porta tunel-api
  abrir_tunel $proxy_porta tunel-ia
  api="$(url_do_tunel tunel-api)" || { echo "   o túnel da API não subiu (veja $logs/tunel-api.log)"; return 1; }
  ia="$(url_do_tunel tunel-ia)" || { echo "   o túnel da IA não subiu (veja $logs/tunel-ia.log)"; return 1; }
  for _ in $(seq 1 60); do api_viva && break; sleep 2; done
  api_viva || { echo "   a API não respondeu pelo túnel"; return 1; }
  echo "   API: $api"
  echo "   Atualizando as variáveis da Vercel"
  definir NEXT_PUBLIC_API_URL "$api/api/v1" &&
    definir INTERNAL_API_URL "$api/api/v1" &&
    definir NEXT_PUBLIC_WS_URL "$(echo "$api" | sed 's#^https#wss#')" &&
    definir OLLAMA_URL "$ia" &&
    definir OLLAMA_MODEL "$modelo" &&
    definir OLLAMA_API_KEY "$chave" &&
    definir CEREBRO_CONTA_PADRAO smartfood-demo || { echo "   não consegui atualizar a Vercel"; return 1; }
  echo "   Republicando o site (cerca de 1 minuto)"
  vercel redeploy "$site" --target production > "$logs/vercel.log" 2>&1 || { echo "   a Vercel não republicou (veja $logs/vercel.log)"; return 1; }
  aquecer
}

echo "1/5 Banco e cardápio"
(cd backend && .venv/bin/python manage.py migrate --noinput >/dev/null && .venv/bin/python manage.py seed_apresentacao && .venv/bin/python manage.py collectstatic --noinput >/dev/null)

echo "2/5 Backend em modo produção e proxy do Ollama"
(cd backend && DEBUG=False SECURE_SSL_REDIRECT=False \
  ALLOWED_HOSTS=".trycloudflare.com,127.0.0.1,localhost" \
  CORS_ORIGINS="$site,http://127.0.0.1:3100,http://localhost:3100" \
  CSRF_TRUSTED_ORIGINS="$site" \
  exec .venv/bin/daphne -b 127.0.0.1 -p $api_porta smartfood.asgi:application) > "$logs/backend.log" 2>&1 &
pids="$pids $!"
OLLAMA_PROXY_KEY="$chave" OLLAMA_MODEL="$modelo" OLLAMA_PROXY_PORT=$proxy_porta \
  node scripts/ollama-proxy.mjs > "$logs/proxy.log" 2>&1 &
pids="$pids $!"

echo "3/5 Túneis HTTPS, Vercel e republicação"
publicar || falha "a publicação não terminou"

echo
echo "SmartFood no ar: $site"
echo "Deixe este terminal aberto. Ctrl+C tira o sistema do ar."

# Vigia: a cada minuto confere os dois túneis; três falhas seguidas, republica.
falhas=0
voltas=0
while sleep 60; do
  voltas=$((voltas + 1))
  [ $((voltas % 60)) -eq 0 ] && aquecer
  if api_viva && ia_viva; then falhas=0; continue; fi
  falhas=$((falhas + 1))
  [ $falhas -lt 3 ] && continue
  echo "$(date '+%H:%M') Túnel caiu. Abrindo outro e republicando..."
  if publicar; then echo "$(date '+%H:%M') SmartFood de volta: $site"; falhas=0; else falhas=2; fi
done
