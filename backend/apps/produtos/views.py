from rest_framework import viewsets, filters
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Produto
from .serializers import ProdutoSerializer


@extend_schema_view(
    list=extend_schema(summary="Listar produtos", tags=["Produtos"]),
    create=extend_schema(summary="Criar produto", tags=["Produtos"]),
    retrieve=extend_schema(summary="Detalhar produto", tags=["Produtos"]),
    update=extend_schema(summary="Atualizar produto", tags=["Produtos"]),
    partial_update=extend_schema(summary="Atualizar produto parcialmente", tags=["Produtos"]),
    destroy=extend_schema(summary="Excluir produto", tags=["Produtos"]),
)
class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.select_related("categoria").all()
    serializer_class = ProdutoSerializer
    search_fields = ["nome", "descricao", "categoria__nome"]
    ordering_fields = ["nome", "preco", "criado_em"]
    filterset_fields = ["disponivel", "categoria"]
