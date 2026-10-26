# SmartFood Roteiro de defesa e demonstração

Tempo sugerido: 10 a 12 minutos, ajustável às regras da banca. A defesa consta no RAP com data prevista de 10/10/2026.

## Apresentação

1. Problema e objetivo, 1 minuto. Explique por que uma base comum evita divergências entre pedido, cozinha e gestão. Relacione à pesquisa de campo somente as observações efetivamente realizadas pelos autores.
2. Escopo e arquitetura, 2 minutos. Mostre cliente, cozinha e administração. Explique Next.js, API Django, banco e WebSocket. Preço histórico e transições valem no servidor.
3. Demonstração, 4 minutos. Execute o fluxo abaixo.
4. IA e qualidade, 2 minutos. Mostre o assistente consultando cardápio e indicadores, diferenciando serviço externo de consulta local. Apresente 49 testes do backend e 12 do assistente/cardápio.
5. Resultados e limitações, 1 minuto. Declare pagamento, fiscal, estoque e múltiplas unidades como evoluções futuras. Limite os resultados ao que foi testado.

## Fluxo para demonstrar

- Abra a tela de início e apresente os três ambientes.
- Entre na administração e abra Salão e mesas. Mostre o QR code e abra o cardápio da mesa.
- Busque X-Burger. Mostre preço, descrição e tempo de preparo. Adicione uma unidade.
- Abra a revisão do pedido, confira itens e envie. Anote o número confirmado.
- Em outra aba, abra a cozinha com a sessão da equipe. Avance recebido, preparando, pronto e entregue.
- Volte ao totem e mostre o acompanhamento atualizado.
- Na gestão, mostre a mesa liberada e a receita de pedidos entregues.
- No assistente, pergunte “Resumo de vendas de hoje” e “Quero opções até R$ 30”.
- Explique que itens sem foto funcional ficam ocultos. A administração permite revelar esses cadastros para adicionar uma foto, preservando o histórico.

## Preparação antes do ensaio

Use Python 3.12 ou superior e Node 22 ou superior. O comando `sh scripts/apresentacao.sh` prepara a demonstração local sem apagar registros existentes. A tela abre em http://127.0.0.1:3100 e a API em http://127.0.0.1:8100. A senha do usuário admin fica no arquivo privado `backend/.env`, campo DEMO_PASSWORD. A criação não redefine a senha de um admin já existente.

O teste `node scripts/smoke.mjs` é exclusivo da demonstração local: cria e conclui um pedido real. Não aponte esse teste para produção.

Prepare as abas antes da banca, mantenha o computador na energia e confirme que as fotos aparecem. Para uso por celular, `127.0.0.1` aponta para o próprio celular: use o domínio público ou configure um endereço acessível da rede local, com CORS correspondente.

## Perguntas da banca

**Como vocês garantem o preço do pedido?** O backend lê o preço atual do produto e grava uma cópia no item. Um reajuste posterior não modifica a receita histórica.

**Por que usar WebSocket e busca periódica?** O evento avisa rapidamente quando o pedido muda. A busca periódica recupera atualizações se a conexão cair. A interface confirma os dados na API.

**O modelo de IA pode errar?** Sim. O contexto inclui dados consultados, com precedência para o banco, e o prompt restringe o domínio. Isso mitiga erros sem fornecer uma garantia absoluta. Perguntas sobre alergênicos dependem de confirmação pela equipe.

**A IA faz pedidos ou altera o cardápio?** Nesta versão ela orienta e consulta. A interface exige revisão e envio explícito para criar o pedido.

**O sistema processa pagamentos?** Não. A receita exibida soma pedidos entregues, sem comprovar recebimento financeiro.

**É um sistema com várias empresas no mesmo banco?** Não. Cada instalação autoriza um restaurante. O antigo seletor de cérebro não constitui isolamento multitenant.

**O que foi verificado online?** A versão publicada foi informada pelo autor. A revisão técnica executou os testes locais. A confirmação pública depende das URLs e configurações do deploy.

## Conferência acadêmica

Os autores devem confirmar os dados oficiais da instituição e da banca, revisar referências e normalização, inserir capturas reais do sistema e regularizar as gravações previstas no RAP. Não substituir essa conferência por uma estimativa de “100% concluído”.
