from rest_framework import serializers
from .models import Mesa


class MesaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Mesa
        fields = (
            "id", "numero", "capacidade",
            "status", "status_display",
            "qr_code", "criado_em", "atualizado_em",
        )
        read_only_fields = ("qr_code", "criado_em", "atualizado_em")
