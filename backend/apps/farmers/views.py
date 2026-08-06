from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .models import Farmer, OTPVerification
from .serializers import (
    FarmerSerializer,
    FarmerRegistrationSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer
)
import random


def generate_otp():
    return str(random.randint(100000, 999999))


class RequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            otp = generate_otp()

            # Save OTP to DB
            OTPVerification.objects.create(
                phone_number=phone,
                otp_code=otp
            )

            # Print to terminal during development
            print(f"\n{'='*40}")
            print(f"OTP for {phone}: {otp}")
            print(f"{'='*40}\n")

            return Response(
                {'message': 'OTP sent successfully'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            otp_code = serializer.validated_data['otp_code']

            # Find latest unused OTP
            otp_obj = OTPVerification.objects.filter(
                phone_number=phone,
                otp_code=otp_code,
                is_used=False
            ).last()

            if not otp_obj:
                return Response(
                    {'error': 'Invalid or expired OTP'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Mark OTP as used
            otp_obj.is_used = True
            otp_obj.save()

            # Get or create farmer by phone number
            farmer, created = Farmer.objects.get_or_create(
                phone_number=phone
            )

            # Generate JWT token for this farmer
            refresh = RefreshToken.for_user(farmer)

            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'farmer': FarmerSerializer(farmer).data,
                'is_new_farmer': created
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FarmerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user IS the farmer because of AUTH_USER_MODEL
        return Response(FarmerSerializer(request.user).data)

    def put(self, request):
        serializer = FarmerRegistrationSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(FarmerSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)