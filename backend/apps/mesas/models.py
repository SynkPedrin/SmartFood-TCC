from django.db import models


class Mesa(models.Model):
    class Status(models.TextChoices):
        DISPONIVEL = "disponivel", "Disponível"
        OCUPADA = "ocupada", "Ocupada"
        RESERVADA = "reservada", "Reservada"
        MANUTENCAO = "manutencao", "Em Manutenção"

    numero = models.PositiveSmallIntegerField(unique=True)
    capacidade = models.PositiveSmallIntegerField(default=4)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DISPONIVEL,
    )
    qr_code = models.CharField(max_length=255, blank=True, unique=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Mesa"
        verbose_name_plural = "Mesas"
        ordering = ["numero"]

    def __str__(self):
        return f"Mesa {self.numero} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        if not self.qr_code:
            self.qr_code = f"mesa-{self.numero}"
        super().save(*args, **kwargs)
