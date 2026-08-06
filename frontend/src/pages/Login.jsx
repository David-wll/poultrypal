import { useState } from 'react'
import { requestOTP } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export default function Login({ onLogin }) {
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Enter a valid phone number')
      return
    }
    setLoading(true)
    setError('')
    try {
      await requestOTP(phone)
      setStep('otp')
    } catch {
      setError('Failed to send OTP. Check your number and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP sent to your phone')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(phone, otp)
      onLogin()
    } catch {
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">

      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #14532d 0%, #166534 50%, #15803d 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white opacity-5" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white opacity-5" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-white opacity-5" />

        <div className="relative z-10 max-w-md animate-fade-in">
          <div className="text-8xl mb-6 animate-bounce-in">🐔</div>
          <h1 className="text-5xl font-black text-white mb-3 leading-tight">
            Poultry<span className="text-primary-300">Pal</span>
          </h1>
          <p className="text-primary-200 text-lg mb-10 leading-relaxed">
            The smartest way to manage your poultry farm. Built for Nigerian farmers.
          </p>

          <div className="space-y-3">
            {[
              { icon: '📊', text: 'Track every flock in real time' },
              { icon: '💉', text: 'Never miss a vaccination again' },
              { icon: '📉', text: 'Auto-update bird count on deaths' },
              { icon: '💰', text: 'Know your exact profit per batch' },
              { icon: '🔔', text: 'SMS alerts on harvest day' },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white bg-opacity-10 backdrop-blur-sm 
                           border border-white border-opacity-10 rounded-2xl px-4 py-3
                           animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-primary-100 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:max-w-lg flex flex-col justify-center items-center 
                      bg-white px-8 py-12 lg:px-12 shadow-2xl">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden animate-bounce-in">
          <span className="text-4xl">🐔</span>
          <span className="text-2xl font-black text-primary-700">PoultryPal</span>
        </div>

        <div className="w-full max-w-sm">
          {step === 'phone' ? (
            <div className="animate-slide-up">
              {/* Step badge */}
              <span className="badge bg-primary-50 text-primary-700 border-primary-200 mb-4">
                Step 1 of 2
              </span>

              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Welcome 👋
              </h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Enter your phone number and we'll send you a one-time code to sign in.
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
                  onKeyDown={e => e.key === 'Enter' && handleRequestOTP()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 
                                text-red-600 rounded-xl px-4 py-3 text-sm mb-5 animate-shake">
                  ⚠️ {error}
                </div>
              )}

              <button
                className="btn-primary animate-pulse-green"
                onClick={handleRequestOTP}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent 
                                     rounded-full animate-spin" />
                    Sending code...
                  </span>
                ) : 'Send OTP →'}
              </button>

              <p className="text-center text-xs text-gray-400 mt-6">
                🇳🇬 Built exclusively for Nigerian poultry farmers
              </p>
            </div>
          ) : (
            <div className="animate-slide-up">
              <span className="badge bg-primary-50 text-primary-700 border-primary-200 mb-4">
                Step 2 of 2
              </span>

              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Check your phone 📲
              </h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                We sent a 6-digit code to{' '}
                <strong className="text-primary-600">{phone}</strong>
              </p>

              <label className="block text-sm font-bold text-gray-700 mb-2">
                6-Digit OTP Code
              </label>
              <input
                className="w-full py-5 border-2 border-gray-200 rounded-2xl bg-gray-50
                           text-3xl font-black text-center text-primary-600 tracking-widest
                           focus:border-primary-500 focus:bg-white focus:outline-none
                           transition-all duration-200 mb-5 font-mono"
                type="number"
                placeholder="••••••"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              />

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 
                                text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
                  ⚠️ {error}
                </div>
              )}

              <button
                className="btn-primary mb-3"
                onClick={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent 
                                     rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify & Sign In →'}
              </button>

              <button
                className="btn-ghost"
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              >
                ← Use a different number
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-300 mt-12">
          PoultryPal © 2025 · Made with ❤️ for Nigerian farmers
        </p>
      </div>
    </div>
  )
}