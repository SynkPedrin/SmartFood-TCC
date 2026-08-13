"""Popula o banco com um restaurante de demonstração.

Sem isto o sistema abre vazio: cardápio sem itens, salão sem mesas e a IA sem
nada para analisar. É idempotente, então pode rodar quantas vezes precisar.

    python manage.py seed_demo
    python manage.py seed_demo --limpar   # apaga os dados de demonstração antes

Também cria o usuário da equipe usado para entrar no painel. A senha sai de
DEMO_PASSWORD quando existir; o padrão só serve para ambiente local.
"""

from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.categorias.models import Categoria
from apps.mesas.models import Mesa
from apps.pedidos.models import ItemPedido, Pedido
from apps.produtos.models import Produto

CATEGORIAS = [
    ("Entradas", "Para começar, e para dividir na mesa."),
    ("Pratos principais", "O prato do dia a dia da casa."),
    ("Bebidas", "Sem álcool, com álcool e o café."),
    ("Sobremesas", "O final da refeição."),
]

# (categoria, nome, descrição, preço, minutos de preparo, disponível)
PRODUTOS = [
    ("Entradas", "Bruschetta de tomate", "Pão italiano tostado, tomate picado, manjericão fresco e azeite.", "24.00", 10, True),
    ("Entradas", "Bolinho de bacalhau", "Seis unidades fritas na hora, servidas com limão siciliano.", "32.00", 15, True),
    ("Entradas", "Caldinho de feijão", "Caldo cremoso com bacon crocante e cebolinha.", "18.00", 8, True),
    ("Pratos principais", "Frango grelhado", "Frango grelhado na chapa com limão, alho e azeite. Acompanha arroz e salada verde.", "46.00", 25, True),
    ("Pratos principais", "Filé à parmegiana", "Filé empanado com molho de tomate e muçarela gratinada. Acompanha arroz e fritas.", "68.00", 35, True),
    ("Pratos principais", "Talharim ao sugo", "Massa fresca com molho de tomate cozido lento, manjericão e parmesão.", "42.00", 20, True),
    ("Pratos principais", "Salmão ao forno", "Posta de salmão assada com ervas, acompanha purê de batata baroa.", "78.00", 30, True),
    ("Pratos principais", "Risoto de cogumelos", "Arroz arbóreo, mix de cogumelos frescos e parmesão.", "56.00", 28, False),
    ("Bebidas", "Suco natural de laranja", "Copo de 400ml, feito na hora.", "12.00", 5, True),
    ("Bebidas", "Água mineral", "Com ou sem gás, 500ml.", "6.00", 2, True),
    ("Bebidas", "Refrigerante lata", "Lata de 350ml.", "8.00", 2, True),
    ("Bebidas", "Taça de vinho tinto", "Seleção da casa, 150ml.", "28.00", 3, True),
    ("Bebidas", "Café expresso", "Grãos torrados na semana.", "7.00", 3, True),
    ("Sobremesas", "Pudim de leite", "Fatia generosa, calda de caramelo.", "18.00", 5, True),
    ("Sobremesas", "Petit gateau", "Bolo quente de chocolate com sorvete de creme.", "26.00", 12, True),
    ("Sobremesas", "Salada de frutas", "Frutas da estação picadas na hora.", "16.00", 8, True),
]

# (número, capacidade, status)
MESAS = [
    (1, 2, Mesa.Status.DISPONIVEL),
    (2, 2, Mesa.Status.DISPONIVEL),
    (3, 4, Mesa.Status.DISPONIVEL),
    (4, 4, Mesa.Status.DISPONIVEL),
    (5, 4, Mesa.Status.RESERVADA),
    (6, 6, Mesa.Status.DISPONIVEL),
    (7, 6, Mesa.Status.DISPONIVEL),
    (8, 8, Mesa.Status.MANUTENCAO),
]

# Pedidos de exemplo: (mesa, status, [(produto, quantidade, observação)])
PEDIDOS = [
    (3, Pedido.Status.RECEBIDO, [("Frango grelhado", 2, "Sem salada em um deles"), ("Suco natural de laranja", 2, "")]),
    (6, Pedido.Status.PREPARANDO, [("Filé à parmegiana", 1, ""), ("Talharim ao sugo", 1, "Bem al dente"), ("Taça de vinho tinto", 2, "")]),
    (1, Pedido.Status.PRONTO, [("Bruschetta de tomate", 1, ""), ("Café expresso", 2, "")]),
]


class Command(BaseCommand):
    help = "Popula o banco com um cardápio, um salão e pedidos de demonstração."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Apaga pedidos, produtos, categorias e mesas antes de popular.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["limpar"]:
            ItemPedido.objects.all().delete()
            Pedido.objects.all().delete()
            Produto.objects.all().delete()
            Categoria.objects.all().delete()
            Mesa.objects.all().delete()
            self.stdout.write(self.style.WARNING("Dados anteriores apagados."))

        categorias = {}
        for nome, descricao in CATEGORIAS:
            categoria, _ = Categoria.objects.get_or_create(
                nome=nome, defaults={"descricao": descricao}
            )
            categorias[nome] = categoria

        produtos = {}
        for categoria, nome, descricao, preco, minutos, disponivel in PRODUTOS:
            produto, _ = Produto.objects.get_or_create(
                nome=nome,
                defaults={
                    "categoria": categorias[categoria],
                    "descricao": descricao,
                    "preco": Decimal(preco),
                    "tempo_preparo": minutos,
                    "disponivel": disponivel,
                },
            )
            produtos[nome] = produto

        for numero, capacidade, status in MESAS:
            Mesa.objects.get_or_create(
                numero=numero,
                defaults={"capacidade": capacidade, "status": status},
            )

        # Usuário da equipe: sem ele não dá para entrar no painel nem na cozinha.
        Usuario = get_user_model()
        senha = getattr(settings, "DEMO_PASSWORD", None) or "smartfood123"
        equipe, novo_usuario = Usuario.objects.get_or_create(
            username="admin",
            defaults={"first_name": "Equipe", "is_staff": True, "is_superuser": True},
        )
        if novo_usuario:
            equipe.set_password(senha)
            equipe.save()

        criados = 0
        if not Pedido.objects.exists():
            for numero, status, itens in PEDIDOS:
                mesa = Mesa.objects.get(numero=numero)
                pedido = Pedido.objects.create(mesa=mesa, status=status)
                for nome, quantidade, observacao in itens:
                    produto = produtos[nome]
                    ItemPedido.objects.create(
                        pedido=pedido,
                        produto=produto,
                        quantidade=quantidade,
                        observacao=observacao,
                        preco_unitario=produto.preco,
                    )
                if status in Pedido.ABERTOS:
                    mesa.status = Mesa.Status.OCUPADA
                    mesa.save(update_fields=["status", "atualizado_em"])
                criados += 1

        if novo_usuario:
            self.stdout.write(
                self.style.WARNING(f'Usuário "admin" criado com a senha "{senha}". Troque fora do ambiente local.')
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Pronto: {Categoria.objects.count()} categorias, "
                f"{Produto.objects.count()} produtos, "
                f"{Mesa.objects.count()} mesas, "
                f"{Pedido.objects.count()} pedidos ({criados} criados agora)."
            )
        )
