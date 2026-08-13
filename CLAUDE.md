# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SmartFood is a restaurant management system (TCC UniSalesiano 2026). It has a Django REST Framework backend and a Next.js 14 frontend, orchestrated via Docker Compose.

## Commands

### Full stack (recommended)
```bash
# Copy env and start everything
cp .env.example .env
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Swagger UI: http://localhost:8000/api/v1/docs/
- ReDoc: http://localhost:8000/api/v1/redoc/

### Frontend (standalone)
```bash
cd frontend
npm install
npm run dev       # dev server on :3000
npm run build     # production build
npm run lint      # ESLint
```

### Backend (standalone)
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

> Postgres is exposed on **port 5433** (not 5432) to avoid conflicts with local installations.

## Architecture

### Backend - `backend/`

Django project named `smartfood`. All domain logic lives in `apps/`:

| App | Purpose |
|-----|---------|
| `apps/categorias` | Product categories |
| `apps/produtos` | Menu items (FK → Categoria, image upload via Pillow) |
| `apps/mesas` | Tables with status choices and auto-generated QR codes |

Each app follows the same layout: `models.py → serializers.py → views.py → urls.py`. All apps register at `api/v1/` - see [backend/smartfood/urls.py](backend/smartfood/urls.py).

DRF is configured with `drf-spectacular` (OpenAPI), `django-filter`, pagination (20/page), and search/ordering filters globally. Django Channels + Redis are wired up (`ASGI_APPLICATION` set, `CHANNEL_LAYERS` configured) for future WebSocket features - no consumers exist yet.

Config is 12-factor via `python-decouple`. `DATABASE_URL` takes priority over individual `DB_*` vars when present and valid.

### Frontend - `frontend/`

Next.js 14 App Router. Pages live in `src/app/`:

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/categorias` | Category CRUD |
| `/produtos` | Product CRUD |
| `/mesas` | Table management |

**Data layer**: TanStack Query (staleTime 30 s) wraps all API calls. The axios client and per-resource API helpers are in [frontend/src/lib/api.ts](frontend/src/lib/api.ts). All TypeScript types are in [frontend/src/types/index.ts](frontend/src/types/index.ts).

**Layout**: `RootLayout → Providers (QueryClient + Toaster) → AppShell`. `AppShell` renders three ambient components - `ConstellationBg`, `DynamicIsland`, `CursorTrail` - then a `<main>` for page content.

**Navigation**: `DynamicIsland` is a floating pill fixed at the top-center. Collapsed it shows the current page icon+label; on hover it expands to show all nav items as magnetic pills (Framer Motion spring + GSAP elastic bounce on route change).

### Design system

Sandy/light neo-brutalist theme. Key tokens defined in [frontend/tailwind.config.ts](frontend/tailwind.config.ts):

- **Background**: `#f4ede1` (sand) / `#faf5ee` (surface) / `#ffffff` (elevated)
- **Brand**: purple `#6d28d9`, cyan `#0891b2`
- **Shadows**: neo-brutalist hard offset - `shadow-neo` (`4px 4px 0 0 rgba(0,0,0,0.82)`), `shadow-neo-purple`, `shadow-neo-cyan`
- **Font**: Space Grotesk (sans/display), JetBrains Mono (mono)
- **Gradients**: `brand-gradient` (135deg purple→cyan), `logo-gradient` (purple→indigo→cyan)

Global CSS and ambient background orbs are in [frontend/src/app/globals.css](frontend/src/app/globals.css).

### Cérebro (vault Obsidian por conta)

`cerebro/` é um vault Obsidian que serve de memória de longo prazo da IA. Estrutura:

- `Sistema/` - conhecimento compartilhado do produto (todas as contas leem).
- `Contas/<slug>/` - cérebro isolado de cada conta: `Conta.md` (frontmatter com nome,
  segmento, `ia_nome`, `ia_tom`, accent), `Identidade.md`, `Diretrizes.md`, `Cardapio.md`,
  `Operacao.md` e `Memoria/AAAA-MM-DD.md` (append-only).
- `Templates/Conta/` - molde para uma conta nova.

O loader é [frontend/src/lib/ia/cerebro.ts](frontend/src/lib/ia/cerebro.ts) (server-only,
usa `fs`): localiza o vault via `CEREBRO_DIR` ou subindo a partir do `cwd`, valida o slug
contra `^[a-z0-9][a-z0-9-]*$` (impede path traversal), lê na ordem
Conta → Identidade → Diretrizes → Cardapio → Operacao → últimas 5 memórias, corta em 12k
caracteres e cacheia 15s.

O system prompt final é `persona (modo) + cérebro (conta) + snapshot (banco)`; em conflito
de preço/disponibilidade **vale o banco**. A conta ativa é `brand.accountId`
(localStorage), enviada como `conta` no POST de `/api/ia/chat`; a resposta traz o header
`X-Cerebro` com o slug usado. Se o slug não existir, a IA degrada para persona + snapshot.

| Rota | Função |
|------|--------|
| `POST /api/ia/chat` | Chat com cérebro da conta injetado |
| `GET /api/ia/contas` | Lista contas que têm cérebro no vault |
| `POST /api/ia/memoria` | Grava aprendizado em `Contas/<slug>/Memoria/` |

Trocar de conta: **Admin → Personalização → Conta ativa**. Ensinar algo à IA:
**Admin → Assistente IA → Ensinar ao cérebro**.

### Environment variables

See [.env.example](.env.example) for all required vars. Key frontend var: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000/api/v1`).
