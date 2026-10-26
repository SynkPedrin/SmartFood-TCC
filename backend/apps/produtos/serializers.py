from rest_framework import serializers
from apps.categorias.serializers import CategoriaSerializer
from .models import Produto


class ProdutoSerializer(serializers.ModelSerializer):
    def validate_preco(self, value):
        if value <= 0:
            raise serializers.ValidationError("O preço deve ser maior que zero.")
        return value

    def validate_imagem(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("A imagem deve ter no máximo 5 MB.")
        return value
    categoria_detalhe = CategoriaSerializer(source="categoria", read_only=True)

    class Meta:
        model = Produto
        fields = (
            "id", "nome", "slug", "descricao", "preco", "imagem",
            "categoria", "categoria_detalhe",
            "disponivel", "tempo_preparo",
            "criado_em", "atualizado_em",
        )
        read_only_fields = ("criado_em", "atualizado_em")
