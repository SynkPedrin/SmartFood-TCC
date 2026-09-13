# Monografia — SmartFood

> **Nota sobre este documento**: este é um **rascunho completo gerado com apoio de IA**,
> construído em cima dos fatos reais do projeto (código, testes, decisões registradas em
> `docs/01` a `docs/07` e o histórico real de commits). Ele não substitui a sua revisão:
> releia cada seção, ajuste para a sua voz e confirme com o orientador se a sua instituição
> exige declaração de uso de IA de apoio à escrita. Os pontos que dependem só de você —
> nome, banca, data, reflexão pessoal — estão marcados com **[A CONFIRMAR]** e não foram
> inventados.

---

## Capa e elementos pré-textuais

| Campo | Valor |
|---|---|
| Instituição | UniSalesiano **[A CONFIRMAR: nome oficial completo e campus]** |
| Curso | Tecnologia em Análise e Desenvolvimento de Sistemas (TDS) **[A CONFIRMAR]** |
| Título do trabalho | SmartFood: um sistema de gestão de pedidos para restaurantes com fila de cozinha em tempo real e assistente de IA ancorado em dados reais |
| Autor | **[A CONFIRMAR]** |
| Orientador | Sergio Tonsig |
| Banca examinadora | **[A CONFIRMAR]** |
| Data de apresentação | 10/10/2026 |

### Resumo

Este trabalho apresenta o SmartFood, um sistema de gestão de pedidos para restaurantes
que integra três frentes de uso — autoatendimento do cliente na mesa, fila de preparo da
cozinha e painel administrativo — em uma única base de dados. O sistema foi construído com
Django REST Framework no backend e Next.js 14 no frontend, comunicando-se por API REST e
WebSocket. O núcleo do domínio — criação de pedido, congelamento de preço, máquina de
estados do fluxo de preparo e ocupação/liberação automática de mesa — é validado por 22
testes automatizados. A cozinha recebe pedidos novos em tempo real por WebSocket
autenticado, com busca periódica como mecanismo de recuperação caso a conexão caia. O
sistema inclui ainda um assistente de inteligência artificial que responde com base no
cardápio e nos dados reais do estabelecimento, evitando alucinação ao recusar informação
que o banco de dados não confirma. Os 20 requisitos funcionais levantados foram
implementados e verificados, e o backend foi hospedado publicamente para validação fora do
ambiente de desenvolvimento. O trabalho discute as decisões de projeto tomadas, os
resultados obtidos e as limitações declaradas de escopo.

**Palavras-chave**: gestão de restaurantes; API REST; WebSocket; máquina de estados;
autoatendimento; modelos de linguagem ancorados em dados.

### Abstract

This work presents SmartFood, an order-management system for restaurants that integrates
three usage fronts — customer self-ordering at the table, the kitchen preparation queue,
and an administrative panel — around a single data source. The system was built with
Django REST Framework on the backend and Next.js 14 on the frontend, communicating through
a REST API and WebSocket. The domain core — order creation, price freezing at sale time, an
explicit state machine for the preparation flow, and automatic table occupancy — is covered
by 22 automated tests. The kitchen receives new orders in real time through an
authenticated WebSocket, with periodic polling as a recovery mechanism if the connection
drops. The system also includes an AI assistant that answers based on the actual menu and
live restaurant data, avoiding hallucination by declining to state what the database does
not confirm. All 20 functional requirements gathered were implemented and verified, and the
backend was deployed publicly for validation outside the development environment. The work
discusses the design decisions made, the results obtained, and the declared scope
limitations.

**Keywords**: restaurant management; REST API; WebSocket; state machine; self-service;
data-grounded language models.

---

## 1. Introdução

### 1.1 Contextualização

