# Testes e evidências

Revisão de 09/10/2026. O backend mantém os 22 testes originais de pedidos e autenticação e acrescenta 27 testes de entrega e segurança, totalizando 49. O frontend tem 12 testes de foto e assistente local.

## Backend

```sh
cd backend
.venv/bin/python manage.py test
```

Os testes cobrem estado inicial obrigatório, fluxo de etapas, preço congelado, mesa ocupada/liberada, item indisponível, pedido vazio, quantidade limitada, idempotência, bloqueio da alteração de itens e mesa, preservação do histórico, autorização da IA, isolamento da instalação, limites de chamada, memória persistente e autoria, marca persistente, indicadores além da primeira página, expiração de token e ticket WebSocket de uso único.

O teste de indicadores cria 25 pedidos entregues e um cancelado, confirmando receita de R$ 500,00 e ticket médio de R$ 20,00. Esses valores pertencem à fixture de teste, sem representar vendas do restaurante.

## Frontend e assistente

```sh
cd frontend
npm test
npm run lint
npm run typecheck
npm run build
```

Os 12 testes confirmam resolução de fotos locais, exclusão de placeholders, preferência pela foto enviada pelo administrador, existência dos 24 arquivos do manifesto, recomendação por orçamento, exclusão de item indisponível, indicação de fonte local, ausência de garantias de alergênicos e de ranking/receita não consultados, fallback do backend indisponível e regras do prompt.

As respostas livres do provedor externo não são avaliadas por esses testes. A chamada real à Groq não foi verificada sem chave no ambiente isolado. Não há teste automatizado da interface no navegador.

## Integração executada

`node scripts/smoke.mjs` roda somente no ambiente local de apresentação e cria/conclui um pedido real. O resultado com data e verificações está em `evidencias/smoke.json`. O script confirma acesso da IA, pedido sem duplicação, todas as etapas, mesa liberada, receita, memória relida no banco, consultas locais de assistente e handshake WebSocket autenticado.

## Limitações

A inspeção visual da interface foi impedida pela política da ferramenta de navegador. A integração pública não foi verificada sem as URLs. A stack PostgreSQL/Redis em Docker não foi executada porque o daemon estava desligado. Não houve teste de carga nem teste de penetração.
