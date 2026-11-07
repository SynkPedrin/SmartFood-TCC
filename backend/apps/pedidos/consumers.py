"""WebSocket da fila da cozinha.

O socket é um **aviso**, não a fonte dos dados: quando um pedido nasce ou muda
de status, quem estiver na cozinha recebe um evento curto e busca a fila
atualizada pela API. Assim não existe risco de a tela e o banco divergirem, e o
payload do socket não carrega dado de operação.

Autenticação: ticket de uso único com validade de 30 segundos, emitido pela API
autenticada. O token da equipe não aparece na URL do WebSocket.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

GRUPO_COZINHA = "cozinha"


@database_sync_to_async
def _usuario_do_ticket(chave: str):
    import uuid
    from django.db import transaction
    from django.utils import timezone
    from apps.restaurante.models import WebsocketTicket
    try:
        codigo = uuid.UUID(chave)
    except (ValueError, TypeError):
        return None
    with transaction.atomic():
        ticket = WebsocketTicket.objects.select_for_update().select_related('usuario').filter(codigo=codigo, expira_em__gt=timezone.now()).first()
        if not ticket:
            return None
        usuario = ticket.usuario
        ticket.delete()
        return usuario


class FilaConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query = self.scope.get("query_string", b"").decode()
        chave = ""
        for parte in query.split("&"):
            if parte.startswith("ticket="):
                chave = parte[len("ticket="):]
                break

        usuario = await _usuario_do_ticket(chave) if chave else None
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


GRUPO_SALAO = "salao"


class SalaoConsumer(AsyncJsonWebsocketConsumer):
    """Avisos públicos do salão: mesa, pedido ou cardápio mudou.

    Sem login, porque o totem do cliente também precisa se atualizar. Por isso o
    evento leva só tipo, identificador e status: nada de itens, valores ou dados
    da equipe. Quem recebe busca o resto pela API, com as permissões de sempre.
    """

    async def connect(self):
        await self.channel_layer.group_add(GRUPO_SALAO, self.channel_name)
        await self.accept()
        await self.send_json({"tipo": "conectado"})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(GRUPO_SALAO, self.channel_name)

    async def receive_json(self, content, **kwargs):
        """O canal é só de saída: o que o cliente mandar é ignorado."""

    async def salao_mudou(self, evento):
        await self.send_json({k: v for k, v in evento.items() if k != "type"})