Restaurantes de pequeno e médio porte costumam operar o fluxo entre salão e cozinha de
forma manual ou com ferramentas fragmentadas: comanda de papel, planilha para o cardápio,
caderno para controle de mesas. Esse arranjo funciona em baixo volume, mas cria pontos
cegos assim que o movimento cresce — o pedido pode se perder entre a mesa e a cozinha, o
preço vendido pode divergir do preço atual do cardápio quando há reajuste no meio do dia, e
o dono do estabelecimento só descobre o desempenho do dia depois de fechar o caixa, não
durante o expediente.

**[A CONFIRMAR]**: se você fez visitas de campo (a planilha de acompanhamento registra
"pesquisa de campo" concluída), é aqui que entra o relato do que foi observado nesses
ambientes — o que funcionava, o que quebrava, e como isso confirmou ou mudou o recorte do
projeto. Isso é experiência sua, não deve ser preenchido por terceiros.

### 1.2 Problema

Como estruturar, em um único sistema, o pedido feito pelo cliente na mesa, a fila de
preparo vista pela cozinha e o acompanhamento administrativo do dia, de forma que as três
visões nunca divirjam entre si e que o fluxo de preparo não possa ser burlado ou perdido?

### 1.3 Objetivo geral

Construir um sistema que integre pedido na mesa, fila da cozinha e gestão administrativa em
uma base de dados única, eliminando divergência entre o que o cliente pediu, o que a
cozinha está preparando e o que o administrador enxerga no relatório do dia.

### 1.4 Objetivos específicos

Derivados diretamente dos requisitos funcionais implementados (ver
[01-requisitos.md](01-requisitos.md)):

1. Permitir que o cliente monte e envie um pedido pela própria mesa, sem necessidade de
   conta (RF04–RF06).
2. Impedir, no servidor, pedidos inválidos — item indisponível ou pedido vazio — e
   registrar o preço praticado no momento da venda, imune a reajustes posteriores do
   cardápio (RF07–RF08).
3. Ocupar e liberar a mesa automaticamente conforme os pedidos abertos daquela mesa mudam
   de estado, sem depender de um funcionário lembrar de atualizar isso manualmente (RF09).
4. Apresentar à cozinha uma fila separada por etapa, que avança de forma controlada — sem
   pular passo e sem retroceder — e que atualiza sozinha quando um pedido novo chega
   (RF10–RF12).
5. Dar ao administrador visão de histórico, receita, ticket médio e mesas atendidas no dia,
   sem exigir consulta direta ao banco de dados (RF13–RF14).
6. Restringir o acesso administrativo e de cozinha por login, mantendo pública apenas a
   leitura do cardápio e a criação de pedido pelo cliente (RF15, RNF02).
7. Oferecer personalização de marca por conta e um assistente de IA que responda com base
   nos dados reais do estabelecimento, sem inventar informação (RF16–RF20, RNF03).

### 1.5 Justificativa

**[A CONFIRMAR]**: por que este problema importa o suficiente para justificar um TCC —
custo de erro operacional para o dono do restaurante, o quanto ferramentas fragmentadas
custam em retrabalho, ou a lacuna que você percebeu entre sistemas de mercado (caros,
fechados) e o que um estabelecimento pequeno consegue pagar. Isso é argumento seu; um
argumento genérico de IA aqui soaria dissociado do resto do texto, que é bem concreto.

### 1.6 Delimitação

O trabalho não cobre pagamento e emissão fiscal, controle de estoque e ficha técnica,
aplicativo nativo para celular, nem múltiplas unidades do mesmo restaurante — a
personalização de marca (white-label) é por conta, não por filial. Essas exclusões foram
declaradas desde o levantamento de requisitos exatamente para que a banca avalie o sistema
pelo que ele se propõe a fazer (ver "Fora do escopo" em
[01-requisitos.md](01-requisitos.md)).

---

## 2. Referencial teórico

### 2.1 Arquitetura cliente-servidor e API REST

