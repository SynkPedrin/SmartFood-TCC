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
| Escrever em categorias, produtos e mesas | 401 | Somente administrador |
| Criar pedido | **Permitido** | Permitido |
| Listar e alterar pedidos | 401 | Permitido |
| Excluir pedidos | 401 | Recusado: preservar histórico |
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
| GET/PATCH | `/pedidos/{id}/` | Pedido específico; mesa e itens imutáveis |
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

Solicite um ticket em `POST /api/v1/auth/ws-ticket/` com o token no cabeçalho. Use o ticket na conexão dentro de 30 segundos; ele só pode ser consumido uma vez. O token da sessão não entra na URL.

```
wss://<host>/ws/cozinha/?ticket=<ticket>
```

Eventos:

```json
{ "tipo": "conectado" }
{ "tipo": "fila", "pedido": 12, "status": "recebido", "novo": true }
```

O evento é um aviso: ao recebê-lo, a interface busca a fila pela API. Assim o banco
permanece a única fonte de verdade.

## Rotas adicionadas na revisão de entrega

| Endpoint | Acesso e função |
|---|---|
| GET /api/v1/health/ | Público, conectividade com banco |
| GET e PATCH /api/v1/restaurante/ | Leitura pública; escrita somente administrador |
| GET /api/v1/indicadores/ | Equipe, totais agregados do dia |
| POST /api/v1/ia/acesso/ | Totem público com limite; admin exige sessão; conta autorizada no servidor |
| GET e POST /api/v1/ia/memorias/ | Leitura equipe; escrita somente administrador |
| POST /api/v1/auth/ws-ticket/ | Equipe, ticket de uso único válido por 30 segundos |
| GET /api/v1/acompanhamento/{uuid}/ | Público, apenas status e tempo estimado do pedido com código |

O pedido nasce recebido, limita cada quantidade a 99 e o corpo a 50 linhas. A chave_idempotencia deve ser UUID e evita duplicação da mesma tentativa. Itens e mesa não são alterados após criação. Histórico não pode ser excluído pela API. O token expira em 24 horas. As rotas Next de IA encaminham a sessão ao backend, e a memória deixa de gravar no disco da Vercel.
