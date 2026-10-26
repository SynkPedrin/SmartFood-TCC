from django.conf import settings
from django.db import models


class Configuracao(models.Model):
    conta = models.SlugField(max_length=64, unique=True)
    marca = models.JSONField(default=dict)
    atualizado_em = models.DateTimeField(auto_now=True)


class Memoria(models.Model):
    conta = models.SlugField(max_length=64, db_index=True)
    texto = models.CharField(max_length=2000)
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em", "-id"]

class WebsocketTicket(models.Model):
    import uuid
    codigo = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    expira_em = models.DateTimeField()
