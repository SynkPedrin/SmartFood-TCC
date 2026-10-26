# SmartFood: gestão de pedidos para restaurantes com acompanhamento da cozinha e assistente baseado em dados

Texto técnico revisado em 09/10/2026 a partir do código e das verificações locais. É material para a monografia; a normalização institucional, a fundamentação bibliográfica, os relatos pessoais e os dados da banca precisam da revisão dos autores e do orientador. O documento não comprova entrega de vídeos ou realização da defesa.

## Identificação

- Autores: Pedro Gabriel Andrade Venegeroles (RA 220303) e João Pedro Paschoaletto Bianchini (RA 220300).
- Curso: Tecnologia em Desenvolvimento de Sistemas, 5º termo, conforme o RAP.
- Orientador: Prof. Sergio Tonsig.
- Grupo: TDS-2026-99.
- Defesa prevista: 10/10/2026, conforme o planejamento informado no RAP.
- Instituição: UniSalesiano; conferir a denominação oficial e o campus na capa institucional.
- Banca: preencher com os nomes oficialmente confirmados.

## Resumo

Este trabalho apresenta o SmartFood, um sistema web que integra autoatendimento do cliente, fila de preparo da cozinha e acompanhamento administrativo em uma base de dados comum. O frontend utiliza Next.js 15 e o backend utiliza Django 5.2 com Django REST Framework, Channels e Daphne. A API valida o estado inicial do pedido, a disponibilidade dos produtos, as quantidades, o preço praticado e as transições de preparo. O sistema impede duplicação de pedidos por repetição da mesma tentativa e atualiza a ocupação das mesas. A comunicação por WebSocket sinaliza alterações, complementada por consultas periódicas à API. O assistente consulta o cardápio e, para usuários autenticados, os indicadores do restaurante e as notas da equipe. Um modo local identificado oferece consultas determinísticas quando o provedor externo não está disponível. A validação executada compreendeu 49 testes do backend, 12 testes do assistente local e das imagens, build de produção e dez verificações de integração local. A implantação pública e a geração pelo provedor externo permanecem sem confirmação nesta revisão. O resultado demonstra a integração do fluxo de pedidos no ambiente local, sem medir ganhos de produtividade ou faturamento.

Palavras-chave: gestão de pedidos; restaurantes; API REST; WebSocket; autoatendimento; assistente baseado em dados.

## Abstract

SmartFood is a web system that combines customer self-ordering, a kitchen preparation queue and administrative monitoring in a shared database. The frontend uses Next.js 15, while the backend uses Django 5.2, Django REST Framework, Channels and Daphne. The API validates initial order status, product availability, quantities, historical prices and preparation transitions. Idempotency prevents duplicate orders when the same submission is retried. WebSocket notifications complement periodic API requests. The assistant retrieves current menu data and, for authenticated staff, operational indicators and persisted notes. An explicitly identified local mode provides deterministic queries when the external provider is unavailable. Local validation comprised 49 backend tests, 12 assistant and image tests, a production build and ten integration checks. Public deployment and generation through the external provider have not been verified in this review. No productivity or revenue improvement was measured.

Keywords: order management; restaurants; REST API; WebSocket; self-service; data-grounded assistant.

## 1. Introdução

O projeto aborda a integração entre a escolha do cliente, o preparo da cozinha e o acompanhamento administrativo. Quando essas atividades dependem de registros separados, a equipe precisa reconciliar informações sobre itens, preços e etapas. O SmartFood propõe uma base comum para esse fluxo. Essa descrição é a motivação de projeto; não representa resultado de pesquisa de campo ou comparação comercial medida.

A questão de desenvolvimento é: como organizar pedidos de mesa, fila de preparo e indicadores em um sistema web que valide suas regras no servidor e permita acompanhar as mudanças?

