from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.flocks.models import Flock
from .models import FeedLog, MortalityLog, EggProductionLog, ExpenseLog
from .serializers import (
    FeedLogSerializer, MortalityLogSerializer,
    EggProductionLogSerializer, ExpenseLogSerializer
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