---
tipo: sistema
titulo: White-label
atualizado: 2026-08-10
---

# White-label

Cada conta veste o sistema com a própria marca. A configuração vive em
`frontend/src/lib/brand/` e é persistida no cliente (`localStorage`, chave
`smartfood:brand`), arquitetada para migrar para a API da conta depois.

## Campos de `BrandConfig`

| Campo | Uso |
|-------|-----|
| `accountId` | **Slug da conta**: é ele que escolhe o cérebro em `Contas/<slug>/` |
| `name` | Nome exibido no lugar de "SmartFood" |
| `logo` | Logo custom (dataURL) ou `null` |
| `accent` | Cor de acento (hex), propagada como variáveis CSS |
| `background` | `dots` · `plain` · `grid` · `image` |
| `backgroundImage` | Imagem de fundo (dataURL) quando `background === 'image'` |

## Como o acento se propaga

`BrandContext` escreve variáveis CSS no `documentElement` (`--primary`,
`--primary-strong`, `--gradient-brand`, além das aliases legadas). Qualquer componente
que use os tokens muda junto, sem precisar de prop.

## Relação com o cérebro

Marca e cérebro são a mesma identidade vista de dois lados: a marca é o que o cliente
**vê**, o cérebro é o que a IA **sabe**. Os dois são chaveados pelo mesmo `accountId`,
trocado em **Admin → Personalização → Conta ativa**.

Ver também: [[IA e Cerebro]], [[Design System]]
