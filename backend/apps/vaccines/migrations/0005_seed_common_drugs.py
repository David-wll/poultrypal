from django.db import migrations


def seed_drugs(apps, schema_editor):
    Drug = apps.get_model('vaccines', 'Drug')

    common_drugs = [
        # Antibiotics
        {'name': 'Oxytetracycline', 'drug_type': 'antibiotic', 'default_unit': 'sachet'},
        {'name': 'Tetracycline', 'drug_type': 'antibiotic', 'default_unit': 'sachet'},
        {'name': 'Ampiclox', 'drug_type': 'antibiotic', 'default_unit': 'sachet'},
        {'name': 'Enrofloxacin', 'drug_type': 'antibiotic', 'default_unit': 'ml'},

        # Vitamins / Supplements
        {'name': 'Vitalyte', 'drug_type': 'vitamin', 'default_unit': 'sachet'},
        {'name': 'ASD Vita', 'drug_type': 'vitamin', 'default_unit': 'sachet'},

        # Coccidiostats
        {'name': 'Amprolium', 'drug_type': 'coccidiostat', 'default_unit': 'sachet'},
        {'name': 'Coxi-Plus', 'drug_type': 'coccidiostat', 'default_unit': 'sachet'},

        # Dewormers
        {'name': 'Piperazine', 'drug_type': 'dewormer', 'default_unit': 'sachet'},
        {'name': 'Levamisole', 'drug_type': 'dewormer', 'default_unit': 'sachet'},
    ]

    for entry in common_drugs:
        Drug.objects.get_or_create(
            name=entry['name'],
            drug_type=entry['drug_type'],
            defaults={'default_unit': entry['default_unit']},
        )


def reverse_seed(apps, schema_editor):
    Drug = apps.get_model('vaccines', 'Drug')
    names = [
        'Oxytetracycline', 'Tetracycline', 'Ampiclox', 'Enrofloxacin',
        'Vitalyte', 'ASD Vita', 'Amprolium', 'Coxi-Plus',
        'Piperazine', 'Levamisole',
    ]
    Drug.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('vaccines', '0004_remove_vaccinationschedule_vaccine_name_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_drugs, reverse_seed),
    ]