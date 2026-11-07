#!/bin/sh
# Deixa o scripts/publicar.sh rodando como serviço do macOS (LaunchAgent):
# independe de terminal aberto, sobe sozinho no login e volta se cair.
#
#   sh scripts/servico.sh instalar   # liga agora e a cada login
#   sh scripts/servico.sh status     # mostra se está no ar e o fim do log
#   sh scripts/servico.sh parar      # tira do ar e não sobe mais no login
set -eu
cd "$(dirname "$0")/.."
raiz="$(pwd)"
rotulo="com.smartfood.publicar"
plist="$HOME/Library/LaunchAgents/$rotulo.plist"
dominio="gui/$(id -u)"
log="$raiz/.publicar/servico.log"

caminho() { # PATH com as ferramentas do usuário: o launchd não lê o perfil do shell
  for c in node vercel cloudflared; do
    p="$(command -v $c)" || { echo "Erro: $c não encontrado no PATH" >&2; exit 1; }
    dirname "$p"
  done | sort -u | tr '\n' ':'
  echo "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
}

case "${1:-status}" in
  instalar)
    mkdir -p "$raiz/.publicar" "$HOME/Library/LaunchAgents"
    cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$rotulo</string>
  <key>ProgramArguments</key>
  <array><string>/bin/sh</string><string>$raiz/scripts/publicar.sh</string></array>
  <key>WorkingDirectory</key><string>$raiz</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$(caminho)</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$log</string>
  <key>StandardErrorPath</key><string>$log</string>
</dict>
</plist>
EOF
    launchctl bootout "$dominio/$rotulo" 2>/dev/null || true
    launchctl bootstrap "$dominio" "$plist"
    echo "Serviço instalado. Acompanhe com: sh scripts/servico.sh status"
    ;;
  parar)
    launchctl bootout "$dominio/$rotulo" 2>/dev/null || true
    rm -f "$plist"
    echo "Serviço parado e removido do login."
    ;;
  status)
    if launchctl print "$dominio/$rotulo" >/dev/null 2>&1; then
      echo "Serviço: $(launchctl print "$dominio/$rotulo" | sed -n 's/^[[:space:]]*state = //p' | head -1)"
    else
      echo "Serviço: não instalado"
    fi
    [ -f "$log" ] && tail -n 12 "$log"
    ;;
  *)
    echo "Uso: sh scripts/servico.sh instalar|status|parar" >&2
    exit 1
    ;;
esac
