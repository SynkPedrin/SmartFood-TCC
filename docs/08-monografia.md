# Esqueleto da monografia

Estrutura sugerida com o que já está pronto no repositório e o que depende de você. Os
trechos marcados com **A PREENCHER** foram deixados em branco de propósito: texto acadêmico
inventado é pior que texto faltando.

## Capa e elementos pré-textuais

**A PREENCHER**: instituição, curso, título, autor, orientador, banca, data, resumo,
abstract, palavras-chave.

## 1. Introdução

- **1.1 Contextualização** — A PREENCHER: cenário da gestão em restaurantes de pequeno e
  médio porte, o que motivou o tema.
- **1.2 Problema** — A PREENCHER: a pergunta que o trabalho responde.
- **1.3 Objetivo geral** — pronto: construir um sistema que integre pedido na mesa, fila da
  cozinha e gestão administrativa em uma base de dados única.
- **1.4 Objetivos específicos** — derivados dos requisitos em [01-requisitos.md](01-requisitos.md).
- **1.5 Justificativa** — A PREENCHER.
- **1.6 Delimitação** — pronto: a seção "Fora do escopo" dos requisitos.

## 2. Referencial teórico

**A PREENCHER**, mas os temas que o trabalho de fato usa são:

- Arquitetura cliente-servidor e API REST.
- Modelo relacional e normalização.
- Comunicação em tempo real: HTTP com sondagem periódica versus WebSocket.
- Autenticação por token e autorização por papel.
- Modelos de linguagem aplicados a domínio restrito, e ancoragem de resposta em dados
  reais para reduzir alucinação.
- Experiência do usuário em autoatendimento.

## 3. Metodologia

- **Tecnologias** — pronto: tabela em [02-arquitetura.md](02-arquitetura.md).
- **Modelagem** — pronto: [03-modelo-de-dados.md](03-modelo-de-dados.md).
- **Casos de uso** — pronto: [04-casos-de-uso.md](04-casos-de-uso.md).
- **Processo de desenvolvimento** — A PREENCHER: como você organizou o trabalho, em que
  ordem, com que ferramentas de controle.

## 4. Desenvolvimento

- **4.1 Arquitetura** — pronto.
- **4.2 Banco de dados** — pronto.
- **4.3 API** — pronto: [05-api.md](05-api.md).
- **4.4 Interfaces** — A PREENCHER com capturas de tela das quatro telas principais.
- **4.5 Decisões de projeto** — pronto: a seção de decisões em arquitetura, que é o
  material mais forte para defesa, porque cada escolha vem com o motivo.
- **4.6 Assistente de IA** — pronto: as três camadas do prompt e o isolamento por conta.

## 5. Resultados

- **5.1 Sistema entregue** — pronto: tabela de requisitos com o estado real.
- **5.2 Testes** — pronto: [06-testes.md](06-testes.md).
- **5.3 Implantação** — pronto: [07-implantacao.md](07-implantacao.md), mais a URL pública.
- **5.4 Limitações** — pronto, e vale listar com honestidade: sem pagamento, sem estoque,
  sem teste automatizado de interface, sem multiunidade.

## 6. Conclusão

**A PREENCHER**: o que foi aprendido, o que faria diferente, trabalhos futuros.

## Referências

**A PREENCHER**: documentação oficial de Django, Django REST Framework, Next.js e
PostgreSQL, mais a bibliografia de engenharia de software que você usar.

## Apêndices sugeridos

- Diagramas que você já produziu.
- Trechos de código comentados: máquina de estados do pedido e montagem do prompt.
- Instruções de execução, que já estão no README do repositório.
