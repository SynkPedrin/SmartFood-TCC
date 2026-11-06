"""Cadastra o cardápio oficial do SmartFood: 24 itens em 6 categorias, todos com foto.

Idempotente por slug: rodar duas vezes mantém 24 produtos, não 48.
As fotos vivem em frontend/public/images/menu/ (fonte versionada); o comando
copia cada uma para MEDIA_ROOT/produtos/ para a API servir via ImageField.

Itens que saíram do cardápio por não terem foto (RETIRADOS) são apagados de
bancos já populados; os que já aparecem em pedidos ficam indisponíveis, porque
o histórico de vendas protege o produto contra exclusão.

    python manage.py seed_menu
    python manage.py seed_menu --limpar   # apaga pedidos, produtos e categorias antes
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.categorias.models import Categoria
from apps.pedidos.models import ItemPedido, Pedido
from apps.produtos.models import Produto

# Fonte das fotos: backend/seed_assets/menu/ viaja com o backend (deploy) e tem
# prioridade; em desenvolvimento vale também a pasta do frontend, irmã deste backend.
_FOTOS_CANDIDATAS = [
    Path(settings.BASE_DIR) / "seed_assets" / "menu",
    Path(settings.BASE_DIR).parent / "frontend" / "public" / "images" / "menu",
]
FOTOS = next((p for p in _FOTOS_CANDIDATAS if p.is_dir()), _FOTOS_CANDIDATAS[0])

CATEGORIAS = [
    ("Entradas", "Para começar, e para dividir na mesa."),
    ("Burgers", "Hambúrgueres artesanais grelhados na hora."),
    ("Sobremesas", "O final feliz da refeição."),
    ("Bebidas", "Geladas, naturais e o café de verdade."),
    ("Combos", "Prato, acompanhamento e bebida com preço fechado."),
    ("Infantil", "Porções do tamanho certo para a criançada."),
]

# Categorias que ficaram sem nenhum item com foto.
CATEGORIAS_RETIRADAS = ["Pizzas", "Pratos", "Massas", "Saladas"]

# Slugs que saíram do cardápio oficial por falta de foto.
RETIRADOS = [
    "smash-burger", "burger-frango", "burger-vegetariano",
    "pizza-margherita", "pizza-calabresa", "pizza-portuguesa", "pizza-frango-catupiry",
    "pizza-quatro-queijos", "pizza-pepperoni", "pizza-chocolate",
    "file-parmegiana", "file-grelhado", "frango-grelhado", "strogonoff-frango",
    "feijoada", "contra-file-fritas", "peixe-grelhado",
    "espaguete-bolonhesa", "fettuccine-alfredo", "penne-molho-tomate",
    "lasanha-bolonhesa", "nhoque-molho-tomate",
    "salada-caesar", "salada-tropical", "bowl-frango",
    "petit-gateau", "brownie-sorvete", "pudim", "cheesecake-frutas-vermelhas",
    "mousse-chocolate",
]

# (categoria, slug, nome, descrição, preço, minutos de preparo, disponível, foto)
# foto = caminho relativo a frontend/public/images/menu/. Item sem foto não entra.
PRODUTOS = [
    # ─── Entradas ───
    ("Entradas", "batata-frita", "Batata Frita",
     "Batatas cortadas na casa, fritas até ficarem douradas e crocantes por fora e macias por dentro. Servidas com sal grosso.",
     "17.90", 10, True, "entradas/batata-frita.webp"),
    ("Entradas", "batata-cheddar-bacon", "Batata com Cheddar e Bacon",
     "Porção generosa de fritas coberta com creme de cheddar derretido e cubos de bacon crocante.",
     "27.90", 12, True, "entradas/batata-cheddar-bacon.webp"),
    ("Entradas", "onion-rings", "Onion Rings",
     "Anéis de cebola empanados em crosta crocante temperada, servidos com molho especial da casa.",
     "22.90", 12, True, "entradas/onion-rings.webp"),
    ("Entradas", "iscas-de-frango", "Iscas de Frango",
     "Tiras de peito de frango empanadas e fritas na hora, suculentas por dentro. Acompanham ketchup artesanal.",
     "28.90", 15, True, "entradas/iscas-de-frango.webp"),
    ("Entradas", "dadinho-de-tapioca", "Dadinho de Tapioca",
     "Cubos de tapioca com queijo coalho empanados até dourar, crocantes por fora e cremosos por dentro.",
     "24.90", 12, True, "entradas/dadinho-de-tapioca.webp"),
    ("Entradas", "bruschetta", "Bruschetta",
     "Fatias de pão italiano tostadas no azeite, cobertas com tomate fresco picado, manjericão e um toque de alho.",
     "19.90", 10, True, "entradas/bruschetta.webp"),

    # ─── Burgers ───
    ("Burgers", "x-burger", "X-Burger",
     "Hambúrguer artesanal grelhado, queijo derretido e maionese da casa no pão de gergelim tostado.",
     "24.90", 15, True, "burgers/x-burger.webp"),
    ("Burgers", "x-salada", "X-Salada",
     "Hambúrguer grelhado, queijo, alface fresca, tomate e maionese da casa no pão de gergelim.",
     "26.90", 15, True, "burgers/x-salada.webp"),
    ("Burgers", "bacon-burger", "Bacon Burger",
     "Hambúrguer artesanal grelhado, queijo cheddar derretido, bacon crocante, alface, tomate e molho especial da casa no pão brioche.",
     "32.90", 18, True, "burgers/bacon-burger.webp"),
    ("Burgers", "duplo-cheddar", "Duplo Cheddar",
     "Dois hambúrgueres altos grelhados na chapa, camadas duplas de cheddar derretido e maionese especial no pão brioche.",
     "36.90", 18, True, "burgers/duplo-cheddar.webp"),

    # ─── Sobremesas ───
    ("Sobremesas", "sorvete", "Sorvete",
     "Taça com três bolas de sorvete — creme, chocolate e morango — com chantilly e biscoito wafer.",
     "12.90", 5, True, "sobremesas/sorvete.webp"),

    # ─── Bebidas ───
    ("Bebidas", "refrigerante-cola", "Refrigerante Cola",
     "Copo gelado de cola com gelo, 350ml.",
     "6.90", 2, True, "bebidas/refrigerante-cola.webp"),
    ("Bebidas", "guarana", "Guaraná",
     "Guaraná gelado servido no copo com gelo, 350ml.",
     "6.90", 2, True, "bebidas/guarana.webp"),
    ("Bebidas", "agua-mineral", "Água Mineral",
     "Garrafa de água mineral gelada, com ou sem gás, 500ml.",
     "4.90", 2, True, "bebidas/agua-mineral.webp"),
    ("Bebidas", "suco-laranja", "Suco de Laranja",
     "Laranjas espremidas na hora, copo de 400ml. Sem açúcar adicionado.",
     "12.90", 5, True, "bebidas/suco-laranja.webp"),
    ("Bebidas", "suco-morango", "Suco de Morango",
     "Morangos frescos batidos com água gelada, copo de 400ml.",
     "12.90", 5, True, "bebidas/suco-morango.webp"),
    ("Bebidas", "limonada", "Limonada",
     "Limão tahiti espremido na hora com gelo, refrescante e pouco doce. Copo de 400ml.",
     "9.90", 5, True, "bebidas/limonada.webp"),
    ("Bebidas", "cafe-espresso", "Café Espresso",
     "Espresso encorpado de grãos torrados na semana, extraído na hora.",
     "6.90", 3, True, "bebidas/cafe-espresso.webp"),

    # ─── Combos ───
    ("Combos", "combo-burger", "Combo Burger",
     "X-Burger artesanal, porção de batata frita crocante e refrigerante gelado. O clássico completo.",
     "54.90", 20, True, "combos/combo-burger.webp"),
    ("Combos", "combo-pizza", "Combo Pizza",
     "Pizza pepperoni grande e refrigerante gelado para acompanhar. Ideal para dividir.",
     "74.90", 30, True, "combos/combo-pizza.webp"),
    ("Combos", "combo-executivo", "Combo Executivo",
     "Bife grelhado com arroz, fritas e salada, mais refrigerante. O almoço completo de dia útil.",
     "39.90", 25, True, "combos/combo-executivo.webp"),

    # ─── Infantil ───
    ("Infantil", "mini-burger-fritas", "Mini Burger com Fritas",
     "Mini hambúrguer com queijo, porção kids de fritas e suco de caixinha.",
     "24.90", 12, True, "infantil/mini-burger-fritas.webp"),
    ("Infantil", "frango-empanado-fritas", "Frango Empanado com Fritas",
     "Nuggets de frango crocantes com fritas kids e suco de caixinha.",
     "22.90", 12, True, "infantil/frango-empanado-fritas.webp"),
    ("Infantil", "mini-macarrao", "Mini Macarrão",
     "Porção kids de espaguete ao molho de tomate com parmesão, palitos de legumes e suco.",
     "19.90", 12, True, "infantil/mini-macarrao.webp"),
]


class Command(BaseCommand):
    help = "Cadastra o cardápio oficial do SmartFood (24 itens em 6 categorias)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Apaga itens de pedido, pedidos, produtos e categorias antes de popular.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["limpar"]:
            ItemPedido.objects.all().delete()
            Pedido.objects.all().delete()
            Produto.objects.all().delete()
            Categoria.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cardápio e pedidos anteriores apagados."))

        categorias = {}
        for nome, descricao in CATEGORIAS:
            categoria, _ = Categoria.objects.update_or_create(
                nome=nome, defaults={"descricao": descricao, "ativo": True}
            )
            categorias[nome] = categoria

        media_produtos = Path(settings.MEDIA_ROOT) / "produtos"
        media_produtos.mkdir(parents=True, exist_ok=True)

        criados = atualizados = com_foto = sem_foto = 0
        for categoria, slug, nome, descricao, preco, minutos, disponivel, foto in PRODUTOS:
            produto, criou = Produto.objects.update_or_create(
                slug=slug,
                defaults={
                    "nome": nome,
                    "categoria": categorias[categoria],
                    "descricao": descricao,
                    "preco": Decimal(preco),
                    "tempo_preparo": minutos,
                    "disponivel": disponivel,
                },
            )
            criados += criou
            atualizados += not criou

            if foto:
                origem = FOTOS / foto
                if origem.exists():
                    destino = media_produtos / f"{slug}.webp"
                    if not destino.exists() or origem.stat().st_mtime > destino.stat().st_mtime:
                        shutil.copy2(origem, destino)
                    nome_media = f"produtos/{slug}.webp"
                    if produto.imagem.name != nome_media:
                        produto.imagem.name = nome_media
                        produto.save(update_fields=["imagem"])
                    com_foto += 1
                else:
                    self.stdout.write(self.style.WARNING(f"UNRESOLVED_ASSET: {foto} ({slug})"))
                    sem_foto += 1
            else:
                sem_foto += 1

        # Retira do banco o que saiu do cardápio. Com histórico de vendas o produto
        # não pode ser apagado (PROTECT), então só deixa de ser oferecido.
        retirados = Produto.objects.filter(slug__in=RETIRADOS)
        com_historico = retirados.filter(itens_pedido__isnull=False).distinct()
        ocultos = com_historico.update(disponivel=False)
        apagados, _ = retirados.exclude(pk__in=com_historico).delete()
        for nome in CATEGORIAS_RETIRADAS:
            categoria = Categoria.objects.filter(nome=nome).first()
            if categoria is None:
                continue
            if categoria.produtos.exists():
                categoria.ativo = False
                categoria.save(update_fields=["ativo"])
            else:
                categoria.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Pronto: {Categoria.objects.count()} categorias, "
                f"{Produto.objects.count()} produtos "
                f"({criados} criados, {atualizados} atualizados, "
                f"{com_foto} com foto, {sem_foto} sem foto; "
                f"{apagados} retirados, {ocultos} ocultos por histórico)."
            )
        )
