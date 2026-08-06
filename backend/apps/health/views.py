from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import HealthObservation
from .serializers import HealthObservationSerializer

from ml.inference import predict_disease_risk


class HealthObservationCreateView(generics.CreateAPIView):
    """
    POST /api/health/observations/

    Farmer submits symptoms (sick-bird check) or a death log. This view:
      1. Saves the raw observation.
      2. Runs it through the disease risk classifier.
      3. Persists the top prediction onto the row (risk_label, risk_score, confidence).
      4. Returns the full ranked prediction list to the frontend, so the RiskCard
         component can show all top candidates -- not just one guess.
    """
    queryset = HealthObservation.objects.all()
    serializer_class = HealthObservationSerializer
    permission_classes = [IsAuthenticated]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        observation = serializer.save()

        prediction_input = {
            "bird_age_weeks": observation.bird_age_weeks,
            "season": observation.season,
            "region": observation.region,
            "days_since_last_vaccination": observation.days_since_last_vaccination,
            "recent_medication": (
                observation.recent_medication.name
                if observation.recent_medication else "None"
            ),
            "respiratory_distress": observation.respiratory_distress,
            "diarrhea": observation.diarrhea,
            "lethargy": observation.lethargy,
            "reduced_feed_intake": observation.reduced_feed_intake,
            "leg_weakness": observation.leg_weakness,
            "sudden_death_count": observation.sudden_death_count,
            "observation_type": observation.observation_type,
        }

        result = predict_disease_risk(prediction_input)
        top = result["predictions"][0]

        observation.risk_label = top["label"]
        observation.risk_score = top["probability"]
        observation.confidence = "model"
        observation.save(update_fields=["risk_label", "risk_score", "confidence"])

        response_data = serializer.data
        response_data["predictions"] = result["predictions"]
        response_data["is_confident"] = result["is_confident"]
        response_data["message"] = result["message"]

        return Response(response_data, status=status.HTTP_201_CREATED)


class HealthObservationListView(generics.ListAPIView):
    """
    GET /api/health/observations/?flock=<id>

    Lists past observations for a flock -- used by the medication/health history
    view and by future retraining scripts.
    """
    serializer_class = HealthObservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = HealthObservation.objects.all().order_by("-date_observed")
        flock_id = self.request.query_params.get("flock")
        if flock_id:
            queryset = queryset.filter(flock_id=flock_id)
        return queryset
