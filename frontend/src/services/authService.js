import api from './api'

export const requestOTP = (phone_number) =>
  api.post('/auth/request-otp/', { phone_number })

export const verifyOTP = (phone_number, otp_code) =>
  api.post('/auth/verify-otp/', { phone_number, otp_code })

export const getProfile = () =>
  api.get('/auth/profile/')

export const updateProfile = (data) =>
  api.put('/auth/profile/', data)