import { useState } from 'react'
import {
  ArrowBack, Agriculture, CheckCircle,
  CalendarToday, Inventory, Home, Notes,
} from '@mui/icons-material'
import { createFlock } from '../services/flockService'
import { useFlocks } from '../context/FlockContext'

const BIRD_TYPES = [
  { value: 'broiler',  label: 'Broiler',  emoji: '🐔', desc: 'Ready in ~42 days',  color: 'from-orange-400 to-amber-500' },
  { value: 'layer',    label: 'Layer',    emoji: '🥚', desc: 'Eggs in ~154 days',  color: 'from-yellow-400 to-orange-400' },
  { value: 'cockerel', label: 'Cockerel', emoji: '🐓', desc: 'Ready in ~84 days',  color: 'from-red-400 to-rose-500' },
  { value: 'turkey',   label: 'Turkey',   emoji: '🦃', desc: 'Ready in ~112 days', color: 'from-amber-600 to-yellow-700' },
  { value: 'duck',     label: 'Duck',     emoji: '🦆', desc: 'Ready in ~56 days',  color: 'from-teal-400 to-cyan-500' },
]

const HOUSING_TYPES = [
  { value: 'deep_litter',  label: 'Deep Litter',  emoji: '🏚️', desc: 'Floor-based system' },
  { value: 'battery_cage', label: 'Battery Cage', emoji: '🏗️', desc: 'Cage-based system' },
  { value: 'free_range',   label: 'Free Range',   emoji: '🌿', desc: 'Open outdoor system' },
]

const STEPS = [
  { label: 'Bird Type',  icon: <Agriculture /> },
  { label: 'Details',    icon: <Inventory /> },
  { label: 'Housing',    icon: <Home /> },
  { label: 'Confirm',    icon: <CheckCircle /> },
]