O sistema segue o estilo arquitetural REST (*Representational State Transfer*), no qual o
servidor expõe recursos identificados por URL e manipulados por verbos HTTP (`GET`,
`POST`, `PATCH`), sem manter estado de sessão entre requisições — cada chamada carrega o
que precisa para ser entendida sozinha. Essa escolha permite que três clientes diferentes
(totem, painel de cozinha e painel administrativo) consumam a mesma API sem duplicar regra
de negócio: a validação de que um pedido não pode pular etapa, por exemplo, vive uma única
vez no servidor e vale para qualquer cliente que chame o endpoint, e não apenas para quem
usa a tela oficial.

### 2.2 Modelo relacional e integridade referencial

O banco de dados é relacional (PostgreSQL em produção, SQLite em desenvolvimento local), e
o desenho do esquema segue normalização até a Terceira Forma Normal nas entidades
principais (categoria, produto, mesa, pedido, item de pedido). Um ponto de desenho
merece destaque teórico: `ItemPedido.preco_unitario` duplica de propósito um dado que
também existe em `Produto.preco`. Trata-se de uma quebra deliberada de normalização estrita
em favor de integridade histórica — o mesmo raciocínio por trás de uma nota fiscal registrar
o valor praticado, não uma referência a uma tabela de preços que muda com o tempo.

### 2.3 Comunicação em tempo real: sondagem periódica versus WebSocket

Duas estratégias resolvem o problema de "a tela precisa saber de algo novo sem que o
usuário recarregue a página": *polling* (o cliente pergunta ao servidor em intervalos
regulares) e WebSocket (uma conexão persistente e bidirecional, na qual o servidor empurra
a atualização assim que ela existe). O WebSocket reduz a latência percebida e o volume de
requisições redundantes, mas introduz um novo modo de falha — a conexão pode cair sem que
nenhum dos dois lados perceba imediatamente. Por isso, sistemas que dependem de atualização
em tempo real para uma operação crítica (como uma fila de cozinha) tipicamente combinam as
duas técnicas: o evento em tempo real para a atualização rápida no caminho feliz, e a
sondagem periódica como rede de segurança para o caminho de falha.

### 2.4 Autenticação por token e autorização por papel

Autenticação (provar quem o usuário é) e autorização (decidir o que esse usuário pode
fazer) são preocupações distintas. O sistema usa autenticação por token — um identificador
opaco emitido no login e enviado em cada requisição subsequente pelo cabeçalho
`Authorization` — e autorização por papel simples (autenticado ou não), aplicada de forma
diferente conforme o recurso: leitura de cardápio é pública porque o cliente da mesa nunca
teve conta; criação de pedido é pública pelo mesmo motivo; listagem de pedidos, mudança de
status e qualquer escrita fora da criação de pedido exigem login, porque são operação
interna do estabelecimento.

### 2.5 Modelos de linguagem aplicados a domínio restrito

Modelos de linguagem de propósito geral respondem com fluência mesmo quando não têm a
informação correta — o fenômeno conhecido como alucinação. Uma estratégia para mitigar isso
em aplicações de domínio restrito é a ancoragem (*grounding*): em vez de deixar o modelo
responder livremente, o sistema injeta no prompt um retrato ao vivo dos dados reais (o
cardápio vigente, por exemplo) e instrui o modelo a recusar informação que esse retrato não
confirma. O SmartFood aplica esse princípio em duas camadas adicionais de contexto — a
persona do assistente e uma memória de longo prazo por conta — sempre com a regra de que,
em conflito entre o que a memória diz e o que o banco de dados diz, o banco de dados
prevalece.

### 2.6 Experiência do usuário em autoatendimento

Telas de autoatendimento (totens, quiosques) atendem um público que não recebeu
treinamento e frequentemente está sob pressão de tempo ou fila. A literatura de interação
humano-computador para esse contexto recomenda fluxos curtos, alvos de toque grandes e
feedback imediato de cada ação — princípios que orientaram o desenho do totem do cliente e
do painel de cozinha, este último pensado para uso em tablet dentro de um ambiente de
cozinha em movimento.

