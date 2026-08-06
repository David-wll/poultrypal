import { useState, useEffect } from 'react'
import {
  ArrowBack, CheckCircle, Grain,
  Warning, Egg, Receipt, Save,
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import { getFlockById } from '../services/flockService'
import { logFeed, logMortality, logEggs, logExpense } from '../services/logService'
import { calcSurvivalRate } from '../utils/survivalRate'
import { getDrugs, logMedication } from '../services/vaccineService'

const FEED_TYPES = ['Starter', 'Grower', 'Finisher', 'Layer Mash', 'Concentrate']
const CAUSES = ['Unknown', 'Newcastle Disease', 'Gumboro', 'Heat Stress', 'Injury', 'Starvation', 'Other']
const EXPENSE_CATEGORIES = ['medication', 'labour', 'equipment', 'other']

const TABS = [
  { id: 'feed',      label: 'Feed',     emoji: '🌾', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-300' },
  { id: 'mortality', label: 'Deaths',   emoji: '📉', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-300' },
  { id: 'medication',label: 'Meds',     emoji: '💊', color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-300' },
  { id: 'eggs',      label: 'Eggs',     emoji: '🥚', color: 'text-yellow-600',  bg: 'bg-yellow-50',  border: 'border-yellow-300' },
  { id: 'expense',   label: 'Expense',  emoji: '💰', color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-300' },
]

const BIRD_EMOJI = {
  broiler: '🐔', layer: '🥚', cockerel: '🐓', turkey: '🦃', duck: '🦆'
}

export default function LogToday({ flockId, navigate }) {
  const [flock, setFlock] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('feed')
  const [saved, setSaved] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [drugs, setDrugs] = useState([])
  const [medicationForm, setMedicationForm] = useState({
    drug: '', dosage: '', quantity_used: '',
    cost: '', date_given: new Date().toISOString().split('T')[0],
  })

  // Form states
  const [feedForm, setFeedForm] = useState({
    feed_type: 'Starter', feed_brand: '',
    quantity_kg: '', cost_naira: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [mortalityForm, setMortalityForm] = useState({
    count: '', suspected_cause: 'Unknown',
    vet_consulted: false, notes: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [eggsForm, setEggsForm] = useState({
    eggs_collected: '', cracked_eggs: '0',
    eggs_sold: '0', revenue_naira: '0',
    date: new Date().toISOString().split('T')[0],
  })
  const [expenseForm, setExpenseForm] = useState({
    category: 'medication', description: '',
    amount_naira: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
      const load = async () => {
        try {
          const res = await getFlockById(flockId)
          setFlock(res.data)
          const drugRes = await getDrugs()
          setDrugs(drugRes.data.filter(d => d.drug_type !== 'vaccine'))
        } catch {
          setError('Failed to load flock data')
        } finally {
          setLoading(false)
        }
      }
      if (flockId) load()
    }, [flockId])

  const setFeed     = (f, v) => setFeedForm(p => ({ ...p, [f]: v }))
  const setMort     = (f, v) => setMortalityForm(p => ({ ...p, [f]: v }))
  const setEggs     = (f, v) => setEggsForm(p => ({ ...p, [f]: v }))
  const setExpense  = (f, v) => setExpenseForm(p => ({ ...p, [f]: v }))
  const setMedication = (f, v) => setMedicationForm(p => ({ ...p, [f]: v }))

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      if (activeTab === 'feed') {
        if (!feedForm.quantity_kg || !feedForm.cost_naira) {
          setError('Please enter quantity and cost')
          setSaving(false)
          return
        }
        await logFeed(flockId, {
          date: feedForm.date,
          feed_type: feedForm.feed_type,
          feed_brand: feedForm.feed_brand,
          quantity_kg: parseFloat(feedForm.quantity_kg),
          cost_naira: parseFloat(feedForm.cost_naira),
        })
      }

      if (activeTab === 'mortality') {
        // Allow 0 deaths — just mark as saved
        const count = parseInt(mortalityForm.count) || 0
        if (count > flock.current_count) {
          setError(`Cannot log ${count} deaths — only ${flock.current_count} birds remaining`)
          setSaving(false)
          return
        }
        if (count > 0) {
          // Only hit the API if there are actual deaths
          await logMortality(flockId, {
            date: mortalityForm.date,
            count: count,
            suspected_cause: mortalityForm.suspected_cause,
            vet_consulted: mortalityForm.vet_consulted,
            notes: mortalityForm.notes,
          })
          const res = await getFlockById(flockId)
          setFlock(res.data)
        }
      }

      if (activeTab === 'medication') {
        if (!medicationForm.drug || !medicationForm.cost) {
          setError('Please select a drug and enter the cost')
          setSaving(false)
          return
        }
        await logMedication(flockId, {
          drug: medicationForm.drug,
          dosage: medicationForm.dosage,
          quantity_used: medicationForm.quantity_used ? parseFloat(medicationForm.quantity_used) : null,
          cost: parseFloat(medicationForm.cost),
          date_given: medicationForm.date_given,
        })
      }

      if (activeTab === 'eggs') {
        if (flock.bird_type !== 'layer') {
          setSaved(p => ({ ...p, eggs: true }))
          setSaving(false)
          return
        }
        if (!eggsForm.eggs_collected) {
          setError('Please enter eggs collected')
          setSaving(false)
          return
        }
        await logEggs(flockId, {
          date: eggsForm.date,
          eggs_collected: parseInt(eggsForm.eggs_collected),
          cracked_eggs: parseInt(eggsForm.cracked_eggs) || 0,
          eggs_sold: parseInt(eggsForm.eggs_sold) || 0,
          revenue_naira: parseFloat(eggsForm.revenue_naira) || 0,
        })
      }

      if (activeTab === 'expense') {
        if (!expenseForm.description || !expenseForm.amount_naira) {
          setError('Please enter description and amount')
          setSaving(false)
          return
        }
        await logExpense(flockId, {
          date: expenseForm.date,
          category: expenseForm.category,
          description: expenseForm.description,
          amount_naira: parseFloat(expenseForm.amount_naira),
        })
      }

      setSaved(p => ({ ...p, [activeTab]: true }))
      const tabs = ['feed', 'mortality', 'medication', 'eggs', 'expense']
      const currentIndex = tabs.indexOf(activeTab)
      if (currentIndex < tabs.length - 1) {
        setTimeout(() => setActiveTab(tabs[currentIndex + 1]), 800)
      }

    } catch (err) {
      setError(
        err.response?.data
          ? Object.values(err.response.data).flat().join(' ')
          : 'Failed to save. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const allSaved = saved.feed && saved.mortality

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={32} sx={{ color: '#16a34a' }} />
          <p className="text-sm text-gray-400">Loading flock data...</p>
        </div>
      </div>
    )
  }

  if (!flock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Flock not found</p>
          <button onClick={() => navigate('dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const survival = calcSurvivalRate(flock.initial_count, flock.current_count)
  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto w-full">
          <button
            onClick={() => navigate('dashboard')}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center 
                       hover:bg-gray-200 transition-colors active:scale-95"
          >
            <ArrowBack sx={{ fontSize: 18, color: '#374151' }} />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-gray-900 text-base">Log Today</h1>
            <p className="text-xs text-gray-400">{today}</p>
          </div>
          {allSaved && (
            <span className="badge bg-primary-50 text-primary-700 border-primary-200 
                             animate-bounce-in">
              ✓ All logged
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-32">

        {/* Flock info card */}
        <div className="card p-4 mb-5 flex items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 
                          to-primary-100 border border-primary-200 flex items-center 
                          justify-center text-2xl flex-shrink-0">
            {BIRD_EMOJI[flock.bird_type] || '🐔'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 truncate">{flock.batch_name}</p>
            <p className="text-xs text-gray-400 capitalize">{flock.bird_type}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-black text-primary-600">
              {flock.current_count.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">birds · {survival} survival</p>
          </div>
        </div>

        {/* All saved banner */}
        {allSaved && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 border 
                          border-primary-300 rounded-2xl px-4 py-4 mb-5 
                          flex items-center gap-3 animate-bounce-in">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center 
                            justify-center flex-shrink-0">
              <CheckCircle sx={{ fontSize: 22, color: '#fff' }} />
            </div>
            <div>
              <p className="font-black text-primary-800 text-sm">
                Today's log complete! 🎉
              </p>
              <p className="text-xs text-primary-600">
                Great job keeping your records updated
              </p>
            </div>
          </div>
        )}

        {/* Tab selector */}
        <div className="grid grid-cols-5 gap-2 mb-5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError('') }}
              className={`
                flex flex-col items-center gap-1 py-3 rounded-2xl border-2 
                transition-all duration-200 relative font-sans active:scale-95
                ${activeTab === tab.id
                  ? `${tab.bg} ${tab.border} shadow-sm`
                  : 'bg-white border-gray-200 hover:border-gray-300'}
              `}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-xs font-bold
                ${activeTab === tab.id ? tab.color : 'text-gray-500'}`}>
                {tab.label}
              </span>
              {saved[tab.id] && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full 
                                bg-primary-500 flex items-center justify-center 
                                animate-bounce-in">
                  <CheckCircle sx={{ fontSize: 12, color: '#fff' }} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ── Feed Tab ── */}
        {activeTab === 'feed' && (
          <div className="card p-6 space-y-5 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center 
                              justify-center text-xl">🌾</div>
              <div>
                <h3 className="font-black text-gray-900">Feed Log</h3>
                <p className="text-xs text-gray-400">Record today's feeding</p>
              </div>
            </div>

            {/* Feed type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Feed Type
              </label>
              <div className="flex flex-wrap gap-2">
                {FEED_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setFeed('feed_type', t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 
                                transition-all duration-150 font-sans
                      ${feedForm.feed_type === t
                        ? 'bg-amber-50 border-amber-400 text-amber-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Feed Brand <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="input-field"
                placeholder="e.g. Top Feeds, Chikun Feeds"
                value={feedForm.feed_brand}
                onChange={e => setFeed('feed_brand', e.target.value)}
              />
            </div>

            {/* Quantity + Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Quantity (kg) *
                </label>
                <div className="flex items-center border-2 border-gray-200 rounded-2xl 
                                bg-gray-50 overflow-hidden focus-within:border-amber-400 
                                transition-all duration-200">
                  <span className="px-3 text-base">⚖️</span>
                  <input
                    className="flex-1 py-3 pr-3 bg-transparent text-sm font-bold 
                               text-gray-900 outline-none"
                    type="number"
                    placeholder="0.0"
                    value={feedForm.quantity_kg}
                    onChange={e => setFeed('quantity_kg', e.target.value)}
                    min={0}
                    step={0.5}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cost (₦) *
                </label>
                <div className="flex items-center border-2 border-gray-200 rounded-2xl 
                                bg-gray-50 overflow-hidden focus-within:border-amber-400 
                                transition-all duration-200">
                  <span className="px-3 text-sm font-bold text-gray-400">₦</span>
                  <input
                    className="flex-1 py-3 pr-3 bg-transparent text-sm font-bold 
                               text-gray-900 outline-none"
                    type="number"
                    placeholder="0"
                    value={feedForm.cost_naira}
                    onChange={e => setFeed('cost_naira', e.target.value)}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
              <input
                className="input-field"
                type="date"
                value={feedForm.date}
                onChange={e => setFeed('date', e.target.value)}
              />
            </div>

            {/* Cost per bird preview */}
            {feedForm.cost_naira && flock.current_count > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 
                              flex justify-between items-center animate-slide-down">
                <span className="text-xs text-amber-700 font-medium">
                  Cost per bird today
                </span>
                <span className="text-sm font-black text-amber-700">
                  ₦{(parseFloat(feedForm.cost_naira) / flock.current_count).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Mortality Tab ── */}
        {activeTab === 'mortality' && (
          <div className="card p-6 space-y-5 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center 
                              justify-center text-xl">📉</div>
              <div>
                <h3 className="font-black text-gray-900">Mortality Log</h3>
                <p className="text-xs text-gray-400">Record bird deaths today</p>
              </div>
            </div>

            {/* Current count banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 
                            flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Current bird count</p>
                <p className="text-2xl font-black text-gray-900">
                  {flock.current_count.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Survival rate</p>
                <p className="text-lg font-black text-primary-600">{survival}</p>
              </div>
            </div>

            {/* No deaths option */}
            <button
              onClick={() => {
                setMort('count', '0')
                setSaved(p => ({ ...p, mortality: true }))
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 
                          transition-all duration-200 font-sans
                ${saved.mortality && mortalityForm.count === '0'
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center 
                              justify-center text-xl">✅</div>
              <div className="text-left">
                <p className="font-black text-gray-900 text-sm">No deaths today</p>
                <p className="text-xs text-gray-400">All birds are alive and well</p>
              </div>
              {saved.mortality && mortalityForm.count === '0' && (
                <CheckCircle className="ml-auto text-primary-500" sx={{ fontSize: 20 }} />
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or log deaths</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Death count */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Number of Deaths *
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-2xl 
                              bg-gray-50 overflow-hidden focus-within:border-red-400 
                              transition-all duration-200">
                <span className="px-4 text-xl">💀</span>
                <input
                  className="flex-1 py-4 pr-4 bg-transparent text-xl font-black 
                             text-red-600 outline-none"
                  type="number"
                  placeholder="0"
                  value={mortalityForm.count}
                  onChange={e => setMort('count', e.target.value)}
                  min={0}
                  max={flock.current_count}
                />
                <span className="px-4 text-sm text-gray-400">birds</span>
              </div>

              {/* Warning if high mortality */}
              {mortalityForm.count > 0 &&
               parseInt(mortalityForm.count) / flock.initial_count >= 0.03 && (
                <div className="flex items-center gap-2 mt-2 bg-red-50 border 
                                border-red-200 rounded-xl px-3 py-2 animate-slide-down">
                  <Warning sx={{ fontSize: 14, color: '#dc2626' }} />
                  <span className="text-xs text-red-600 font-medium">
                    High mortality detected — consider contacting a vet
                  </span>
                </div>
              )}
            </div>

            {/* Cause */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Suspected Cause
              </label>
              <div className="flex flex-wrap gap-2">
                {CAUSES.map(c => (
                  <button
                    key={c}
                    onClick={() => setMort('suspected_cause', c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 
                                transition-all duration-150 font-sans
                      ${mortalityForm.suspected_cause === c
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Vet consulted */}
            <button
              onClick={() => setMort('vet_consulted', !mortalityForm.vet_consulted)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 
                          transition-all duration-200 font-sans
                ${mortalityForm.vet_consulted
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 bg-white'}`}
            >
              <span className="text-xl">👨‍⚕️</span>
              <span className={`text-sm font-bold flex-1 text-left
                ${mortalityForm.vet_consulted ? 'text-primary-700' : 'text-gray-600'}`}>
                Vet was consulted
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center 
                               justify-center transition-all
                ${mortalityForm.vet_consulted
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-300'}`}>
                {mortalityForm.vet_consulted && (
                  <CheckCircle sx={{ fontSize: 14, color: '#fff' }} />
                )}
              </div>
            </button>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Any observations..."
                value={mortalityForm.notes}
                onChange={e => setMort('notes', e.target.value)}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
              <input
                className="input-field"
                type="date"
                value={mortalityForm.date}
                onChange={e => setMort('date', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Medication Tab ── */}
        {activeTab === 'medication' && (
          <div className="card p-6 space-y-5 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center 
                              justify-center text-xl">💊</div>
              <div>
                <h3 className="font-black text-gray-900">Medication Log</h3>
                <p className="text-xs text-gray-400">Record drugs given today</p>
              </div>
            </div>

            {/* Drug selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Drug *
              </label>
              <select
                className="input-field"
                value={medicationForm.drug}
                onChange={e => setMedication('drug', e.target.value)}
              >
                <option value="">Select a drug</option>
                {drugs.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.drug_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Dosage <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="input-field"
                placeholder="e.g. 5g per liter of water"
                value={medicationForm.dosage}
                onChange={e => setMedication('dosage', e.target.value)}
              />
            </div>

            {/* Quantity + Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Quantity Used <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="0"
                  value={medicationForm.quantity_used}
                  onChange={e => setMedication('quantity_used', e.target.value)}
                  min={0}
                  step={0.5}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cost (₦) *
                </label>
                <div className="flex items-center border-2 border-gray-200 rounded-2xl 
                                bg-gray-50 overflow-hidden focus-within:border-teal-400 
                                transition-all duration-200">
                  <span className="px-3 text-sm font-bold text-gray-400">₦</span>
                  <input
                    className="flex-1 py-3 pr-3 bg-transparent text-sm font-bold 
                               text-gray-900 outline-none"
                    type="number"
                    placeholder="0"
                    value={medicationForm.cost}
                    onChange={e => setMedication('cost', e.target.value)}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Date Given</label>
              <input
                className="input-field"
                type="date"
                value={medicationForm.date_given}
                onChange={e => setMedication('date_given', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Eggs Tab ── */}
        {activeTab === 'eggs' && (
          <div className="card p-6 space-y-5 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center 
                              justify-center text-xl">🥚</div>
              <div>
                <h3 className="font-black text-gray-900">Egg Production</h3>
                <p className="text-xs text-gray-400">
                  {flock.bird_type === 'layer'
                    ? "Record today's egg collection"
                    : "Only applies to layer flocks"}
                </p>
              </div>
            </div>

            {flock.bird_type !== 'layer' ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🚫🥚</div>
                <p className="text-gray-500 font-bold">Not a layer flock</p>
                <p className="text-gray-400 text-sm mt-1">
                  Egg logging is only for layer birds
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Eggs Collected *', field: 'eggs_collected', emoji: '🥚', color: 'focus-within:border-yellow-400' },
                    { label: 'Cracked Eggs',     field: 'cracked_eggs',   emoji: '💔', color: 'focus-within:border-red-300' },
                    { label: 'Eggs Sold',        field: 'eggs_sold',      emoji: '🛒', color: 'focus-within:border-blue-300' },
                    { label: 'Revenue (₦)',      field: 'revenue_naira',  emoji: '💵', color: 'focus-within:border-green-400' },
                  ].map(item => (
                    <div key={item.field}>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {item.label}
                      </label>
                      <div className={`flex items-center border-2 border-gray-200 
                                      rounded-2xl bg-gray-50 overflow-hidden 
                                      ${item.color} transition-all duration-200`}>
                        <span className="px-3 text-base">{item.emoji}</span>
                        <input
                          className="flex-1 py-3 pr-3 bg-transparent text-sm 
                                     font-bold text-gray-900 outline-none"
                          type="number"
                          placeholder="0"
                          value={eggsForm[item.field]}
                          onChange={e => setEggs(item.field, e.target.value)}
                          min={0}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Egg rate */}
                {eggsForm.eggs_collected && flock.current_count > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 
                                  flex justify-between items-center animate-slide-down">
                    <span className="text-xs text-yellow-700 font-medium">
                      Production rate
                    </span>
                    <span className="text-sm font-black text-yellow-700">
                      {((parseInt(eggsForm.eggs_collected) / flock.current_count) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                  <input
                    className="input-field"
                    type="date"
                    value={eggsForm.date}
                    onChange={e => setEggs('date', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Expense Tab ── */}
        {activeTab === 'expense' && (
          <div className="card p-6 space-y-5 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center 
                              justify-center text-xl">💰</div>
              <div>
                <h3 className="font-black text-gray-900">Expense Log</h3>
                <p className="text-xs text-gray-400">Record any non-feed costs</p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setExpense('category', cat)}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 
                                capitalize transition-all duration-150 font-sans
                      ${expenseForm.category === cat
                        ? 'bg-purple-50 border-purple-400 text-purple-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                  >
                    {{
                      medication: '💊 Medication',
                      labour: '👷 Labour',
                      equipment: '🔧 Equipment',
                      other: '📦 Other',
                    }[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description *
              </label>
              <input
                className="input-field"
                placeholder="e.g. Bought antibiotics for treatment"
                value={expenseForm.description}
                onChange={e => setExpense('description', e.target.value)}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Amount (₦) *
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-2xl 
                              bg-gray-50 overflow-hidden focus-within:border-purple-400 
                              transition-all duration-200">
                <span className="px-4 text-sm font-bold text-gray-400">₦</span>
                <input
                  className="flex-1 py-4 pr-4 bg-transparent text-xl font-black 
                             text-purple-600 outline-none"
                  type="number"
                  placeholder="0"
                  value={expenseForm.amount_naira}
                  onChange={e => setExpense('amount_naira', e.target.value)}
                  min={0}
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
              <input
                className="input-field"
                type="date"
                value={expenseForm.date}
                onChange={e => setExpense('date', e.target.value)}
              />
            </div>
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
          {allSaved ? (
            <button
              onClick={() => navigate('dashboard')}
              className="btn-primary py-3"
            >
              ✅ Done — Back to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('dashboard')}
                className="btn-ghost flex-1 py-3"
              >
                Skip
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-2 py-3"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent 
                                     rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save sx={{ fontSize: 18 }} />
                    Save {TABS.find(t => t.id === activeTab)?.label}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}