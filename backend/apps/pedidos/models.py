from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Pedido(models.Model):
    """Pedido feito em uma mesa. Percorre a fila da cozinha até ser entregue."""

    class Status(models.TextChoices):
        RECEBIDO = "recebido", "Recebido"
        PREPARANDO = "preparando", "Em preparo"
        PRONTO = "pronto", "Pronto"
        ENTREGUE = "entregue", "Entregue"
        CANCELADO = "cancelado", "Cancelado"

    # Fluxo permitido. Impede que um pedido volte no tempo ou pule etapas,
    # o que é a regra de negócio que a cozinha depende para confiar na fila.
    TRANSICOES = {
        Status.RECEBIDO: {Status.PREPARANDO, Status.CANCELADO},
        Status.PREPARANDO: {Status.PRONTO, Status.CANCELADO},
        Status.PRONTO: {Status.ENTREGUE},
        Status.ENTREGUE: set(),
        Status.CANCELADO: set(),
    }

    #: Estados que ainda ocupam a cozinha ou o salão.
    ABERTOS = (Status.RECEBIDO, Status.PREPARANDO, Status.PRONTO)

    mesa = models.ForeignKey(
        "mesas.Mesa",
        on_delete=models.PROTECT,
        related_name="pedidos",
        verbose_name="Mesa",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RECEBIDO,
        db_index=True,
    )
    observacao = models.TextField("Observação", blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Pedido #{self.pk} - Mesa {self.mesa.numero} ({self.get_status_display()})"

    @property
    def total(self) -> Decimal:
        """Soma dos itens, com o preço congelado no momento do pedido."""
        return sum((item.subtotal for item in self.itens.all()), Decimal("0.00"))

    @property
    def quantidade_itens(self) -> int:
        return sum(item.quantidade for item in self.itens.all())

    @property
    def tempo_preparo_estimado(self) -> int:
        """Minutos do item mais demorado: a cozinha trabalha em paralelo."""
        return max((item.produto.tempo_preparo for item in self.itens.all()), default=0)

    def pode_ir_para(self, novo_status: str) -> bool:
        return novo_status in self.TRANSICOES.get(self.status, set())


class ItemPedido(models.Model):
    """Linha do pedido. Guarda o preço praticado, não o preço atual do produto."""

    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="itens",
        verbose_name="Pedido",
    )
    produto = models.ForeignKey(
        "produtos.Produto",
        on_delete=models.PROTECT,
        related_name="itens_pedido",
        verbose_name="Produto",
    )
    quantidade = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    preco_unitario = models.DecimalField(
        "Preço unitário",
        max_digits=8,
        decimal_places=2,
        help_text="Congelado no momento do pedido, para o histórico não mudar quando o cardápio mudar.",
    )
    observacao = models.CharField("Observação", max_length=200, blank=True)

    class Meta:
        verbose_name = "Item do pedido"
        verbose_name_plural = "Itens do pedido"
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantidade}x {self.produto.nome}"

    @property
    def subtotal(self) -> Decimal:
        return self.preco_unitario * self.quantidade

    def save(self, *args, **kwargs):
        if self.preco_unitario is None:
            self.preco_unitario = self.produto.preco
        super().save(*args, **kwargs)