---

## 3. Metodologia

### 3.1 Tecnologias

A tabela completa de decisões tecnológicas está em [02-arquitetura.md](02-arquitetura.md).
Em síntese: Django 5 com Django REST Framework no backend, Django Channels com Daphne para
o servidor ASGI que sustenta o WebSocket, PostgreSQL como banco relacional, Next.js 14 (App
Router) com TanStack Query no frontend, e Groq como provedor do modelo de linguagem usado
pelo assistente de IA.

### 3.2 Modelagem e casos de uso

O modelo de dados (entidades, relacionamentos e justificativa de cada campo) está em
[03-modelo-de-dados.md](03-modelo-de-dados.md); os casos de uso, organizados por ator
(cliente, cozinha, administrador, sistema), estão em [04-casos-de-uso.md](04-casos-de-uso.md).

### 3.3 Processo de desenvolvimento

O desenvolvimento foi conduzido de forma incremental, com controle de versão Git desde o
commit inicial, e pode ser reconstituído pelo próprio histórico do repositório:

1. **Fundação** — estrutura dos dois projetos (Django e Next.js), modelo de dados inicial e
   o primeiro esqueleto do assistente de IA com memória por conta.
2. **Preparação para publicação** — ajuste do vault de memória da IA para ser publicado
   junto do frontend, primeira verificação de build de produção.
3. **Domínio de pedidos** — modelo de `Pedido` e `ItemPedido`, congelamento de preço,
   máquina de estados, ocupação e liberação de mesa, e a migração dos três painéis (totem,
   cozinha, administração) de dados fictícios para a API real.
4. **Segurança** — autenticação por token, fechamento de escrita da API para usuário não
   autenticado, mantendo pública apenas a leitura do cardápio e a criação de pedido.
5. **Qualidade e tempo real** — suíte de 22 testes automatizados cobrindo o núcleo do
   domínio, e o consumidor WebSocket que avisa a cozinha de pedidos novos.
6. **Documentação técnica** — os documentos de requisitos, arquitetura, modelo de dados,
   casos de uso, API, testes e implantação reunidos em `docs/`.
7. **Preparação para produção** — configuração de CORS por variável de ambiente, servidor
   ASGI de produção (Daphne) e hospedagem do backend fora do ambiente local.

Um retrato honesto do processo inclui também o que precisou ser corrigido: entre o estado
inicial do projeto e a retomada registrada neste trabalho, dezesseis pendências foram
levantadas em auditoria — da ausência total de testes automatizados a *ViewSets* sem
`permission_classes`, que permitiam que qualquer requisição sem autenticação apagasse um
produto do cardápio. Treze dessas dezesseis pendências foram resolvidas ao longo do
desenvolvimento; isso é discutido com mais detalhe na seção de Limitações.

**[A CONFIRMAR]**: se você usou alguma metodologia formal de gestão (Kanban, sprints
informais, alguma ferramenta de board), este é o lugar para descrever como organizou o
próprio tempo — isso não está no código, só na sua memória do processo.

---

## 4. Desenvolvimento

### 4.1 Arquitetura

Descrita e diagramada em [02-arquitetura.md](02-arquitetura.md): o frontend Next.js serve
as três interfaces (totem, cozinha, administração) e um conjunto de rotas de servidor
próprias para a IA; o backend Django expõe a API REST e o WebSocket da cozinha; um vault de
arquivos Markdown (`frontend/cerebro/`) guarda a memória de longo prazo de cada conta.

### 4.2 Banco de dados

O esquema completo, com a razão de cada tabela e cada campo, está em
[03-modelo-de-dados.md](03-modelo-de-dados.md).

### 4.3 API

A referência de endpoints está em [05-api.md](05-api.md), também disponível como OpenAPI
navegável (Swagger UI e ReDoc) gerado por `drf-spectacular` diretamente do código —
garantindo que a documentação da API nunca fique desatualizada em relação ao que o sistema
realmente aceita.

