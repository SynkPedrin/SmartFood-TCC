from django.contrib import admin
from .models import Produto


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ("nome", "categoria", "preco", "disponivel", "tempo_preparo")
    list_filter = ("disponivel", "categoria")
    search_fields = ("nome", "descricao")
    list_editable = ("disponivel", "preco")
