"""Regras de acesso do SmartFood.

O sistema tem dois tipos de usuário no mesmo servidor:

* o **cliente na mesa**, que não faz login e precisa ver o cardápio e mandar
  o próprio pedido;
* a **equipe do restaurante**, que administra cardápio, mesas e a fila da cozinha
  e por isso precisa estar autenticada.

Por padrão vale `LeituraPublicaEscritaAutenticada`: qualquer um lê, só a equipe
escreve. O pedido é a exceção deliberada, tratada em `PermissaoPedido`.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class LeituraPublicaEscritaAutenticada(BasePermission):
    """GET, HEAD e OPTIONS liberados. Qualquer escrita exige login."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class PermissaoPedido(BasePermission):
    """Pedido tem uma regra própria.

    Criar é público: é o cliente da mesa fazendo o pedido pelo totem, sem conta.
    Ler, alterar status e excluir exigem login, porque isso é operação interna
    do restaurante.
    """

    def has_permission(self, request, view):
        if request.method == "POST" and getattr(view, "action", None) == "create":
            return True
        return bool(request.user and request.user.is_authenticated)
