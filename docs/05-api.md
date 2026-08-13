# API

Base: `/api/v1/`. Documentação viva em `/api/v1/docs/` (Swagger) e `/api/v1/redoc/`.
Todas as listagens são paginadas em 20 itens e aceitam busca, filtro e ordenação.

## Autenticação

Token do DRF no cabeçalho:

```
Authorization: Token <chave>
```

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login/` | Troca usuário e senha por um token |
| POST | `/auth/logout/` | Invalida o token atual |
| GET | `/auth/eu/` | Dados do dono do token |

## Regras de acesso

| Operação | Sem login | Com login |
|----------|-----------|-----------|
| Ler categorias, produtos e mesas | Permitido | Permitido |
| Escrever em categorias, produtos e mesas | 401 | Permitido |
| Criar pedido | **Permitido** | Permitido |
| Listar, alterar e excluir pedidos | 401 | Permitido |
| Mudar status do pedido | 401 | Permitido |
| WebSocket da cozinha | Recusado no handshake | Permitido |

Criar pedido é público de propósito: quem cria é o cliente na mesa, que não tem conta.

## Recursos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/categorias/` | Categorias do cardápio |
| GET/PATCH/DELETE | `/categorias/{id}/` | Categoria específica |
| GET/POST | `/produtos/` | Produtos; filtros `disponivel` e `categoria` |
| GET/PATCH/DELETE | `/produtos/{id}/` | Produto específico |
| GET/POST | `/mesas/` | Mesas do salão |
| GET/PATCH/DELETE | `/mesas/{id}/` | Mesa específica |
| GET/POST | `/pedidos/` | Pedidos; filtros `status`, `mesa` e `aberto` |
| GET/PATCH/DELETE | `/pedidos/{id}/` | Pedido específico |
| POST | `/pedidos/{id}/status/` | Avança a etapa respeitando o fluxo |

### Criar pedido

```http
POST /api/v1/pedidos/
Content-Type: application/json

{
  "mesa": 4,
  "observacao": "aniversário na mesa",
  "itens": [
    { "produto": 1, "quantidade": 2, "observacao": "sem cebola" },
    { "produto": 9, "quantidade": 1 }
  ]
}
```

Resposta `201` com o pedido completo: total calculado, itens com o preço congelado,
status `recebido` e o tempo estimado de preparo.

Erros esperados:

| Situação | Resposta |
|----------|----------|
| Item indisponível | 400 com o nome do produto |
| Lista de itens vazia | 400 |
| Mesa inexistente | 400 |

### Mudar status

```http
POST /api/v1/pedidos/12/status/
Authorization: Token <chave>

{ "status": "preparando" }
```

Transição inválida devolve 400 explicando a origem e o destino recusados.

## WebSocket

```
ws://<host>/ws/cozinha/?token=<chave>
```

Eventos:

```json
{ "tipo": "conectado" }
{ "tipo": "fila", "pedido": 12, "status": "recebido", "novo": true }
```

O evento é um aviso: ao recebê-lo, a interface busca a fila pela API. Assim o banco
permanece a única fonte de verdade.
