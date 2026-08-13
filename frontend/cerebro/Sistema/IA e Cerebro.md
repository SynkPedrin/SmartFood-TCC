---
tipo: sistema
titulo: IA e Cérebro
atualizado: 2026-08-10
---

# IA e Cérebro

A IA do SmartFood roda na **Groq** (API compatível com OpenAI), chamada por um route
handler do Next (`/api/ia/chat`, runtime Node). A chave `GROQ_API_KEY` nunca sai do servidor.

## As três fontes de contexto

Cada resposta é montada com três camadas empilhadas no system prompt:

1. **Persona** (`lib/ia/prompts.ts`) - `admin` ou `totem`. Define postura e limites.
2. **Snapshot ao vivo** (`lib/ia/context.ts`) - produtos, categorias e mesas lidos do
   Django na hora. Se o backend estiver fora, a IA avisa em vez de inventar.
3. **Cérebro da conta** (`lib/ia/cerebro.ts`) - este vault. Identidade, diretrizes,
   cardápio comentado, operação e memórias daquela conta específica.

```
system prompt = persona + snapshot(banco) + cérebro(vault da conta)
```

## Isolamento por conta

O corpo do POST leva `conta: "<slug>"`. O loader resolve **apenas**
`cerebro/Contas/<slug>/` e recusa slug fora do formato `[a-z0-9-]`, então uma conta não
consegue ler o cérebro de outra nem escapar da pasta.

Se o slug não existir, a IA responde só com persona + snapshot: degradação limpa, sem erro.

## Ordem de leitura dentro da conta

`Conta.md` → `Identidade.md` → `Diretrizes.md` → `Cardapio.md` → `Operacao.md` →
`Memoria/` (as mais recentes primeiro, limitadas). O texto total é cortado num teto de
caracteres para não estourar o contexto: por isso **arquivo curto e específico** vale mais
que arquivo longo.

## A IA escrevendo no cérebro

`POST /api/ia/memoria` com `{ conta, texto, titulo? }` acrescenta um item em
`Contas/<slug>/Memoria/AAAA-MM-DD.md`. É append-only: aprendizado antigo nunca é
reescrito. Na tela `/admin/ia` isso aparece como **Ensinar ao cérebro**.

## Precedência quando há conflito

Dado do **banco** ganha de dado do **cérebro**. Se o `Cardapio.md` diz que a lasanha custa
R$ 48 e o banco diz R$ 52, vale R$ 52 e a IA deve sinalizar a divergência.

Ver também: [[Backend]], [[White-label]], [[Glossario]]
