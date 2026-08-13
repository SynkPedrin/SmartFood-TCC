from rest_framework.routers import DefaultRouter
from .views import MesaViewSet

router = DefaultRouter()
router.register("mesas", MesaViewSet, basename="mesa")

urlpatterns = router.urls
