"""WebSocket da fila da cozinha.

O socket é um **aviso**, não a fonte dos dados: quando um pedido nasce ou muda
de status, quem estiver na cozinha recebe um evento curto e busca a fila
atualizada pela API. Assim não existe risco de a tela e o banco divergirem, e o
payload do socket não carrega dado de operação.

Autenticação: o mesmo token do REST, passado em `?token=`. WebSocket não manda
cabeçalho Authorization pelo navegador, então a query string é o caminho usual.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

GRUPO_COZINHA = "cozinha"


@database_sync_to_async
def _usuario_do_token(chave: str):
    from rest_framework.authtoken.models import Token

    try:
        return Token.objects.select_related("user").get(key=chave).user
    except Token.DoesNotExist:
        return None


class FilaConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query = self.scope.get("query_string", b"").decode()
        chave = ""
        for parte in query.split("&"):
            if parte.startswith("token="):
                chave = parte[len("token="):]
                break

        usuario = await _usuario_do_token(chave) if chave else None
        if usuario is None or not usuario.is_active:
            # 4401: fecha deixando claro que faltou credencial, não que caiu.
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(GRUPO_COZINHA, self.channel_name)
        await self.accept()
        await self.send_json({"tipo": "conectado"})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(GRUPO_COZINHA, self.channel_name)

    async def fila_mudou(self, evento):
        """Repassa o aviso vindo do signal para quem está na cozinha."""
        await self.send_json({
            "tipo": "fila",
            "pedido": evento.get("pedido"),
            "status": evento.get("status"),
            "novo": evento.get("novo", False),
        })
