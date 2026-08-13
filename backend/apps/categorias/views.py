from rest_framework import viewsets, filters
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Categoria
from .serializers import CategoriaSerializer


@extend_schema_view(
    list=extend_schema(summary="Listar categorias", tags=["Categorias"]),
    create=extend_schema(summary="Criar categoria", tags=["Categorias"]),
    retrieve=extend_schema(summary="Detalhar categoria", tags=["Categorias"]),
    update=extend_schema(summary="Atualizar categoria", tags=["Categorias"]),
    partial_update=extend_schema(summary="Atualizar categoria parcialmente", tags=["Categorias"]),
    destroy=extend_schema(summary="Excluir categoria", tags=["Categorias"]),
)
class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nome"]
    ordering_fields = ["nome", "criado_em"]
