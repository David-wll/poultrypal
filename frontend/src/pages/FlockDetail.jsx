import { useState, useEffect } from 'react'
import {
  ArrowBack, Agriculture, TrendingUp, TrendingDown,
  Vaccines, Assessment, CheckCircle, Warning,
  CalendarToday, Inventory, WaterDrop, Receipt,
  MoreVert, Edit, Delete,
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import { getFlockById, harvestFlock } from '../services/flockService'
import { getFeedLogs, getMortalityLogs } from '../services/logService'
import { getVaccineSchedule } from '../services/vaccineService'
import { getMedicationLogs } from '../services/vaccineService'
import { formatNaira } from '../utils/formatCurrency'
import { calcSurvivalRate } from '../utils/survivalRate'
import { deleteFlock } from '../services/flockService'
import { useFlocks } from '../context/FlockContext'
import HealthCheckForm from '../components/HealthCheckForm';

const BIRD_EMOJI = {
  broiler: '🐔', layer: '🥚', cockerel: '🐓', turkey: '🦃', duck: '🦆'
}

function getDaysRemaining(harvestDate) {
  if (!harvestDate) return 0
  const [year, month, day] = harvestDate.split('-').map(Number)
  const harvest = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((harvest - today) / (1000 * 60 * 60 * 24))
}

function getDaysAlive(arrivalDate) {
  if (!arrivalDate) return 0
  const [year, month, day] = arrivalDate.split('-').map(Number)
  const arrival = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - arrival) / (1000 * 60 * 60 * 24))
}

