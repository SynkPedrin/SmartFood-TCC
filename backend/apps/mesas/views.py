from rest_framework import viewsets, filters
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Mesa
from .serializers import MesaSerializer


@extend_schema_view(
    list=extend_schema(summary="Listar mesas", tags=["Mesas"]),
    create=extend_schema(summary="Criar mesa", tags=["Mesas"]),
    retrieve=extend_schema(summary="Detalhar mesa", tags=["Mesas"]),
    update=extend_schema(summary="Atualizar mesa", tags=["Mesas"]),
    partial_update=extend_schema(summary="Atualizar mesa parcialmente", tags=["Mesas"]),
    destroy=extend_schema(summary="Excluir mesa", tags=["Mesas"]),
)
class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["numero", "status", "capacidade"]
    filterset_fields = ["status"]
