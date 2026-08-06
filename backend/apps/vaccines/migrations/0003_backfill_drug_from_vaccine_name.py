from django.db import migrations


def backfill_drugs(apps, schema_editor):
    VaccinationSchedule = apps.get_model('vaccines', 'VaccinationSchedule')
    Drug = apps.get_model('vaccines', 'Drug')

    for schedule in VaccinationSchedule.objects.all():
        if not schedule.vaccine_name:
            continue

        drug = Drug.objects.filter(
            name__iexact=schedule.vaccine_name, drug_type='vaccine'
        ).first()

        if not drug:
            drug = Drug.objects.create(
                name=schedule.vaccine_name, drug_type='vaccine'
            )

        schedule.drug = drug
        schedule.save(update_fields=['drug'])


def reverse_backfill(apps, schema_editor):
    # No-op: we don't delete Drug rows on reverse, since they may be reused elsewhere
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('vaccines', '0002_drug_vaccinationschedule_cost_medicationlog_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_drugs, reverse_backfill),
    ]