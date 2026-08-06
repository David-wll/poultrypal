from django.urls import path
from .views import FlockListCreateView, FlockDetailView, HarvestFlockView

urlpatterns = [
    path('', FlockListCreateView.as_view(), name='flock-list-create'),
    path('<uuid:flock_id>/', FlockDetailView.as_view(), name='flock-detail'),
    path('<uuid:flock_id>/harvest/', HarvestFlockView.as_view(), name='flock-harvest'),
]