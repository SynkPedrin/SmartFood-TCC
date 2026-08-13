from django.contrib import admin
from .models import Mesa


@admin.register(Mesa)
class MesaAdmin(admin.ModelAdmin):
    list_display = ("numero", "capacidade", "status", "qr_code")
    list_filter = ("status",)
    list_editable = ("status",)
