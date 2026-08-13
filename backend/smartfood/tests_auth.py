"""Testes da autenticação da equipe."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class AutenticacaoTests(APITestCase):
    def setUp(self):
        self.usuario = get_user_model().objects.create_user(
            username="equipe", password="segredo123", first_name="Equipe"
        )

    def test_login_devolve_token_e_usuario(self):
        resposta = self.client.post(
            reverse("login"), {"username": "equipe", "password": "segredo123"}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertTrue(resposta.data["token"])
        self.assertEqual(resposta.data["usuario"]["username"], "equipe")

    def test_senha_errada_nao_entra(self):
        resposta = self.client.post(
            reverse("login"), {"username": "equipe", "password": "chutando"}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Token.objects.exists())

    def test_token_identifica_o_dono(self):
        token = Token.objects.create(user=self.usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        resposta = self.client.get(reverse("eu"))
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["username"], "equipe")

    def test_sair_invalida_o_token(self):
        token = Token.objects.create(user=self.usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.assertEqual(self.client.post(reverse("logout")).status_code, status.HTTP_204_NO_CONTENT)
        # o mesmo token não vale mais
        self.assertEqual(self.client.get(reverse("eu")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sessao_sem_token_nao_acessa(self):
        self.assertEqual(self.client.get(reverse("eu")).status_code, status.HTTP_401_UNAUTHORIZED)
