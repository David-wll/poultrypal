import africastalking
from django.conf import settings


def send_sms(phone_number, message):
    """
    Send SMS via Africa's Talking.
    During development, prints to terminal instead.
    """
    if settings.DEBUG or not settings.AFRICASTALKING_API_KEY:
        # Development — print to terminal
        print(f"\n{'='*50}")
        print(f"SMS TO: {phone_number}")
        print(f"MESSAGE: {message}")
        print(f"{'='*50}\n")
        return

    # Production — send real SMS
    try:
        africastalking.initialize(
            username=settings.AFRICASTALKING_USERNAME,
            api_key=settings.AFRICASTALKING_API_KEY,
        )
        sms = africastalking.SMS

        # Convert 080XXXXXXXX → +23480XXXXXXXX
        if phone_number.startswith('0'):
            phone_number = '+234' + phone_number[1:]

        response = sms.send(
            message=message,
            recipients=[phone_number],
        )
        print(f"SMS sent: {response}")
        return response
    except Exception as e:
        print(f"SMS failed: {e}")