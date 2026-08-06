from celery import shared_task
from datetime import date, timedelta


@shared_task
def check_harvest_dates():
    """Runs daily at 6am — notifies farmers whose flock is ready"""
    from apps.flocks.models import Flock
    from apps.notifications.models import NotificationLog
    from apps.notifications.sms import send_sms

    today = date.today()
    ready_flocks = Flock.objects.filter(
        expected_harvest_date=today,
        status='active'
    ).select_related('farmer')

    for flock in ready_flocks:
        message = (
            f"PoultryPal: Your {flock.current_count} {flock.bird_type}s "
            f"({flock.batch_name}) are ready for market today! "
            f"Login to record your harvest."
        )
        send_sms(flock.farmer.phone_number, message)

        # Log it
        NotificationLog.objects.create(
            farmer=flock.farmer,
            channel='sms',
            notification_type='harvest',
            message=message,
            delivered=True,
        )


@shared_task
def check_vaccine_reminders():
    """Runs daily at 8am — reminds farmers 2 days before vaccine is due"""
    from apps.vaccines.models import VaccinationSchedule
    from apps.notifications.models import NotificationLog
    from apps.notifications.sms import send_sms

    due_date = date.today() + timedelta(days=2)
    due_vaccines = VaccinationSchedule.objects.filter(
        scheduled_date=due_date,
        administered_date__isnull=True,
        reminder_sent=False,
    ).select_related('flock__farmer')

    for vaccine in due_vaccines:
        farmer = vaccine.flock.farmer
        message = (
            f"PoultryPal: Reminder — {vaccine.vaccine_name} vaccine is due "
            f"for {vaccine.flock.batch_name} on {vaccine.scheduled_date}. "
            f"Don't miss it!"
        )
        send_sms(farmer.phone_number, message)

        # Mark reminder as sent
        vaccine.reminder_sent = True
        vaccine.save()

        # Log it
        NotificationLog.objects.create(
            farmer=farmer,
            channel='sms',
            notification_type='vaccine',
            message=message,
            delivered=True,
        )


@shared_task
def check_overdue_vaccines():
    """Runs daily at 8am — alerts farmers about overdue vaccines"""
    from apps.vaccines.models import VaccinationSchedule
    from apps.notifications.models import NotificationLog
    from apps.notifications.sms import send_sms

    yesterday = date.today() - timedelta(days=1)
    overdue = VaccinationSchedule.objects.filter(
        scheduled_date=yesterday,
        administered_date__isnull=True,
    ).select_related('flock__farmer')

    for vaccine in overdue:
        farmer = vaccine.flock.farmer
        message = (
            f"PoultryPal: OVERDUE — {vaccine.vaccine_name} vaccine for "
            f"{vaccine.flock.batch_name} was due yesterday. "
            f"Please administer it immediately."
        )
        send_sms(farmer.phone_number, message)

        NotificationLog.objects.create(
            farmer=farmer,
            channel='sms',
            notification_type='overdue',
            message=message,
            delivered=True,
        )


@shared_task
def send_daily_log_reminder():
    """Runs daily at 7pm — reminds farmers who haven't logged today"""
    from apps.flocks.models import Flock
    from apps.logs.models import FeedLog
    from apps.notifications.models import NotificationLog
    from apps.notifications.sms import send_sms

    today = date.today()
    active_flocks = Flock.objects.filter(
        status='active'
    ).select_related('farmer')

    notified_farmers = set()

    for flock in active_flocks:
        # Check if farmer logged today
        logged_today = FeedLog.objects.filter(
            flock=flock,
            date=today,
        ).exists()

        if not logged_today and flock.farmer.id not in notified_farmers:
            message = (
                f"PoultryPal: Don't forget to log today's feed and "
                f"health update for {flock.batch_name}. "
                f"Good records = better profits!"
            )
            send_sms(flock.farmer.phone_number, message)
            notified_farmers.add(flock.farmer.id)

            NotificationLog.objects.create(
                farmer=flock.farmer,
                channel='sms',
                notification_type='summary',
                message=message,
                delivered=True,
            )


@shared_task
def send_mortality_alert(flock_id, death_count):
    """Fires immediately when deaths exceed 3% of flock"""
    from apps.flocks.models import Flock
    from apps.notifications.models import NotificationLog
    from apps.notifications.sms import send_sms

    flock = Flock.objects.select_related('farmer').get(id=flock_id)
    message = (
        f"PoultryPal ALERT: {death_count} deaths logged today in "
        f"{flock.batch_name}. Mortality rate is high. "
        f"Please check your birds and contact a vet."
    )
    send_sms(flock.farmer.phone_number, message)

    NotificationLog.objects.create(
        farmer=flock.farmer,
        channel='sms',
        notification_type='mortality',
        message=message,
        delivered=True,
    )