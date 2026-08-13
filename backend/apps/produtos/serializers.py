from rest_framework import serializers
from apps.categorias.serializers import CategoriaSerializer
from .models import Produto


class ProdutoSerializer(serializers.ModelSerializer):
    categoria_detalhe = CategoriaSerializer(source="categoria", read_only=True)

    class Meta:
        model = Produto
        fields = (
            "id", "nome", "descricao", "preco", "imagem",
            "categoria", "categoria_detalhe",
            "disponivel", "tempo_preparo",
            "criado_em", "atualizado_em",
        )
        read_only_fields = ("criado_em", "atualizado_em")
