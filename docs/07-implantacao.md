# Implantação do SmartFood

## Publicação atual: túnel a partir do Mac

O site público é https://smart-food-tcc-4k2l.vercel.app. O backend (Django em modo produção, SQLite) e o Ollama rodam no Mac do projeto e chegam à Vercel por túneis HTTPS gratuitos da Cloudflare. Um único comando faz tudo:

```sh
sh scripts/apresentacao.sh   # só na primeira vez, para instalar; depois pare com Ctrl+C
sh scripts/publicar.sh       # deixe o terminal aberto durante o uso
```

O `publicar.sh` aplica migrações e o cardápio, sobe o backend com `DEBUG=False`, abre os túneis, atualiza `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `NEXT_PUBLIC_WS_URL`, `OLLAMA_URL`, `OLLAMA_MODEL` e `OLLAMA_API_KEY` na Vercel e republica o site. O endereço do túnel muda a cada execução, por isso o script sempre republica. O Ollama fica atrás de `scripts/ollama-proxy.mjs`, que exige a chave `OLLAMA_PROXY_KEY` (guardada em `backend/.env`), só aceita `POST /api/chat` e força o modelo configurado.

Limites: o sistema só funciona com o Mac ligado, o Ollama aberto e o script rodando. Para ficar no ar 24 h, publique o backend numa nuvem (seções abaixo) e use Ollama Cloud ou Groq na Vercel.

O frontend já publicado na Vercel precisa receber uma nova versão para usar as alterações. Esta revisão não republicou a produção nem verificou sua URL. O backend deve ser atualizado antes do frontend, pois as novas interfaces dependem das rotas de indicadores, configuração, memória, acompanhamento e tickets de WebSocket.

## Vercel

Root Directory: `frontend`. Build Command: `npm run build`. Use Node 22. O projeto contém lockfile para instalação reproduzível.

| Variável | Valor esperado |
|---|---|
| NEXT_PUBLIC_API_URL | URL HTTPS da API terminando em /api/v1 |
| INTERNAL_API_URL | A mesma API acessível ao servidor da Vercel |
| NEXT_PUBLIC_WS_URL | Origem WSS do backend, sem /api/v1 |
| OLLAMA_URL | Endereço do Ollama acessível ao servidor. Na Vercel, `https://ollama.com` (Ollama Cloud) ou um servidor próprio publicado; `localhost` não funciona lá |
| OLLAMA_MODEL | Modelo do Ollama, por exemplo `qwen3.5:9b` (local) ou um modelo da nuvem |
| OLLAMA_API_KEY | Somente para o Ollama Cloud, privada, no servidor |
| GROQ_API_KEY / GROQ_MODEL | Opcionais: reserva usada se o Ollama falhar |
| CEREBRO_CONTA_PADRAO | Slug autorizado no backend, por exemplo smartfood-demo |

O cérebro Markdown viaja com a função como referência somente de leitura. Novas memórias são gravadas no banco Django, persistindo entre deploys. Sem motor de IA disponível, o assistente local se identifica e responde consultas de cardápio e indicadores. Uma falha da API deve aparecer como indisponibilidade, sem usar preços antigos para recomendar pratos.

Atualize as variáveis e faça o novo deploy. NEXT_PUBLIC_* entra no build. Verifique fotos, login, pedido, fila, entrega, acompanhamento e indicadores usando as URLs públicas reais.

## Backend

Requer Python 3.12 ou superior, PostgreSQL persistente e servidor ASGI. Redis permite eventos e limites de chamadas compartilhados entre processos. No ambiente local sem Redis há camada em memória, adequada para um processo.

Configure SECRET_KEY aleatória e privada, DEBUG=False, ALLOWED_HOSTS com o domínio da API, CORS_ORIGINS com a origem exata da Vercel, DATABASE_URL, REDIS_URL, CEREBRO_CONTA_PADRAO e CSRF_TRUSTED_ORIGINS se usar o admin Django. Mantenha DB_SSL_REQUIRE=True para PostgreSQL gerenciado com TLS. Para PostgreSQL interno em contêiner, o compose de produção define False.

Antes das migrações, gere backup do banco de produção com os recursos do seu provedor. Depois execute:

```sh
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py check --deploy
```

Inicialize o serviço:

```sh
daphne -b 0.0.0.0 -p 8000 smartfood.asgi:application
```

Para uma instalação nova de demonstração, configure DEMO_PASSWORD forte e execute `python manage.py seed_apresentacao`. O comando adiciona o cardápio oficial e as mesas, preserva pedidos existentes e não redefine senhas de usuários já criados. Não execute seeds automaticamente em produção: `seed_menu` atualiza preços e disponibilidade dos produtos oficiais.

Aplique HTTPS no proxy. O backend reconhece X-Forwarded-Proto, exige cookies seguros e usa HSTS em produção. O WebSocket aceita as origens configuradas em CORS_ORIGINS. O navegador solicita um ticket autenticado válido por 30 segundos antes de conectar. Tokens da equipe expiram após 24 horas, configuráveis por TOKEN_TTL_HOURS.

Fotos enviadas pelo administrador exigem disco persistente em MEDIA_ROOT. As fotos oficiais WebP estão também no frontend e permanecem acessíveis mesmo quando o disco de mídia da API não contém o seed. A configuração atual serve mídia pelo backend, suficiente para a demonstração. Para volume alto, planeje armazenamento/CDN próprio.

`GET /api/v1/health/` confirma conectividade básica com o banco. Isso não substitui teste funcional ou validação da IA.

## Docker para produção

O `docker-compose.prod.yml` usa Daphne, frontend compilado, usuários sem privilégios nas aplicações e volumes para PostgreSQL e mídia. Banco e Redis não expõem portas no host. As portas das aplicações escutam somente em 127.0.0.1 para uso atrás de um proxy HTTPS.

Preencha `.env` a partir do exemplo, incluindo senhas fortes para banco e Redis, domínios, CORS e chave Django. Rode:

```sh
docker compose -f docker-compose.prod.yml up --build -d
```

A definição foi inspecionada e sua sintaxe passou em `docker compose config --quiet`. O build e a execução dos contêineres ainda precisam de confirmação: o daemon Docker não estava em execução durante esta revisão.

## Apresentação local

```sh
sh scripts/apresentacao.sh
```

O script cria arquivos privados somente quando ausentes, instala as dependências, aplica migrações, carrega o cardápio oficial e compila o frontend. Abre o site em http://127.0.0.1:3100 com API em http://127.0.0.1:8100. A senha do admin está no campo DEMO_PASSWORD de `backend/.env`. Não publique nem compartilhe esse arquivo.

O comando não apaga registros existentes. Instalações que usaram o seed antigo podem conservar produtos adicionais: eles não aparecem no totem sem foto funcional.

## Verificação após publicação

Confirme primeiro o backend e suas migrações, depois o frontend. Registre data e URLs usadas. Confira login, pedidos, atualização da cozinha, entrega, liberação da mesa, receita, salvamento de marca em dois dispositivos e memória persistente após novo deploy. Teste uma pergunta real na Groq com o modelo configurado. A revisão local não comprova que a versão pública contém essas alterações.

As portas locais podem ser definidas por SMARTFOOD_API_PORT e SMARTFOOD_SITE_PORT. O script injeta os endereços consistentes durante a compilação, preservando arquivos de configuração já existentes.
