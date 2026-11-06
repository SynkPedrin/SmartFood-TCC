---
tipo: sistema
titulo: Arquitetura
atualizado: 2026-11-06
---

# Arquitetura

SmartFood é um sistema de gestão de restaurante (TCC UniSalesiano 2026) com três
ambientes de trabalho sobre a mesma base de dados: **salão/totem**, **cozinha** e
**administração**.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 5.2 + Django REST Framework, servido por Daphne (ASGI) |
| Banco | PostgreSQL em produção, SQLite no desenvolvimento local |
| Tempo real | Django Channels: WebSocket `/ws/cozinha/`, Redis em produção, memória no local |
| Frontend | Next.js 15 (App Router) + TypeScript |
| Dados no client | TanStack Query (staleTime 30s) |
| IA | Ollama (modelo local, padrão `qwen3.5:9b`) via route handler do Next; Groq opcional como reserva |
| Orquestração | Docker Compose (desenvolvimento e produção) |

## Fluxo de uma requisição

```
Browser → Next.js (App Router)
            ├── páginas React → axios → Django REST (/api/v1/…)
            ├── cozinha → ticket de 30 s → WebSocket /ws/cozinha/ → refaz a busca na API
            └── /api/ia/chat  → autoriza a conta no Django
                              → lê snapshot, indicadores e memórias do Django
                              → lê o cérebro da conta (este vault)
                              → Ollama (stream) → texto puro de volta pro client
```

O client **nunca** fala com o motor de IA direto: só o servidor do Next chama o Ollama
(e a Groq, se configurada como reserva). Sem motor disponível, um assistente local
identificado responde consultas simples de cardápio e indicadores.

## Configuração

12-factor via `python-decouple` no backend e `process.env` no Next.
`DATABASE_URL` tem prioridade sobre os `DB_*` individuais quando presente e válida.

Ver também: [[Backend]], [[Frontend]], [[IA e Cerebro]]