O objetivo geral é implementar e verificar esse fluxo integrado. Os objetivos específicos são permitir consulta e envio de pedidos, registrar preços históricos, controlar etapas e mesas, apresentar indicadores, restringir operações internas por autenticação e oferecer consultas assistidas com dados atuais.

O escopo inclui categorias, produtos, mesas, pedidos, cozinha, administração, marca configurável e assistente. Pagamentos, divisão de conta, gorjetas, emissão fiscal, estoque, aplicativo nativo e múltiplas unidades não integram esta versão.

## 2. Fundamentos e decisões técnicas

A arquitetura cliente-servidor concentra a validação de negócios na API. O navegador apresenta os dados e envia solicitações; o servidor verifica cada ação antes de persistir. Assim, esconder uma opção na interface não constitui a única proteção de uma regra.

No modelo relacional, cada item registra quantidade e preço unitário praticado. O preço histórico evita que a atualização posterior do cardápio altere pedidos já registrados. Transações e bloqueios coordenam mudanças do pedido e da mesa. A chave única de tentativa permite recuperar o pedido após uma falha de rede sem criar outro registro.

WebSocket mantém uma conexão para avisar a cozinha sobre alterações. O evento dispara uma nova consulta; a API continua sendo a fonte do estado persistido. Consultas periódicas oferecem recuperação quando a conexão de eventos está indisponível. A publicação de eventos ocorre após a confirmação da transação.

Autenticação identifica a equipe e autorização define as operações permitidas. Tokens têm validade configurável, com padrão de 24 horas. Um ticket de uso único, válido por 30 segundos, autoriza a conexão WebSocket. A leitura do cardápio e a criação de pedidos são públicas; operações internas exigem autenticação e escritas de cadastro, marca e memória exigem administrador.

A integração com modelos de linguagem fornece contexto atual ao provedor e instruções para limitar respostas ao domínio. Isso reduz a necessidade de inferir preços e disponibilidade, mas não garante ausência de erros. As notas persistidas são referências, não autorização para executar ações. O assistente não confirma pagamento, alteração de pedido ou escrita que não realizou.

A fundamentação bibliográfica formal deve ser complementada com fontes efetivamente lidas pelos autores, seguindo as exigências da instituição. Nenhuma entrevista, livro ou experimento foi inventado nesta revisão.

## 3. Método de desenvolvimento e verificação

A revisão comparou o RAP de 23/09/2026 ao código existente. O relatório registrava a persistência de pedidos, o fluxo de estados, a cozinha e a integração de chat, além de pendências de autenticação da IA, memória e regressão. O percentual estimado no RAP não foi convertido em medida de conclusão nesta revisão.

As correções foram implementadas em uma cópia isolada, preservando credenciais, dados e os 22 testes originais. Novos testes cobriram permissões, entrada inválida, repetição de pedidos, indicadores agregados, memória, configuração e tickets. A execução de integração utilizou os servidores locais Next e Django e releitura dos registros após as operações. As evidências estão em `06-testes.md`, `09-auditoria-rap-e-entrega.md` e `evidencias/smoke.json`.

SQLite foi usado na validação local. PostgreSQL e Redis estão previstos na configuração de produção. A definição Docker foi preparada para Daphne e aplicações sem privilégios, com volumes de dados; os contêineres não foram executados porque o daemon não estava disponível.

## 4. Sistema desenvolvido

### 4.1 Interfaces

O totem permite selecionar mesa, buscar e ordenar pratos, ajustar quantidades, registrar observações e revisar o pedido. Os produtos sem foto específica ou com falha de carregamento ficam ocultos no cardápio público. Os cadastros permanecem disponíveis à administração para correção. Dos 54 produtos oficiais, 24 têm fotos específicas existentes; as demais entradas não são apresentadas ao cliente enquanto não recebem foto funcional.

A cozinha organiza pedidos por etapa e recebe avisos em tempo real. A administração reúne indicadores do dia, cadastro de cardápio, mesas com QR code, pedidos, personalização e consultas assistidas. A marca pode ser pré-visualizada e salva no banco, permitindo que outro dispositivo consulte a configuração persistida.

