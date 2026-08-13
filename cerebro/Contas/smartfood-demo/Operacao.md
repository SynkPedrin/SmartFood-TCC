---
tipo: operacao
conta: smartfood-demo
---

# Operação

## Salão

Mesas cadastradas no banco, com capacidade padrão 4 e QR code `mesa-<numero>` gerado
automaticamente. Status possíveis: disponível, ocupada, reservada, em manutenção.

Mesa em manutenção não aparece como opção de alocação em nenhuma sugestão da IA.

## Horário de referência (demonstração)

| Dia | Funcionamento |
|-----|---------------|
| Terça a quinta | 11h30 às 15h · 18h30 às 23h |
| Sexta e sábado | 11h30 às 15h · 18h30 às 00h |
| Domingo | 11h30 às 16h |
| Segunda | Fechado |

## Fluxo do pedido

1. Cliente lê o QR da mesa e abre o totem.
2. Monta o pedido e confirma no painel.
3. Pedido cai na fila da cozinha.
4. Cozinha muda o status conforme avança.
5. Admin acompanha em `/admin/pedidos`.

## Picos

Sexta e sábado à noite concentram a maior ocupação. Sugestão de promoção deve
preferir os dias fracos (terça e quarta) em vez de reforçar o pico.
