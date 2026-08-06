from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid


class FarmerManager(BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('Phone number is required')
        farmer = self.model(phone_number=phone_number, **extra_fields)
        farmer.set_unusable_password()
        farmer.save(using=self._db)
        return farmer

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        farmer = self.model(phone_number=phone_number, **extra_fields)
        farmer.set_password(password)
        farmer.save(using=self._db)
        return farmer


class Farmer(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True)
    farm_name = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    lga = models.CharField(max_length=50, blank=True)

    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('pidgin', 'Pidgin'),
        ('yo', 'Yoruba'),
        ('ha', 'Hausa'),
        ('ig', 'Igbo'),
    ]
    preferred_language = models.CharField(
        max_length=10, choices=LANGUAGE_CHOICES, default='en'
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = FarmerManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.full_name} — {self.phone_number}"


class OTPVerification(models.Model):
    phone_number = models.CharField(max_length=15)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.phone_number} — {self.otp_code}"