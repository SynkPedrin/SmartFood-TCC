---
tipo: sistema
titulo: Backend
atualizado: 2026-08-10
---

# Backend (Django REST Framework)

Projeto `smartfood`. Todo o domínio vive em `backend/apps/`, e cada app segue o mesmo
formato: `models.py → serializers.py → views.py → urls.py`.

## Apps

| App | Domínio |
|-----|---------|
| `apps.categorias` | Categorias do cardápio |
| `apps.produtos` | Itens do cardápio (FK → Categoria, upload de imagem via Pillow) |
| `apps.mesas` | Mesas do salão, com status e QR code automático |

Todos registram sob `api/v1/` em `backend/smartfood/urls.py`. A raiz `/` redireciona
para o Swagger.

## Modelos que a IA precisa conhecer

**Produto**: `nome`, `descricao`, `preco` (decimal), `disponivel` (bool),
`tempo_preparo` (minutos), `categoria` (FK), `imagem`.
`__str__` = `"{nome} - R$ {preco}"`.

**Categoria**: `nome`, `descricao`, `ativo`.

**Mesa**: `numero` (único), `capacidade` (padrão 4), `status`, `qr_code`, timestamps.
Status possíveis:

| Valor | Rótulo |
|-------|--------|
| `disponivel` | Disponível |
| `ocupada` | Ocupada |
| `reservada` | Reservada |
| `manutencao` | Em Manutenção |

O `qr_code` é gerado no `save()` como `mesa-<numero>` quando vazio.

## Convenções DRF

- Paginação global: **20 por página** (respostas vêm em `{ results: [...] }`).
- `django-filter` + busca + ordenação habilitados globalmente.
- OpenAPI via `drf-spectacular`.
- Channels/Redis configurados (`ASGI_APPLICATION`, `CHANNEL_LAYERS`) para WebSocket futuro.

## Regra para a IA

Preço, disponibilidade e status de mesa **sempre** vêm do snapshot ao vivo do banco,
nunca do cérebro. O cérebro guarda o que o banco não sabe: contexto, história, intenção.

Ver também: [[Arquitetura]], [[IA e Cerebro]]
