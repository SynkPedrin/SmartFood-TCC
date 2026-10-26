import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smartfood.settings")

from django.core.asgi import get_asgi_application

# O app HTTP precisa existir antes de importar qualquer coisa que toque em models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import OriginValidator
from django.conf import settings

from apps.pedidos.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": OriginValidator(URLRouter(websocket_urlpatterns), settings.CORS_ALLOWED_ORIGINS),
})
