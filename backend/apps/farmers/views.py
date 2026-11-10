from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from .models import Farmer, OTPVerification
from .serializers import (
    FarmerSerializer,
    FarmerRegistrationSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PasswordRegisterSerializer,
    PasswordLoginSerializer,
    SetPasswordSerializer,
)
from .throttles import PhoneRateThrottle
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


def _session_response(farmer, is_new, http_status=status.HTTP_200_OK):
    """Same response shape as verify-otp, so the frontend handles both alike."""
    refresh = RefreshToken.for_user(farmer)
    return Response({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'farmer': FarmerSerializer(farmer).data,
        'is_new_farmer': is_new,
    }, status=http_status)


class PasswordRegisterView(APIView):
    """Create an account with phone number + password (no OTP needed)."""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle, PhoneRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Never attach a password to an existing account here: that would let
        # anyone claim an OTP-created account just by knowing the phone number.
        if Farmer.objects.filter(phone_number=data['phone_number']).exists():
            return Response(
                {'error': 'An account with this number already exists. '
                          'Sign in instead, or sign in with OTP and set a '
                          'password from your profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            farmer = Farmer.objects.create_user(
                phone_number=data['phone_number'],
                password=data['password'],
                full_name=data.get('full_name', ''),
            )
        except IntegrityError:
            return Response(
                {'error': 'An account with this number already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return _session_response(farmer, True, status.HTTP_201_CREATED)


class PasswordLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle, PhoneRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        farmer = authenticate(
            request,
            phone_number=data['phone_number'],
            password=data['password'],
        )
        if farmer is None:
            # 400, not 401: the frontend logs out and redirects on any 401.
            # Same message for unknown number and wrong password.
            return Response(
                {'error': 'Invalid phone number or password.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return _session_response(farmer, False)


class SetPasswordView(APIView):
    """Signed-in farmers (e.g. via OTP) can add a password, or change theirs.
    Changing an existing password requires the current one."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        farmer = request.user
        data = serializer.validated_data

        has_password = bool(farmer.password) and farmer.has_usable_password()
        if has_password and not farmer.check_password(
            data.get('current_password', '')
        ):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            validate_password(data['new_password'], user=farmer)
        except DjangoValidationError as e:
            return Response(
                {'error': ' '.join(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
        farmer.set_password(data['new_password'])
        farmer.save(update_fields=['password'])
        return Response({'message': 'Password saved.'})