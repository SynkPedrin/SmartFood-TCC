---
tipo: mapa
titulo: Cérebro SmartFood
atualizado: 2026-08-10
---

# 🧠 Cérebro SmartFood

Este vault é a **memória de longo prazo** do sistema. Tudo que está aqui é lido pela IA
em tempo de execução e injetado no system prompt antes de cada resposta.

> [!info] Como funciona
> `Sistema/` é o conhecimento **compartilhado** (como o SmartFood funciona).
> `Contas/<slug>/` é o cérebro **próprio de cada conta**: identidade, cardápio, operação,
> diretrizes e memórias. Uma conta **nunca** enxerga o cérebro de outra.

## Camadas

```
Cérebro
├── Sistema/          conhecimento do produto (todas as contas leem)
├── Contas/<slug>/    cérebro isolado por conta
│   ├── Conta.md      identidade da conta + persona da IA (frontmatter)
│   ├── Identidade.md tom de voz, público, posicionamento
│   ├── Cardapio.md   o que a IA sabe do cardápio além do banco
│   ├── Operacao.md   horários, salão, fluxo de mesas
│   ├── Diretrizes.md o que a IA pode e não pode fazer nesta conta
│   └── Memoria/      aprendizados datados (a IA escreve aqui)
└── Templates/Conta/  molde para nascer uma conta nova
```

## Sistema (compartilhado)

- [[Arquitetura]] - visão geral do stack e do fluxo de dados
- [[Backend]] - Django REST Framework, apps e endpoints
- [[Frontend]] - Next.js 14 App Router, rotas e camada de dados
- [[Design System]] - tokens, sombras, tipografia
- [[IA e Cerebro]] - como a IA lê este vault
- [[White-label]] - personalização por conta
- [[Glossario]] - vocabulário do domínio

## Contas com cérebro próprio

| Conta | Slug | Segmento | Cérebro |
|-------|------|----------|---------|
| SmartFood Demo | `smartfood-demo` | Demonstração / TCC | [[Conta]] em `Contas/smartfood-demo/` |
| Cantina da Nona | `cantina-da-nona` | Cantina italiana | `Contas/cantina-da-nona/Conta.md` |
| Sushi Yama | `sushi-yama` | Japonês / delivery | `Contas/sushi-yama/Conta.md` |

## Criar uma conta nova

1. Duplique `Templates/Conta/` para `Contas/<slug>/`.
2. Troque os placeholders `{{...}}` no `Conta.md`.
3. Selecione a conta em **Admin → Personalização → Conta ativa**.
4. A IA passa a responder com o cérebro dessa conta na próxima mensagem.

## Regras do cérebro

- Um arquivo = um assunto. Nomes estáveis (o loader busca por nome).
- Fato incerto não entra. A IA é proibida de inventar; o cérebro alimenta essa regra.
- Memória datada nunca é reescrita, só acrescentada.
- Nada de segredo aqui: chaves e senhas ficam em `.env`, nunca no vault.
