from django.db import models
from apps.categorias.models import Categoria


class Produto(models.Model):
    nome = models.CharField(max_length=150)
    descricao = models.TextField(blank=True)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    imagem = models.ImageField(upload_to="produtos/", blank=True, null=True)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="produtos",
    )
    disponivel = models.BooleanField(default=True)
    tempo_preparo = models.PositiveSmallIntegerField(
        default=15,
        help_text="Tempo estimado de preparo em minutos",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ["categoria__nome", "nome"]

    def __str__(self):
        return f"{self.nome} - R$ {self.preco}"
