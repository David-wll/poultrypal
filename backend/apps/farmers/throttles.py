from rest_framework.throttling import SimpleRateThrottle


class PhoneRateThrottle(SimpleRateThrottle):
    """Limits attempts per phone number, so one account can't be brute-forced
    even if the attacker rotates IP addresses. Rate: 'auth_phone' in settings."""
    scope = 'auth_phone'

    def get_cache_key(self, request, view):
        phone = str(request.data.get('phone_number', '')).strip()
        if not phone:
            return None
        return self.cache_format % {'scope': self.scope, 'ident': phone}