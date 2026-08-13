# SmartFood

Sistema de gestão para restaurantes desenvolvido como Trabalho de Conclusão de Curso.
Um único sistema atende três públicos: o **cliente** no totem da mesa, a **cozinha** e a
**administração**.

<p>
  <img alt="Django" src="https://img.shields.io/badge/Django-5.1-092E20?logo=django&logoColor=white">
  <img alt="DRF" src="https://img.shields.io/badge/DRF-3.15-A30000">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white">
</p>

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 5 + Django REST Framework |
| Banco | PostgreSQL 16 (porta **5433** no host, para não conflitar com instalações locais) |
| Realtime | Django Channels + Redis (infra configurada) |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estado remoto | TanStack Query |
| IA | Groq (OpenAI-compat), chamada por route handler do Next |
| Orquestração | Docker Compose |

## Como rodar

### Stack completa (recomendado)

```bash
cp .env.example .env      # preencha SECRET_KEY e, se for usar a IA, GROQ_API_KEY
docker compose up --build
```

| Serviço | Endereço |
|---------|----------|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api/v1/ |
| Swagger UI | http://localhost:8000/api/v1/docs/ |
| ReDoc | http://localhost:8000/api/v1/redoc/ |

### Separado

```bash
# backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# frontend
cd frontend
npm install
npm run dev
```

## Estrutura

```
backend/            projeto Django "smartfood"
  apps/categorias/  categorias do cardápio
  apps/produtos/    itens do cardápio (FK categoria, upload de imagem)
  apps/mesas/       mesas do salão, status e QR code automático
frontend/           Next.js 14 (App Router)
  src/app/          páginas: /, /totem, /cozinha, /admin/*
  src/lib/api.ts    client axios e helpers por recurso
  src/lib/ia/       persona, snapshot do banco e cérebro da conta
  cerebro/          vault Obsidian: memória de longo prazo da IA, isolada por conta
```

## Telas

| Rota | Público |
|------|---------|
| `/` | Entrada, escolhe o ambiente |
| `/totem` | Cliente na mesa: cardápio, carrinho e Chef IA |
| `/cozinha` | Fila de preparo |
| `/admin` | Painel de gestão |
| `/admin/cardapio` | CRUD de produtos e categorias |
| `/admin/mesas` | Salão, status e QR |
| `/admin/ia` | Assistente com os dados do restaurante |
| `/admin/personalizacao` | White-label e conta ativa |

## API

Todos os recursos ficam sob `/api/v1/`, com paginação de 20 itens, busca, filtros e
ordenação. A documentação é gerada por `drf-spectacular`.

| Recurso | Endpoint |
|---------|----------|
| Categorias | `/api/v1/categorias/` |
| Produtos | `/api/v1/produtos/` |
| Mesas | `/api/v1/mesas/` |

## IA com cérebro por conta

A IA responde a partir de três camadas: a **persona** do modo (`admin` ou `totem`), o
**cérebro da conta** (vault Obsidian em `frontend/cerebro/Contas/<slug>/`) e um **snapshot ao vivo**
do banco. Em conflito de preço ou disponibilidade, o banco tem precedência.

Cada conta tem memória própria e isolada: identidade, diretrizes, cardápio comentado,
operação e memórias datadas. A conta ativa é escolhida em **Admin → Personalização**, e é
possível ensinar algo novo à IA em **Admin → Assistente IA → Ensinar ao cérebro**.

| Rota interna | Função |
|--------------|--------|
| `POST /api/ia/chat` | Chat com o cérebro da conta injetado |
| `GET /api/ia/contas` | Contas que possuem cérebro no vault |
| `POST /api/ia/memoria` | Grava um aprendizado na memória da conta |

A chave da Groq vive apenas no servidor: o navegador nunca fala com a API do modelo.

## Estado atual

Implementado e funcionando de ponta a ponta:

- CRUD de categorias, produtos e mesas (API + telas)
- Documentação automática da API
- Totem, cozinha e painel administrativo
- Personalização white-label por conta
- Assistente de IA com dados reais e cérebro por conta

Em desenvolvimento:

- Persistência de **pedidos** (as telas de pedido e cozinha ainda usam dados de exemplo)
- Autenticação e controle de acesso
- Consumers WebSocket para atualizar a cozinha em tempo real
- Testes automatizados

## Deploy na Vercel

A Vercel hospeda o **frontend**. Django, PostgreSQL e Redis precisam de outro provedor
(Render, Railway, Fly.io), porque a Vercel não roda processos persistentes com banco.

Ao importar o repositório em [vercel.com/new](https://vercel.com/new):

| Campo | Valor |
|-------|-------|
| Framework Preset | Next.js (detectado) |
| **Root Directory** | `frontend` |
| Build Command | padrão (`next build`) |

Variáveis de ambiente do projeto na Vercel:

| Variável | Valor |
|----------|-------|
| `GROQ_API_KEY` | sua chave da Groq (obrigatória para a IA) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `CEREBRO_CONTA_PADRAO` | `smartfood-demo` |
| `NEXT_PUBLIC_API_URL` | URL pública da API Django, quando existir |
| `INTERNAL_API_URL` | a mesma URL, usada pelo servidor do Next |

O vault do cérebro fica em `frontend/cerebro/` justamente para viajar junto no deploy. As
rotas de IA leem esses arquivos em tempo de execução, então o `next.config.js` declara
`outputFileTracingIncludes` para incluí-los no bundle serverless.

Sem um backend público, o site sobe funcionando: a IA responde com o cérebro da conta e
avisa com transparência que os dados ao vivo do restaurante estão indisponíveis.

## Variáveis de ambiente

Veja [.env.example](.env.example). As principais:

| Variável | Para quê |
|----------|----------|
| `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Django |
| `DB_*` ou `DATABASE_URL` | Banco (a `DATABASE_URL` tem prioridade) |
| `NEXT_PUBLIC_API_URL` | URL da API vista pelo navegador |
| `INTERNAL_API_URL` | URL da API vista pelo servidor do Next |
| `GROQ_API_KEY`, `GROQ_MODEL` | IA |
| `CEREBRO_DIR`, `CEREBRO_CONTA_PADRAO` | Vault do cérebro |
