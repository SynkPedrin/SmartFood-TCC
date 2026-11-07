from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from apps.pedidos.models import Pedido
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
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ["numero", "status", "capacidade"]
    filterset_fields = ["status"]

    # As três ações abaixo são públicas: quem usa é o cliente no totem, sem conta.
    # Nenhuma delas tira a mesa de reserva ou manutenção, e liberar só vale para
    # mesa sem pedido em andamento.

    @extend_schema(summary="Cliente senta na mesa (ocupa)", tags=["Mesas"], request=None)
    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def sentar(self, request, pk=None):
        with transaction.atomic():
            mesa = get_object_or_404(Mesa.objects.select_for_update(), pk=pk)
            if mesa.status == Mesa.Status.DISPONIVEL:
                mesa.status = Mesa.Status.OCUPADA
                mesa.save(update_fields=["status", "atualizado_em"])
            elif mesa.status != Mesa.Status.OCUPADA:
                return Response({"detail": f"Mesa {mesa.get_status_display().lower()}. Consulte o atendimento."}, status=409)
        return Response(MesaSerializer(mesa).data)

    @extend_schema(summary="Cliente deixa a mesa sem pedido (libera)", tags=["Mesas"], request=None)
    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def liberar(self, request, pk=None):
        with transaction.atomic():
            mesa = get_object_or_404(Mesa.objects.select_for_update(), pk=pk)
            aberto = Pedido.objects.filter(mesa=mesa, status__in=Pedido.ABERTOS).exists()
            if mesa.status == Mesa.Status.OCUPADA and not aberto:
                mesa.status = Mesa.Status.DISPONIVEL
                mesa.save(update_fields=["status", "atualizado_em"])
        return Response(MesaSerializer(mesa).data)

    @extend_schema(summary="Pedidos em andamento da mesa (visão do cliente)", tags=["Mesas"])
    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def pedidos(self, request, pk=None):
        mesa = get_object_or_404(Mesa, pk=pk)
        abertos = (
            Pedido.objects.filter(mesa=mesa, status__in=Pedido.ABERTOS)
            .prefetch_related("itens__produto")
            .order_by("criado_em")
        )
        return Response({
            "mesa": mesa.numero,
            "status": mesa.status,
            "pedidos": [
                {
                    "id": p.id,
                    "status": p.status,
                    "status_display": p.get_status_display(),
                    "criado_em": p.criado_em,
                    "total": str(p.total),
                    "itens": [{"nome": i.produto.nome, "quantidade": i.quantidade} for i in p.itens.all()],
                }
                for p in abertos
            ],
        })
