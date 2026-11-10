import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Turn a DRF error response into one readable sentence
function errorMessage(err) {
  const data = err.response?.data
  if (err.response?.status === 429) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (!data) return 'Could not reach the server. Check your connection.'
  if (data.error) return data.error
  const first = Object.values(data)[0]
  return Array.isArray(first) ? first.join(' ') : 'Something went wrong. Try again.'
}

export default function PasswordAuthForm({ onSuccess }) {
  const { loginWithPassword, registerAccount } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState('')

  const submit = async () => {
    if (!phone || phone.length < 10) {
      setError('Enter a valid phone number')
      return
    }
    if (!password) {
      setError('Enter your password')
      return
    }
    if (isRegister && password !== confirm) {
      setError('Passwords do not match')
    return
    }
    setLoading(true)
    setError('')
    try {
      if (isRegister) await registerAccount(phone, password)
      else await loginWithPassword(phone, password)
      onSuccess()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up">
      <h2 className="text-3xl font-black text-gray-900 mb-2">
        {isRegister ? 'Create account 🐣' : 'Welcome back 👋'}
      </h2>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        {isRegister
          ? 'Choose a password to sign in with your phone number.'
          : 'Sign in with your phone number and password.'}
      </p>

      <label className="block text-sm font-bold text-gray-700 mb-2">
        Phone Number
      </label>
      <div className="flex items-center border-2 border-gray-200 rounded-2xl
                      bg-gray-50 overflow-hidden mb-5 focus-within:border-primary-500
                      focus-within:bg-white transition-all duration-200">
        <span className="px-4 text-xl">📱</span>
        <input
          className="flex-1 py-4 pr-4 bg-transparent text-base text-gray-900
                     outline-none placeholder-gray-400"
          type="tel"
          placeholder="08012345678"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          maxLength={15}
          autoComplete="username"
        />
      </div>

      <label className="block text-sm font-bold text-gray-700 mb-2">
        Password
      </label>
      <div className="flex items-center border-2 border-gray-200 rounded-2xl
                      bg-gray-50 overflow-hidden mb-2 focus-within:border-primary-500
                      focus-within:bg-white transition-all duration-200">
        <span className="px-4 text-xl">🔒</span>
        <input
          className="flex-1 py-4 bg-transparent text-base text-gray-900
                     outline-none placeholder-gray-400"
          type={showPassword ? 'text' : 'password'}
          placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <button
          type="button"
          className="px-4 text-xs font-bold text-primary-600"
          onClick={() => setShowPassword(v => !v)}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {isRegister && (
        <p className="text-xs text-gray-400 mb-5">
          Use at least 8 characters, and not only numbers.
        </p>
      )}

      {isRegister && (
        <>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="flex items-center border-2 border-gray-200 rounded-2xl
                          bg-gray-50 overflow-hidden mb-5 focus-within:border-primary-500
                          focus-within:bg-white transition-all duration-200">
            <span className="px-4 text-xl">🔒</span>
            <input
              className="flex-1 py-4 pr-4 bg-transparent text-base text-gray-900
                         outline-none placeholder-gray-400"
              type={showPassword ? 'text' : 'password'}
              placeholder="Type the password again"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>
        </>
      )}

      {!isRegister && <div className="mb-3" />}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200
                        text-red-600 rounded-xl px-4 py-3 text-sm mb-5 animate-shake">
          ⚠️ {error}
        </div>
      )}

      <button className="btn-primary mb-3" onClick={submit} disabled={loading}>
        {loading ? 'Please wait...' : isRegister ? 'Create account →' : 'Sign in →'}
      </button>

      <button
        className="btn-ghost"
                onClick={() => { setIsRegister(v => !v); setError(''); setConfirm('') }}
      >
        {isRegister
          ? 'Already have an account? Sign in'
          : 'New here? Create an account'}
      </button>
    </div>
  )
}