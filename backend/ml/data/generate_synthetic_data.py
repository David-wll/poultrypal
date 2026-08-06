"""
Generates synthetic HealthObservation rows for training PoultryPal's disease
risk classifier, ahead of having real farmer-submitted data.

Usage:
    python generate_synthetic_data.py --n 6000 --out synthetic_health_observations.csv

Design notes:
- Each row = one farmer "observation" (either a sick-bird check or a death log).
- We first sample a disease (or Healthy) weighted by base_rate.
- Age is sampled conditioned on the disease's age window (with some spread outside
  it, since real life isn't clean-cut).
- Symptoms are sampled independently per-disease from DISEASE_PROFILES probabilities,
  then a small amount of label noise is injected (some Healthy birds get a stray
  symptom, some diseased birds present atypically) so the model doesn't overfit to
  a too-clean synthetic signal.
- sudden_death_count uses a Poisson draw scaled by disease severity; a count > 0
  represents a death-log observation, count == 0 represents a sick-bird-check
  observation with the bird still alive.
- days_since_last_vaccination and recent_medication are included as contextual
  features but are NOT strongly tied to outcome here (Newcastle vaccination status
  in particular should matter a lot in reality -- flagged as a TODO once we can
  ground that relationship in literature or real data).
"""

import argparse
import csv
import random
from datetime import date

from disease_profiles import DISEASE_PROFILES, NIGERIAN_REGIONS, SEASONS

random.seed(42)

DISEASE_NAMES = list(DISEASE_PROFILES.keys())
DISEASE_WEIGHTS = [DISEASE_PROFILES[d]["base_rate"] for d in DISEASE_NAMES]

DRUGS = ["None", "Amprolium", "Oxytetracycline", "Vitamin_Electrolyte", "Tylosin", "Sulfadimidine"]


def sample_age_weeks(profile):
    lo, hi = profile["age_weeks_range"]
    # clamp hi to something realistic for a laying/broiler flock lifecycle
    hi = min(hi, 78)
    lo = max(lo, 0)
    # sample mostly inside the window, occasionally outside it
    if random.random() < 0.85:
        return max(0, round(random.uniform(lo, hi if hi > lo else lo + 4)))
    else:
        return max(0, round(random.gauss((lo + hi) / 2, 15)))


def sample_symptoms(profile, noise_rate=0.06):
    symptoms = {}
    for symptom, prob in profile["symptom_probs"].items():
        draw = random.random() < prob
        # inject label noise: small chance to flip the symptom either way
        if random.random() < noise_rate:
            draw = not draw
        symptoms[symptom] = draw
    return symptoms


def sample_sudden_death_count(profile, is_death_log):
    if not is_death_log:
        return 0
    lam = profile["sudden_death_lambda"]
    # Poisson-ish via random draws (avoid numpy dependency)
    count = 0
    p = pow(2.718281828, -lam)
    cum_p = p
    u = random.random()
    k = 0
    while u > cum_p and k < 20:
        k += 1
        p *= lam / k
        cum_p += p
    count = max(1, k)  # a death-log observation always has at least 1 death
    return count


def generate_row(row_id):
    disease = random.choices(DISEASE_NAMES, weights=DISEASE_WEIGHTS, k=1)[0]
    profile = DISEASE_PROFILES[disease]

    age_weeks = sample_age_weeks(profile)
    young_bonus = profile["young_bird_multiplier"] if age_weeks < 8 else 1.0

    season = random.choice(SEASONS)
    if profile["season_bias"] and random.random() < 0.7:
        season = profile["season_bias"]

    region = random.choice(NIGERIAN_REGIONS)

    symptoms = sample_symptoms(profile)

    # ~30% of observations are death logs, rest are sick-bird checks
    is_death_log = random.random() < 0.30 if disease != "Healthy" else random.random() < 0.02
    sudden_death_count = sample_sudden_death_count(profile, is_death_log)

    days_since_vaccination = random.choice([None, 7, 14, 30, 60, 90, 180])
    recent_medication = random.choices(
        DRUGS, weights=[0.5, 0.1, 0.1, 0.1, 0.1, 0.1], k=1
    )[0]

    row = {
        "observation_id": row_id,
        "bird_age_weeks": age_weeks,
        "season": season,
        "region": region,
        "days_since_last_vaccination": days_since_vaccination if days_since_vaccination is not None else "",
        "recent_medication": recent_medication,
        "respiratory_distress": int(symptoms["respiratory_distress"]),
        "diarrhea": int(symptoms["diarrhea"]),
        "lethargy": int(symptoms["lethargy"]),
        "reduced_feed_intake": int(symptoms["reduced_feed_intake"]),
        "leg_weakness": int(symptoms["leg_weakness"]),
        "sudden_death_count": sudden_death_count,
        "observation_type": "death_log" if is_death_log else "sick_check",
        "disease_label": disease,
    }
    return row


def main(n_rows, out_path):
    fieldnames = [
        "observation_id", "bird_age_weeks", "season", "region",
        "days_since_last_vaccination", "recent_medication",
        "respiratory_distress", "diarrhea", "lethargy",
        "reduced_feed_intake", "leg_weakness", "sudden_death_count",
        "observation_type", "disease_label",
    ]
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for i in range(1, n_rows + 1):
            writer.writerow(generate_row(i))

    print(f"Wrote {n_rows} synthetic rows to {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=6000)
    parser.add_argument("--out", type=str, default="synthetic_health_observations.csv")
    args = parser.parse_args()
    main(args.n, args.out)
