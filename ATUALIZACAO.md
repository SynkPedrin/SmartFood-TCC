# 🍽️ SmartFood - Apresentação de Atualização

**Sistema de gestão para restaurantes** · TCC UniSalesiano 2026
*O que evoluiu desde a última vez (linguagem simples).*

---

## Slide 1 - Em uma frase

O **SmartFood** é um sistema que atende **três públicos** ao mesmo tempo:

- 🧑‍🍳 **Cliente** (Totem): faz o pedido na mesa, sozinho.
- 👨‍🍳 **Cozinha**: vê os pedidos chegando e controla o preparo.
- 🧑‍💼 **Administrador**: cadastra o cardápio, as mesas e acompanha tudo.

Desde a última versão, ele ficou **mais bonito, mais inteligente e mais próximo de um produto de verdade**.

---

## Slide 2 - O Front-end (a parte que aparece na tela)

**O que é:** é o "rosto" do sistema - tudo que a pessoa vê e clica no navegador.

**Como está agora:**
- Visual **limpo e profissional**, no estilo de aplicativos modernos (pense em apps como Notion, Stripe, Linear).
- **Cores sóbrias** (um violeta discreto), **botões pretos** elegantes, linhas finas e bastante "respiro" (espaço em branco).
- Tiramos tudo que fazia parecer **"feito às pressas por robô"**: emojis soltos, enfeites, textos exagerados de propaganda e dados inventados.

**As telas principais:**
| Tela | Para quê serve |
|------|----------------|
| **Início** | Escolher entre Totem, Cozinha ou Administração |
| **Totem** | O cliente escolhe a mesa e monta o pedido |
| **Cozinha** | Painel com os pedidos em colunas (Novo → Preparando → Pronto) |
| **Administração** | Cadastrar cardápio/mesas e ver um resumo do dia |

**Bônus - marca personalizável:** cada restaurante pode trocar o **logo, a cor e o fundo** na tela de Personalização, sem mexer no código.

---

## Slide 3 - A conexão com a IA (o "assistente inteligente")

**A novidade principal:** antes o assistente era "de mentira" (respostas prontas, sempre iguais). **Agora ele pensa de verdade.**

**Como funciona, em linguagem simples:**

1. A pessoa escreve uma pergunta (ex.: *"Qual prato combina com vinho tinto?"*).
2. O sistema junta essa pergunta com os **dados reais do restaurante** (os pratos que existem no cardápio).
3. Envia tudo para uma **IA na internet** (o serviço **Groq**, que roda um modelo parecido com o ChatGPT).
4. A resposta volta **aparecendo aos poucos**, como se estivesse sendo digitada na hora.

**Onde a IA aparece:**
- 🧑‍💼 **No Administrador:** ajuda a analisar o cardápio, criar descrições de pratos e sugerir promoções.
- 🧑‍🍳 **No Totem ("Chef IA"):** recomenda pratos e explica ingredientes para o cliente.

**Detalhe importante de segurança (bem simples):**
A "senha" de acesso à IA (a chave) **nunca vai para o navegador do cliente**. Ela fica **guardada no servidor**, como um cofre. O navegador só conversa com o nosso servidor, e é o servidor que fala com a IA. Assim ninguém consegue roubar a chave.

> E se o servidor de dados estiver desligado? A IA **avisa com honestidade** ("não tenho os dados agora") em vez de **inventar números** - isso evita passar informação falsa.

---

## Slide 4 - Como as partes se conectam

```
   CLIENTE (navegador)
        │
        ▼
   FRONT-END (as telas, porta 3000)
        │        │
        │        └──► SERVIDOR DA IA ──► Groq (internet) 🤖
        │             (guarda a chave em segredo)
        ▼
   BACK-END (a API, porta 8000) ──► Banco de dados (cardápio, mesas, pedidos)
```

- O **front-end** mostra as telas.
- O **back-end** guarda e entrega os dados (cardápio, mesas…).
- A **IA** é um serviço à parte, acessado com segurança pelo servidor.

---

## Slide 5 - O que já está funcionando ✅

- ✅ Front-end novo, bonito e organizado (todas as telas).
- ✅ Assistente de IA **real** (no admin e no totem).
- ✅ Back-end **rodando** e **salvando dados de verdade** (cadastros persistem).
- ✅ Personalização da marca (logo, cor, fundo).
- ✅ Documentação da API disponível (tela de "docs").

---

## Slide 6 - O que ainda falta corrigir ⚠️

Sendo transparente, ainda **não está pronto para o mundo real**. Faltam, em ordem de prioridade:

1. 🔐 **Login e permissões** - hoje qualquer pessoa com o link entra no Admin/Cozinha e a API aceita comandos sem senha. **É o item mais importante.**
2. 🗝️ **Trocar as senhas/chaves** que ficaram expostas (da IA, do banco Supabase e a chave interna do sistema).
3. 📊 **Cadastrar dados de exemplo** - o banco está vazio, por isso as telas mostram "0". Com dados, tudo ganha vida.
4. 📦 **Tela de Pedidos de verdade** - hoje a lista de pedidos ainda usa dados de exemplo (fixos), não reais.
5. 🔔 **Cozinha em tempo real** - os pedidos novos deveriam aparecer sozinhos e tocar um alerta.
6. 🛡️ **Deixar seguro para publicar** - site com cadeado (HTTPS), esconder mensagens de erro técnicas, e limitar o uso da IA para não gerar custo indevido.
7. 🐳 **Resolver o Docker** - ele parou de iniciar; por enquanto rodamos as duas partes manualmente (instruções abaixo).

---

## Slide 7 - Como rodar o sistema hoje

**Front-end (as telas):**
```bash
cd frontend
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
npm run dev
```
→ abre em http://localhost:3000

**Back-end (a API):**
```bash
cd backend
export DATABASE_URL="sqlite:////Users/pedro/Downloads/SmartFood-tcc/backend/db.sqlite3"
./.venv-local/bin/python manage.py runserver 0.0.0.0:8000
```
→ API em http://localhost:8000/api/v1/ · Documentação em http://localhost:8000/api/v1/docs/

---

## Slide 8 - Resumo final

> O SmartFood saiu de um **protótipo básico** para um sistema com **cara profissional** e uma **IA que realmente funciona**.
>
> O próximo grande passo é a **segurança/login** - depois disso, é um produto que dá para apresentar e usar de verdade.

*Dúvidas? É só pedir para detalhar qualquer slide.*
