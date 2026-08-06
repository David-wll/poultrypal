from rest_framework import serializers
from .models import VaccinationSchedule, Drug, MedicationLog


class DrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = [
            'id', 'name', 'drug_type', 'default_unit_cost',
            'default_unit', 'notes', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class VaccinationScheduleSerializer(serializers.ModelSerializer):
    is_done = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    drug_name = serializers.CharField(source='drug.name', read_only=True)
    drug_type = serializers.CharField(source='drug.drug_type', read_only=True)

    class Meta:
        model = VaccinationSchedule
        fields = [
            'id', 'flock', 'drug', 'drug_name', 'drug_type',
            'scheduled_date', 'administered_date', 'administered_by',
            'dose_ml', 'cost', 'reminder_sent', 'notes', 'created_at',
            'is_done', 'is_overdue'
        ]
        read_only_fields = ['id', 'reminder_sent', 'created_at']


class MarkAdministeredSerializer(serializers.Serializer):
    administered_date = serializers.DateField()
    administered_by = serializers.CharField(max_length=100, required=False)
    dose_ml = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False
    )
    cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )


class MedicationLogSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source='drug.name', read_only=True)
    drug_type = serializers.CharField(source='drug.drug_type', read_only=True)

    class Meta:
        model = MedicationLog
        fields = [
            'id', 'flock', 'drug', 'drug_name', 'drug_type',
            'date_given', 'dosage', 'quantity_used', 'cost',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'flock', 'created_at']