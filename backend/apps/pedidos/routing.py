from django.urls import path

from .consumers import FilaConsumer, SalaoConsumer

websocket_urlpatterns = [
    path("ws/cozinha/", FilaConsumer.as_asgi()),
    path("ws/salao/", SalaoConsumer.as_asgi()),
]
