---
tipo: sistema
titulo: Frontend
atualizado: 2026-08-10
---

# Frontend (Next.js 14 · App Router)

Páginas em `frontend/src/app/`. Três ambientes de trabalho sobre a mesma API.

## Rotas

| Rota | Ambiente | O que faz |
|------|----------|-----------|
| `/` | Entrada | Escolhe por onde entrar |
| `/totem` | Cliente na mesa | Cardápio, carrinho e o **Chef IA** (modo `totem`) |
| `/cozinha` | Cozinha | Fila de pedidos |
| `/admin` | Gestão | Dashboard |
| `/admin/cardapio` | Gestão | CRUD de produtos e categorias (abas) |
| `/admin/mesas` | Gestão | Salão, status e QR |
| `/admin/pedidos` | Gestão | Acompanhamento |
| `/admin/ia` | Gestão | Assistente IA (modo `admin`) |
| `/admin/personalizacao` | Gestão | White-label + **conta ativa do cérebro** |

## Camada de dados

TanStack Query com `staleTime` de 30s envolve todas as chamadas. O client axios e os
helpers por recurso ficam em `frontend/src/lib/api.ts`; os tipos em
`frontend/src/types/index.ts`.

## Layout

`RootLayout → Providers (QueryClient + BrandProvider + Toaster) → AppShell`.
O `AppShell` monta os componentes ambientes e o `<main>`.

## IA no client

`useIAChat(mode, inicial)` (`lib/ia/useChat.ts`) faz POST para `/api/ia/chat` e consome
a resposta como **stream de texto puro**, atualizando a bolha do assistente a cada chunk.
Ele envia junto o `conta` (slug) vindo do `BrandProvider`, que é o que seleciona o cérebro.

Ver também: [[Design System]], [[White-label]], [[IA e Cerebro]]
