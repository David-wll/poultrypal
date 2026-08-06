from django.contrib import admin
from .models import VaccinationSchedule, Drug, MedicationLog


@admin.register(Drug)
class DrugAdmin(admin.ModelAdmin):
    list_display = ('name', 'drug_type', 'default_unit_cost', 'default_unit', 'is_active')
    list_filter = ('drug_type', 'is_active')
    search_fields = ('name',)


@admin.register(MedicationLog)
class MedicationLogAdmin(admin.ModelAdmin):
    list_display = ('flock', 'drug', 'date_given', 'cost', 'quantity_used')
    list_filter = ('drug__drug_type', 'date_given')
    search_fields = ('flock__batch_name', 'drug__name')
    autocomplete_fields = ('flock', 'drug')


# If VaccinationSchedule isn't already registered elsewhere, add this too:
@admin.register(VaccinationSchedule)
class VaccinationScheduleAdmin(admin.ModelAdmin):
    list_display = ('flock', 'drug', 'scheduled_date', 'administered_date', 'cost', 'is_overdue')
    list_filter = ('drug__drug_type', 'scheduled_date')
    search_fields = ('flock__batch_name', 'drug__name')
    autocomplete_fields = ('flock', 'drug')