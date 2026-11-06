---
tipo: sistema
titulo: Frontend
atualizado: 2026-11-06
---

# Frontend (Next.js 15 · App Router)

Páginas em `frontend/src/app/`. Três ambientes de trabalho sobre a mesma API.

## Rotas

| Rota | Ambiente | O que faz |
|------|----------|-----------|
| `/` | Entrada | Escolhe por onde entrar |
| `/totem` | Cliente na mesa | Cardápio, carrinho, acompanhamento e o **Chef IA** (modo `totem`) |
| `/cozinha` | Cozinha | Fila de pedidos por etapa, ao vivo (exige login) |
| `/entrar` | Equipe | Login |
| `/admin` | Gestão | Dashboard |
| `/admin/cardapio` | Gestão | CRUD de produtos e categorias (abas) |
| `/admin/mesas` | Gestão | Salão, status e QR code |
| `/admin/pedidos` | Gestão | Histórico e números do dia |
| `/admin/ia` | Gestão | Assistente IA (modo `admin`) e **Ensinar ao cérebro** |
| `/admin/personalizacao` | Gestão | White-label da marca |

## Camada de dados

TanStack Query com `staleTime` de 30s envolve todas as chamadas. O client axios e os
helpers por recurso ficam em `frontend/src/lib/api.ts`.

## IA no client

`useIAChat` (`lib/ia/useChat.ts`) faz POST para `/api/ia/chat` e consome a resposta como
**stream de texto puro**, atualizando a bolha do assistente a cada pedaço.

Ver também: [[Design System]], [[White-label]], [[IA e Cerebro]]
