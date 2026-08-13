from pathlib import Path
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost").split(",")

DJANGO_APPS = [
    # antes do admin de proposito: e o daphne que passa a servir o runserver,
    # senao o runserver sobe em WSGI e o WebSocket nao existe
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    "channels",
]

LOCAL_APPS = [
    "apps.categorias",
    "apps.produtos",
    "apps.mesas",
    "apps.pedidos",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "smartfood.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "smartfood.wsgi.application"
ASGI_APPLICATION = "smartfood.asgi.application"

_database_url = config("DATABASE_URL", default="")
_url_is_valid = _database_url and "[" not in _database_url and "SUA-SENHA" not in _database_url

if _url_is_valid:
    _is_sqlite = _database_url.startswith("sqlite")
    DATABASES = {"default": dj_database_url.parse(_database_url, conn_max_age=600, ssl_require=not _is_sqlite)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="smartfood"),
            "USER": config("DB_USER", default="smartfood"),
            "PASSWORD": config("DB_PASSWORD", default="smartfood123"),
            "HOST": config("DB_HOST", default="db"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }

# Com Redis, o aviso da cozinha funciona entre vários processos. Sem Redis
# (máquina de desenvolvimento sem Docker), cai para a camada em memória, que
# vale só dentro do processo: suficiente para desenvolver e apresentar.
#
# A escolha é por alcance real, não pela variável existir: no docker-compose a
# REDIS_URL aponta para o host "redis", que fora do Docker não resolve, e o
# WebSocket morria tentando conectar.
_redis_url = config("REDIS_URL", default="")


def _alcancavel(url: str) -> bool:
    import socket
    from urllib.parse import urlparse

    host = urlparse(url).hostname
    if not host:
        return False
    try:
        socket.gethostbyname(host)
        return True
    except OSError:
        return False


if _redis_url and _alcancavel(_redis_url):
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [_redis_url]},
        }
    }
else:
    CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Senha do usuário de demonstração criado por `manage.py seed_demo`.
DEMO_PASSWORD = config("DEMO_PASSWORD", default="")

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Token para a equipe (totem e cardápio continuam de leitura pública).
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "smartfood.permissions.LeituraPublicaEscritaAutenticada",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SmartFood API",
    "DESCRIPTION": "API do sistema de gestão de pedidos SmartFood - TCC UniSalesiano 2026",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
