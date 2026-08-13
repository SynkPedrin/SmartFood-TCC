# Requisitos

Cada requisito traz o estado real no código, não a intenção. `Implementado` significa
que existe endpoint ou tela funcionando e, quando marcado, teste automatizado cobrindo.

## Requisitos funcionais

| ID | Requisito | Ator | Estado |
|----|-----------|------|--------|
| RF01 | Cadastrar, editar, listar e excluir categorias do cardápio | Administrador | Implementado |
| RF02 | Cadastrar, editar, listar e excluir produtos, com preço, descrição, tempo de preparo, imagem e disponibilidade | Administrador | Implementado |
| RF03 | Cadastrar mesas com número, capacidade e status, gerando o QR code automaticamente | Administrador | Implementado |
| RF04 | Consultar o cardápio sem autenticação, a partir da mesa | Cliente | Implementado |
| RF05 | Montar um pedido com vários itens e quantidades | Cliente | Implementado |
| RF06 | Enviar o pedido, que passa a existir no banco e entra na fila da cozinha | Cliente | Implementado, com teste |
| RF07 | Impedir pedido de produto indisponível ou pedido sem itens | Sistema | Implementado, com teste |
| RF08 | Registrar o preço praticado no momento do pedido | Sistema | Implementado, com teste |
| RF09 | Ocupar a mesa quando um pedido é aberto e liberá-la quando o último pedido dela fecha | Sistema | Implementado, com teste |
| RF10 | Visualizar a fila de pedidos separada por etapa | Cozinha | Implementado |
| RF11 | Avançar o pedido na fila respeitando o fluxo, sem pular etapa nem voltar | Cozinha | Implementado, com teste |
| RF12 | Receber pedidos novos na cozinha sem recarregar a tela | Cozinha | Implementado (WebSocket) |
| RF13 | Acompanhar histórico de pedidos com filtro por status | Administrador | Implementado |
| RF14 | Ver receita, número de pedidos, ticket médio e mesas atendidas no dia | Administrador | Implementado |
| RF15 | Entrar no sistema com usuário e senha | Equipe | Implementado, com teste |
| RF16 | Personalizar nome, logo, cor de acento e plano de fundo por conta | Administrador | Implementado |
| RF17 | Conversar com um assistente de IA sobre os dados reais do restaurante | Administrador | Implementado |
| RF18 | Manter memória de longo prazo por conta, isolada entre contas | Sistema | Implementado |
| RF19 | Ensinar um fato novo ao assistente, que passa a valer nas próximas respostas | Administrador | Implementado |
| RF20 | Recomendar pratos ao cliente com base apenas no cardápio existente | Cliente | Implementado |

## Requisitos não funcionais

| ID | Requisito | Como é atendido |
|----|-----------|-----------------|
| RNF01 | A API deve ser documentada | OpenAPI gerado por `drf-spectacular`, com Swagger e ReDoc publicados |
| RNF02 | Escrita na API exige autenticação | Token do DRF; leitura do cardápio e criação de pedido seguem públicas por decisão de projeto |
| RNF03 | O sistema não deve inventar dados na resposta da IA | O prompt proíbe explicitamente e a resposta é ancorada num retrato ao vivo do banco |
| RNF04 | Segredos não podem ficar no código | `.env` fora do versionamento; a chave da IA só existe no servidor |
| RNF05 | A interface deve ser usável em tablet no salão e na cozinha | Layout responsivo, alvos de toque grandes na cozinha |
| RNF06 | O sistema deve continuar utilizável se um serviço cair | Cozinha volta para busca periódica sem WebSocket; a IA avisa quando o banco está fora em vez de inventar |
| RNF07 | O código deve ser reproduzível em outra máquina | Docker Compose, `.env.example` e comando de seed |
| RNF08 | Deve haver testes automatizados do núcleo | 22 testes cobrindo pedido, fluxo de status, permissões e autenticação |
| RNF09 | Respeitar preferência de menos movimento | `prefers-reduced-motion` respeitado nas animações |

## Fora do escopo

Declarado para a banca não cobrar o que nunca foi prometido:

- Pagamento e emissão fiscal.
- Controle de estoque e ficha técnica.
- Aplicativo nativo para celular.
- Múltiplas unidades do mesmo restaurante (o white-label é por conta, não por filial).

## A PREENCHER

- Justificativa do tema e problema de pesquisa.
- Público-alvo real considerado, se houve entrevista ou levantamento.
- Priorização (MoSCoW ou similar) e o critério usado.
