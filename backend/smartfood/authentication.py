from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        if token.created + timedelta(hours=settings.TOKEN_TTL_HOURS) <= timezone.now():
            raise AuthenticationFailed('Sessão expirada. Entre novamente.')
        return user, token
