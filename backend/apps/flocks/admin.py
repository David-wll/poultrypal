from django.contrib import admin
from .models import Flock

@admin.register(Flock)
class FlockAdmin(admin.ModelAdmin):
    list_display = ['batch_name', 'bird_type', 'initial_count', 'current_count', 'arrival_date', 'expected_harvest_date', 'status']
    list_filter = ['bird_type', 'status']
    search_fields = ['batch_name']