"""
Disease symptom profiles for PoultryPal synthetic data generation.

Each profile defines:
- age_weeks_range: (min, max) age window where disease is most likely (outside this
  range the disease can still occur, but at much lower base probability)
- season_bias: which season increases likelihood ("dry", "rainy", or None for no bias)
- symptom_probs: probability that each symptom flag is True, GIVEN the bird has this disease
- sudden_death_lambda: mean of a Poisson distribution for sudden_death_count when this
  disease is present (captures how "sudden and severe" the disease tends to be)
- base_rate: relative prevalence weight used when sampling which disease (if any) a
  given synthetic observation represents

Sources (see conversation for full citations): MSD Veterinary Manual (Newcastle),
WOAH Terrestrial Manual (Fowl Typhoid/Pullorum), FAO poultry disease guides
(Coccidiosis, Salmonellosis), The Poultry Site (Gumboro/IBD).

NOTE: these numbers are reasonable estimates built from qualitative descriptions in
veterinary sources, not precise published statistics. They are a starting point for
bootstrapping a model pre-launch and should be revisited once real HealthObservation
data starts coming in from farmers.
"""

DISEASE_PROFILES = {
    "Newcastle Disease": {
        "age_weeks_range": (0, 260),  # any age, young more susceptible
        "young_bird_multiplier": 1.6,  # extra weight if bird_age_weeks < 8
        "season_bias": None,
        "symptom_probs": {
            "respiratory_distress": 0.80,
            "diarrhea": 0.55,          # often greenish
            "lethargy": 0.75,
            "reduced_feed_intake": 0.70,
            "leg_weakness": 0.45,      # nervous/neurotropic signs, e.g. twisted neck
        },
        "sudden_death_lambda": 3.5,
        "base_rate": 0.22,
    },
    "Coccidiosis": {
        "age_weeks_range": (3, 8),
        "young_bird_multiplier": 1.0,
        "season_bias": "rainy",  # damp litter favors oocyst survival
        "symptom_probs": {
            "respiratory_distress": 0.05,
            "diarrhea": 0.85,          # blood-streaked droppings
            "lethargy": 0.60,
            "reduced_feed_intake": 0.65,
            "leg_weakness": 0.15,
        },
        "sudden_death_lambda": 1.0,
        "base_rate": 0.22,
    },
    "Salmonellosis": {
        "age_weeks_range": (0, 4),
        "young_bird_multiplier": 2.0,  # greatest losses are in chicks < 4 weeks
        "season_bias": None,
        "symptom_probs": {
            "respiratory_distress": 0.10,
            "diarrhea": 0.75,          # pasty white diarrhea
            "lethargy": 0.70,
            "reduced_feed_intake": 0.60,
            "leg_weakness": 0.10,
        },
        "sudden_death_lambda": 2.5,
        "base_rate": 0.18,
    },
    "Fowl Typhoid": {
        "age_weeks_range": (8, 260),  # older birds more affected
        "young_bird_multiplier": 0.6,
        "season_bias": None,
        "symptom_probs": {
            "respiratory_distress": 0.55,  # laboured breathing
            "diarrhea": 0.65,
            "lethargy": 0.80,              # depression, anaemia
            "reduced_feed_intake": 0.60,
            "leg_weakness": 0.10,
        },
        "sudden_death_lambda": 2.0,
        "base_rate": 0.18,
    },
    "Gumboro (IBD)": {
        "age_weeks_range": (3, 6),  # signs most pronounced in this narrow window
        "young_bird_multiplier": 1.0,
        "season_bias": None,
        "symptom_probs": {
            "respiratory_distress": 0.10,
            "diarrhea": 0.55,          # watery droppings
            "lethargy": 0.80,
            "reduced_feed_intake": 0.55,
            "leg_weakness": 0.20,
        },
        "sudden_death_lambda": 2.2,  # mortality usually 0-20% but sometimes up to 60%
        "base_rate": 0.10,
    },
    "Healthy": {
        "age_weeks_range": (0, 260),
        "young_bird_multiplier": 1.0,
        "season_bias": None,
        "symptom_probs": {
            "respiratory_distress": 0.02,
            "diarrhea": 0.03,
            "lethargy": 0.05,
            "reduced_feed_intake": 0.04,
            "leg_weakness": 0.02,
        },
        "sudden_death_lambda": 0.05,
        "base_rate": 0.10,
    },
}

NIGERIAN_REGIONS = [
    "North Central", "North East", "North West",
    "South East", "South South", "South West",
]

# Nigeria's two broad seasons
SEASONS = ["dry", "rainy"]
