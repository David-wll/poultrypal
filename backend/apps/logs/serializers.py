from rest_framework import serializers
from .models import FeedLog, MortalityLog, EggProductionLog, ExpenseLog
from decimal import Decimal

class FeedLogSerializer(serializers.ModelSerializer):
    quantity_kg = serializers.DecimalField(
        max_digits=6, decimal_places=2, required=False
    )

    class Meta:
        model = FeedLog
        fields = [
            'id', 'flock', 'date', 'feed_type', 'feed_brand',
            'quantity_kg', 'bags', 'bag_size_kg', 'cost_naira', 'created_at'
        ]
        read_only_fields = ['id', 'flock', 'created_at']

    def validate(self, attrs):
        # Bags entry: derive kg from bags x bag size
        if attrs.get('quantity_kg') is None:
            bags = attrs.get('bags')
            size = attrs.get('bag_size_kg')
            if not bags or not size:
                raise serializers.ValidationError(
                    'Enter the amount in kg, or the number of bags and the bag size.'
                )
            attrs['quantity_kg'] = (bags * size).quantize(Decimal('0.01'))
        if attrs['quantity_kg'] <= 0:
            raise serializers.ValidationError('Feed amount must be greater than 0.')
        return attrs


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