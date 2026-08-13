# Implantação

O sistema tem duas metades que vivem em lugares diferentes: o frontend em edge (Vercel) e
o backend com banco em um servidor comum.

## Frontend na Vercel

| Campo | Valor |
|-------|-------|
| Framework | Next.js (detectado) |
| Root Directory | `frontend` |
| Build | padrão (`next build`) |

Variáveis de ambiente:

| Variável | Para quê |
|----------|----------|
| `GROQ_API_KEY` | Chave do modelo de linguagem. Sem ela, a IA responde 500 |
| `GROQ_MODEL` | Modelo usado, por exemplo `llama-3.3-70b-versatile` |
| `NEXT_PUBLIC_API_URL` | URL pública da API, vista pelo navegador |
| `INTERNAL_API_URL` | Mesma API, vista pelo servidor do Next |
| `NEXT_PUBLIC_WS_URL` | Base do WebSocket, por exemplo `wss://api.exemplo.com` |
| `CEREBRO_CONTA_PADRAO` | Conta usada quando o navegador não informa nenhuma |

Variável nova só passa a valer depois de um novo deploy: a Vercel injeta no build.

O vault do cérebro fica em `frontend/cerebro/` justamente para viajar junto. As rotas de IA
leem esses arquivos em tempo de execução, e por isso `next.config.js` declara
`outputFileTracingIncludes`, sem o que os arquivos não entram no pacote da função.

## Backend

A Vercel não hospeda o Django com banco e WebSocket. Opções que atendem: Render, Railway ou
Fly.io, todas com PostgreSQL gerenciado e suporte a processo persistente.

Antes de publicar:

1. `DEBUG=False`
2. `SECRET_KEY` forte e única, fora do repositório
3. `ALLOWED_HOSTS` com o domínio real
4. `CORS_ALLOWED_ORIGINS` com o domínio do frontend
5. `DATABASE_URL` do banco gerenciado
6. `REDIS_URL` se quiser o WebSocket entre vários processos
7. Servir por ASGI, para o WebSocket existir:

```bash
daphne -b 0.0.0.0 -p 8000 smartfood.asgi:application
```

Depois do primeiro deploy:

```bash
python manage.py migrate
python manage.py seed_demo     # cardápio, salão e usuário da equipe
```

`seed_demo` cria o usuário `admin`. A senha vem de `DEMO_PASSWORD`; sem ela, usa um padrão
que só serve para ambiente local. **Troque em produção.**

## Local com Docker

```bash
cp .env.example .env
docker compose up --build
```

Sobe banco, Redis, backend e frontend juntos. O Postgres é exposto na porta 5433 para não
conflitar com instalação local.

## Local sem Docker

```bash
# backend
cd backend
pip install -r requirements.txt
DATABASE_URL="sqlite:///db.sqlite3" python manage.py migrate
DATABASE_URL="sqlite:///db.sqlite3" python manage.py seed_demo
DATABASE_URL="sqlite:///db.sqlite3" python manage.py runserver

# frontend
cd frontend && npm install && npm run dev
```

Sem Redis alcançável, a camada de canal cai para memória: o WebSocket funciona dentro do
processo, que é o suficiente para desenvolver e apresentar.
