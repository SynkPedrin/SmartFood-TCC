from django.db import transaction
from rest_framework import serializers

from apps.mesas.models import Mesa
from apps.produtos.models import Produto

from .models import ItemPedido, Pedido


class ItemPedidoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source="produto.nome", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemPedido
        fields = ("id", "produto", "produto_nome", "quantidade", "preco_unitario", "observacao", "subtotal")
        read_only_fields = ("preco_unitario",)

    def validate_produto(self, produto):
        if not produto.disponivel:
            raise serializers.ValidationError(f'O produto "{produto.nome}" está indisponível.')
        return produto


class PedidoSerializer(serializers.ModelSerializer):
    itens = ItemPedidoSerializer(many=True)
    mesa_numero = serializers.IntegerField(source="mesa.numero", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    quantidade_itens = serializers.IntegerField(read_only=True)
    tempo_preparo_estimado = serializers.IntegerField(read_only=True)

    class Meta:
        model = Pedido
        fields = (
            "id", "mesa", "mesa_numero",
            "status", "status_display",
            "itens", "total", "quantidade_itens", "tempo_preparo_estimado",
            "observacao", "criado_em", "atualizado_em",
        )
        read_only_fields = ("criado_em", "atualizado_em")

    def validate_itens(self, itens):
        if not itens:
            raise serializers.ValidationError("O pedido precisa de pelo menos um item.")
        return itens

    def validate_status(self, novo_status):
        """Na atualização, respeita o fluxo do pedido em vez de aceitar qualquer salto."""
        pedido = self.instance
        if pedido is None or novo_status == pedido.status:
            return novo_status
        if not pedido.pode_ir_para(novo_status):
            atual = pedido.get_status_display()
            raise serializers.ValidationError(
                f'Não é possível mudar de "{atual}" para "{dict(Pedido.Status.choices)[novo_status]}".'
            )
        return novo_status

    @transaction.atomic
    def create(self, validated_data):
        itens = validated_data.pop("itens")
        pedido = Pedido.objects.create(**validated_data)

        for item in itens:
            produto: Produto = item["produto"]
            ItemPedido.objects.create(
                pedido=pedido,
                produto=produto,
                quantidade=item.get("quantidade", 1),
                observacao=item.get("observacao", ""),
                # congela o preço praticado: o histórico não muda quando o cardápio muda
                preco_unitario=produto.preco,
            )

        # Mesa com pedido aberto está ocupada.
        if pedido.mesa.status != Mesa.Status.OCUPADA:
            pedido.mesa.status = Mesa.Status.OCUPADA
            pedido.mesa.save(update_fields=["status", "atualizado_em"])

        return pedido

    @transaction.atomic
    def update(self, instance, validated_data):
        # Itens não são editados por aqui: mudar o que já foi para a cozinha
        # exige cancelar e refazer, que é como a operação funciona na prática.
        validated_data.pop("itens", None)
        pedido = super().update(instance, validated_data)

        # Fechou o último pedido da mesa? Ela volta a ficar disponível.
        if pedido.status in (Pedido.Status.ENTREGUE, Pedido.Status.CANCELADO):
            ainda_aberto = (
                Pedido.objects.filter(mesa=pedido.mesa, status__in=Pedido.ABERTOS)
                .exclude(pk=pedido.pk)
                .exists()
            )
            if not ainda_aberto and pedido.mesa.status == Mesa.Status.OCUPADA:
                pedido.mesa.status = Mesa.Status.DISPONIVEL
                pedido.mesa.save(update_fields=["status", "atualizado_em"])

        return pedido


class MudarStatusSerializer(serializers.Serializer):
    """Entrada da ação de avançar o pedido na fila."""

    status = serializers.ChoiceField(choices=Pedido.Status.choices)
