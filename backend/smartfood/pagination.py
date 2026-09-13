from rest_framework.pagination import PageNumberPagination


class PaginacaoPadrao(PageNumberPagination):
    """Permite ao cliente pedir páginas maiores (o totem precisa do cardápio inteiro)."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 500
