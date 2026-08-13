---
tipo: sistema
titulo: Arquitetura
atualizado: 2026-08-10
---

# Arquitetura

SmartFood é um sistema de gestão de restaurante (TCC UniSalesiano 2026) com três
ambientes de trabalho sobre a mesma base de dados: **salão/totem**, **cozinha** e
**administração**.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django + Django REST Framework |
| Banco | PostgreSQL (exposto na porta **5433**, não 5432) |
| Realtime | Django Channels + Redis (configurado, sem consumers ainda) |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Dados no client | TanStack Query (staleTime 30s) |
| IA | Groq (OpenAI-compat) via route handler do Next |
| Orquestração | Docker Compose |

## Fluxo de uma requisição

```
Browser → Next.js (App Router)
            ├── páginas React → axios → Django REST (/api/v1/…)
            └── /api/ia/chat  → lê snapshot do Django
                              → lê o cérebro da conta (vault Obsidian)
                              → Groq (stream) → texto puro de volta pro client
```

O client **nunca** fala com a Groq direto: a chave vive só no servidor.

## Portas

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000/api/v1/`
- Swagger: `/api/v1/docs/` · ReDoc: `/api/v1/redoc/`
- Postgres: `5433`

## Configuração

12-factor via `python-decouple` no backend e `process.env` no Next.
`DATABASE_URL` tem prioridade sobre os `DB_*` individuais quando presente e válida.

Ver também: [[Backend]], [[Frontend]], [[IA e Cerebro]]
