# SmartFood

Gestão de pedidos para restaurantes, com cardápio do cliente, fila da cozinha e painel administrativo. Revisão de entrega em 09/10/2026.

## Executar a apresentação local

Requer Python 3.12 ou superior e Node 22 ou superior.

```sh
sh scripts/apresentacao.sh
```

Site: http://127.0.0.1:3100. API: http://127.0.0.1:8100/api/v1. Login: admin. A senha gerada fica no campo DEMO_PASSWORD de `backend/.env` e não aparece em logs. O script não redefine credenciais de um admin já existente.

O cardápio oficial tem 24 itens em 6 categorias, todos com foto específica. Os 30 itens que não tinham foto saíram do cardápio: o `seed_menu` os apaga de bancos já populados e, se algum já tiver sido vendido, apenas o deixa indisponível para preservar o histórico. Produtos cadastrados depois sem foto funcional continuam ocultos do cliente até receberem imagem.

## O que mudou

Interface de entrada, cardápio e dashboard refeita; busca e ordenação; carrinho com revisão; acompanhamento do preparo; navegação no celular; QR por mesa; upload de fotos; marca salva no banco. Pedidos começam recebidos e usam chave de tentativa para evitar duplicação. Receita e ticket são agregados no servidor. Sessões expiram e o WebSocket usa ticket temporário.

O assistente consulta dados reais da API e gera as respostas com o Ollama (padrão `qwen3.5:9b`, configurado por `OLLAMA_URL` e `OLLAMA_MODEL`), com a Groq como reserva opcional. Sem motor disponível, o assistente local se identifica e responde consultas de cardápio e operação. Novas memórias exigem administrador e persistem no banco. Uma instalação atende um restaurante.

## Validação

49 testes do backend e 12 do assistente/cardápio passaram. O build de produção e a integração local foram executados. Confira o resultado em [análise e entrega](docs/09-auditoria-rap-e-entrega.md) e [evidência de integração](docs/evidencias/smoke.json).

```sh
cd backend
.venv/bin/python manage.py test
```

```sh
cd frontend
npm test
npm run lint
npm run typecheck
npm run build
```

## Vercel e produção

Atualize primeiro o backend com as migrações e depois faça o novo deploy do frontend, com Root Directory `frontend`. Variáveis, HTTPS, banco, mídia persistente e Docker de produção estão em [implantação](docs/07-implantacao.md).

Esta revisão não republicou nem confirmou o site online. A chamada real à Groq precisa de validação com a chave da implantação. A inspeção visual foi bloqueada pela ferramenta de navegador. O Docker de produção não foi executado porque o daemon estava desligado.

## Defesa

[ roteiro e perguntas da banca](docs/10-roteiro-defesa.md). Os slides estão em `output/SmartFood-Defesa-TCC.pptx`. Pagamento, emissão fiscal, estoque e múltiplas unidades ficam fora do escopo. Revise dados oficiais da banca, capturas de tela, referências e vídeos com os autores.
