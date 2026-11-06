import re
from decimal import Decimal
from django.conf import settings
from django.db import connection
from django.db.models import Count, Q, Sum, F, DecimalField, ExpressionWrapper
from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from apps.pedidos.models import Pedido, ItemPedido
from .models import Configuracao, Memoria


class IAAnonThrottle(AnonRateThrottle):
    scope = "ia_anon"


class IAUserThrottle(UserRateThrottle):
    scope = "ia_user"


class AcessoIAView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [IAAnonThrottle, IAUserThrottle]

    def post(self, request):
        modo = request.data.get("mode")
        if modo not in ("admin", "totem"):
            return Response({"error": "Modo inválido."}, status=400)
        if modo == "admin" and not request.user.is_authenticated:
            return Response({"error": "Entre na área da equipe para usar o assistente."}, status=401)
        if modo == "admin" and not request.user.is_staff:
            return Response({"error": "O assistente de gestão é exclusivo do administrador."}, status=403)
        conta = request.data.get("conta") or settings.RESTAURANTE_CONTA
        if conta != settings.RESTAURANTE_CONTA:
            return Response({"error": "Conta não pertence a esta instalação."}, status=403)
        return Response({"conta": settings.RESTAURANTE_CONTA, "mode": modo})


class MemoriaSerializer(serializers.ModelSerializer):
    autor_nome = serializers.CharField(source="autor.username", read_only=True)

    class Meta:
        model = Memoria
        fields = ["id", "conta", "texto", "autor_nome", "criado_em"]
        read_only_fields = ["id", "conta", "autor_nome", "criado_em"]


class MemoriasView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        notas = Memoria.objects.filter(conta=settings.RESTAURANTE_CONTA)[:30]
        return Response({"results": MemoriaSerializer(notas, many=True).data})

    def post(self, request):
        if request.data.get("conta", settings.RESTAURANTE_CONTA) != settings.RESTAURANTE_CONTA:
            return Response({"error": "Conta inválida."}, status=403)
        entrada = MemoriaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        entrada.save(conta=settings.RESTAURANTE_CONTA, autor=request.user)
        return Response(entrada.data, status=201)


class ConfiguracaoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        obj = Configuracao.objects.filter(conta=settings.RESTAURANTE_CONTA).first()
        return Response({"accountId": settings.RESTAURANTE_CONTA, **(obj.marca if obj else {})})

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Autenticação necessária."}, status=401)
        if not request.user.is_staff:
            return Response({"error": "Somente administradores podem alterar a marca."}, status=403)
        data = request.data
        marca = {}
        for key in ("name", "logo", "accent", "background", "backgroundImage"):
            if key in data:
                value = data[key]
                if value is not None and not isinstance(value, str):
                    return Response({"error": "Configuração inválida."}, status=400)
                if isinstance(value, str) and len(value) > (2500000 if key in ("logo", "backgroundImage") else 150):
                    return Response({"error": "Configuração excede o limite."}, status=400)
                if key in ("logo", "backgroundImage") and value and not re.match(r"^(data:image/(png|jpeg|webp);base64,|https://)", value):
                    return Response({"error": "Use uma imagem PNG, JPEG ou WebP, ou URL HTTPS."}, status=400)
                marca[key] = value
        if "name" in marca and not marca["name"]:
            return Response({"error": "Informe o nome do restaurante."}, status=400)
        if "accent" in marca and not re.fullmatch(r"#[0-9a-fA-F]{6}", marca["accent"] or ""):
            return Response({"error": "Cor inválida."}, status=400)
        if "background" in marca and marca["background"] not in ("plain", "dots", "grid", "image"):
            return Response({"error": "Fundo inválido."}, status=400)
        obj, _ = Configuracao.objects.get_or_create(conta=settings.RESTAURANTE_CONTA)
        obj.marca = {**obj.marca, **marca}
        obj.save()
        return Response({"accountId": obj.conta, **obj.marca})


class IndicadoresView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dia = timezone.localdate()
        pedidos = Pedido.objects.filter(criado_em__date=dia)
        entregues = pedidos.filter(status=Pedido.Status.ENTREGUE)
        valor = ExpressionWrapper(F("quantidade") * F("preco_unitario"), output_field=DecimalField(max_digits=14, decimal_places=2))
        receita = ItemPedido.objects.filter(pedido__in=entregues).aggregate(total=Sum(valor))["total"] or Decimal("0.00")
        quantidade = entregues.count()
        mais = list(ItemPedido.objects.filter(pedido__in=entregues).values("produto__nome").annotate(quantidade=Sum("quantidade")).order_by("-quantidade", "produto__nome")[:5])
        return Response({"data": str(dia), "receita": str(receita), "ticket_medio": str((receita / quantidade).quantize(Decimal("0.01")) if quantidade else Decimal("0.00")), "pedidos_hoje": pedidos.count(), "entregues": quantidade, "em_andamento": pedidos.filter(status__in=Pedido.ABERTOS).count(), "mesas_atendidas": pedidos.exclude(status=Pedido.Status.CANCELADO).values("mesa").distinct().count(), "por_status": list(pedidos.values("status").annotate(quantidade=Count("id"))), "mais_vendidos": mais})


class AcompanhamentoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, codigo):
        pedido = Pedido.objects.filter(acompanhamento=codigo).first()
        if not pedido:
            return Response({"error": "Pedido não encontrado."}, status=404)
        return Response({"id": pedido.pk, "status": pedido.status, "status_display": pedido.get_status_display(), "tempo_preparo_estimado": pedido.tempo_preparo_estimado})


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            return Response({"status": "unavailable"}, status=503)
        return Response({"status": "ok"})
