from datetime import timedelta

DEFAULT_SCHEDULES = {
    'broiler': [
        {'vaccine': 'Newcastle (LaSota)', 'day': 7},
        {'vaccine': 'Gumboro (IBD)', 'day': 14},
        {'vaccine': 'Newcastle Booster', 'day': 21},
        {'vaccine': 'Gumboro Booster', 'day': 28},
    ],
    'layer': [
        {'vaccine': "Marek's Disease", 'day': 1},
        {'vaccine': 'Newcastle (LaSota)', 'day': 7},
        {'vaccine': 'Infectious Bronchitis', 'day': 14},
        {'vaccine': 'Gumboro (IBD)', 'day': 21},
        {'vaccine': 'Newcastle Booster', 'day': 42},
        {'vaccine': 'Fowl Pox', 'day': 56},
    ],
    'cockerel': [
        {'vaccine': 'Newcastle (LaSota)', 'day': 7},
        {'vaccine': 'Gumboro (IBD)', 'day': 14},
        {'vaccine': 'Newcastle Booster', 'day': 28},
        {'vaccine': 'Fowl Pox', 'day': 42},
    ],
    'turkey': [
        {'vaccine': 'Newcastle (LaSota)', 'day': 7},
        {'vaccine': 'Fowl Pox', 'day': 21},
        {'vaccine': 'Newcastle Booster', 'day': 42},
    ],
    'duck': [
        {'vaccine': 'Duck Plague', 'day': 7},
        {'vaccine': 'Duck Cholera', 'day': 21},
    ],
}


def generate_schedule(flock):
    """
    Auto-generates vaccination schedule when a new flock is created.
    Called inside FlockListCreateView after flock.save()
    """
    from apps.vaccines.models import VaccinationSchedule, Drug

    schedules = DEFAULT_SCHEDULES.get(flock.bird_type, [])

    for s in schedules:
        due_date = flock.arrival_date + timedelta(days=s['day'])

        drug, _ = Drug.objects.get_or_create(
            name=s['vaccine'],
            drug_type='vaccine',
        )

        VaccinationSchedule.objects.create(
            flock=flock,
            drug=drug,
            scheduled_date=due_date,
        )