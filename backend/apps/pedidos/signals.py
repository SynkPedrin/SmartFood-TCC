"""Avisa a cozinha quando a fila muda.

O evento carrega só o identificador e o status: quem recebe busca a fila pela
API. Isso mantém o banco como fonte única e evita servir dado velho pelo socket.
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from .consumers import GRUPO_COZINHA
from .models import Pedido


@receiver(post_save, sender=Pedido)
def avisar_cozinha(sender, instance: Pedido, created: bool, **kwargs):
    camada = get_channel_layer()
    if camada is None:
        return

    try:
        async_to_sync(camada.group_send)(
            GRUPO_COZINHA,
            {
                "type": "fila.mudou",
                "pedido": instance.pk,
                "status": instance.status,
                "novo": created,
            },
        )
    except Exception:
        # Sem Redis no ambiente, o pedido não pode falhar por causa do aviso:
        # a cozinha ainda tem a busca periódica como rede de segurança.
        pass
