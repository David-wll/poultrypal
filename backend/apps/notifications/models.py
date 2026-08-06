from django.db import models
import uuid

class NotificationLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(
        'farmers.Farmer', on_delete=models.CASCADE, related_name='notifications'
    )

    CHANNEL_CHOICES = [
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
    ]
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='sms')

    TYPE_CHOICES = [
        ('harvest', 'Harvest Ready'),
        ('vaccine', 'Vaccine Reminder'),
        ('mortality', 'Mortality Alert'),
        ('summary', 'Weekly Summary'),
        ('overdue', 'Overdue Vaccine'),
    ]
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField()
    delivered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.farmer.full_name} — {self.notification_type} ({self.created_at.date()})"