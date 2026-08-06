from django.urls import path
from .views import (
    VaccinationScheduleView,
    MarkAdministeredView,
    RescheduleView,
    DrugListView,
    MedicationLogView,
)

urlpatterns = [
    path('<uuid:flock_id>/schedule/', VaccinationScheduleView.as_view(), name='vaccine-schedule'),
    path('<uuid:vaccine_id>/administer/', MarkAdministeredView.as_view(), name='mark-administered'),
    path('<uuid:vaccine_id>/reschedule/', RescheduleView.as_view(), name='reschedule'),
    path('drugs/', DrugListView.as_view(), name='drug-list'),
    path('<uuid:flock_id>/medications/', MedicationLogView.as_view(), name='medication-log'),
]