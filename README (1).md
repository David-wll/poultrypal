# 🐔 PoultryPal

A full-stack web app built for Nigerian smallholder poultry farmers to track their flocks, manage costs, and get AI-assisted health risk assessments for sick or dying birds — all in one place.

Built with **Django REST Framework** + **React**, with a **machine learning-based disease triage feature** trained on synthetic data grounded in veterinary literature.

---

## 🌍 Why PoultryPal

Smallholder poultry farming is a major livelihood across Nigeria, but most farmers manage their flocks with pen, paper, or memory — no easy way to track feed costs, vaccination schedules, or catch disease outbreaks early. PoultryPal digitizes that workflow and adds a triage layer that helps farmers narrow down what might be wrong with a sick bird before it's too late, or before an outbreak spreads through the flock.

---

## ✨ Features

- **Flock management** — track batches by breed, housing type, arrival date, and expected harvest date
- **Daily logging** — feed, mortality, egg production, and expenses per flock
- **Vaccination scheduling** — automatic schedule generation with overdue tracking
- **Medication tracking** — linked drug records and cost tracking
- **SMS notifications** — vaccination reminders via Africa's Talking (OTP-based auth also runs through this)
- **AI-powered health risk assessment** *(new)* — farmers log symptoms or a bird death, and a trained classifier returns ranked, probability-scored disease candidates rather than a single black-box guess
- **Financial reporting** — per-flock cost breakdown and survival rate calculations

---

## 🧠 The ML Feature — Health Risk Assessment

This is the part of the project I'm most proud of, and also the part I want to be most transparent about.

### The problem
PoultryPal didn't have real farmer health data to train on before launch — a classic cold-start problem. Rather than wait for data that might never come, or fake having "real" data, I built a documented, honest bootstrap:

### The approach
1. **Synthetic data generation**, grounded in veterinary literature (MSD Veterinary Manual, WOAH Terrestrial Manual, FAO poultry disease guides) for five common poultry diseases — Newcastle Disease, Coccidiosis, Salmonellosis, Fowl Typhoid, and Gumboro (IBD) — plus a Healthy class.
2. Each disease profile encodes realistic **age windows, seasonal bias, and symptom probabilities** based on qualitative descriptions in those sources — documented directly in [`ml/data/disease_profiles.py`](backend/ml/data/disease_profiles.py).
3. A **RandomForestClassifier** trained on 6,000 synthetic observations, achieving **64% overall accuracy** across 6 classes (vs. ~17% random baseline).

### Being honest about the limitations
- `bird_age_weeks` dominates feature importance (~43%) — the model leans heavily on age windows we encoded, more than symptoms alone. This is a real limitation of bootstrapping from synthetic rules rather than organic data.
- The weakest class (Gumboro, f1 ≈ 0.49) genuinely overlaps in age and symptoms with other diseases in real veterinary practice too — this isn't just a data problem, it reflects real diagnostic difficulty.
- **This is explicitly framed as a triage tool, not a diagnostic tool.** The app never returns a single confident label — it returns ranked probabilities for the top 3 candidates, and below a 45% confidence threshold on the top prediction, it tells the farmer the picture is ambiguous and recommends consulting a vet, instead of forcing a guess.

### The path to improvement
Every real observation a farmer submits gets stored (`HealthObservation` model). The plan is a periodic retraining pipeline that blends real farmer data with the synthetic baseline, weighting real data higher as it accumulates — closing the loop from "bootstrapped on literature" to "trained on real outcomes."

---

## 🏗️ Architecture

```
poultrypal/
├── backend/                   # Django REST Framework
│   ├── apps/
│   │   ├── farmers/            # Auth (OTP/JWT), farmer profiles
│   │   ├── flocks/              # Flock CRUD, feed/mortality/egg/expense logs
│   │   ├── vaccines/            # Drug records, vaccination schedules, medication logs
│   │   ├── health/               # HealthObservation model + ML-backed risk endpoint
│   │   ├── notifications/       # SMS reminders via Africa's Talking
│   │   └── reports/              # Financial/P&L reporting
│   ├── ml/
│   │   ├── data/                  # Disease profiles + synthetic data generator
│   │   ├── training/              # RandomForest training script
│   │   ├── saved_models/          # Trained model bundle (.joblib)
│   │   └── inference.py           # Loads model, exposes predict_disease_risk()
│   └── poultrypal/                # Django project settings
│
└── frontend/                   # React + Vite + Tailwind CSS
    └── src/
        ├── components/          # HealthCheckForm, RiskCard, BottomNav, etc.
        ├── pages/                 # Dashboard, FlockDetail, LogToday, Reports, etc.
        ├── context/               # Auth + Flock context providers
        └── services/              # API layer (axios)
```

---

## 🛠️ Tech Stack

**Backend:** Django, Django REST Framework, SimpleJWT, Celery, SQLite (dev)
**Frontend:** React, Vite, Tailwind CSS, MUI icons
**ML:** scikit-learn (RandomForestClassifier), pandas, joblib
**SMS/Auth:** Africa's Talking API (OTP-based login)

---

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Copy .env.example to .env and fill in your own SECRET_KEY
cp .env.example .env

python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Regenerating the ML model (optional)

```bash
cd backend/ml/training
python train_classifier.py --data ../data/synthetic_health_observations.csv --out ../saved_models/disease_classifier.joblib
```

---

## 📊 Model Performance Snapshot

| Class | F1-score |
|---|---|
| Healthy | 0.78 |
| Coccidiosis | ~0.65 |
| Newcastle Disease | ~0.65 |
| Salmonellosis | ~0.60 |
| Fowl Typhoid | ~0.58 |
| Gumboro (IBD) | 0.49 |

**Overall accuracy: 64%** on a held-out synthetic test set. See [`ml/training/train_classifier.py`](backend/ml/training/train_classifier.py) for the full classification report and feature importance breakdown.

---

## 🗺️ Roadmap

- [ ] Flock-level outbreak/anomaly detector (death-rate threshold monitoring)
- [ ] Health observation history view per flock
- [ ] Retraining pipeline blending real farmer data with synthetic baseline
- [ ] Image-based diagnosis (fecal image classification) as a secondary input
- [ ] Production deployment (Railway backend + Vercel frontend)

---

## 👤 Author

**Williams David Urahojo (Iyeh)**
Graduating Software Engineering student, Veritas University, Abuja
[GitHub](https://github.com/David-wll) · [LinkedIn](https://linkedin.com/in/david-williams-7478b0324)
