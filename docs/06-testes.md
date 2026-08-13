# Testes

## Como rodar

```bash
cd backend
python manage.py test                 # tudo
python manage.py test apps.pedidos    # só o fluxo de pedido
```

Em máquina sem PostgreSQL, aponte para SQLite antes de rodar:

```bash
DATABASE_URL="sqlite:///db.sqlite3" python manage.py test
```

O Django cria e destrói um banco de teste próprio, então o banco de desenvolvimento
não é tocado.

## O que é coberto

22 testes, concentrados onde um erro causa prejuízo de verdade.

### Criação de pedido

| Teste | Por que existe |
|-------|----------------|
| Cliente sem login consegue pedir | O totem é usado por quem não tem conta |
| Pedido ocupa a mesa | Regra de salão que o sistema mantém sozinho |
| Preço do item fica congelado | Reajuste de cardápio não pode reescrever venda antiga |
| Produto indisponível é recusado | Evita vender o que a cozinha não tem |
| Pedido sem item é recusado | Pedido vazio não é pedido |

### Fluxo de status

| Teste | Por que existe |
|-------|----------------|
| Avança uma etapa por vez | É o caminho feliz da cozinha |
| Não pula etapa | Marcar entregue sem preparar esconde erro de operação |
| Não volta no tempo | Histórico de produção precisa ser confiável |
| Pronto não pode ser cancelado | O prato já foi feito; o custo já existe |
| Entregar libera a mesa | Salão precisa refletir a realidade |
| Mesa segue ocupada com outro pedido aberto | O caso que quebra a regra ingênua |

### Fila e permissões

| Teste | Por que existe |
|-------|----------------|
| Filtro `aberto` traz só a fila viva | É o que a cozinha consome |
| Tempo estimado é do item mais demorado | A cozinha trabalha em paralelo, não em série |
| Ler fila exige login | Dado de operação não é público |
| Mudar status exige login | Ninguém de fora move a fila |
| Cardápio é leitura pública | O totem depende disso |
| Escrever no cardápio exige login | Era o buraco de segurança original |

### Autenticação

Login válido, senha errada, identificação pelo token, logout invalidando o token e acesso
sem token.

## O que não é coberto

Dito com clareza porque banca pergunta:

- Interface: não há teste automatizado de componente. As telas foram verificadas com
  navegador real, clicando pelo protocolo de depuração do Chrome.
- WebSocket: verificado manualmente ponta a ponta, sem teste automatizado.
- Camada de IA: depende de serviço externo e resposta não determinística.
