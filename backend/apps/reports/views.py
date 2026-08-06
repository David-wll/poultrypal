from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from apps.flocks.models import Flock
from apps.flocks.serializers import FlockSerializer
from apps.logs.models import FeedLog, MortalityLog, EggProductionLog, ExpenseLog
from apps.vaccines.models import MedicationLog, VaccinationSchedule


class FlockReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(
            Flock, id=flock_id, farmer=request.user
        )

        feed_cost = FeedLog.objects.filter(flock=flock).aggregate(
            total=Sum('cost_naira')
        )['total'] or 0

        other_expenses = ExpenseLog.objects.filter(flock=flock).aggregate(
            total=Sum('amount_naira')
        )['total'] or 0

        medication_cost = MedicationLog.objects.filter(flock=flock).aggregate(
            total=Sum('cost')
        )['total'] or 0

        vaccine_cost = VaccinationSchedule.objects.filter(flock=flock).aggregate(
            total=Sum('cost')
        )['total'] or 0

        revenue = EggProductionLog.objects.filter(flock=flock).aggregate(
            total=Sum('revenue_naira')
        )['total'] or 0

        total_deaths = MortalityLog.objects.filter(flock=flock).aggregate(
            total=Sum('count')
        )['total'] or 0

        total_expenses = feed_cost + other_expenses + medication_cost + vaccine_cost
        net_profit = revenue - total_expenses
        survival_rate = round(
            (flock.initial_count - total_deaths) / flock.initial_count * 100, 1
        ) if flock.initial_count > 0 else 0

        return Response({
            'flock': FlockSerializer(flock).data,
            'feed_cost': feed_cost,
            'medication_cost': medication_cost,
            'vaccine_cost': vaccine_cost,
            'other_expenses': other_expenses,
            'total_expenses': total_expenses,
            'total_revenue': revenue,
            'net_profit': net_profit,
            'survival_rate': survival_rate,
            'total_deaths': total_deaths,
            'cost_per_bird': round(
                total_expenses / flock.current_count, 2
            ) if flock.current_count > 0 else 0,
        })