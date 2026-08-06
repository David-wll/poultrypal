"""
Trains a RandomForestClassifier on the synthetic HealthObservation data to predict
disease_label from symptom + context features.

Usage:
    python train_classifier.py --data ../data/synthetic_health_observations.csv \
                                --out ../saved_models/disease_classifier.joblib

Outputs a single joblib bundle containing:
    - the trained model
    - the fitted encoders for categorical columns (season, region, recent_medication,
      observation_type)
    - the exact feature column order the model expects at inference time

This bundle is what ml/inference.py loads later.
"""

import argparse
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder

CATEGORICAL_COLS = ["season", "region", "recent_medication", "observation_type"]
NUMERIC_COLS = [
    "bird_age_weeks", "days_since_last_vaccination",
    "respiratory_distress", "diarrhea", "lethargy",
    "reduced_feed_intake", "leg_weakness", "sudden_death_count",
]
TARGET_COL = "disease_label"


def load_and_prepare(path):
    df = pd.read_csv(path)

    # days_since_last_vaccination has blanks for "never vaccinated" -- use -1 as a
    # sentinel rather than dropping rows or imputing a fake mean.
    df["days_since_last_vaccination"] = df["days_since_last_vaccination"].fillna(-1)

    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col + "_enc"] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    feature_cols = NUMERIC_COLS + [c + "_enc" for c in CATEGORICAL_COLS]
    X = df[feature_cols]
    y = df[TARGET_COL]

    return X, y, encoders, feature_cols


def main(data_path, out_path):
    X, y, encoders, feature_cols = load_and_prepare(data_path)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("=== Classification Report (held-out test set) ===")
    print(classification_report(y_test, y_pred))

    print("=== Feature Importances ===")
    importances = sorted(
        zip(feature_cols, clf.feature_importances_), key=lambda x: -x[1]
    )
    for name, imp in importances:
        print(f"{name:35s} {imp:.4f}")

    bundle = {
        "model": clf,
        "encoders": encoders,
        "feature_cols": feature_cols,
        "numeric_cols": NUMERIC_COLS,
        "categorical_cols": CATEGORICAL_COLS,
    }
    joblib.dump(bundle, out_path)
    print(f"\nSaved model bundle to {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="../data/synthetic_health_observations.csv")
    parser.add_argument("--out", type=str, default="../saved_models/disease_classifier.joblib")
    args = parser.parse_args()
    main(args.data, args.out)
