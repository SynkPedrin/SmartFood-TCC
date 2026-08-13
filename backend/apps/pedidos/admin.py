from django.contrib import admin

from .models import ItemPedido, Pedido


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    autocomplete_fields = ("produto",)
    readonly_fields = ("subtotal",)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("id", "mesa", "status", "total", "criado_em")
    list_filter = ("status", "criado_em")
    search_fields = ("id", "mesa__numero")
    date_hierarchy = "criado_em"
    inlines = [ItemPedidoInline]
