"""Tratamento de erros da API.

Categoria, produto e mesa com histórico são protegidos por on_delete=PROTECT.
Sem este handler a tentativa de exclusão vira erro 500; aqui ela vira 409 com
uma mensagem que a tela consegue mostrar.
"""

from django.db.models import ProtectedError, RestrictedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def tratar_excecao(exc, context):
    if isinstance(exc, (ProtectedError, RestrictedError)):
        return Response(
            {"detail": "Não é possível excluir: há registros ligados a este item. Desative-o em vez de excluir."},
            status=status.HTTP_409_CONFLICT,
        )
    return exception_handler(exc, context)
