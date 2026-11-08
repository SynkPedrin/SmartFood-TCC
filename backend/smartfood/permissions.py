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
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class PermissaoPedido(BasePermission):
    """Pedido tem uma regra própria.

    * Criar é público: é o cliente da mesa fazendo o pedido pelo totem, sem conta.
    * A tela da cozinha funciona sem login (fica num monitor fixo da cozinha):
      ela pode ler **só a fila aberta** (`?aberto=true`) e **só avançar** o
      preparo (em preparo → pronto → entregue). A máquina de estados do pedido
      continua impedindo pular etapa ou voltar.
    * Cancelar, ver o histórico completo, editar e excluir exigem a equipe logada.
    """

    #: Etapas que a cozinha pode marcar sem login. Cancelar fica de fora.
    AVANCOS_DA_COZINHA = {"preparando", "pronto", "entregue"}

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        acao = getattr(view, "action", None)
        if request.method == "POST" and acao == "create":
            return True
        if request.method == "GET" and acao == "list":
            return str(request.query_params.get("aberto", "")).lower() in {"true", "1"}
        if request.method == "POST" and acao == "status":
            return str(request.data.get("status", "")) in self.AVANCOS_DA_COZINHA
        return False
