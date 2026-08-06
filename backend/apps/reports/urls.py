from django.urls import path
from .views import FlockReportView

urlpatterns = [
    path('<uuid:flock_id>/', FlockReportView.as_view(), name='flock-report'),
]