function calculateHarvestDate(birdType, arrivalDate) {
  const days = { broiler: 42, layer: 154, cockerel: 84, turkey: 112, duck: 56 }
  const d = new Date(arrivalDate)
  d.setDate(d.getDate() + (days[birdType] || 42))
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AddFlock({ navigate }) {
  const { fetchFlocks } = useFlocks()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    bird_type: '',
    batch_name: '',
    breed: '',
    initial_count: '',
    arrival_date: new Date().toISOString().split('T')[0],
    housing_type: 'deep_litter',
    notes: '',
  })

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setError('')
  }

  const validateStep = () => {
    if (step === 0 && !form.bird_type) {
      setError('Please select a bird type')
      return false
    }
    if (step === 1) {
      if (!form.batch_name.trim()) { setError('Batch name is required'); return false }
      if (!form.initial_count || form.initial_count <= 0) { setError('Enter a valid bird count'); return false }
      if (!form.arrival_date) { setError('Arrival date is required'); return false }
    }
    return true
  }

  const next = () => {
    if (!validateStep()) return
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await createFlock({
        ...form,
        initial_count: parseInt(form.initial_count),
      })
      await fetchFlocks()
      setSuccess(true)
      setTimeout(() => navigate('dashboard'), 2000)
    } catch (err) {
      setError(
        err.response?.data
          ? Object.values(err.response.data).flat().join(' ')
          : 'Failed to create flock. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const selectedBird = BIRD_TYPES.find(b => b.value === form.bird_type)
  const selectedHousing = HOUSING_TYPES.find(h => h.value === form.housing_type)

  // ── Success screen ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 
                      flex flex-col items-center justify-center px-5 animate-fade-in">
        <div className="card p-10 text-center max-w-sm w-full animate-bounce-in">
          <div className="text-7xl mb-4 animate-bounce">
            {selectedBird?.emoji || '🐔'}
          </div>
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center 
                          justify-center mx-auto mb-4">
            <CheckCircle sx={{ fontSize: 36, color: '#16a34a' }} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Flock Created!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <strong className="text-primary-600">{form.batch_name}</strong> has been registered.
          </p>
          <p className="text-gray-400 text-xs">
            Vaccination schedule auto-generated ✓
          </p>
          <p className="text-gray-400 text-xs mt-1">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto w-full">
          <button
            onClick={() => step === 0 ? navigate('dashboard') : setStep(s => s - 1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center 
                       hover:bg-gray-200 transition-colors active:scale-95"
          >
            <ArrowBack sx={{ fontSize: 18, color: '#374151' }} />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-gray-900 text-base">Add New Flock</h1>
            <p className="text-xs text-gray-400">{STEPS[step].label} · Step {step + 1} of 4</p>
          </div>
          <div className="text-2xl">{selectedBird?.emoji || '🐣'}</div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 
                       transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-32">

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                transition-all duration-300
                ${i === step   ? 'bg-primary-600 text-white shadow-md shadow-primary-200' :
                  i < step     ? 'bg-primary-100 text-primary-600' :
                                 'bg-gray-100 text-gray-400'}
              `}>
                {i < step ? <CheckCircle sx={{ fontSize: 13 }} /> : s.icon && <span className="text-sm">{s.icon}</span>}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 transition-colors duration-300
                  ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Bird Type ── */}
        {step === 0 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                What birds are you raising? 🐔
              </h2>
              <p className="text-gray-400 text-sm">
                Select the type of bird for this batch.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {BIRD_TYPES.map((bird, i) => (
                <button
                  key={bird.value}
                  onClick={() => set('bird_type', bird.value)}
                  className={`
                    flex items-center gap-4 p-4 rounded-2xl border-2 text-left
                    transition-all duration-200 animate-slide-up active:scale-98
                    ${form.bird_type === bird.value
                      ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
                  `}
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  {/* Gradient icon */}
                  <div className={`
                    w-14 h-14 rounded-2xl bg-gradient-to-br ${bird.color}
                    flex items-center justify-center text-2xl flex-shrink-0
                    shadow-md
                  `}>
                    {bird.emoji}
                  </div>

                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-base">{bird.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{bird.desc}</p>
                  </div>

                  {form.bird_type === bird.value && (
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center 
                                    justify-center flex-shrink-0">
                      <CheckCircle sx={{ fontSize: 16, color: '#fff' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Batch Details ── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <div className="text-4xl mb-2">{selectedBird?.emoji}</div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                Batch Details
              </h2>
              <p className="text-gray-400 text-sm">
                Tell us about this specific batch of {selectedBird?.label}s.
              </p>
            </div>

            <div className="card p-6 space-y-5">
              {/* Batch name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Batch Name *
                  <span className="text-gray-400 font-normal ml-1">
                    (e.g. "Batch A - June 2025")
                  </span>
                </label>
                <input
                  className="input-field"
                  placeholder="Give this batch a name"
                  value={form.batch_name}
                  onChange={e => set('batch_name', e.target.value)}
                />
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Breed
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Ross 308, Noiler, Arbor Acres"
                  value={form.breed}
                  onChange={e => set('breed', e.target.value)}
                />
              </div>

              {/* Bird count */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Number of Birds *
                </label>
                <div className="flex items-center border-2 border-gray-200 rounded-2xl 
                                bg-gray-50 overflow-hidden focus-within:border-primary-500 
                                focus-within:bg-white transition-all duration-200">
                  <span className="px-4 text-xl">🐦</span>
                  <input
                    className="flex-1 py-3.5 pr-4 bg-transparent text-base text-gray-900 
                               outline-none font-bold"
                    type="number"
                    placeholder="e.g. 500"
                    value={form.initial_count}
                    onChange={e => set('initial_count', e.target.value)}
                    min={1}
                  />
                  <span className="px-4 text-sm text-gray-400 font-medium">birds</span>
                </div>
              </div>

              {/* Arrival date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <CalendarToday sx={{ fontSize: 14 }} className="mr-1" />
                  Arrival Date *
                </label>
                <input
                  className="input-field"
                  type="date"
                  value={form.arrival_date}
                  onChange={e => set('arrival_date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Auto harvest date preview */}
              {form.arrival_date && form.bird_type && (
                <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 
                                animate-slide-down">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarToday sx={{ fontSize: 14, color: '#16a34a' }} />
                    <span className="text-xs font-black text-primary-700 uppercase tracking-wide">
                      Auto-calculated Harvest Date
                    </span>
                  </div>
                  <p className="text-primary-800 font-black text-lg">
                    {calculateHarvestDate(form.bird_type, form.arrival_date)}
                  </p>
                  <p className="text-primary-500 text-xs mt-1">
                    You'll get an SMS alert on this date 🔔
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Housing ── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                Housing Type 🏡
              </h2>
              <p className="text-gray-400 text-sm">
                How are your birds being kept?
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {HOUSING_TYPES.map((h, i) => (
                <button
                  key={h.value}
                  onClick={() => set('housing_type', h.value)}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left
                    transition-all duration-200 animate-slide-up active:scale-98
                    ${form.housing_type === h.value
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'}
                  `}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                    flex-shrink-0
                    ${form.housing_type === h.value
                      ? 'bg-primary-100' : 'bg-gray-100'}
                  `}>
                    {h.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900">{h.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{h.desc}</p>
                  </div>
                  {form.housing_type === h.value && (
                    <CheckCircle sx={{ fontSize: 20, color: '#16a34a' }} />
                  )}
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="card p-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Notes sx={{ fontSize: 14 }} className="mr-1" />
                Additional Notes
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Any extra details about this batch..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                Confirm & Create 🚀
              </h2>
              <p className="text-gray-400 text-sm">
                Review your flock details before saving.
              </p>
            </div>

            {/* Summary card */}
            <div className="card overflow-hidden mb-4">
              {/* Hero banner */}
              <div className={`bg-gradient-to-r ${selectedBird?.color} p-6 flex items-center gap-4`}>
                <div className="text-5xl">{selectedBird?.emoji}</div>
                <div>
                  <p className="text-white font-black text-xl">{form.batch_name}</p>
                  <p className="text-white text-opacity-80 text-sm">
                    {selectedBird?.label} · {form.initial_count} birds
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-0">
                {[
                  { label: 'Bird Type',     value: selectedBird?.label,    icon: '🐔' },
                  { label: 'Breed',         value: form.breed || 'Mixed',  icon: '🧬' },
                  { label: 'Bird Count',    value: `${parseInt(form.initial_count).toLocaleString()} birds`, icon: '🔢' },
                  { label: 'Arrival Date',  value: new Date(form.arrival_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }), icon: '📅' },
                  { label: 'Harvest Date',  value: calculateHarvestDate(form.bird_type, form.arrival_date), icon: '🛒' },
                  { label: 'Housing',       value: selectedHousing?.label, icon: '🏡' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-3 
                                          border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{row.icon}</span>
                      <span className="text-sm text-gray-500">{row.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-generated info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <p className="text-xs font-black text-blue-700 uppercase tracking-wide mb-2">
                ✨ Auto-Generated for You
              </p>
              {[
                '✅ Vaccination schedule created',
                '🔔 Harvest day SMS reminder set',
                '📊 Reports dashboard ready',
              ].map((item, i) => (
                <p key={i} className="text-xs text-blue-600 py-0.5">{item}</p>
              ))}
            </div>

            {form.notes && (
              <div className="card p-4 mb-4">
                <p className="text-xs font-bold text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{form.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 
                          text-red-600 rounded-2xl px-4 py-3 text-sm animate-slide-down">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 
                      shadow-lg px-4 py-4 max-w-2xl mx-auto">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="btn-ghost flex-1 py-3"
            >
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={next} className="btn-primary flex-2 py-3">
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-2 py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent 
                                   rounded-full animate-spin" />
                  Creating flock...
                </span>
              ) : '🚀 Create Flock'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}