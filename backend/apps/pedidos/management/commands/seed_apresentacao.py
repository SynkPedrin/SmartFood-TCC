"""Prepara cardápio oficial, mesas e equipe, sem pedidos ou vendas fictícias."""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from apps.mesas.models import Mesa
from .seed_demo import MESAS

class Command(BaseCommand):
    help = 'Prepara uma demonstração sem duplicar registros nem apagar pedidos existentes.'

    def handle(self, *args, **options):
        if not settings.DEMO_PASSWORD:
            raise CommandError('Defina DEMO_PASSWORD. Nenhuma senha é impressa ou presumida.')
        call_command('seed_menu')
        for numero, capacidade, status in MESAS:
            Mesa.objects.get_or_create(numero=numero, defaults={'capacidade':capacidade,'status':status})
        usuario, criou = get_user_model().objects.get_or_create(username='admin',defaults={'first_name':'Equipe','is_staff':True})
        if criou:
            usuario.set_password(settings.DEMO_PASSWORD); usuario.save()
        self.stdout.write(self.style.SUCCESS('Mesas e equipe prontas. Pedidos existentes preservados.'))
