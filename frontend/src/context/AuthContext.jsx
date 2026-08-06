import { createContext, useContext, useState } from 'react'
import { verifyOTP, getProfile, updateProfile } from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(
    JSON.parse(localStorage.getItem('farmer')) || null
  )

  const login = async (phone_number, otp_code) => {
    const res = await verifyOTP(phone_number, otp_code)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('refresh', res.data.refresh)
    localStorage.setItem('farmer', JSON.stringify(res.data.farmer))
    setFarmer(res.data.farmer)
    return res.data
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
      logout,
      updateFarmerProfile,
      refreshFarmerProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)