from rest_framework import serializers
from .models import HealthObservation


class HealthObservationSerializer(serializers.ModelSerializer):
    """
    Handles both input (farmer submits symptoms) and output (includes the
    model's prediction fields once set by the view).
    """

    class Meta:
        model = HealthObservation
        fields = [
            "id",
            "flock",
            "date_observed",
            "bird_age_weeks",
            "season",
            "region",
            "days_since_last_vaccination",
            "recent_medication",
            "respiratory_distress",
            "diarrhea",
            "lethargy",
            "reduced_feed_intake",
            "leg_weakness",
            "sudden_death_count",
            "observation_type",
            "risk_label",
            "risk_score",
            "confidence",
        ]
        read_only_fields = ["id", "date_observed", "risk_label", "risk_score", "confidence"]
