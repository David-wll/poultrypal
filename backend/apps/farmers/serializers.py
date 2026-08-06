from rest_framework import serializers
from .models import Farmer, OTPVerification

class FarmerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmer
        fields = [
            'id', 'full_name', 'phone_number', 'email',
            'farm_name', 'state', 'lga', 'preferred_language',
            'created_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at']


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