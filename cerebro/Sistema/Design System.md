---
tipo: sistema
titulo: Design System
atualizado: 2026-08-10
---

# Design System

Tema claro, base areia, com fundamento neo-brutalista suavizado: linhas finas, sombras
discretas, botões pouco arredondados.

## Tokens

| Papel | Valor |
|-------|-------|
| Fundo (sand) | `#f4ede1` |
| Superfície | `#faf5ee` |
| Elevado | `#ffffff` |
| Acento padrão | `#6e56cf` (roxo) |
| Secundária | ciano do gradiente de marca |
| Raio de botão | `6px` (quadrado por intenção) |

Definidos em `frontend/src/app/globals.css` e `frontend/tailwind.config.ts`.

## Tipografia

Space Grotesk para sans/display, JetBrains Mono para mono.

## Regras de estilo que a IA deve respeitar ao sugerir texto de interface

- Português do Brasil, direto, sem entusiasmo publicitário no admin.
- Sem travessão (o traço longo, U+2014) em nenhum texto do sistema: use vírgula, dois-pontos ou ponto.
- Rótulos curtos, verbo no infinitivo em botões ("Salvar", "Gerar descrição").
- Nada de emoji em tela de gestão. No totem, com parcimônia.

Ver também: [[White-label]], [[Frontend]]
