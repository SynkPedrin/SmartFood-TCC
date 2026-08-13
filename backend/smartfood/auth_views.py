"""Autenticação por token para a equipe do restaurante.

Usa o `authtoken` que já vem no DRF, então não entra dependência nova. O token
é criado no primeiro login e reaproveitado depois; sair apaga o token, o que
invalida a sessão em todos os dispositivos daquele usuário.
"""

from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})


class UsuarioSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)


class RespostaLoginSerializer(serializers.Serializer):
    token = serializers.CharField(read_only=True)
    usuario = UsuarioSerializer(read_only=True)


class LoginView(APIView):
    """Troca usuário e senha por um token."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Entrar",
        tags=["Autenticação"],
        request=LoginSerializer,
        responses={200: RespostaLoginSerializer},
    )
    def post(self, request):
        entrada = LoginSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)

        usuario = authenticate(
            request,
            username=entrada.validated_data["username"],
            password=entrada.validated_data["password"],
        )
        if usuario is None:
            return Response(
                {"detail": "Usuário ou senha inválidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=usuario)
        return Response({"token": token.key, "usuario": UsuarioSerializer(usuario).data})


class EuView(APIView):
    """Diz quem é o dono do token. A interface usa para validar a sessão salva."""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Usuário da sessão", tags=["Autenticação"], responses={200: UsuarioSerializer})
    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)


class LogoutView(APIView):
    """Apaga o token atual."""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Sair", tags=["Autenticação"], request=None, responses={204: None})
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
