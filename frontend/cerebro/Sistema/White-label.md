---
tipo: sistema
titulo: White-label
atualizado: 2026-11-06
---

# White-label

Cada instalação veste o sistema com a própria marca. A configuração é salva no
servidor (`/api/v1/restaurante/`), vale em qualquer dispositivo e só o administrador
altera. O navegador guarda uma cópia para abrir sem piscar.

## Campos da marca

| Campo | Uso |
|-------|-----|
| `accountId` | **Slug da conta**: é ele que escolhe o cérebro em `Contas/<slug>/` |
| `name` | Nome exibido no lugar de "SmartFood" |
| `logo` | Logo próprio ou `null` |
| `accent` | Cor de acento (hex), propagada como variáveis CSS |
| `background` | `dots` · `plain` · `grid` · `image` |
| `backgroundImage` | Imagem de fundo quando `background === 'image'` |

## Relação com o cérebro

Marca e cérebro são a mesma identidade vista de dois lados: a marca é o que o cliente
**vê**, o cérebro é o que a IA **sabe**. Edição em **Admin → Personalização**.

Ver também: [[IA e Cerebro]], [[Design System]]