function StatBox({ label, value, sub, color, bg, icon }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex flex-col gap-1`}>
      <div className={`${color} flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide`}>
        {icon} {label}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function VaccineRow({ vaccine }) {
  const isOverdue = !vaccine.is_done && new Date(vaccine.scheduled_date) < new Date()
  const isDone = vaccine.is_done

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border
      ${isDone    ? 'bg-primary-50 border-primary-100' :
        isOverdue ? 'bg-red-50 border-red-200' :
                    'bg-white border-gray-100'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
        ${isDone    ? 'bg-primary-100' :
          isOverdue ? 'bg-red-100' :
                      'bg-gray-100'}`}
      >
        {isDone
          ? <CheckCircle sx={{ fontSize: 18, color: '#16a34a' }} />
          : isOverdue
          ? <Warning sx={{ fontSize: 18, color: '#dc2626' }} />
          : <Vaccines sx={{ fontSize: 18, color: '#6b7280' }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate
          ${isDone ? 'text-primary-700' : isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
          {vaccine.drug_name}
        </p>
        <p className="text-xs text-gray-400">
          {isDone
            ? `Given on ${new Date(vaccine.administered_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
            : `Due ${new Date(vaccine.scheduled_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
          }
        </p>
      </div>
      <span className={`badge text-xs flex-shrink-0
        ${isDone    ? 'bg-primary-100 text-primary-700 border-primary-200' :
          isOverdue ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-gray-100 text-gray-500 border-gray-200'}`}
      >
        {isDone ? 'Done' : isOverdue ? 'Overdue' : 'Pending'}
      </span>
    </div>
  )
}

export default function FlockDetail({ flockId, navigate }) {
  const { fetchFlocks } = useFlocks()
  const [flock, setFlock] = useState(null)
  const [feedLogs, setFeedLogs] = useState([])
  const [mortalityLogs, setMortalityLogs] = useState([])
  const [vaccines, setVaccines] = useState([])
  const [medicationLogs, setMedicationLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [harvesting, setHarvesting] = useState(false)
  const [showHarvestConfirm, setShowHarvestConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [flockRes, feedRes, mortRes, vaccineRes, medRes] = await Promise.all([
          getFlockById(flockId),
          getFeedLogs(flockId),
          getMortalityLogs(flockId),
          getVaccineSchedule(flockId),
          getMedicationLogs(flockId),
        ])
        setFlock(flockRes.data)
        setFeedLogs(feedRes.data)
        setMortalityLogs(mortRes.data)
        setVaccines(vaccineRes.data)
        setMedicationLogs(medRes.data)
      } catch {
        setError('Failed to load flock data')
      } finally {
        setLoading(false)
      }
    }
    if (flockId) load()
  }, [flockId])

  const handleHarvest = async () => {
    setHarvesting(true)
    try {
      await harvestFlock(flockId)
      setFlock(prev => ({ ...prev, status: 'harvested' }))
      setShowHarvestConfirm(false)
    } catch {
      setError('Failed to mark as harvested')
    } finally {
      setHarvesting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteFlock(flockId)
      await fetchFlocks()
      navigate('dashboard')
    } catch {
      setError('Failed to delete flock')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={32} sx={{ color: '#16a34a' }} />
          <p className="text-sm text-gray-400">Loading flock details...</p>
        </div>
      </div>
    )
  }

  if (!flock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Flock not found</p>
          <button onClick={() => navigate('dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const daysAlive    = getDaysAlive(flock.arrival_date)
  const daysLeft     = getDaysRemaining(flock.expected_harvest_date)
  const isReady      = daysLeft <= 0
  const survival     = calcSurvivalRate(flock.initial_count, flock.current_count)
  const totalDeaths  = mortalityLogs.reduce((s, l) => s + l.count, 0)
  const totalFeedCost = feedLogs.reduce((s, l) => s + parseFloat(l.cost_naira), 0)
  const totalMedicationCost = medicationLogs.reduce((s, l) => s + parseFloat(l.cost), 0)
  const totalFeedKg  = feedLogs.reduce((s, l) => s + parseFloat(l.quantity_kg), 0)
  const doneVaccines = vaccines.filter(v => v.is_done).length
  const totalDays    = daysAlive + Math.max(0, daysLeft)
  const progress     = totalDays > 0 ? Math.min(100, (daysAlive / totalDays) * 100) : 100

  const TABS = [
    { id: 'overview',   label: 'Overview',  emoji: '📊' },
    { id: 'feed',       label: 'Feed',      emoji: '🌾' },
    { id: 'mortality',  label: 'Deaths',    emoji: '📉' },
    { id: 'medication', label: 'Meds',      emoji: '💊' },
    { id: 'vaccines',   label: 'Vaccines',  emoji: '💉' },
    { id: 'health',     label: 'Health',    emoji: '🩺' },
  ]

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
            <h1 className="font-black text-gray-900 text-base">{flock.batch_name}</h1>
            <p className="text-xs text-gray-400 capitalize">
              {flock.bird_type} · {flock.breed || 'Mixed breed'}
            </p>
          </div>
          <span className={`badge
            ${flock.status === 'active'    ? 'bg-primary-50 text-primary-700 border-primary-200' :
              flock.status === 'harvested' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                             'bg-red-50 text-red-700 border-red-200'}`}
          >
            {flock.status}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-32">

        {/* Hero card */}
        <div className="card overflow-hidden mb-5 animate-fade-in">
          {/* Gradient banner */}
          <div className={`p-5 flex items-center gap-4
            ${isReady
              ? 'bg-gradient-to-r from-primary-600 to-primary-500'
              : 'bg-gradient-to-r from-gray-800 to-gray-700'}`}
          >
            <div className="text-5xl">{BIRD_EMOJI[flock.bird_type] || '🐔'}</div>
            <div className="flex-1">
              <p className="text-white font-black text-xl">{flock.batch_name}</p>
              <p className="text-white text-opacity-70 text-sm capitalize">
                {flock.bird_type} · {flock.current_count.toLocaleString()} birds remaining
              </p>
            </div>
            {isReady && (
              <span className="badge bg-white text-primary-700 border-white 
                               animate-pulse text-xs">
                🎉 Ready!
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="px-5 py-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Day {daysAlive}</span>
              <span className={isReady ? 'text-primary-600 font-bold' : ''}>
                {isReady ? '🎉 Ready for market!' : `${daysLeft} days to harvest`}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700
                  ${isReady
                    ? 'bg-gradient-to-r from-primary-500 to-primary-400 animate-pulse'
                    : 'bg-gradient-to-r from-primary-600 to-primary-400'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Arrived: {new Date(...flock.arrival_date.split('-').map(Number)).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>Harvest: {new Date(...flock.expected_harvest_date.split('-').map((n, i) => i === 1 ? Number(n) - 1 : Number(n))).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Harvest button */}
        {isReady && flock.status === 'active' && (
          <div className="mb-5 animate-bounce-in">
            {!showHarvestConfirm ? (
              <button
                onClick={() => setShowHarvestConfirm(true)}
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 
                           text-white font-black text-base rounded-2xl shadow-lg 
                           shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 
                           transition-all duration-200 flex items-center justify-center gap-2"
              >
                🛒 Record Harvest
              </button>
            ) : (
              <div className="card p-5 border-2 border-primary-300 animate-slide-down">
                <p className="font-black text-gray-900 mb-1">Confirm Harvest</p>
                <p className="text-sm text-gray-500 mb-4">
                  This will mark <strong>{flock.batch_name}</strong> as harvested
                  and generate your final P&L report.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowHarvestConfirm(false)}
                    className="btn-ghost flex-1 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleHarvest}
                    disabled={harvesting}
                    className="flex-2 py-2.5 bg-gradient-to-r from-primary-600 
                               to-primary-700 text-white font-bold rounded-2xl 
                               border-none cursor-pointer flex items-center 
                               justify-center gap-2 text-sm"
                  >
                    {harvesting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white 
                                         border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : '✅ Confirm Harvest'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        {flock.status === 'active' && (
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => navigate('logToday', flock.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 
                         bg-gradient-to-r from-primary-600 to-primary-700 
                         text-white text-sm font-bold rounded-2xl shadow-md 
                         shadow-primary-200 hover:shadow-lg transition-all 
                         duration-200 active:scale-95"
            >
              <WaterDrop sx={{ fontSize: 16 }} /> Log Today
            </button>
            <button
              onClick={() => navigate('reports', flock.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 
                         bg-white border-2 border-gray-200 text-gray-700 
                         text-sm font-bold rounded-2xl hover:border-gray-300 
                         transition-all duration-200 active:scale-95"
            >
              <Assessment sx={{ fontSize: 16 }} /> View Report
            </button>
          </div>
        )}

        {/* Delete flock */}
        {flock.status === 'active' && (
          <div className="mb-5">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-white border-2 border-red-200 text-red-600 
                           text-sm font-bold rounded-2xl hover:bg-red-50 
                           transition-all duration-200 active:scale-95"
              >
                🗑️ Delete This Flock
              </button>
            ) : (
              <div className="card p-5 border-2 border-red-300 animate-slide-down">
                <p className="font-black text-gray-900 mb-1">Confirm Delete</p>
                <p className="text-sm text-gray-500 mb-4">
                  This will permanently remove <strong>{flock.batch_name}</strong> from 
                  your active flocks. This cannot be undone from the app.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-ghost flex-1 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-2 py-2.5 bg-red-600 text-white font-bold 
                               rounded-2xl border-none cursor-pointer flex 
                               items-center justify-center gap-2 text-sm"
                  >
                    {deleting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white 
                                         border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </span>
                    ) : '🗑️ Yes, Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm 
                          font-bold whitespace-nowrap transition-all duration-200 
                          flex-shrink-0 font-sans
                ${activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}
            >
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label="Birds Alive"
                value={flock.current_count.toLocaleString()}
                sub={`of ${flock.initial_count.toLocaleString()} initial`}
                color="text-primary-600"
                bg="bg-primary-50"
                icon="🐔"
              />
              <StatBox
                label="Survival Rate"
                value={survival}
                sub={`${totalDeaths} deaths total`}
                color="text-blue-600"
                bg="bg-blue-50"
                icon="📈"
              />
              <StatBox
                label="Total Feed Cost"
                value={`₦${totalFeedCost.toLocaleString()}`}
                sub={`${totalFeedKg.toFixed(1)}kg consumed`}
                color="text-amber-600"
                bg="bg-amber-50"
                icon="🌾"
              />
              <StatBox
                label="Cost per Bird"
                value={flock.current_count > 0
                  ? `₦${((totalFeedCost + totalMedicationCost) / flock.current_count).toFixed(0)}`
                  : '₦0'}
                sub="feed + medication"
                color="text-purple-600"
                bg="bg-purple-50"
                icon="💰"
              />
            </div>

            {/* Vaccine summary */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-gray-900 text-sm">Vaccination Progress</p>
                <span className="text-xs text-gray-400">
                  {doneVaccines}/{vaccines.length} done
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-400 
                             rounded-full transition-all duration-700"
                  style={{ width: `${vaccines.length > 0 ? (doneVaccines / vaccines.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-primary-600 font-bold">
                  {doneVaccines} administered
                </span>
                <span className="text-xs text-gray-400">
                  {vaccines.length - doneVaccines} remaining
                </span>
              </div>
            </div>

            {/* Flock details */}
            <div className="card p-5">
              <p className="font-black text-gray-900 text-sm mb-3">Flock Information</p>
              {[
                { label: 'Bird Type',     value: flock.bird_type,     icon: '🐔' },
                { label: 'Breed',         value: flock.breed || 'Mixed breed', icon: '🧬' },
                { label: 'Housing',       value: flock.housing_type?.replace('_', ' '), icon: '🏡' },
                { label: 'Arrival Date',  value: new Date(flock.arrival_date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }), icon: '📅' },
                { label: 'Harvest Date',  value: new Date(flock.expected_harvest_date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }), icon: '🛒' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 
                                        border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{row.icon}</span>
                    <span className="text-sm text-gray-500">{row.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 capitalize">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Feed Tab ── */}
        {activeTab === 'feed' && (
          <div className="animate-slide-up">
            {feedLogs.length === 0 ? (
              <div className="card p-10 text-center border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-3">🌾</div>
                <p className="font-bold text-gray-500">No feed logs yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start logging daily feed from Log Today
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-amber-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                      Total Cost
                    </p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      ₦{totalFeedCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                      Total Feed
                    </p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      {totalFeedKg.toFixed(1)} kg
                    </p>
                  </div>
                </div>

                {feedLogs.map((log, i) => (
                  <div key={log.id}
                    className="card p-4 flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center 
                                    justify-center text-xl flex-shrink-0">
                      🌾
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{log.feed_type}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.date + 'T00:00:00').toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {log.feed_brand ? ` · ${log.feed_brand}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-gray-900">
                        ₦{parseFloat(log.cost_naira).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{log.quantity_kg}kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Mortality Tab ── */}
        {activeTab === 'mortality' && (
          <div className="animate-slide-up">
            {mortalityLogs.length === 0 ? (
              <div className="card p-10 text-center border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-bold text-primary-600">No deaths recorded</p>
                <p className="text-sm text-gray-400 mt-1">
                  All birds are alive and well
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-red-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide">
                      Total Deaths
                    </p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      {totalDeaths}
                    </p>
                  </div>
                  <div className="bg-primary-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">
                      Survival Rate
                    </p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      {survival}
                    </p>
                  </div>
                </div>

                {mortalityLogs.map((log, i) => (
                  <div key={log.id}
                    className="card p-4 animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center 
                                      justify-center text-xl flex-shrink-0">
                        📉
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">
                          {log.count} bird{log.count > 1 ? 's' : ''} died
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.date + 'T00:00:00').toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="text-xl font-black text-red-600">
                        -{log.count}
                      </span>
                    </div>
                    {log.suspected_cause && log.suspected_cause !== 'Unknown' && (
                      <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">
                        Cause: {log.suspected_cause}
                      </div>
                    )}
                    {log.vet_consulted && (
                      <div className="mt-2 text-xs text-primary-600 font-medium">
                        👨‍⚕️ Vet was consulted
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Medication Tab ── */}
        {activeTab === 'medication' && (
          <div className="animate-slide-up">
            {medicationLogs.length === 0 ? (
              <div className="card p-10 text-center border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-3">💊</div>
                <p className="font-bold text-gray-500">No medications logged yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start logging daily medications from Log Today
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary */}
                <div className="bg-teal-50 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                    Total Medication Cost
                  </p>
                  <p className="text-xl font-black text-gray-900 mt-1">
                    ₦{totalMedicationCost.toLocaleString()}
                  </p>
                </div>

                {medicationLogs.map((log, i) => (
                  <div key={log.id}
                    className="card p-4 flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center 
                                    justify-center text-xl flex-shrink-0">
                      💊
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{log.drug_name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {new Date(log.date_given + 'T00:00:00').toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {log.dosage ? ` · ${log.dosage}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-gray-900">
                        ₦{parseFloat(log.cost).toLocaleString()}
                      </p>
                      {log.quantity_used && (
                        <p className="text-xs text-gray-400">{log.quantity_used} used</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Vaccines Tab ── */}
        {activeTab === 'vaccines' && (
          <div className="animate-slide-up">
            {vaccines.length === 0 ? (
              <div className="card p-10 text-center border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-3">💉</div>
                <p className="font-bold text-gray-500">No vaccines scheduled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-primary-50 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-primary-600">{doneVaccines}</p>
                    <p className="text-xs text-gray-400">Done</p>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-amber-600">
                      {vaccines.filter(v => !v.is_done && !v.is_overdue).length}
                    </p>
                    <p className="text-xs text-gray-400">Upcoming</p>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-red-600">
                      {vaccines.filter(v => v.is_overdue).length}
                    </p>
                    <p className="text-xs text-gray-400">Overdue</p>
                  </div>
                </div>

                {vaccines.map((vaccine, i) => (
                  <div
                    key={vaccine.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <VaccineRow vaccine={vaccine} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Health Tab ── */}
        {activeTab === 'health' && (
          <div className="animate-slide-up">
            <HealthCheckForm flockId={flock.id} />
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 
                          text-red-600 rounded-2xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  )
}