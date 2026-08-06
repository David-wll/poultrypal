from django.core.management.base import BaseCommand
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Send all scheduled notifications'

    def handle(self, *args, **options):
        self.check_harvests()
        self.check_vaccines()
        self.check_daily_logs()
        self.stdout.write(
            self.style.SUCCESS('All notifications processed!')
        )

    def check_harvests(self):
        from apps.flocks.models import Flock
        from apps.notifications.sms import send_sms

        today = date.today()
        ready = Flock.objects.filter(
            expected_harvest_date=today,
            status='active'
        ).select_related('farmer')

        for flock in ready:
            msg = (
                f"PoultryPal: Your {flock.current_count} "
                f"{flock.bird_type}s ({flock.batch_name}) "
                f"are ready for market today!"
            )
            send_sms(flock.farmer.phone_number, msg)
            self.stdout.write(f"Harvest alert sent: {flock.batch_name}")

    def check_vaccines(self):
        from apps.vaccines.models import VaccinationSchedule
        from apps.notifications.sms import send_sms

        due_date = date.today() + timedelta(days=2)
        due = VaccinationSchedule.objects.filter(
            scheduled_date=due_date,
            administered_date__isnull=True,
            reminder_sent=False,
        ).select_related('flock__farmer')

        for vaccine in due:
            msg = (
                f"PoultryPal: {vaccine.vaccine_name} vaccine due "
                f"for {vaccine.flock.batch_name} on "
                f"{vaccine.scheduled_date}. Don't miss it!"
            )
            send_sms(vaccine.flock.farmer.phone_number, msg)
            vaccine.reminder_sent = True
            vaccine.save()
            self.stdout.write(
                f"Vaccine reminder sent: {vaccine.vaccine_name}"
            )

    def check_daily_logs(self):
        from apps.flocks.models import Flock
        from apps.logs.models import FeedLog
        from apps.farmers.models import Farmer

        today = date.today()

        # Get all active farmers
        farmers = Farmer.objects.filter(is_active=True)

        for farmer in farmers:
            # Get all active flocks for this farmer
            flocks = Flock.objects.filter(
                farmer=farmer,
                status='active'
            )

            if not flocks.exists():
                continue

            # Find which flocks have NOT been logged today
            unlogged = []
            for flock in flocks:
                logged = FeedLog.objects.filter(
                    flock=flock,
                    date=today
                ).exists()
                if not logged:
                    unlogged.append(flock.batch_name)

            # Only send if there are unlogged flocks
            if unlogged:
                if len(unlogged) == 1:
                    msg = (
                        f"PoultryPal: Don't forget to log today's "
                        f"feed and health update for {unlogged[0]}!"
                    )
                else:
                    flock_names = ', '.join(unlogged)
                    msg = (
                        f"PoultryPal: You have {len(unlogged)} flocks "
                        f"not logged today: {flock_names}. "
                        f"Please update your records!"
                    )

                from apps.notifications.sms import send_sms
                send_sms(farmer.phone_number, msg)
                self.stdout.write(
                    f"Log reminder sent to {farmer.full_name}: "
                    f"{len(unlogged)} unlogged flocks"
                )