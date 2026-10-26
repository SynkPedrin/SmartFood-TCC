# Modelo de dados

## Diagrama entidade-relacionamento

```mermaid
erDiagram
    CATEGORIA ||--o{ PRODUTO : classifica
    PRODUTO   ||--o{ ITEM_PEDIDO : "é vendido em"
    MESA      ||--o{ PEDIDO : origina
    PEDIDO    ||--|{ ITEM_PEDIDO : contém
    USUARIO   ||--o| TOKEN : possui

    CATEGORIA {
        int id PK
        string nome
        text descricao
        bool ativo
        datetime criado_em
        datetime atualizado_em
    }

    PRODUTO {
        int id PK
        string nome
        text descricao
        decimal preco
        image imagem
        int categoria_id FK
        bool disponivel
        smallint tempo_preparo
        datetime criado_em
        datetime atualizado_em
    }

    MESA {
        int id PK
        smallint numero UK
        smallint capacidade
        string status
        string qr_code UK
        datetime criado_em
        datetime atualizado_em
    }

    PEDIDO {
        int id PK
        int mesa_id FK
        string status
        uuid acompanhamento UK
        uuid chave_idempotencia UK
        text observacao
        datetime criado_em
        datetime atualizado_em
    }

    ITEM_PEDIDO {
        int id PK
        int pedido_id FK
        int produto_id FK
        smallint quantidade
        decimal preco_unitario
        string observacao
    }

    USUARIO {
        int id PK
        string username UK
        string password
        bool is_staff
    }

    TOKEN {
        string key PK
        int user_id FK
    }
```

## Dicionário de dados

### Categoria

| Campo | Tipo | Regra |
|-------|------|-------|
| nome | varchar | Nome exibido no cardápio |
| descricao | text | Opcional |
| ativo | boolean | Categoria inativa não deveria aparecer ao cliente |

### Produto

| Campo | Tipo | Regra |
|-------|------|-------|
| nome | varchar | Nome do prato |
| descricao | text | Texto de vitrine, opcional |
| preco | decimal | Preço atual do cardápio, não o preço histórico |
| imagem | arquivo | Upload tratado com Pillow |
| categoria | FK | Protegida contra exclusão em cascata indevida |
| disponivel | boolean | `false` bloqueia a inclusão em novos pedidos |
| tempo_preparo | smallint | Minutos; alimenta a estimativa mostrada ao cliente |

### Mesa

| Campo | Tipo | Regra |
|-------|------|-------|
| numero | smallint | Único no salão |
| capacidade | smallint | Padrão 4 lugares |
| status | varchar | `disponivel`, `ocupada`, `reservada`, `manutencao` |
| qr_code | varchar | Gerado como `mesa-<numero>` quando vazio |

O status é mantido pelo sistema: abrir pedido ocupa a mesa, e fechar o último pedido dela
devolve para disponível.

### Pedido

| Campo | Tipo | Regra |
|-------|------|-------|
| mesa | FK | `PROTECT`: mesa com histórico não é apagada por engano |
| status | varchar | `recebido`, `preparando`, `pronto`, `entregue`, `cancelado` |
| observacao | text | Observação geral do pedido |

Campos calculados, expostos pela API e não gravados: `total`, `quantidade_itens` e
`tempo_preparo_estimado`, este último igual ao item mais demorado, porque a cozinha
trabalha em paralelo.

### ItemPedido

| Campo | Tipo | Regra |
|-------|------|-------|
| pedido | FK | `CASCADE`: item não existe sem o pedido |
| produto | FK | `PROTECT`: produto vendido não some do histórico |
| quantidade | smallint | Entre 1 e 99 pela API |
| preco_unitario | decimal | **Congelado** no momento do pedido |
| observacao | varchar | "sem cebola", "bem passado" |

## Máquina de estados do pedido

```mermaid
stateDiagram-v2
    [*] --> recebido: cliente envia pelo totem
    recebido --> preparando: cozinha inicia
    recebido --> cancelado: desistência
    preparando --> pronto: cozinha finaliza
    preparando --> cancelado: problema na cozinha
    pronto --> entregue: garçom entrega
    entregue --> [*]
    cancelado --> [*]
```

Depois de `pronto` não há cancelamento: o prato existe e o custo já foi incorrido. Qualquer
outra transição é recusada pela API com HTTP 400.

## Persistência adicionada na revisão

Pedido.acompanhamento é um UUID único gerado pelo servidor; chave_idempotencia é um UUID opcional único por tentativa. A migração preenche os pedidos existentes individualmente antes de exigir o acompanhamento.

Configuracao armazena a marca em JSON por slug da instalação. Memoria armazena texto, autor e data; somente administrador grava. WebsocketTicket registra UUID, usuário e expiração e é consumido atomicamente antes do handshake autenticado. O token DRF usa sua data de criação para o prazo de sessão configurado.
