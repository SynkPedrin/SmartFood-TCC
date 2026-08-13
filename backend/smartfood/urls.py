from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from .auth_views import EuView, LoginView, LogoutView

urlpatterns = [
    # Raiz → documentação (evita 404 ao abrir a URL base)
    path("", RedirectView.as_view(url="/api/v1/docs/", permanent=False)),

    path("admin/", admin.site.urls),

    # Documentação da API
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # Autenticação da equipe
    path("api/v1/auth/login/", LoginView.as_view(), name="login"),
    path("api/v1/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/v1/auth/eu/", EuView.as_view(), name="eu"),

    # Apps
    path("api/v1/", include("apps.categorias.urls")),
    path("api/v1/", include("apps.produtos.urls")),
    path("api/v1/", include("apps.mesas.urls")),
    path("api/v1/", include("apps.pedidos.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
