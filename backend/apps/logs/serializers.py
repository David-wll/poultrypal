from rest_framework import serializers
from .models import FeedLog, MortalityLog, EggProductionLog, ExpenseLog

class FeedLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedLog
        fields = [
            'id', 'flock', 'date', 'feed_type', 'feed_brand',
            'quantity_kg', 'cost_naira', 'created_at'
        ]
        read_only_fields = ['id', 'flock', 'created_at']


class MortalityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MortalityLog
        fields = [
            'id', 'flock', 'date', 'count', 'suspected_cause',
            'vet_consulted', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'flock', 'created_at']

    def validate_count(self, value):
        if value < 0:
            raise serializers.ValidationError("Count cannot be negative")
        return value


class EggProductionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EggProductionLog
        fields = [
            'id', 'flock', 'date', 'eggs_collected', 'cracked_eggs',
            'eggs_sold', 'revenue_naira', 'created_at'
        ]
        read_only_fields = ['id', 'flock', 'created_at']


class ExpenseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseLog
        fields = [
            'id', 'flock', 'date', 'category',
            'description', 'amount_naira', 'created_at'
        ]
        read_only_fields = ['id', 'flock', 'created_at']