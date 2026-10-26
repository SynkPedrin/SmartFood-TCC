import django_filters
from django.db.models import Prefetch
from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAdminUser
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status as http, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from smartfood.permissions import PermissaoPedido

from .models import ItemPedido, Pedido
from .serializers import MudarStatusSerializer, PedidoSerializer


class PedidoFilter(django_filters.FilterSet):
    """`?aberto=true` devolve a fila viva da cozinha, sem entregues nem cancelados."""

    aberto = django_filters.BooleanFilter(method="filtrar_aberto")

    class Meta:
        model = Pedido
        fields = ["status", "mesa", "aberto"]

    def filtrar_aberto(self, queryset, name, value):
        if value is None:
            return queryset
        if value:
            return queryset.filter(status__in=Pedido.ABERTOS)
        return queryset.exclude(status__in=Pedido.ABERTOS)


@extend_schema_view(
    list=extend_schema(
        summary="Listar pedidos",
        tags=["Pedidos"],
        parameters=[
            OpenApiParameter("aberto", bool, description="true traz só a fila em andamento"),
        ],
    ),
    create=extend_schema(summary="Criar pedido", tags=["Pedidos"]),
    retrieve=extend_schema(summary="Detalhar pedido", tags=["Pedidos"]),
    update=extend_schema(summary="Atualizar pedido", tags=["Pedidos"]),
    partial_update=extend_schema(summary="Atualizar pedido parcialmente", tags=["Pedidos"]),
    destroy=extend_schema(summary="Excluir pedido", tags=["Pedidos"]),
)
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = (
        Pedido.objects.select_related("mesa")
        .prefetch_related(Prefetch("itens", queryset=ItemPedido.objects.select_related("produto")))
        .all()
    )
    serializer_class = PedidoSerializer
    # O cliente da mesa cria sem conta; ver e mexer na fila é da equipe.
    permission_classes = [PermissaoPedido]
    filterset_class = PedidoFilter
    search_fields = ["mesa__numero", "itens__produto__nome"]
    ordering_fields = ["criado_em", "status"]

    def create(self, request, *args, **kwargs):
        # UUID por tentativa: repetição de rede devolve o pedido já gravado.
        import uuid
        chave = request.data.get("chave_idempotencia")
        if chave:
            try:
                chave = uuid.UUID(str(chave))
            except (ValueError, TypeError):
                raise ValidationError({"chave_idempotencia": "Use um UUID válido."})
            existente = self.queryset.filter(chave_idempotencia=chave).first()
            if existente:
                return self._repeticao(existente, request)
        try:
            with transaction.atomic():
                return super().create(request, *args, **kwargs)
        except IntegrityError:
            if not chave:
                raise
            existente = self.queryset.filter(chave_idempotencia=chave).first()
            if not existente:
                raise
            return self._repeticao(existente, request)

    def _repeticao(self, pedido, request):
        if str(pedido.mesa_id) != str(request.data.get("mesa")):
            raise ValidationError({"chave_idempotencia": "Chave já utilizada."})
        # Não publica itens nem observações na repetição pública.
        return Response({"id": pedido.pk, "acompanhamento": str(pedido.acompanhamento), "status": pedido.status}, status=200)

    def destroy(self, request, *args, **kwargs):
        # Histórico operacional é preservado; cancelamento segue a máquina de estados.
        raise ValidationError({"detail": "Pedidos não são excluídos. Cancele antes de ficarem prontos."})

    @extend_schema(
        summary="Mudar o status do pedido",
        description="Respeita o fluxo: recebido → em preparo → pronto → entregue. Cancelar só antes de ficar pronto.",
        tags=["Pedidos"],
        request=MudarStatusSerializer,
        responses=PedidoSerializer,
    )
    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        pedido = self.get_object()
        entrada = MudarStatusSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        novo = entrada.validated_data["status"]

        serializer = self.get_serializer(pedido, data={"status": novo}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=http.HTTP_200_OK)