### 4.4 Interfaces

**A PREENCHER**: capturas de tela das quatro telas principais — totem, cozinha,
administração de pedidos e a tela de conversas com a IA. Recomenda-se uma captura do fluxo
completo (montar pedido → aparecer na cozinha → avançar status → aparecer no histórico do
admin) para reforçar visualmente a integração que é o argumento central deste trabalho.

### 4.5 Decisões de projeto

As decisões mais relevantes para a defesa — cada uma com o motivo, não só a escolha — estão
detalhadas em [02-arquitetura.md](02-arquitetura.md#decisões-de-projeto). As mais
prováveis de gerar pergunta da banca:

- **Por que o preço fica congelado no item, e não é lido do produto em tempo de exibição?**
  Porque um reajuste de cardápio não pode reescrever o faturamento de um pedido já
  fechado — a mesma razão pela qual uma nota fiscal registra o valor praticado, não uma
  referência à tabela de preços vigente.
- **Por que o WebSocket carrega só um aviso curto, e não o pedido inteiro?** Para que o
  banco de dados continue sendo a única fonte de verdade. Se o payload do evento trouxesse
  os dados do pedido, uma reconexão perdida poderia deixar a cozinha com informação velha
  sem que ninguém percebesse a divergência.
- **Por que a máquina de estados do pedido é validada no servidor, e não só escondida na
  interface?** Porque a regra precisa valer para qualquer cliente da API, não só para quem
  usa a tela oficial — inclusive para proteger contra erro de operação, não só má-fé.
- **Por que criar pedido é público, mas ver a fila não é?** Porque são papéis diferentes:
  quem cria o pedido é o cliente na mesa, que nunca teve conta; quem vê a fila e o
  histórico é a operação interna do restaurante.

### 4.6 Assistente de IA

O assistente combina três camadas de contexto no prompt enviado ao modelo — persona (tom e
comportamento esperado), cérebro da conta (identidade, diretrizes, cardápio e memória
específicos daquele estabelecimento) e um retrato ao vivo do banco de dados — com a regra
explícita de que, em conflito entre o cérebro e o banco, o banco prevalece. A chave de
acesso ao provedor do modelo de linguagem nunca é exposta ao navegador: apenas o servidor
do Next.js se comunica com o provedor externo, e o cliente fala apenas com esse servidor.

---

## 5. Resultados

### 5.1 Sistema entregue

Os 20 requisitos funcionais levantados no início do projeto foram implementados e
verificados — a lista completa, com o estado real de cada um, está em
[01-requisitos.md](01-requisitos.md). Não há requisito funcional declarado e não entregue.

### 5.2 Testes

22 testes automatizados cobrem o núcleo do domínio: criação de pedido, congelamento de
preço, fluxo de status, ocupação e liberação de mesa, filtros da fila e autenticação. O
detalhamento de cada teste e o porquê de existir estão em
[06-testes.md](06-testes.md), assim como o que **não** é coberto por teste automatizado —
interface, WebSocket e a camada de IA —, declarado com a mesma transparência.

### 5.3 Implantação

O frontend está publicado na Vercel; o backend, hospedado com banco de dados PostgreSQL
gerenciado, servido por ASGI (Daphne) para sustentar o WebSocket em produção. O processo
completo de implantação, variável por variável, está em
[07-implantacao.md](07-implantacao.md).

**[A CONFIRMAR ao fechar o texto]**: inserir aqui a URL pública final do backend e a data em
que a publicação foi verificada funcionando de ponta a ponta (idealmente a mesma sessão da
gravação do vídeo de atualização 2).

### 5.4 Limitações

Declaradas com a mesma franqueza usada durante todo o levantamento de requisitos:

- Sem pagamento, emissão fiscal, controle de estoque ou ficha técnica — fora do escopo
  desde o início.
- Sem aplicativo nativo; a interface do totem é web, otimizada para tablet fixo na mesa.
- Sem suporte a múltiplas unidades do mesmo restaurante — a personalização de marca é por
  conta, não por filial.
- Sem teste automatizado de interface nem de WebSocket; ambos foram verificados
  manualmente, com o motivo documentado em [06-testes.md](06-testes.md).
- O banco de dados PostgreSQL gerenciado usado na implantação de demonstração está no
  plano gratuito do provedor, que expira automaticamente 30 dias após a criação — uma
  limitação operacional da demonstração, não do sistema em si, e que precisa de atenção
  perto da data da apresentação para não expirar antes da banca.

---

## 6. Conclusão

**[A CONFIRMAR — texto abaixo é um rascunho de partida, não uma reflexão pronta]**

O desenvolvimento do SmartFood partiu de um estado bem mais frágil do que o sistema final
sugere: um projeto sem persistência real de pedidos, sem autenticação, com telas
consumindo dados fictícios e sem nenhum teste automatizado. Levar esse projeto a um sistema
com fluxo de pedido ponta a ponta, autenticação, 22 testes automatizados e comunicação em
tempo real exigiu tratar cada uma dessas lacunas como uma pendência explícita, não como
detalhe a resolver depois — treze das dezesseis pendências herdadas de uma auditoria de
retomada foram resolvidas ao longo do trabalho.

Entre os aprendizados técnicos mais concretos está o valor de decisões de projeto
documentadas com o motivo, e não só a escolha: ao revisar o próprio trabalho semanas
depois, entender *por que* o preço fica congelado no item do pedido, ou *por que* o
WebSocket carrega só um aviso, foi mais rápido por essas decisões estarem registradas do
que seria reconstruí-las pela leitura do código.

**[A CONFIRMAR]**: o que você pessoalmente levaria para um próximo projeto, o que faria
diferente com o tempo que teve, e os trabalhos futuros que você recomendaria — controle de
estoque, aplicativo nativo, suporte a múltiplas filiais, teste automatizado de interface —
são conclusões que só fazem sentido na sua própria voz.

---

## Referências

Base técnica direta do trabalho (documentação oficial, verificável):

- DJANGO SOFTWARE FOUNDATION. **Django documentation**. Disponível em:
  https://docs.djangoproject.com/. Acesso em: 2026.
- ENCODE. **Django REST Framework documentation**. Disponível em:
  https://www.django-rest-framework.org/. Acesso em: 2026.
- DJANGO SOFTWARE FOUNDATION. **Django Channels documentation**. Disponível em:
  https://channels.readthedocs.io/. Acesso em: 2026.
- VERCEL. **Next.js documentation**. Disponível em: https://nextjs.org/docs. Acesso em:
  2026.
- POSTGRESQL GLOBAL DEVELOPMENT GROUP. **PostgreSQL documentation**. Disponível em:
  https://www.postgresql.org/docs/. Acesso em: 2026.
- MDN WEB DOCS. **WebSockets API**. Disponível em:
  https://developer.mozilla.org/docs/Web/API/WebSockets_API. Acesso em: 2026.

**[A CONFIRMAR]**: referências de engenharia de software e fundamentação teórica exigidas
pela sua instituição (por exemplo, bibliografia de Engenharia de Software, Banco de Dados e
Interação Humano-Computador usada na disciplina). Evite aceitar citação de artigo ou livro
específico sugerida por IA sem checar a existência e o conteúdo da fonte — é o tipo de erro
que uma banca identifica rápido.

---

## Apêndices sugeridos

- Diagramas de caso de uso e de classes já produzidos durante a modelagem inicial.
- Trecho comentado da máquina de estados do pedido (`Pedido.TRANSICOES`).
- Trecho comentado da montagem do prompt em três camadas do assistente de IA.
- Instruções de execução do projeto — já mantidas atualizadas no `README.md` do
  repositório.
