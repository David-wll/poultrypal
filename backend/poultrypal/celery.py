import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'poultrypal.settings')

app = Celery('poultrypal')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    'check-harvest-dates': {
        'task': 'apps.notifications.tasks.check_harvest_dates',
        'schedule': crontab(hour=6, minute=0),  # 6am daily
    },
    'check-vaccine-reminders': {
        'task': 'apps.notifications.tasks.check_vaccine_reminders',
        'schedule': crontab(hour=8, minute=0),  # 8am daily
    },
    'check-overdue-vaccines': {
        'task': 'apps.notifications.tasks.check_overdue_vaccines',
        'schedule': crontab(hour=8, minute=5),  # 8:05am daily
    },
    'send-daily-log-reminder': {
        'task': 'apps.notifications.tasks.send_daily_log_reminder',
        'schedule': crontab(hour=19, minute=0),  # 7pm daily
    },
}