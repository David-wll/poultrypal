from rest_framework import serializers
from .models import Farmer, OTPVerification
from django.contrib.auth.password_validation import validate_password

class FarmerSerializer(serializers.ModelSerializer):
    has_password = serializers.SerializerMethodField()

    class Meta:
        model = Farmer
        fields = [
            'id', 'full_name', 'phone_number', 'email',
            'farm_name', 'state', 'lga', 'preferred_language',
            'created_at', 'is_active', 'has_password'
        ]
        read_only_fields = ['id', 'created_at', 'has_password']

    def get_has_password(self, obj):
        # OTP-created accounts have an empty/unusable password
        return bool(obj.password) and obj.has_usable_password()


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)


class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)


class FarmerRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmer
        fields = [
            'full_name', 'phone_number', 'email',
            'farm_name', 'state', 'lga', 'preferred_language'
        ]

    def validate_phone_number(self, value):
        # Make sure phone number starts with + or 0
        if not value.startswith(('+', '0')):
            raise serializers.ValidationError(
                "Phone number must start with + or 0"
            )
        return value

def _check_phone_format(value):
    value = value.strip()
    if not value.startswith(('+', '0')):
        raise serializers.ValidationError("Phone number must start with + or 0")
    return value


class PasswordRegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True, max_length=128)
    full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_phone_number(self, value):
        return _check_phone_format(value)

    def validate_password(self, value):
        validate_password(value)
        return value


class PasswordLoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True, max_length=128)

    def validate_phone_number(self, value):
        return value.strip()


class SetPasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, max_length=128
    )
    new_password = serializers.CharField(write_only=True, max_length=128)