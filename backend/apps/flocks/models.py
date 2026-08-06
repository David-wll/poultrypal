from django.db import models
from datetime import timedelta, date
import uuid

GROW_OUT_DAYS = {
    'broiler': 42,
    'cockerel': 84,
    'layer': 154,
    'turkey': 112,
    'duck': 56,
}

class Flock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(
        'farmers.Farmer', on_delete=models.CASCADE, related_name='flocks'
    )
    batch_name = models.CharField(max_length=100)

    BIRD_TYPES = [
        ('broiler', 'Broiler'),
        ('layer', 'Layer'),
        ('cockerel', 'Cockerel'),
        ('turkey', 'Turkey'),
        ('duck', 'Duck'),
    ]
    bird_type = models.CharField(max_length=20, choices=BIRD_TYPES)
    breed = models.CharField(max_length=50, blank=True)

    HOUSING_TYPES = [
        ('deep_litter', 'Deep Litter'),
        ('battery_cage', 'Battery Cage'),
        ('free_range', 'Free Range'),
    ]
    housing_type = models.CharField(
        max_length=20, choices=HOUSING_TYPES, default='deep_litter'
    )

    initial_count = models.IntegerField()
    current_count = models.IntegerField(default=0)
    arrival_date = models.DateField()
    expected_harvest_date = models.DateField(blank=True, null=True)

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('harvested', 'Harvested'),
        ('terminated', 'Terminated'),
    ]
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active'
    )
    notes = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Always set current_count on first save
        if not self.pk:
            self.current_count = self.initial_count

        # Always calculate harvest date if not set
        if not self.expected_harvest_date:
            days = GROW_OUT_DAYS.get(self.bird_type, 42)
            if self.arrival_date:
                self.expected_harvest_date = (
                    self.arrival_date + timedelta(days=days)
                )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.batch_name} ({self.bird_type})"