"""Monta um turno de almoço em andamento para demonstração.

    python manage.py simular_turno              # cria o turno de hoje
    python manage.py simular_turno --reiniciar  # refaz (tempos de espera frescos)

Os pedidos passam pelas mesmas regras do sistema: o serializer congela o preço,
ocupa a mesa ao criar e libera ao entregar, e cada mudança de status respeita a
máquina de estados. Só o horário de criação é recuado, para a fila mostrar
esperas de verdade (inclusive um pedido atrasado) e o dia ter faturamento.

Cada pedido simulado recebe uma chave de idempotência derivada da data, então o
comando sabe quais são seus e não mexe em pedidos reais.
"""

import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.mesas.models import Mesa
from apps.pedidos.models import Pedido
from apps.pedidos.serializers import PedidoSerializer
from apps.produtos.models import Produto

NAMESPACE = uuid.UUID("5b8f1c1e-6d2a-4c55-9a0b-7e3f2d1c9a10")

# (mesa, minutos atrás, status final, [(produto, qtd, observação)], observação do pedido)
ENTREGUES = [
    (3, 98, [("X-Burger", 2, ""), ("Batata Frita", 1, ""), ("Refrigerante Cola", 2, "")], ""),
    (7, 91, [("Combo Executivo", 1, ""), ("Suco de Laranja", 1, "")], ""),
    (1, 84, [("Bacon Burger", 1, ""), ("Limonada", 1, "")], ""),
    (8, 77, [("Combo Pizza", 2, ""), ("Guaraná", 2, ""), ("Sorvete", 2, "")], "Aniversário, pode trazer a sobremesa no fim"),
    (5, 69, [("Iscas de Frango", 1, ""), ("Duplo Cheddar", 1, ""), ("Água Mineral", 1, "")], ""),
    (6, 61, [("Mini Burger com Fritas", 2, ""), ("X-Salada", 2, ""), ("Suco de Morango", 2, "")], ""),
    (2, 52, [("Bruschetta", 1, ""), ("Combo Burger", 1, "")], ""),
    (4, 44, [("Dadinho de Tapioca", 1, ""), ("Café Espresso", 2, "")], ""),
]

ABERTOS = [
    (5, 23, "preparando", [("Duplo Cheddar", 2, "Um sem cebola"), ("Onion Rings", 1, ""), ("Refrigerante Cola", 2, "")], ""),
    (1, 16, "pronto", [("Combo Executivo", 1, ""), ("Suco de Laranja", 1, "Sem açúcar")], ""),
    (3, 11, "preparando", [("Bacon Burger", 1, "Ponto mal passado"), ("X-Salada", 1, ""), ("Batata Frita", 1, ""), ("Limonada", 2, "")], ""),
    (4, 5, "recebido", [("Frango Empanado com Fritas", 1, ""), ("Mini Macarrão", 1, ""), ("Guaraná", 2, "")], "Uma criança na mesa"),
    (2, 2, "recebido", [("Batata com Cheddar e Bacon", 1, ""), ("Bacon Burger", 2, ""), ("Água Mineral", 1, "Com gás")], ""),
]

# Mesa que acabou de sentar e ainda está escolhendo.
SENTADAS = [6]

CAMINHO = {
    "recebido": [],
    "preparando": ["preparando"],
    "pronto": ["preparando", "pronto"],
    "entregue": ["preparando", "pronto", "entregue"],
}


class Command(BaseCommand):
    help = "Cria um turno de almoço em andamento: pedidos em todas as etapas e mesas ocupadas."

    def add_arguments(self, parser):
        parser.add_argument("--reiniciar", action="store_true", help="Apaga o turno simulado de hoje e cria de novo.")

    def handle(self, *args, **opts):
        hoje = timezone.localdate()
        chaves = [uuid.uuid5(NAMESPACE, f"{hoje}:{n}") for n in range(len(ENTREGUES) + len(ABERTOS))]
        existentes = Pedido.objects.filter(chave_idempotencia__in=chaves)

        if existentes.exists():
            if not opts["reiniciar"]:
                raise CommandError("O turno de hoje já foi simulado. Use --reiniciar para refazer.")
            mesas = set(existentes.values_list("mesa_id", flat=True))
            existentes.delete()
            for mesa in Mesa.objects.filter(pk__in=mesas, status=Mesa.Status.OCUPADA):
                if not Pedido.objects.filter(mesa=mesa, status__in=Pedido.ABERTOS).exists():
                    mesa.status = Mesa.Status.DISPONIVEL
                    mesa.save(update_fields=["status", "atualizado_em"])
            self.stdout.write("Turno anterior removido.")

        produtos = {p.nome: p for p in Produto.objects.filter(disponivel=True)}
        mesas = {m.numero: m for m in Mesa.objects.all()}
        agora = timezone.now()

        roteiro = [(m, min_, "entregue", itens, obs) for m, min_, itens, obs in ENTREGUES] + ABERTOS
        with transaction.atomic():
            for chave, (numero, minutos, status, itens, obs) in zip(chaves, roteiro):
                if numero not in mesas:
                    raise CommandError(f"Mesa {numero} não existe. Rode seed_demo antes.")
                faltando = [nome for nome, _, _ in itens if nome not in produtos]
                if faltando:
                    raise CommandError(f"Produtos fora do cardápio: {', '.join(faltando)}. Rode seed_menu antes.")
                dados = {
                    "mesa": mesas[numero].pk,
                    "chave_idempotencia": str(chave),
                    "observacao": obs,
                    "itens": [{"produto": produtos[n].pk, "quantidade": q, "observacao": o} for n, q, o in itens],
                }
                entrada = PedidoSerializer(data=dados)
                entrada.is_valid(raise_exception=True)
                pedido = entrada.save()
                for etapa in CAMINHO[status]:
                    passo = PedidoSerializer(pedido, data={"status": etapa}, partial=True)
                    passo.is_valid(raise_exception=True)
                    pedido = passo.save()
                quando = agora - timedelta(minutes=minutos)
                Pedido.objects.filter(pk=pedido.pk).update(criado_em=quando)

            for numero in SENTADAS:
                mesa = mesas[numero]
                if mesa.status == Mesa.Status.DISPONIVEL:
                    mesa.status = Mesa.Status.OCUPADA
                    mesa.save(update_fields=["status", "atualizado_em"])

        ocupadas = Mesa.objects.filter(status=Mesa.Status.OCUPADA).count()
        abertos = Pedido.objects.filter(status__in=Pedido.ABERTOS).count()
        self.stdout.write(self.style.SUCCESS(
            f"Turno pronto: {len(ENTREGUES)} entregues hoje, {abertos} pedidos na cozinha, "
            f"{ocupadas} de {len(mesas)} mesas ocupadas."
        ))
