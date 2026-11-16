from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.flocks.models import Flock
from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction
from django.utils.dateparse import parse_date
from .models import FeedLog, FeedBag, MortalityLog, EggProductionLog, ExpenseLog
from .serializers import (
    FeedLogSerializer, MortalityLogSerializer,
    EggProductionLogSerializer, ExpenseLogSerializer,
    FeedBagSerializer, FeedBagOpenSerializer
)


class FeedLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        logs = FeedLog.objects.filter(flock=flock).order_by('-date')
        return Response(FeedLogSerializer(logs, many=True).data)

    def post(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        serializer = FeedLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(flock=flock)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MortalityLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        logs = MortalityLog.objects.filter(flock=flock).order_by('-date')
        return Response(MortalityLogSerializer(logs, many=True).data)

    def post(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        serializer = MortalityLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(flock=flock)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EggLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        logs = EggProductionLog.objects.filter(flock=flock).order_by('-date')
        return Response(EggProductionLogSerializer(logs, many=True).data)

    def post(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        serializer = EggProductionLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(flock=flock)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExpenseLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        logs = ExpenseLog.objects.filter(flock=flock).order_by('-date')
        return Response(ExpenseLogSerializer(logs, many=True).data)

    def post(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        serializer = ExpenseLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(flock=flock)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def _spread(total, n):
    """Split `total` into n two-decimal parts that add up exactly to total."""
    base = (total / n).quantize(Decimal('0.01'))
    parts = [base] * n
    parts[-1] = total - base * (n - 1)
    return parts


def _create_feed_estimates(bag, flock):
    """
    Spread what is left of a finished bag across the days it was in use.
    Feed the farmer logged herself during those days stays exactly as she
    entered it, and is subtracted from the bag so nothing is counted twice.
    """
    days = [bag.opened_on + timedelta(days=i) for i in range(bag.days_used)]
    own_logs = list(
        FeedLog.objects.filter(flock=flock, is_estimate=False, date__in=days)
    )
    logged_days = {log.date for log in own_logs}
    own_kg = sum((log.quantity_kg for log in own_logs), Decimal('0'))
    own_cost = sum((log.cost_naira for log in own_logs), Decimal('0'))

    free_days = [d for d in days if d not in logged_days]
    remaining_kg = max(bag.bag_size_kg - own_kg, Decimal('0'))
    remaining_cost = max(bag.price_naira - own_cost, Decimal('0'))
    if not free_days or remaining_kg == 0:
        return

    kgs = _spread(remaining_kg, len(free_days))
    costs = _spread(remaining_cost, len(free_days))
    FeedLog.objects.bulk_create([
        FeedLog(
            flock=flock, date=d, feed_type=bag.feed_type or 'Feed',
            quantity_kg=kg, cost_naira=cost, is_estimate=True, bag=bag,
        )
        for d, kg, cost in zip(free_days, kgs, costs)
    ])


class FeedBagListView(APIView):
    """GET: open bag, bag history and averages. POST: open a new bag."""
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        bags = list(
            FeedBag.objects.filter(flock=flock).order_by('-opened_on', '-created_at')
        )
        open_bag = next((b for b in bags if not b.finished_on), None)
        finished = [b for b in bags if b.finished_on]

        summary = None
        if finished:
            n = len(finished)
            grams = [
                b.grams_per_bird_per_day for b in finished
                if b.grams_per_bird_per_day
            ]
            summary = {
                'bags_finished': n,
                'avg_days': round(sum(b.days_used for b in finished) / n, 1),
                'avg_kg_per_day': round(sum(b.kg_per_day for b in finished) / n, 2),
                'avg_cost_per_day': round(sum(b.cost_per_day for b in finished) / n, 2),
                'avg_grams_per_bird_per_day': (
                    round(sum(grams) / len(grams), 1) if grams else None
                ),
            }
        return Response({
            'open_bag': FeedBagSerializer(open_bag).data if open_bag else None,
            'bags': FeedBagSerializer(bags, many=True).data,
            'summary': summary,
        })

    def post(self, request, flock_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        if FeedBag.objects.filter(flock=flock, finished_on__isnull=True).exists():
            return Response(
                {'error': 'Finish the current bag before opening a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = FeedBagOpenSerializer(data=request.data)
        if serializer.is_valid():
            bag = serializer.save(
                flock=flock,
                opened_on=serializer.validated_data.get('opened_on') or date.today(),
            )
            return Response(
                FeedBagSerializer(bag).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FeedBagFinishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, flock_id, bag_id):
        flock = get_object_or_404(Flock, id=flock_id, farmer=request.user)
        bag = get_object_or_404(FeedBag, id=bag_id, flock=flock)
        if bag.finished_on:
            return Response(
                {'error': 'This bag is already finished.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        raw = request.data.get('finished_on')
        finished_on = parse_date(str(raw)) if raw else date.today()
        if finished_on is None:
            return Response(
                {'error': 'Enter a valid date.'}, status=status.HTTP_400_BAD_REQUEST
            )
        if finished_on < bag.opened_on:
            return Response(
                {'error': 'Finish date cannot be before the day the bag was opened.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            bag.finished_on = finished_on
            bag.birds_at_finish = flock.current_count
            bag.save()
            _create_feed_estimates(bag, flock)   # remove this line for stats-only
        return Response(FeedBagSerializer(bag).data)