from django.db import models
import uuid


class Drug(models.Model):
    """Lookup table for drugs/medications and vaccines."""

    DRUG_TYPE_CHOICES = [
        ('antibiotic', 'Antibiotic'),
        ('vitamin', 'Vitamin/Supplement'),
        ('coccidiostat', 'Coccidiostat'),
        ('dewormer', 'Dewormer'),
        ('vaccine', 'Vaccine'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    drug_type = models.CharField(max_length=20, choices=DRUG_TYPE_CHOICES)
    default_unit_cost = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    default_unit = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_drug_type_display()})"


class MedicationLog(models.Model):
    """Daily/as-needed drug administration log — parallel to FeedLog."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flock = models.ForeignKey(
        'flocks.Flock', on_delete=models.CASCADE, related_name='medication_logs'
    )
    drug = models.ForeignKey(
        Drug, on_delete=models.PROTECT, related_name='medication_logs'
    )
    date_given = models.DateField()
    dosage = models.CharField(max_length=100, blank=True)
    quantity_used = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_given']

    def __str__(self):
        return f"{self.flock.batch_name} — {self.drug.name} on {self.date_given}"


class VaccinationSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flock = models.ForeignKey(
        'flocks.Flock', on_delete=models.CASCADE, related_name='vaccine_schedules'
    )
    drug = models.ForeignKey(
        Drug, on_delete=models.PROTECT, related_name='vaccine_schedules',
        limit_choices_to={'drug_type': 'vaccine'}
    )
    scheduled_date = models.DateField()
    administered_date = models.DateField(blank=True, null=True)
    administered_by = models.CharField(max_length=100, blank=True)
    dose_ml = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )
    cost = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    reminder_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_done(self):
        return self.administered_date is not None

    @property
    def is_overdue(self):
        from datetime import date
        return (
            not self.is_done and
            self.scheduled_date < date.today()
        )

    def __str__(self):
        return f"{self.flock.batch_name} — {self.drug.name} ({self.scheduled_date})"