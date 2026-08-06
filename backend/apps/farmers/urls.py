from django.urls import path
from .views import RequestOTPView, VerifyOTPView, FarmerProfileView

urlpatterns = [
    path('request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('profile/', FarmerProfileView.as_view(), name='farmer-profile'),
]