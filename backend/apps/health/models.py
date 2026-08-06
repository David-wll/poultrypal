from django.db import models
from apps.flocks.models import Flock
from apps.vaccines.models import Drug

class HealthObservation(models.Model):
    SEASON_CHOICES = [("dry", "Dry"), ("rainy", "Rainy")]
    OBS_TYPE_CHOICES = [("sick_check", "Sick Check"), ("death_log", "Death Log")]

    flock = models.ForeignKey(Flock, on_delete=models.CASCADE, related_name="health_observations")
    date_observed = models.DateField(auto_now_add=True)

    bird_age_weeks = models.PositiveIntegerField()
    season = models.CharField(max_length=10, choices=SEASON_CHOICES)
    region = models.CharField(max_length=100)
    days_since_last_vaccination = models.PositiveIntegerField(null=True, blank=True)
    recent_medication = models.ForeignKey(Drug, null=True, blank=True, on_delete=models.SET_NULL)

    respiratory_distress = models.BooleanField(default=False)
    diarrhea = models.BooleanField(default=False)
    lethargy = models.BooleanField(default=False)
    reduced_feed_intake = models.BooleanField(default=False)
    leg_weakness = models.BooleanField(default=False)
    sudden_death_count = models.PositiveIntegerField(default=0)

    observation_type = models.CharField(max_length=20, choices=OBS_TYPE_CHOICES)

    # Filled in by the rule engine or ML model after submission
    risk_label = models.CharField(max_length=50, blank=True)
    risk_score = models.FloatField(null=True, blank=True)
    confidence = models.CharField(max_length=20, blank=True)  # "rule-based" or "model"

    def __str__(self):
        return f"{self.flock} - {self.date_observed} - {self.observation_type}"