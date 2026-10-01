from django.urls import path
from .views import FeedLogView, MortalityLogView, EggLogView, ExpenseLogView

urlpatterns = [
    path('<uuid:flock_id>/feed/', FeedLogView.as_view(), name='feed-log'),
    path('<uuid:flock_id>/mortality/', MortalityLogView.as_view(), name='mortality-log'),
    path('<uuid:flock_id>/eggs/', EggLogView.as_view(), name='egg-log'),
    path('<uuid:flock_id>/expenses/', ExpenseLogView.as_view(), name='expense-log'),
]