from rest_framework import serializers
from datetime import date
from .models import Flock

class FlockSerializer(serializers.ModelSerializer):
    days_alive = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    survival_rate = serializers.SerializerMethodField()

    class Meta:
        model = Flock
        fields = [
            'id', 'farmer', 'batch_name', 'bird_type', 'breed',
            'housing_type', 'initial_count', 'current_count',
            'arrival_date', 'expected_harvest_date', 'status',
            'notes', 'created_at',
            'days_alive', 'days_remaining', 'survival_rate',
        ]
        read_only_fields = [
            'id', 'farmer', 'current_count',
            'expected_harvest_date', 'created_at'
        ]

    def get_days_alive(self, obj):
        return (date.today() - obj.arrival_date).days

    def get_days_remaining(self, obj):
        if obj.expected_harvest_date:
            return max(0, (obj.expected_harvest_date - date.today()).days)
        return None

    def get_survival_rate(self, obj):
        if obj.initial_count == 0:
            return 0
        return round((obj.current_count / obj.initial_count) * 100, 1)


class FlockCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flock
        fields = [
            'batch_name', 'bird_type', 'breed',
            'housing_type', 'initial_count', 'arrival_date', 'notes'
        ]

    def validate_initial_count(self, value):
        if value <= 0:
            raise serializers.ValidationError("Bird count must be greater than 0")
        return value

    def validate_arrival_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Arrival date cannot be in the future")
        return value

    def create(self, validated_data):
        farmer = validated_data.pop('farmer', None)
        flock = Flock(
            farmer=farmer,
            current_count=validated_data['initial_count'],
            **validated_data
        )
        flock.save()
        return flock