"""Cadastra o cardápio oficial do SmartFood: 54 itens em 10 categorias.

Idempotente por slug: rodar duas vezes mantém 54 produtos, não 108.
As fotos vivem em frontend/public/images/menu/ (fonte versionada); o comando
copia cada uma para MEDIA_ROOT/produtos/ para a API servir via ImageField.

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
    ("Pizzas", "Massa de fermentação lenta, forno bem quente."),
    ("Pratos", "Os clássicos do almoço e do jantar."),
    ("Massas", "Massas frescas com molhos cozidos devagar."),
    ("Saladas", "Leves, frescas e montadas na hora."),
    ("Sobremesas", "O final feliz da refeição."),
    ("Bebidas", "Geladas, naturais e o café de verdade."),
    ("Combos", "Prato, acompanhamento e bebida com preço fechado."),
    ("Infantil", "Porções do tamanho certo para a criançada."),
]

# (categoria, slug, nome, descrição, preço, minutos de preparo, disponível, foto)
# foto = caminho relativo a frontend/public/images/menu/; None quando ainda não existe.
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
    ("Burgers", "smash-burger", "Smash Burger",
     "Carne prensada na chapa até formar crosta caramelizada, queijo americano, cebola e molho especial.",
     "29.90", 15, True, None),
    ("Burgers", "burger-frango", "Burger de Frango",
     "Peito de frango grelhado e suculento, queijo, alface e maionese de ervas no pão tostado.",
     "27.90", 15, True, None),
    ("Burgers", "burger-vegetariano", "Burger Vegetariano",
     "Hambúrguer de grão-de-bico e legumes grelhado, queijo, alface, tomate e maionese de ervas.",
     "28.90", 15, True, None),

    # ─── Pizzas ───
    ("Pizzas", "pizza-margherita", "Pizza Margherita",
     "Molho artesanal de tomate, muçarela, tomates frescos, manjericão e um fio de azeite.",
     "49.90", 25, True, None),
    ("Pizzas", "pizza-calabresa", "Pizza Calabresa",
     "Molho de tomate, muçarela, calabresa fatiada e cebola roxa, finalizada com orégano.",
     "46.90", 25, True, None),
    ("Pizzas", "pizza-portuguesa", "Pizza Portuguesa",
     "Presunto, muçarela, ovo cozido em fatias, cebola, azeitona e orégano sobre molho de tomate.",
     "54.90", 28, True, None),
    ("Pizzas", "pizza-frango-catupiry", "Pizza Frango com Catupiry",
     "Frango desfiado temperado, catupiry cremoso e muçarela sobre molho de tomate.",
     "52.90", 28, True, None),
    ("Pizzas", "pizza-quatro-queijos", "Pizza Quatro Queijos",
     "Muçarela, gorgonzola, catupiry e parmesão gratinado sobre molho de tomate artesanal.",
     "56.90", 28, True, None),
    ("Pizzas", "pizza-pepperoni", "Pizza Pepperoni",
     "Molho de tomate, muçarela e rodelas generosas de pepperoni levemente apimentado.",
     "57.90", 28, True, None),
    ("Pizzas", "pizza-chocolate", "Pizza de Chocolate",
     "Massa assada coberta com chocolate ao leite derretido e toque de chocolate meio amargo.",
     "42.90", 20, True, None),

    # ─── Pratos ───
    ("Pratos", "file-parmegiana", "Filé à Parmegiana",
     "Filé empanado coberto com molho artesanal de tomate e queijo gratinado, acompanhado de arroz branco e batatas fritas.",
     "54.90", 35, True, None),
    ("Pratos", "file-grelhado", "Filé Grelhado",
     "Filé mignon grelhado no ponto, acompanhado de arroz branco e legumes salteados na manteiga.",
     "49.90", 30, True, None),
    ("Pratos", "frango-grelhado", "Frango Grelhado",
     "Peito de frango grelhado na chapa com limão, alho e azeite. Acompanha arroz branco e salada verde.",
     "39.90", 25, True, None),
    ("Pratos", "strogonoff-frango", "Strogonoff de Frango",
     "Cubos de frango ao molho cremoso de tomate com champignon, acompanhado de arroz branco e batata palha.",
     "42.90", 25, True, None),
    ("Pratos", "feijoada", "Feijoada",
     "Feijão preto encorpado com carnes suínas e defumados, acompanhado de arroz, couve, laranja e farofa.",
     "44.90", 30, True, None),
    ("Pratos", "contra-file-fritas", "Contra-Filé com Fritas",
     "Contra-filé grelhado na chapa, fatiado, com porção de batatas fritas crocantes e salada.",
     "52.90", 30, True, None),
    ("Pratos", "peixe-grelhado", "Peixe Grelhado",
     "Filé de peixe branco grelhado com ervas e limão, acompanhado de arroz e legumes no vapor.",
     "56.90", 30, True, None),

    # ─── Massas ───
    ("Massas", "espaguete-bolonhesa", "Espaguete à Bolonhesa",
     "Espaguete al dente envolvido em molho bolonhesa cozido por horas, finalizado com parmesão ralado.",
     "36.90", 20, True, None),
    ("Massas", "fettuccine-alfredo", "Fettuccine Alfredo",
     "Fettuccine fresco ao molho cremoso de manteiga e parmesão, com toque de noz-moscada.",
     "39.90", 20, True, None),
    ("Massas", "penne-molho-tomate", "Penne ao Molho de Tomate",
     "Penne al dente ao molho artesanal de tomates maduros com manjericão fresco.",
     "31.90", 18, True, None),
    ("Massas", "lasanha-bolonhesa", "Lasanha à Bolonhesa",
     "Camadas de massa fresca, bolonhesa, molho branco e queijo gratinado no forno.",
     "42.90", 35, True, None),
    ("Massas", "nhoque-molho-tomate", "Nhoque ao Molho de Tomate",
     "Nhoque de batata macio ao molho de tomate caseiro e manjericão, com parmesão.",
     "38.90", 22, False, None),

    # ─── Saladas ───
    ("Saladas", "salada-caesar", "Salada Caesar",
     "Alface romana crocante, croutons artesanais, lascas de parmesão e molho caesar da casa.",
     "32.90", 10, True, None),
    ("Saladas", "salada-tropical", "Salada Tropical",
     "Mix de folhas verdes com manga, abacaxi, tomate cereja e vinagrete cítrico.",
     "28.90", 10, True, None),
    ("Saladas", "bowl-frango", "Bowl de Frango",
     "Bowl com frango grelhado em tiras, mix de folhas, grão-de-bico, tomate cereja e molho de iogurte.",
     "34.90", 12, True, None),

    # ─── Sobremesas ───
    ("Sobremesas", "petit-gateau", "Petit Gâteau",
     "Bolo quente de chocolate com interior cremoso, acompanhado de sorvete de baunilha.",
     "24.90", 12, True, None),
    ("Sobremesas", "brownie-sorvete", "Brownie com Sorvete",
     "Brownie de chocolate meio amargo aquecido, servido com bola de sorvete de creme e calda.",
     "21.90", 10, True, None),
    ("Sobremesas", "pudim", "Pudim",
     "Pudim de leite condensado em fatia generosa, com calda de caramelo feita na casa.",
     "14.90", 5, True, None),
    ("Sobremesas", "cheesecake-frutas-vermelhas", "Cheesecake de Frutas Vermelhas",
     "Cheesecake assado cremoso sobre base de biscoito, coberto com calda de frutas vermelhas.",
     "22.90", 8, True, None),
    ("Sobremesas", "mousse-chocolate", "Mousse de Chocolate",
     "Mousse aerado de chocolate meio amargo, finalizado com raspas de chocolate.",
     "16.90", 5, True, None),
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
    help = "Cadastra o cardápio oficial do SmartFood (54 itens em 10 categorias)."

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

        self.stdout.write(
            self.style.SUCCESS(
                f"Pronto: {Categoria.objects.count()} categorias, "
                f"{Produto.objects.count()} produtos "
                f"({criados} criados, {atualizados} atualizados, "
                f"{com_foto} com foto, {sem_foto} sem foto)."
            )
        )
