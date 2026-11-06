---
tipo: sistema
titulo: IA e Cérebro
atualizado: 2026-11-06
---

# IA e Cérebro

A IA do SmartFood roda no **Ollama**, chamado por um route handler do Next
(`/api/ia/chat`, runtime Node). O modelo padrão é `qwen3.5:9b`, rodando na própria
máquina, sem custo por pergunta e sem limite de tokens por minuto. O mesmo código fala
com o Ollama Cloud quando `OLLAMA_URL` aponta para a nuvem com `OLLAMA_API_KEY`.
A Groq é opcional e só entra se o Ollama falhar.

## As camadas de contexto

```
system prompt = persona (modo) + cérebro (vault da conta) + dados ao vivo (banco)
```

1. **Persona** - `admin` ou `totem`. Define postura e limites.
2. **Cérebro** - este vault: identidade, diretrizes, cardápio comentado, operação,
   memórias datadas da conta e as notas compartilhadas de `Sistema/`.
3. **Dados ao vivo** - produtos, categorias, mesas, indicadores do dia e notas
   ensinadas pela equipe, lidos do Django na hora da pergunta.

No totem a IA recebe só o nome do restaurante, o tom e o cardápio visível: nada de
memória, operação ou assunto interno chega ao cliente.

## Conta autorizada

O servidor Django define qual conta a instalação atende. Outra conta é recusada.
Se o cérebro da conta não existir, a IA responde só com persona e dados ao vivo.

## Ensinar ao cérebro

Em `/admin/ia`, **Ensinar ao cérebro** grava a nota no banco (`/api/v1/ia/memorias/`),
com autor e data. Só administrador grava. A nota entra nas próximas respostas e
sobrevive a novos deploys.

## Precedência quando há conflito

Dado do **banco** ganha de dado do **cérebro**. Se uma nota diz um preço e o banco diz
outro, vale o banco e a IA sinaliza a divergência.

## Quando o motor falha

Ordem de tentativa: Ollama, depois Groq (se houver chave). Se nenhum responder, ou se o
banco estiver fora do ar, entra o assistente local, que se identifica e responde só o
que dá para calcular dos dados.

Ver também: [[Backend]], [[White-label]], [[Glossario]]
