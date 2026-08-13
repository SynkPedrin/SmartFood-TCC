from django.urls import path

from .consumers import FilaConsumer

websocket_urlpatterns = [
    path("ws/cozinha/", FilaConsumer.as_asgi()),
]
