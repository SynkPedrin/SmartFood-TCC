"""Testes do fluxo de pedido: o coração do sistema.

Cobrem o que a interface não consegue provar sozinha: regra de transição de
status, congelamento de preço, ocupação da mesa e quem pode fazer o quê.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.categorias.models import Categoria
from apps.mesas.models import Mesa
from apps.pedidos.models import ItemPedido, Pedido
from apps.produtos.models import Produto


class BaseFixtures(APITestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nome="Pratos principais")
        self.produto = Produto.objects.create(
            nome="Frango grelhado",
            categoria=self.categoria,
            preco=Decimal("46.00"),
            tempo_preparo=25,
        )
        self.bebida = Produto.objects.create(
            nome="Suco de laranja",
            categoria=self.categoria,
            preco=Decimal("12.00"),
            tempo_preparo=5,
        )
        self.indisponivel = Produto.objects.create(
            nome="Risoto de cogumelos",
            categoria=self.categoria,
            preco=Decimal("56.00"),
            disponivel=False,
        )
        self.mesa = Mesa.objects.create(numero=1, capacidade=4)
        self.equipe = get_user_model().objects.create_user(username="equipe", password="segredo123")

    def autenticar(self):
        self.client.force_authenticate(user=self.equipe)

    def criar_pedido(self, **kwargs) -> Pedido:
        pedido = Pedido.objects.create(mesa=kwargs.pop("mesa", self.mesa), **kwargs)
        ItemPedido.objects.create(
            pedido=pedido, produto=self.produto, quantidade=1, preco_unitario=self.produto.preco
        )
        return pedido


class CriacaoDePedidoTests(BaseFixtures):
    def test_cliente_sem_login_consegue_fazer_pedido(self):
        """O totem é usado pelo cliente na mesa, que não tem conta."""
        resposta = self.client.post(
            reverse("pedido-list"),
            {
                "mesa": self.mesa.id,
                "itens": [
                    {"produto": self.produto.id, "quantidade": 2},
                    {"produto": self.bebida.id, "quantidade": 1},
                ],
            },
            format="json",
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Pedido.objects.count(), 1)
        self.assertEqual(resposta.data["status"], Pedido.Status.RECEBIDO)
        # 2x46 + 1x12
        self.assertEqual(Decimal(resposta.data["total"]), Decimal("104.00"))

    def test_pedido_ocupa_a_mesa(self):
        self.client.post(
            reverse("pedido-list"),
            {"mesa": self.mesa.id, "itens": [{"produto": self.produto.id, "quantidade": 1}]},
            format="json",
        )
        self.mesa.refresh_from_db()
        self.assertEqual(self.mesa.status, Mesa.Status.OCUPADA)

    def test_preco_do_item_fica_congelado(self):
        """Reajuste de cardápio não pode reescrever o histórico de vendas."""
        self.client.post(
            reverse("pedido-list"),
            {"mesa": self.mesa.id, "itens": [{"produto": self.produto.id, "quantidade": 1}]},
            format="json",
        )
        self.produto.preco = Decimal("99.00")
        self.produto.save()

        item = ItemPedido.objects.get()
        self.assertEqual(item.preco_unitario, Decimal("46.00"))
        self.assertEqual(item.pedido.total, Decimal("46.00"))

    def test_produto_indisponivel_e_recusado(self):
        resposta = self.client.post(
            reverse("pedido-list"),
            {"mesa": self.mesa.id, "itens": [{"produto": self.indisponivel.id, "quantidade": 1}]},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Pedido.objects.exists())

    def test_pedido_sem_item_e_recusado(self):
        resposta = self.client.post(
            reverse("pedido-list"), {"mesa": self.mesa.id, "itens": []}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)


class FluxoDeStatusTests(BaseFixtures):
    def setUp(self):
        super().setUp()
        self.pedido = self.criar_pedido()
        self.url = reverse("pedido-status", args=[self.pedido.id])
        self.autenticar()

    def test_avanca_uma_etapa_por_vez(self):
        for destino in (Pedido.Status.PREPARANDO, Pedido.Status.PRONTO, Pedido.Status.ENTREGUE):
            resposta = self.client.post(self.url, {"status": destino}, format="json")
            self.assertEqual(resposta.status_code, status.HTTP_200_OK, destino)
            self.pedido.refresh_from_db()
            self.assertEqual(self.pedido.status, destino)

    def test_nao_pula_etapa(self):
        resposta = self.client.post(self.url, {"status": Pedido.Status.ENTREGUE}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.status, Pedido.Status.RECEBIDO)

    def test_nao_volta_no_tempo(self):
        self.pedido.status = Pedido.Status.PRONTO
        self.pedido.save()

        resposta = self.client.post(self.url, {"status": Pedido.Status.PREPARANDO}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pronto_nao_pode_ser_cancelado(self):
        """Depois de pronto o prato já foi feito: cancelar viraria prejuízo escondido."""
        self.pedido.status = Pedido.Status.PRONTO
        self.pedido.save()

        resposta = self.client.post(self.url, {"status": Pedido.Status.CANCELADO}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_entregar_libera_a_mesa(self):
        self.mesa.status = Mesa.Status.OCUPADA
        self.mesa.save()

        for destino in (Pedido.Status.PREPARANDO, Pedido.Status.PRONTO, Pedido.Status.ENTREGUE):
            self.client.post(self.url, {"status": destino}, format="json")

        self.mesa.refresh_from_db()
        self.assertEqual(self.mesa.status, Mesa.Status.DISPONIVEL)

    def test_mesa_continua_ocupada_se_houver_outro_pedido_aberto(self):
        self.mesa.status = Mesa.Status.OCUPADA
        self.mesa.save()
        self.criar_pedido(status=Pedido.Status.PREPARANDO)

        for destino in (Pedido.Status.PREPARANDO, Pedido.Status.PRONTO, Pedido.Status.ENTREGUE):
            self.client.post(self.url, {"status": destino}, format="json")

        self.mesa.refresh_from_db()
        self.assertEqual(self.mesa.status, Mesa.Status.OCUPADA)


class FilaDaCozinhaTests(BaseFixtures):
    def test_filtro_aberto_traz_so_a_fila_viva(self):
        self.criar_pedido(status=Pedido.Status.RECEBIDO)
        self.criar_pedido(status=Pedido.Status.PREPARANDO)
        self.criar_pedido(status=Pedido.Status.ENTREGUE)
        self.criar_pedido(status=Pedido.Status.CANCELADO)
        self.autenticar()

        resposta = self.client.get(reverse("pedido-list"), {"aberto": "true"})
        self.assertEqual(resposta.data["count"], 2)

    def test_tempo_estimado_e_do_item_mais_demorado(self):
        """A cozinha faz os pratos em paralelo, então não se soma o tempo."""
        pedido = self.criar_pedido()
        ItemPedido.objects.create(
            pedido=pedido, produto=self.bebida, quantidade=1, preco_unitario=self.bebida.preco
        )
        self.assertEqual(pedido.tempo_preparo_estimado, 25)


class PermissoesTests(BaseFixtures):
    def test_ler_fila_exige_login(self):
        resposta = self.client.get(reverse("pedido-list"))
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mudar_status_exige_login(self):
        pedido = self.criar_pedido()
        resposta = self.client.post(
            reverse("pedido-status", args=[pedido.id]),
            {"status": Pedido.Status.PREPARANDO},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cardapio_e_leitura_publica(self):
        """O totem lê o cardápio sem conta nenhuma."""
        self.assertEqual(self.client.get("/api/v1/produtos/").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/v1/mesas/").status_code, status.HTTP_200_OK)

    def test_escrever_no_cardapio_exige_login(self):
        resposta = self.client.delete(f"/api/v1/produtos/{self.produto.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Produto.objects.filter(pk=self.produto.pk).exists())
