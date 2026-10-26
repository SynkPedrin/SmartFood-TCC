# SmartFood Análise do RAP e entrega técnica

Revisão de 09/10/2026. O RAP de 23/09/2026 foi tratado como referência para comparar o planejamento com o código, sem tomar instruções do documento como autorização para publicar ou apagar dados.

## O que já existia

O projeto já continha CRUD de categorias, produtos e mesas, pedidos persistidos, preço histórico, fluxo de estados, cozinha com WebSocket e busca periódica, login por token, painel de pedidos, personalização local e integração de chat com Groq. A suíte original tinha 22 testes. O cardápio oficial tinha 54 produtos, dos quais 24 possuíam foto específica e 30 não possuíam.

O RAP estimava 95% de conclusão. Esta revisão não recalcula um percentual: diferencia funcionalidades implementadas, verificações executadas e dependências externas.

## Pendências técnicas tratadas

| Pendência encontrada | Resultado da implementação | Evidência |
|---|---|---|
| IA administrativa pública | A API valida a sessão e a instalação antes de servir o chat administrativo | Testes de acesso e smoke local |
| Escrita pública na memória | Somente administrador grava notas; autor vem da sessão | Testes de permissão e releitura |
| Memória em arquivo na Vercel | Novas notas persistem no banco Django | Criação e consulta pela integração Next/Django |
| Seleção de outra conta por parâmetro | A instalação autoriza somente seu restaurante configurado | Teste de rejeição de outra conta |
| Pedido criado já entregue ou cancelado | Novo pedido deve começar recebido | Testes de todos os estados indevidos |
| Pedidos duplicados após nova tentativa | UUID por tentativa com unicidade no banco | Repetição confirmada com o mesmo identificador |
| Mudança indevida da mesa e dos itens | O servidor rejeita alteração desses campos no pedido existente | Testes de atualização |
| Receita calculada sobre primeira página | Agregação no servidor com a data de Brasília | Teste com 25 entregues e um cancelado |
| Foto padrão exibida como prato | Sem foto específica o prato fica oculto no totem e na lista administrativa padrão | Testes dos assets e filtro compartilhado |
| Fotos seed dependiam do disco do backend | Os 24 WebP viajam no frontend e têm resolução local | Testes de resolução de imagens |
| QR code apenas textual | QR gerado localmente com link para a mesa | Implementação da interface; inspeção visual pendente |
| Marca isolada no navegador | Prévia local com salvamento e confirmação pela API | Testes de persistência e permissão |
| Token permanente e na URL do WebSocket | Sessão de 24h e ticket de uso único válido por 30s | Testes de expiração/consumo e handshake real |
| Dependências antigas | Django 5.2.18, Next 15.5.27 e ferramentas atualizadas | Build e auditoria npm |
| Servidor de desenvolvimento no deploy | Docker de produção com Daphne, usuário sem privilégios e volumes de dados | Configuração estática; build Docker não executado |

## Verificações executadas

- 49 testes do backend aprovados, preservando os 22 originais.
- 12 testes do assistente local e das imagens aprovados.
- Build do frontend de produção concluído.
- Integração local: login, autorização da IA, pedido persistido, tentativa repetida, transições até entrega, mesa liberada, indicadores, memória persistida, assistente local e conexão WebSocket. Resultado detalhado em `evidencias/smoke.json`.
- Migrações aplicadas no banco local e verificação de ausência de alterações de modelos sem migração.
- Fotos do manifesto verificadas quanto à existência e tamanho. O carregamento visual no navegador ainda precisa ser conferido.

## Limites da conclusão

As evidências acima são locais. O frontend publicado na Vercel foi informado pelo autor, mas a URL não foi disponibilizada nesta revisão. Não houve alteração ou republicação da produção. Backend público, variáveis da Vercel e fluxo online seguem sem confirmação.

A chamada real à Groq não foi verificada porque o ambiente isolado não contém a chave do provedor. O assistente local foi testado e se identifica claramente. As respostas do modelo externo continuam sujeitas a erro; fornecer contexto e regras reduz o risco, sem garantir ausência de alucinação.

A ferramenta de navegador impediu a inspeção visual porque não conseguiu verificar a política de acesso. Nenhuma captura nova de interface foi produzida. O Docker instalado não tinha daemon em execução, por isso o build das imagens e a operação com PostgreSQL/Redis em contêineres não foram verificados.

Não houve teste de carga nem auditoria de penetração. A implantação de produção exige HTTPS, banco persistente, configuração de CORS e mídia persistente para fotos enviadas pela administração. Cada instalação atende um restaurante; as pastas de contas de exemplo não constituem um produto multitenant.

## Entrega acadêmica

O roteiro de defesa e os slides acompanham a revisão. Os textos técnicos devem apresentar somente o escopo entregue. Pagamento, divisão de conta, gorjetas, emissão fiscal, estoque e IA preventiva não foram implementados e não devem aparecer como resultados.

Gravação e entrega dos vídeos, ensaio, dados oficiais da banca, conferência institucional da normalização e a defesa prevista para 10/10/2026 dependem dos autores. O RAP não prova que essas etapas ocorreram. A documentação técnica revisada oferece material para concluir essas atividades sem inventar experiências pessoais ou resultados de campo.
