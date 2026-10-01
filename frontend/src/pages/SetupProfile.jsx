import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
  'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT',
  'Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
  'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo',
  'Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
]

const STEPS = [
  { label: 'Personal', emoji: '👤' },
  { label: 'Farm',     emoji: '🏡' },
]

export default function SetupProfile({ onComplete }) {
  const { updateFarmerProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    full_name: '', email: '',
    farm_name: '', state: '', lga: '',
    preferred_language: 'en',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setError('')
  }

  const next = () => {
    if (step === 0 && !form.full_name.trim()) {
      setError('Please enter your full name')
      return
    }
    if (step === 1 && (!form.farm_name.trim() || !form.state)) {
      setError('Please fill in farm name and state')
      return
    }
    setError('')
    setStep(s => s + 1)
  }

  const submit = async () => {
    setLoading(true)
    try {
      await updateFarmerProfile(form)
      onComplete()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 via-white 
                    to-primary-100 flex flex-col items-center justify-center px-5 py-10">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 animate-bounce-in">
        <span className="text-4xl">🐔</span>
        <span className="text-2xl font-black text-primary-700">PoultryPal</span>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Set Up Your Farm
          </h1>
          <p className="text-gray-500 text-sm">
            Just a few details to get you started
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-sm font-black transition-all duration-300
                  ${i < step  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' :
                    i === step ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 ring-4 ring-primary-100' :
                                 'bg-gray-200 text-gray-400'}
                `}>
                  {i < step ? '✓' : s.emoji}
                </div>
                <span className={`text-xs font-bold transition-colors duration-300
                  ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-1 mx-2 mb-5 rounded-full transition-all duration-500
                  ${i < step ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up">

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <div className="text-4xl mb-3">👤</div>
                <h3 className="text-xl font-black text-gray-900 mb-1">
                  Personal Information
                </h3>
                <p className="text-gray-500 text-sm">
                  Tell us your name to personalize your experience.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Emeka Okafor"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="emeka@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="text-4xl mb-3">🏡</div>
                <h3 className="text-xl font-black text-gray-900 mb-1">Your Farm</h3>
                <p className="text-gray-500 text-sm">
                  Tell us about your farm's name and location.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Farm Name *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Golden Farms"
                  value={form.farm_name}
                  onChange={e => set('farm_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  State *
                </label>
                <select
                  className="input-field"
                  value={form.state}
                  onChange={e => set('state', e.target.value)}
                >
                  <option value="">Select your state</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  LGA <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className="input-field"
                  placeholder="Local Government Area"
                  value={form.lga}
                  onChange={e => set('lga', e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
                <p className="text-xs font-black text-primary-700 uppercase tracking-wide mb-3">
                  📋 Summary
                </p>
                {[
                  ['Name', form.full_name],
                  ['Farm', form.farm_name],
                  ['State', form.state],
                  ['LGA', form.lga || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-primary-100 last:border-0">
                    <span className="text-xs text-gray-500">{k}</span>
                    <span className="text-xs font-bold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 
                            text-red-600 rounded-xl px-4 py-3 text-sm animate-slide-down">
              ⚠️ {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                className="btn-ghost flex-1"
                onClick={() => setStep(s => s - 1)}
              >
                ← Back
              </button>
            )}
            {step < 1 ? (
              <button className="btn-primary flex-2" onClick={next}>
                Continue →
              </button>
            ) : (
              <button
                className="btn-primary flex-2"
                onClick={submit}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent 
                                     rounded-full animate-spin" />
                    Setting up...
                  </span>
                ) : '🚀 Launch My Farm'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}