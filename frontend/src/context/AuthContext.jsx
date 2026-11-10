import { createContext, useContext, useState } from 'react'
import {
  verifyOTP, getProfile, updateProfile,
  registerWithPassword, loginWithPasswordRequest,
} from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(
    JSON.parse(localStorage.getItem('farmer')) || null
  )

  const saveSession = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('refresh', data.refresh)
    localStorage.setItem('farmer', JSON.stringify(data.farmer))
    setFarmer(data.farmer)
    return data
  }

  // OTP sign-in (unchanged behaviour)
  const login = async (phone_number, otp_code) => {
    const res = await verifyOTP(phone_number, otp_code)
    return saveSession(res.data)
  }

  // Password sign-in / sign-up
  const loginWithPassword = async (phone_number, password) => {
    const res = await loginWithPasswordRequest(phone_number, password)
    return saveSession(res.data)
  }

  const registerAccount = async (phone_number, password) => {
    const res = await registerWithPassword(phone_number, password)
    return saveSession(res.data)
  }

  const logout = () => {
    localStorage.clear()
    setFarmer(null)
  }

  const updateFarmerProfile = async (data) => {
    const res = await updateProfile(data)
    localStorage.setItem('farmer', JSON.stringify(res.data))
    setFarmer(res.data)
    return res.data
  }

  const refreshFarmerProfile = async () => {
    try {
      const res = await getProfile()
      localStorage.setItem('farmer', JSON.stringify(res.data))
      setFarmer(res.data)
    } catch (err) {
      console.error('Could not refresh profile', err)
    }
  }

  return (
    <AuthContext.Provider value={{
      farmer,
      login,
      loginWithPassword,
      registerAccount,
      logout,
      updateFarmerProfile,
      refreshFarmerProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)