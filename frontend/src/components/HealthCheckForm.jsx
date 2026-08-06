import { useState } from 'react'
import { LocalHospital, Coronavirus } from '@mui/icons-material'
import api from '../services/api'
import RiskCard from './RiskCard'

const REGIONS = ['North Central', 'North East', 'North West', 'South East', 'South South', 'South West']

const SYMPTOMS = [
  ['respiratory_distress', '🫁', 'Respiratory distress (gasping, coughing)'],
  ['diarrhea', '💧', 'Diarrhea'],
  ['lethargy', '😴', 'Lethargy / low energy'],
  ['reduced_feed_intake', '🍽️', 'Reduced feed intake'],
  ['leg_weakness', '🦵', 'Leg weakness / difficulty standing'],
]

export default function HealthCheckForm({ flockId }) {
  const [observationType, setObservationType] = useState('sick_check')
  const [form, setForm] = useState({
    bird_age_weeks: '',
    season: 'rainy',
    region: 'South West',
    days_since_last_vaccination: '',
    respiratory_distress: false,
    diarrhea: false,
    lethargy: false,
    reduced_feed_intake: false,
    leg_weakness: false,
    sudden_death_count: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const toggleSymptom = (field) =>
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const payload = {
        flock: flockId,
        ...form,
        bird_age_weeks: Number(form.bird_age_weeks),
        days_since_last_vaccination: form.days_since_last_vaccination
          ? Number(form.days_since_last_vaccination)
          : null,
        sudden_death_count: observationType === 'death_log'
          ? Number(form.sudden_death_count || 0)
          : 0,
        observation_type: observationType,
      }

      const res = await api.post('/health/observations/', payload)
      setResult(res.data)
    } catch {
      setError('Failed to get a health assessment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Observation type toggle */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setObservationType('sick_check')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95
            ${observationType === 'sick_check'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-200'
              : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-300'}`}
        >
          <Coronavirus sx={{ fontSize: 18 }} /> Bird Seems Sick
        </button>
        <button
          type="button"
          onClick={() => setObservationType('death_log')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95
            ${observationType === 'death_log'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-200'
              : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-300'}`}
        >
          📉 Bird Died
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Bird Age (weeks)
          </label>
          <input
            type="number"
            required
            value={form.bird_age_weeks}
            onChange={handleChange('bird_age_weeks')}
            placeholder="e.g. 5"
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm 
                       font-medium focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Season
            </label>
            <select
              value={form.season}
              onChange={handleChange('season')}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm 
                         font-medium focus:border-primary-500 focus:outline-none transition-colors"
            >
              <option value="dry">Dry</option>
              <option value="rainy">Rainy</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Region
            </label>
            <select
              value={form.region}
              onChange={handleChange('region')}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm 
                         font-medium focus:border-primary-500 focus:outline-none transition-colors"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Days Since Last Vaccination
          </label>
          <input
            type="number"
            value={form.days_since_last_vaccination}
            onChange={handleChange('days_since_last_vaccination')}
            placeholder="Leave blank if never vaccinated"
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm 
                       font-medium focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>

        {observationType === 'death_log' && (
          <div className="animate-slide-down">
            <label className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1.5 block">
              Number of Deaths
            </label>
            <input
              type="number"
              required
              value={form.sudden_death_count}
              onChange={handleChange('sudden_death_count')}
              placeholder="e.g. 2"
              className="w-full px-4 py-3 rounded-2xl border-2 border-red-200 text-sm 
                         font-medium focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            {observationType === 'death_log' ? 'Symptoms noticed beforehand' : 'Symptoms observed'}
          </p>
          <div className="space-y-2">
            {SYMPTOMS.map(([field, emoji, label]) => (
              <button
                type="button"
                key={field}
                onClick={() => toggleSymptom(field)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left 
                            transition-all duration-150 active:scale-[0.98]
                  ${form[field]
                    ? 'bg-primary-50 border-primary-300'
                    : 'bg-white border-gray-100 hover:border-gray-200'}`}
              >
                <span className="text-lg">{emoji}</span>
                <span className={`text-sm flex-1 ${form[field] ? 'font-bold text-primary-700' : 'font-medium text-gray-600'}`}>
                  {label}
                </span>
                {form[field] && <span className="text-primary-600 font-black">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 
                     text-white font-black text-base rounded-2xl shadow-lg 
                     shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 
                     transition-all duration-200 flex items-center justify-center gap-2
                     disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent 
                               rounded-full animate-spin" />
              Checking...
            </span>
          ) : (
            <>
              <LocalHospital sx={{ fontSize: 18 }} /> Check Symptoms
            </>
          )}
        </button>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 
                          text-red-600 rounded-2xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}
      </form>

      <RiskCard result={result} />
    </div>
  )
}