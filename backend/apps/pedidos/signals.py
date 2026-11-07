"""Avisos em tempo real: fila da cozinha e salão.

O evento carrega só o identificador e o status: quem recebe busca os dados pela
API. Isso mantém o banco como fonte única e evita servir dado velho pelo socket.
Todo aviso sai depois do commit, para ninguém buscar um registro que não existe.
"""

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.categorias.models import Categoria
from apps.mesas.models import Mesa
from apps.produtos.models import Produto

from .consumers import GRUPO_COZINHA, GRUPO_SALAO
from .models import Pedido


def _avisar(grupo: str, evento: dict):
    camada = get_channel_layer()
    if camada is None:
        return

    def enviar():
        try:
            async_to_sync(camada.group_send)(grupo, evento)
        except Exception:
            # Sem Redis no ambiente, a gravação não pode falhar por causa do aviso:
            # as telas ainda têm a busca periódica como rede de segurança.
            logging.getLogger(__name__).warning("Aviso em tempo real indisponível", exc_info=True)

    transaction.on_commit(enviar)


@receiver(post_save, sender=Pedido)
def avisar_pedido(sender, instance: Pedido, created: bool, **kwargs):
    _avisar(GRUPO_COZINHA, {"type": "fila.mudou", "pedido": instance.pk, "status": instance.status, "novo": created})
    _avisar(GRUPO_SALAO, {"type": "salao.mudou", "tipo": "pedido", "pedido": instance.pk, "mesa": instance.mesa_id, "status": instance.status})


@receiver(post_save, sender=Mesa)
@receiver(post_delete, sender=Mesa)
def avisar_mesa(sender, instance: Mesa, **kwargs):
    _avisar(GRUPO_SALAO, {"type": "salao.mudou", "tipo": "mesa", "mesa": instance.pk, "status": instance.status})


@receiver(post_save, sender=Produto)
@receiver(post_delete, sender=Produto)
@receiver(post_save, sender=Categoria)
@receiver(post_delete, sender=Categoria)
def avisar_cardapio(sender, instance, **kwargs):
    _avisar(GRUPO_SALAO, {"type": "salao.mudou", "tipo": "cardapio"})
