---
tipo: sistema
titulo: Backend
atualizado: 2026-11-06
---

# Backend (Django REST Framework)

Projeto `smartfood`. Todo o domínio vive em `backend/apps/`, e cada app segue o mesmo
formato: `models.py → serializers.py → views.py → urls.py`.

## Apps

| App | Domínio |
|-----|---------|
| `apps.categorias` | Categorias do cardápio |
| `apps.produtos` | Itens do cardápio, foto e carga do cardápio oficial (`seed_menu`) |
| `apps.mesas` | Mesas do salão, com status e QR code automático |
| `apps.pedidos` | Pedidos e itens, fila da cozinha, máquina de estados, WebSocket |
| `apps.restaurante` | Marca, memória da IA, indicadores do dia, acompanhamento, saúde |

Todos registram sob `api/v1/`. Documentação viva em `/api/v1/docs/` e `/api/v1/redoc/`.

## Modelos que a IA precisa conhecer

**Produto**: `nome`, `slug`, `descricao`, `preco`, `disponivel`, `tempo_preparo`
(minutos), `categoria`, `imagem`. Produto sem foto fica oculto no totem.

**Categoria**: `nome`, `descricao`, `ativo`.

**Mesa**: `numero` (único), `capacidade` (padrão 4), `status`, `qr_code` (`mesa-<numero>`).
Status: disponível, ocupada, reservada, em manutenção.

**Pedido**: status Recebido → Em preparo → Pronto → Entregue. Cancelar só antes de
Pronto. Preço de cada item congelado na venda. Abrir pedido ocupa a mesa; o último
pedido entregue ou cancelado libera a mesa.

## Indicadores

Receita do dia soma só pedidos **entregues**, na data de Brasília. Não é pagamento
confirmado: o sistema não tem módulo de pagamento.

## Regra para a IA

Preço, disponibilidade e status de mesa **sempre** vêm do snapshot ao vivo do banco,
nunca do cérebro. O cérebro guarda o que o banco não sabe: contexto, história, intenção.

Ver também: [[Arquitetura]], [[IA e Cerebro]]
