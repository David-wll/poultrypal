from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.flocks.models import Flock
from .models import VaccinationSchedule, Drug, MedicationLog
from .serializers import (
    VaccinationScheduleSerializer,
    MarkAdministeredSerializer,
    DrugSerializer,
    MedicationLogSerializer,
)


class VaccinationScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        schedules = VaccinationSchedule.objects.filter(
            flock=flock
        ).order_by('scheduled_date')
        return Response(VaccinationScheduleSerializer(schedules, many=True).data)


class MarkAdministeredView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, vaccine_id):
        vaccine = get_object_or_404(
            VaccinationSchedule,
            id=vaccine_id,
            flock__farmer=request.user
        )
        serializer = MarkAdministeredSerializer(data=request.data)
        if serializer.is_valid():
            vaccine.administered_date = serializer.validated_data['administered_date']
            vaccine.administered_by = serializer.validated_data.get('administered_by', '')
            vaccine.dose_ml = serializer.validated_data.get('dose_ml', None)
            vaccine.cost = serializer.validated_data.get('cost', vaccine.cost)
            vaccine.save()
            return Response(VaccinationScheduleSerializer(vaccine).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RescheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, vaccine_id):
        vaccine = get_object_or_404(
            VaccinationSchedule,
            id=vaccine_id,
            flock__farmer=request.user
        )
        new_date = request.data.get('scheduled_date')
        if not new_date:
            return Response(
                {'error': 'scheduled_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        vaccine.scheduled_date = new_date
        vaccine.save()
        return Response(VaccinationScheduleSerializer(vaccine).data)


class DrugListView(APIView):
    """Lookup list for drug dropdowns — filterable by ?drug_type=vaccine etc."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        drugs = Drug.objects.filter(is_active=True)
        drug_type = request.query_params.get('drug_type')
        if drug_type:
            drugs = drugs.filter(drug_type=drug_type)
        return Response(DrugSerializer(drugs, many=True).data)


class MedicationLogView(APIView):
    """List + create medication logs for a specific flock."""
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        logs = MedicationLog.objects.filter(flock=flock).order_by('-date_given')
        return Response(MedicationLogSerializer(logs, many=True).data)

    def post(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        serializer = MedicationLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(flock=flock)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)