Capturas atuais das interfaces devem ser inseridas após inspeção no navegador. A ferramenta de navegação impediu essa inspeção nesta revisão por falha de verificação da política de acesso; fotografias de produtos não substituem capturas do sistema.

### 4.2 Pedidos e indicadores

Novos pedidos começam em recebido. As transições admitidas seguem as regras do domínio, com cancelamento quando permitido. O servidor rejeita quantidades fora do intervalo, itens indisponíveis e mesas bloqueadas. A mesa ocupada admite complementação de pedidos. A última entrega ou cancelamento libera a mesa conforme os pedidos restantes.

O acompanhamento público utiliza um identificador aleatório e retorna somente informações reduzidas de status. A receita administrativa soma os preços históricos dos pedidos entregues na data de Brasília. Os cálculos consideram todos os registros do período, independentemente da paginação usada na interface, e não representam recebimento financeiro confirmado.

### 4.3 Assistente

O modo do cliente consulta apenas os pratos visíveis e disponíveis, sem notas internas ou indicadores da equipe. O modo administrativo exige sessão e consulta os dados operacionais. As notas da equipe são persistidas no Django, evitando depender de gravação em arquivos temporários das funções da Vercel.

Sem chave externa ou diante de indisponibilidade do provedor, o modo local informa sua origem e responde consultas estruturadas sobre preço, tempo de preparo, orçamento e indicadores. Ele não se apresenta como geração por um modelo externo e não garante adequação alimentar com base apenas no nome do prato. A integração Groq está implementada, mas sua chamada real não foi validada no ambiente isolado.

## 5. Resultados e limitações

A suíte final executada aprovou 49 testes do backend e 12 testes do assistente local e das imagens. O build de produção concluiu. As dez verificações de integração confirmaram localmente autorização, repetição sem duplicação, transições, liberação de mesa, indicadores, gravação e consulta de memória, assistência local, rejeição de entrada inválida e handshake WebSocket.

O autor informou que o frontend já está na Vercel. Sem as URLs da instalação, esta revisão não comprovou que a publicação contém as alterações ou que a API pública está operacional. O backend precisa ser atualizado antes do frontend, pois a interface revisada depende de novas rotas e migrações.

Não foram realizados teste de carga, auditoria de penetração, avaliação de respostas reais do provedor externo ou inspeção visual completa. Não foram medidos redução de erros, aumento de vendas ou satisfação de usuários. Os testes locais estabelecem evidência sobre os comportamentos examinados, sem provar todas as condições possíveis de produção.

## 6. Conclusão

O SmartFood implementa um fluxo de pedidos com persistência comum, preços históricos, validação de etapas e acompanhamento por diferentes interfaces. A revisão tratou as pendências técnicas identificadas no RAP e ampliou a verificação local, além de melhorar a apresentação do cardápio e a persistência de configuração e memória.

A conclusão de implantação exige conferir a instalação pública, a configuração do provedor de IA e as interfaces no navegador. Como trabalhos futuros, propõem-se avaliação com usuários, testes de carga, armazenamento dedicado de mídia e ampliação do domínio conforme necessidades levantadas. A reflexão sobre o processo acadêmico e as experiências pessoais deve ser redigida pelos autores.

## Fontes técnicas e material do projeto

- RAP TDS-2026-99 de 23/09/2026, fornecido pelos autores.
- Código e documentação do SmartFood; evidências locais de 09/10/2026.
- Django: https://docs.djangoproject.com/en/5.2/
- Django REST Framework: https://www.django-rest-framework.org/
- Channels: https://channels.readthedocs.io/
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs/

As referências acima identificam a documentação técnica; completar a formatação e as datas de consulta reais conforme o padrão institucional. Não substituem uma revisão bibliográfica acadêmica.
