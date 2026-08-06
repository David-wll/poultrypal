import { useState, useEffect } from 'react'
import {
  Agriculture, Vaccines, CheckCircle,
  Warning, Schedule, Person, Assessment,
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import { useFlocks } from '../context/FlockContext'
import { getVaccineSchedule, markAdministered } from '../services/vaccineService'

const BIRD_EMOJI = {
  broiler: '🐔', layer: '🥚', cockerel: '🐓', turkey: '🦃', duck: '🦆'
}

function getVaccineStatus(vaccine) {
  if (vaccine.is_done) return 'done'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(vaccine.scheduled_date + 'T00:00:00')
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff <= 3) return 'upcoming'
  return 'pending'
}

function getDaysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

const STATUS_CONFIG = {
  done:     { label: 'Done',     color: 'text-primary-600', bg: 'bg-primary-50',  border: 'border-primary-200', badgeBg: 'bg-primary-100',  badgeText: 'text-primary-700' },
  overdue:  { label: 'Overdue',  color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     badgeBg: 'bg-red-100',      badgeText: 'text-red-700' },
  upcoming: { label: 'Soon',     color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   badgeBg: 'bg-amber-100',    badgeText: 'text-amber-700' },
  pending:  { label: 'Pending',  color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',    badgeBg: 'bg-gray-100',     badgeText: 'text-gray-600' },
}

function VaccineCard({ vaccine, flockName, birdType, onMark }) {
  const status = getVaccineStatus(vaccine)
  const cfg    = STATUS_CONFIG[status]
  const daysUntil = getDaysUntil(vaccine.scheduled_date)
  const [marking, setMarking] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [adminDate, setAdminDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [adminBy, setAdminBy] = useState('')

  const handleMark = async () => {
    setMarking(true)
    try {
      await onMark(vaccine.id, {
        administered_date: adminDate,
        administered_by: adminBy,
      })
      setShowForm(false)
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className={`card border-2 ${cfg.border} overflow-hidden animate-fade-in`}>
      <div className={`p-4 ${cfg.bg}`}>
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                           flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
            {status === 'done'
              ? <CheckCircle sx={{ fontSize: 20, color: '#16a34a' }} />
              : status === 'overdue'
              ? <Warning sx={{ fontSize: 20, color: '#dc2626' }} />
              : status === 'upcoming'
              ? <Schedule sx={{ fontSize: 20, color: '#d97706' }} />
              : <Vaccines sx={{ fontSize: 20, color: '#9ca3af' }} />
            }
          </div>

          <div className="flex-1 min-w-0">
            {/* Vaccine name */}
            <p className="font-black text-gray-900 text-sm leading-tight">
              {vaccine.drug_name}
            </p>

            {/* Flock info */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm">
                {BIRD_EMOJI[birdType] || '🐔'}
              </span>
              <span className="text-xs text-gray-500 truncate">{flockName}</span>
            </div>

            {/* Date info */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge ${cfg.badgeBg} ${cfg.badgeText} 
                               border-transparent text-xs`}>
                {cfg.label}
              </span>

              {status === 'done' ? (
                <span className="text-xs text-gray-400">
                  Given {new Date(vaccine.administered_date + 'T00:00:00')
                    .toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                </span>
              ) : (
                <span className={`text-xs font-bold ${cfg.color}`}>
                  {status === 'overdue'
                    ? `${Math.abs(daysUntil)} days overdue`
                    : daysUntil === 0
                    ? 'Due today!'
                    : daysUntil === 1
                    ? 'Due tomorrow!'
                    : `Due in ${daysUntil} days`}
                </span>
              )}
            </div>

            {/* Due date */}
            <p className="text-xs text-gray-400 mt-1">
              📅 {new Date(vaccine.scheduled_date + 'T00:00:00')
                .toLocaleDateString('en-NG', {
                  weekday: 'short', day: 'numeric',
                  month: 'short', year: 'numeric'
                })}
            </p>
          </div>
        </div>

        {/* Mark as done button */}
        {status !== 'done' && (
          <div className="mt-3">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold 
                            border-2 transition-all duration-200 font-sans
                  ${status === 'overdue'
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                    : status === 'upcoming'
                    ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
              >
                💉 Mark as Administered
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-gray-200 
                              space-y-3 animate-slide-down">
                <p className="text-xs font-black text-gray-700">
                  Record Administration
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Date Given
                  </label>
                  <input
                    className="input-field text-sm py-2.5"
                    type="date"
                    value={adminDate}
                    onChange={e => setAdminDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Administered By
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    className="input-field text-sm py-2.5"
                    placeholder="e.g. Dr. Adebayo or Self"
                    value={adminBy}
                    onChange={e => setAdminBy(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold 
                               bg-gray-100 text-gray-600 border-none 
                               cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMark}
                    disabled={marking}
                    className="flex-2 py-2 rounded-xl text-xs font-bold 
                               bg-primary-600 text-white border-none 
                               cursor-pointer font-sans flex items-center 
                               justify-center gap-1"
                  >
                    {marking ? (
                      <span className="w-3 h-3 border-2 border-white 
                                       border-t-transparent rounded-full 
                                       animate-spin" />
                    ) : '✅ Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Administered by */}
        {status === 'done' && vaccine.administered_by && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs">👨‍⚕️</span>
            <span className="text-xs text-gray-400">
              By {vaccine.administered_by}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VaccinationCalendar({ navigate }) {
  const { flocks } = useFlocks()
  const [allVaccines, setAllVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeFlock, setActiveFlock] = useState('all')
  const [error, setError] = useState('')

  const activeFlocks = flocks.filter(f => f.status === 'active')

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.all(
          activeFlocks.map(async flock => {
            const res = await getVaccineSchedule(flock.id)
            return res.data.map(v => ({
              ...v,
              flockName: flock.batch_name,
              flockId: flock.id,
              birdType: flock.bird_type,
            }))
          })
        )
        setAllVaccines(results.flat())
      } catch {
        setError('Failed to load vaccine schedules')
      } finally {
        setLoading(false)
      }
    }
    if (activeFlocks.length > 0) load()
    else setLoading(false)
  }, [flocks])

  const handleMark = async (vaccineId, data) => {
    await markAdministered(vaccineId, data)
    // Refresh vaccines
    setLoading(true)
    try {
      const results = await Promise.all(
        activeFlocks.map(async flock => {
          const res = await getVaccineSchedule(flock.id)
          return res.data.map(v => ({
            ...v,
            flockName: flock.batch_name,
            flockId: flock.id,
            birdType: flock.bird_type,
          }))
        })
      )
      setAllVaccines(results.flat())
    } finally {
      setLoading(false)
    }
  }

  // Filter vaccines
  const filtered = allVaccines.filter(v => {
    const statusMatch = activeFilter === 'all' || getVaccineStatus(v) === activeFilter
    const flockMatch  = activeFlock === 'all' || v.flockId === activeFlock
    return statusMatch && flockMatch
  })

  // Sort — overdue first, then upcoming, then pending, then done
  const ORDER = { overdue: 0, upcoming: 1, pending: 2, done: 3 }
  const sorted = [...filtered].sort((a, b) =>
    ORDER[getVaccineStatus(a)] - ORDER[getVaccineStatus(b)]
  )

  // Counts
  const counts = {
    all:      allVaccines.length,
    overdue:  allVaccines.filter(v => getVaccineStatus(v) === 'overdue').length,
    upcoming: allVaccines.filter(v => getVaccineStatus(v) === 'upcoming').length,
    pending:  allVaccines.filter(v => getVaccineStatus(v) === 'pending').length,
    done:     allVaccines.filter(v => getVaccineStatus(v) === 'done').length,
  }

  const FILTERS = [
    { id: 'all',      label: 'All',      count: counts.all },
    { id: 'overdue',  label: 'Overdue',  count: counts.overdue },
    { id: 'upcoming', label: 'Soon',     count: counts.upcoming },
    { id: 'pending',  label: 'Pending',  count: counts.pending },
    { id: 'done',     label: 'Done',     count: counts.done },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 py-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-black text-gray-900 text-base">
                Vaccination Calendar
              </h1>
              <p className="text-xs text-gray-400">
                {counts.overdue > 0
                  ? `⚠️ ${counts.overdue} overdue vaccine${counts.overdue > 1 ? 's' : ''}`
                  : counts.upcoming > 0
                  ? `🔔 ${counts.upcoming} vaccine${counts.upcoming > 1 ? 's' : ''} due soon`
                  : '✅ All vaccines on track'}
              </p>
            </div>
            <div className="text-3xl">💉</div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 mb-5 animate-fade-in">
          {[
            { label: 'Total',   value: counts.all,      bg: 'bg-gray-100',     color: 'text-gray-700' },
            { label: 'Overdue', value: counts.overdue,  bg: 'bg-red-100',      color: 'text-red-700' },
            { label: 'Soon',    value: counts.upcoming, bg: 'bg-amber-100',    color: 'text-amber-700' },
            { label: 'Done',    value: counts.done,     bg: 'bg-primary-100',  color: 'text-primary-700' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {counts.overdue > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 
                          mb-5 flex items-center gap-3 animate-bounce-in">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center 
                            justify-center flex-shrink-0">
              <Warning sx={{ fontSize: 22, color: '#dc2626' }} />
            </div>
            <div>
              <p className="font-black text-red-800 text-sm">
                {counts.overdue} overdue vaccine{counts.overdue > 1 ? 's' : ''}!
              </p>
              <p className="text-xs text-red-500">
                Mark them as administered or reschedule immediately
              </p>
            </div>
          </div>
        )}

        {/* Flock filter */}
        {activeFlocks.length > 1 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase 
                          tracking-wide mb-2">Filter by Flock</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveFlock('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold 
                            border-2 transition-all duration-200 font-sans
                  ${activeFlock === 'all'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200'}`}
              >
                All Flocks
              </button>
              {activeFlocks.map(flock => (
                <button
                  key={flock.id}
                  onClick={() => setActiveFlock(flock.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 
                              rounded-xl text-xs font-bold border-2 
                              transition-all duration-200 font-sans
                    ${activeFlock === flock.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  <span>{BIRD_EMOJI[flock.bird_type] || '🐔'}</span>
                  <span className="truncate max-w-20">{flock.batch_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 
                          rounded-xl text-xs font-bold border-2 
                          transition-all duration-200 font-sans
                ${activeFilter === f.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-black
                  ${activeFilter === f.id
                    ? 'bg-white text-primary-600'
                    : 'bg-gray-100 text-gray-600'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <CircularProgress size={32} sx={{ color: '#16a34a' }} />
            <p className="text-sm text-gray-400">Loading vaccines...</p>
          </div>
        ) : activeFlocks.length === 0 ? (
          <div className="card p-10 text-center border-2 border-dashed 
                          border-gray-200 animate-fade-in">
            <div className="text-5xl mb-3">💉</div>
            <p className="font-bold text-gray-500">No active flocks</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">
              Add a flock to see its vaccination schedule
            </p>
            <button
              onClick={() => navigate('addFlock')}
              className="inline-flex items-center gap-2 px-5 py-2.5 
                         bg-primary-600 text-white font-bold rounded-2xl 
                         text-sm border-none cursor-pointer font-sans"
            >
              + Add First Flock
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="card p-10 text-center border-2 border-dashed 
                          border-gray-200 animate-fade-in">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold text-gray-500">
              No vaccines in this filter
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try a different filter above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((vaccine, i) => (
              <div
                key={vaccine.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <VaccineCard
                  vaccine={vaccine}
                  flockName={vaccine.flockName}
                  birdType={vaccine.birdType}
                  onMark={handleMark}
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 
                          rounded-2xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t 
                      border-gray-100 shadow-lg flex z-50">
        {[
          { icon: <Agriculture />, label: 'Flocks',   active: false, action: () => navigate('dashboard') },
          { icon: <Vaccines />,    label: 'Vaccines', active: true,  action: () => {} },
          { icon: <Assessment />,  label: 'Reports',  active: false, action: () => navigate('reportsLanding') },
          { icon: <Person />,      label: 'Profile',  active: false, action: () => navigate('profile') },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className={`flex-1 flex flex-col items-center gap-1 py-3 
                        transition-colors
              ${item.active
                ? 'text-primary-600'
                : 'text-gray-400 hover:text-gray-600'}`}
          >
            {item.icon}
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}