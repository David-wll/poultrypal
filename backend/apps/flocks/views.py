from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Flock
from .serializers import FlockSerializer, FlockCreateSerializer
from apps.vaccines.schedules import generate_schedule


class FlockListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only return active flocks for this farmer
        flocks = Flock.objects.filter(
            farmer=request.user,
            is_deleted=False
        ).order_by('-created_at')
        serializer = FlockSerializer(flocks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FlockCreateSerializer(data=request.data)
        if serializer.is_valid():
            flock = serializer.save(farmer=request.user)
            generate_schedule(flock)
            return Response(
                FlockSerializer(flock).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FlockDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, flock_id):
        flock = get_object_or_404(
            Flock, id=flock_id,
            farmer=request.user,
            is_deleted=False
        )
        return Response(FlockSerializer(flock).data)

    def put(self, request, flock_id):
        flock = get_object_or_404(
            Flock, id=flock_id,
            farmer=request.user,
            is_deleted=False
        )
        serializer = FlockCreateSerializer(
            flock, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(FlockSerializer(flock).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, flock_id):
        flock = get_object_or_404(
            Flock, id=flock_id,
            farmer=request.user
        )
        flock.is_deleted = True
        flock.save()
        return Response(
            {'message': 'Flock deleted'},
            status=status.HTTP_200_OK
        )


class HarvestFlockView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, flock_id):
        flock = get_object_or_404(
            Flock, id=flock_id,
            farmer=request.user,
            status='active'
        )
        flock.status = 'harvested'
        flock.save()
        return Response(
            {'message': f'{flock.batch_name} marked as harvested'},
            status=status.HTTP_200_OK
        )