import api from './api'

export const requestOTP = (phone_number) =>
  api.post('/auth/request-otp/', { phone_number })

export const verifyOTP = (phone_number, otp_code) =>
  api.post('/auth/verify-otp/', { phone_number, otp_code })

export const getProfile = () =>
  api.get('/auth/profile/')

export const updateProfile = (data) =>
  api.put('/auth/profile/', data)

export const registerWithPassword = (phone_number, password) =>
  api.post('/auth/register/', { phone_number, password })

export const loginWithPasswordRequest = (phone_number, password) =>
  api.post('/auth/login/', { phone_number, password })

export const setPasswordRequest = (new_password, current_password = '') =>
  api.post('/auth/set-password/', { new_password, current_password })