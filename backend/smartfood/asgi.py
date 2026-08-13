import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smartfood.settings")

from django.core.asgi import get_asgi_application

# O app HTTP precisa existir antes de importar qualquer coisa que toque em models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from apps.pedidos.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(websocket_urlpatterns),
})
