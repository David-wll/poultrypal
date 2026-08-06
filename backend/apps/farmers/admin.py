from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Farmer, OTPVerification

class FarmerAdmin(UserAdmin):
    model = Farmer
    list_display = ['phone_number', 'full_name', 'farm_name', 'state', 'created_at']
    list_filter = ['state', 'is_active']
    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'email', 'farm_name', 'state', 'lga', 'preferred_language')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'password1', 'password2'),
        }),
    )
    search_fields = ['phone_number', 'full_name']
    ordering = ['phone_number']

admin.site.register(Farmer, FarmerAdmin)
admin.site.register(OTPVerification)