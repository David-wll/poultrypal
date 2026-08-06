"""
Loads the trained disease classifier and exposes a single function,
predict_disease_risk(), that Django views should call.

Design principles (see conversation with Williams for full reasoning):
- Never return a single bare label. Always return ranked probabilities for the
  top few candidate diseases, since the underlying model has real, documented
  uncertainty (~64% overall accuracy, weaker on Gumboro specifically).
- If the top prediction's probability is below CONFIDENCE_THRESHOLD, flag the
  result as low-confidence and recommend consulting a vet/extension worker
  rather than presenting a false sense of certainty.
- This is a triage aid, not a diagnostic tool. Frontend copy should reflect that
  framing explicitly (see HealthCheckForm / RiskCard components).
"""

import os
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "disease_classifier.joblib")

# Below this top-1 probability, we tell the farmer the picture is ambiguous
# rather than naming a single disease with false confidence.
CONFIDENCE_THRESHOLD = 0.45

# How many ranked candidates to return to the frontend.
TOP_K = 3

_bundle = None  # lazy-loaded singleton so Django doesn't reload the model per-request


def _get_bundle():
    global _bundle
    if _bundle is None:
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


def _encode_categorical(value, encoder):
    """Encode a categorical value, falling back to the encoder's most common
    class if the value wasn't seen during training (e.g. a new region name)."""
    value = str(value)
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    # Unseen category -- fall back to class 0 rather than raising, but this
    # is a signal worth logging server-side for future retraining.
    return 0


def predict_disease_risk(observation: dict) -> dict:
    """
    observation: dict with keys matching HealthObservation fields, e.g.
        {
            "bird_age_weeks": 5,
            "season": "rainy",
            "region": "South West",
            "days_since_last_vaccination": 20,   # or None
            "recent_medication": "None",
            "respiratory_distress": False,
            "diarrhea": True,
            "lethargy": True,
            "reduced_feed_intake": True,
            "leg_weakness": False,
            "sudden_death_count": 0,
            "observation_type": "sick_check",
        }

    Returns:
        {
            "predictions": [{"label": str, "probability": float}, ...],  # sorted desc
            "is_confident": bool,
            "message": str,  # human-readable summary, safe to show directly
        }
    """
    bundle = _get_bundle()
    model = bundle["model"]
    encoders = bundle["encoders"]
    feature_cols = bundle["feature_cols"]
    numeric_cols = bundle["numeric_cols"]
    categorical_cols = bundle["categorical_cols"]

    row = {}
    for col in numeric_cols:
        if col == "days_since_last_vaccination":
            val = observation.get(col)
            row[col] = -1 if val is None else val
        elif col in ("respiratory_distress", "diarrhea", "lethargy",
                     "reduced_feed_intake", "leg_weakness"):
            row[col] = int(bool(observation.get(col, False)))
        else:
            row[col] = observation.get(col, 0)

    for col in categorical_cols:
        row[col + "_enc"] = _encode_categorical(observation.get(col, ""), encoders[col])

    X = pd.DataFrame([[row[c] for c in feature_cols]], columns=feature_cols)

    probs = model.predict_proba(X)[0]
    classes = model.classes_

    ranked = sorted(zip(classes, probs), key=lambda x: -x[1])[:TOP_K]
    predictions = [{"label": label, "probability": round(float(p), 3)} for label, p in ranked]

    top_label, top_prob = ranked[0]
    is_confident = top_prob >= CONFIDENCE_THRESHOLD

    if is_confident:
        message = (
            f"Most likely: {top_label} ({top_prob*100:.0f}% confidence). "
            f"This is a triage estimate, not a diagnosis -- confirm with a vet "
            f"or extension worker where possible, especially before starting treatment."
        )
    else:
        message = (
            "Symptoms are ambiguous across several possible conditions "
            "(no single disease stood out with strong confidence). "
            "Please consult a vet or extension worker for a proper assessment."
        )

    return {
        "predictions": predictions,
        "is_confident": is_confident,
        "message": message,
    }


if __name__ == "__main__":
    # Quick manual smoke test
    sample = {
        "bird_age_weeks": 5,
        "season": "rainy",
        "region": "South West",
        "days_since_last_vaccination": 20,
        "recent_medication": "None",
        "respiratory_distress": False,
        "diarrhea": True,
        "lethargy": True,
        "reduced_feed_intake": True,
        "leg_weakness": False,
        "sudden_death_count": 0,
        "observation_type": "sick_check",
    }
    result = predict_disease_risk(sample)
    print(result)
