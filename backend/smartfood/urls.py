from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.generic import RedirectView
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from .auth_views import EuView, LoginView, LogoutView, WebsocketTicketView
from apps.restaurante.views import AcessoIAView, MemoriasView, ConfiguracaoView, IndicadoresView, AcompanhamentoView, HealthView

urlpatterns = [
    path("api/v1/health/", HealthView.as_view()),
    path("api/v1/restaurante/", ConfiguracaoView.as_view()),
    path("api/v1/indicadores/", IndicadoresView.as_view()),
    path("api/v1/ia/acesso/", AcessoIAView.as_view()),
    path("api/v1/ia/memorias/", MemoriasView.as_view()),
    path("api/v1/acompanhamento/<uuid:codigo>/", AcompanhamentoView.as_view()),
    # Raiz → documentação (evita 404 ao abrir a URL base)
    path("", RedirectView.as_view(url="/api/v1/docs/", permanent=False)),

    path("admin/", admin.site.urls),

    # Documentação da API
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    path("api/v1/auth/ws-ticket/", WebsocketTicketView.as_view()),

    # Autenticação da equipe
    path("api/v1/auth/login/", LoginView.as_view(), name="login"),
    path("api/v1/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/v1/auth/eu/", EuView.as_view(), name="eu"),

    # Apps
    path("api/v1/", include("apps.categorias.urls")),
    path("api/v1/", include("apps.produtos.urls")),
    path("api/v1/", include("apps.mesas.urls")),
    path("api/v1/", include("apps.pedidos.urls")),

    # Fotos dos produtos em qualquer modo: a rota "static()" padrão só existe com
    # DEBUG=True, e sem foto o cardápio quebra em produção. Serve direto do Django,
    # suficiente para o volume deste projeto (numa operação grande, usar CDN/nginx).
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
