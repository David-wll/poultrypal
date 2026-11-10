from django.urls import path
from .views import (
    RequestOTPView, VerifyOTPView, FarmerProfileView,
    PasswordRegisterView, PasswordLoginView, SetPasswordView,
)

urlpatterns = [
    path('request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('register/', PasswordRegisterView.as_view(), name='password-register'),
    path('login/', PasswordLoginView.as_view(), name='password-login'),
    path('set-password/', SetPasswordView.as_view(), name='set-password'),
    path('profile/', FarmerProfileView.as_view(), name='farmer-profile'),
]