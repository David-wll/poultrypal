from django.urls import path
from .views import HealthObservationCreateView, HealthObservationListView

urlpatterns = [
    path("observations/", HealthObservationCreateView.as_view(), name="health-observation-create"),
    path("observations/list/", HealthObservationListView.as_view(), name="health-observation-list"),
]
