#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
api_port="${SMARTFOOD_API_PORT:-8100}"
site_port="${SMARTFOOD_SITE_PORT:-3100}"
export NEXT_PUBLIC_API_URL="http://127.0.0.1:$api_port/api/v1"
export INTERNAL_API_URL="$NEXT_PUBLIC_API_URL"
export NEXT_PUBLIC_WS_URL="ws://127.0.0.1:$api_port"
export CORS_ORIGINS="http://127.0.0.1:$site_port,http://localhost:$site_port"
python_cmd="python3"
if command -v python3.12 >/dev/null 2>&1; then python_cmd="python3.12"; fi
"$python_cmd" -c 'import sys; assert sys.version_info >= (3, 12), "Instale Python 3.12 ou superior para executar esta versão."'
"$python_cmd" scripts/preparar-local.py
if [ ! -x backend/.venv/bin/python ]; then
  "$python_cmd" -m venv backend/.venv
fi
backend/.venv/bin/pip install -r backend/requirements.txt
(cd backend && .venv/bin/python manage.py migrate --noinput && .venv/bin/python manage.py seed_apresentacao && .venv/bin/python manage.py collectstatic --noinput)
(cd frontend && npm ci && npm run build)
(cd backend && .venv/bin/python manage.py runserver "127.0.0.1:$api_port" --noreload) &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT INT TERM
cd frontend
npm run start -- -H 127.0.0.1 -p "$site_port"
