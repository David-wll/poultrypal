from django.db import models
import uuid

class FeedLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flock = models.ForeignKey(
        'flocks.Flock', on_delete=models.CASCADE, related_name='feed_logs'
    )
    date = models.DateField()
    feed_type = models.CharField(max_length=50)  # Starter, Grower, Finisher
    feed_brand = models.CharField(max_length=50, blank=True)
    quantity_kg = models.DecimalField(max_digits=6, decimal_places=2)
    cost_naira = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.flock.batch_name} — Feed {self.date}"


class MortalityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flock = models.ForeignKey(
        'flocks.Flock', on_delete=models.CASCADE, related_name='mortality_logs'
    )
    date = models.DateField()
    count = models.IntegerField()
    suspected_cause = models.CharField(max_length=100, blank=True)
    vet_consulted = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Auto-deduct from flock current count
        self.flock.current_count = max(
            0, self.flock.current_count - self.count
        )
        self.flock.save()
        # Trigger alert if deaths exceed 3% of flock
        spike_threshold = self.flock.initial_count * 0.03
        if self.count >= spike_threshold:
            #from apps.notifications.tasks import send_mortality_alert
            #send_mortality_alert.delay(str(self.flock.id), self.count)
            pass

    def __str__(self):
        return f"{self.flock.batch_name} — {self.count} deaths on {self.date}"


class EggProductionLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flock = models.ForeignKey(
        'flocks.Flock', on_delete=models.CASCADE, related_name='egg_logs'
    )
    date = models.DateField()
    eggs_collected = models.IntegerField()
    cracked_eggs = models.IntegerField(default=0)
    eggs_sold = models.IntegerField(default=0)
    revenue_naira = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.flock.batch_name} — Eggs {self.date}"


class ExpenseLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flock = models.ForeignKey(
        'flocks.Flock', on_delete=models.CASCADE, related_name='expense_logs'
    )
    date = models.DateField()

    CATEGORY_CHOICES = [
        ('feed', 'Feed'),
        ('medication', 'Medication'),
        ('labour', 'Labour'),
        ('equipment', 'Equipment'),
        ('other', 'Other'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=200)
    amount_naira = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.flock.batch_name} — {self.category} {self.date}"
