import { useState } from 'react'
import { useFlocks } from '../context/FlockContext'
import { useAuth } from '../context/AuthContext'
import {
  Agriculture, Add, Notifications, TrendingUp,
  Warning, CheckCircle, Schedule, Egg,
  Vaccines, Assessment, Logout, Person,
  WaterDrop, Refresh,
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import { formatNaira } from '../utils/formatCurrency'
import { calcSurvivalRate } from '../utils/survivalRate'
import BottomNav from '../components/BottomNav'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDaysRemaining(harvestDate) {
  if (!harvestDate) return 0
  // Parse as local date, not UTC
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

const BIRD_EMOJI = {
  broiler: '🐔', layer: '🥚', cockerel: '🐓', turkey: '🦃', duck: '🦆'
}

function FlockCard({ flock, navigate }) {
  const daysAlive   = getDaysAlive(flock.arrival_date)
  const daysLeft    = getDaysRemaining(flock.expected_harvest_date)
  const survival    = parseFloat(calcSurvivalRate(flock.initial_count, flock.current_count))
  const isReady     = daysLeft <= 0
  const isWarning   = survival < 90
  const totalDays   = daysAlive + Math.max(0, daysLeft)
  const progress    = Math.min(100, (daysAlive / totalDays) * 100)

  return (
    <div
      onClick={() => navigate('flockDetail', flock.id)}
      className={`
        card card-hover p-5 relative overflow-hidden animate-fade-in
        ${isReady   ? 'border-primary-400 ring-2 ring-primary-200' :
          isWarning ? 'border-amber-300' : 'border-gray-100'}
      `}
    >
      {/* Ready banner */}
      {isReady && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r 
                        from-primary-600 to-primary-500 text-white text-xs 
                        font-black text-center py-1.5 tracking-widest animate-pulse">
          🎉 READY FOR MARKET
        </div>
      )}

      <div className={isReady ? 'mt-6' : ''}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 
                            to-primary-100 border border-primary-200 flex items-center 
                            justify-center text-2xl">
              {BIRD_EMOJI[flock.bird_type] || '🐔'}
            </div>
            <div>
              <p className="font-black text-gray-900 text-base leading-tight">
                {flock.batch_name}
              </p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                {flock.bird_type} · {flock.breed || 'Mixed breed'}
              </p>
            </div>
          </div>
          <span className={`badge text-xs
            ${flock.status === 'active'    ? 'bg-primary-50 text-primary-700 border-primary-200' :
              flock.status === 'harvested' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                             'bg-red-50 text-red-700 border-red-200'}
          `}>
            {flock.status}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Day {daysAlive}</span>
            <span className={isReady ? 'text-primary-600 font-bold' : ''}>
              {isReady ? '🎉 Harvest now!' : `${daysLeft} days to harvest`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700
                ${isReady ? 'bg-gradient-to-r from-primary-500 to-primary-400 animate-pulse' :
                            'bg-gradient-to-r from-primary-600 to-primary-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Birds', value: flock.current_count.toLocaleString(), color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'Survival', value: `${survival}%`,
              color: survival >= 95 ? 'text-primary-600' : survival >= 85 ? 'text-amber-600' : 'text-red-600',
              bg: survival >= 95 ? 'bg-primary-50' : survival >= 85 ? 'bg-amber-50' : 'bg-red-50' },
            { label: 'Arrived', value: new Date(flock.arrival_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }), color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-2.5 text-center`}>
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Warning */}
        {isWarning && !isReady && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 
                          rounded-xl px-3 py-2 mb-3">
            <Warning className="text-amber-500" sx={{ fontSize: 14 }} />
            <span className="text-xs text-amber-700 font-medium">
              Mortality above 10% — monitor closely
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); navigate('logToday', flock.id) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 
                       bg-gradient-to-r from-primary-600 to-primary-700 text-white 
                       text-xs font-bold rounded-xl transition-all duration-200 
                       hover:shadow-md hover:shadow-primary-200 active:scale-95"
          >
            <Add sx={{ fontSize: 14 }} /> Log Today
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate('reports', flock.id) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 
                       bg-gray-100 text-gray-700 text-xs font-bold rounded-xl 
                       transition-all duration-200 hover:bg-gray-200 active:scale-95"
          >
            <Assessment sx={{ fontSize: 14 }} /> Reports
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, bg, delay }) {
  return (
    <div
      className="card p-4 flex items-center gap-3 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard({ navigate }) {
  const { farmer, logout } = useAuth()
  const { flocks, loading, fetchFlocks } = useFlocks()
  const [showMenu, setShowMenu] = useState(false)
  const [showFlockPicker, setShowFlockPicker] = useState(false)      // ← add this
  const [showReportPicker, setShowReportPicker] = useState(false)    // ← add this

  const activeFlocks  = flocks.filter(f => f.status === 'active')
  const totalBirds    = activeFlocks.reduce((s, f) => s + f.current_count, 0)
  const readyFlocks   = activeFlocks.filter(f => getDaysRemaining(f.expected_harvest_date) <= 0)
  const avgSurvival   = activeFlocks.length
    ? (activeFlocks.reduce((s, f) => s + (f.current_count / f.initial_count) * 100, 0) / activeFlocks.length).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 
                      shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl">🐔</span>
          <div>
            <p className="font-black text-gray-900 text-base leading-none">PoultryPal</p>
            <p className="text-xs text-primary-600 font-bold">{farmer?.farm_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={fetchFlocks}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center 
                       justify-center hover:bg-gray-200 transition-colors"
          >
            <Refresh sx={{ fontSize: 18, color: '#374151' }} />
          </button>
          <button
            onClick={() => setShowMenu(m => !m)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 
                       to-primary-700 flex items-center justify-center 
                       text-white font-black text-sm shadow-md shadow-primary-200"
          >
            {farmer?.full_name?.[0]?.toUpperCase() || 'F'}
          </button>

          {showMenu && (
            <div className="absolute top-11 right-0 bg-white border border-gray-100 
                            rounded-2xl shadow-xl min-w-48 overflow-hidden z-50 
                            animate-slide-down">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="font-bold text-gray-900 text-sm">{farmer?.full_name}</p>
                <p className="text-xs text-gray-400">{farmer?.phone_number}</p>
              </div>
              <button
                className="flex items-center gap-2.5 px-4 py-3 w-full 
                          text-left text-sm text-gray-700 font-semibold 
                          hover:bg-gray-50 transition-colors font-sans"
                onClick={() => {
                  setShowMenu(false)
                  navigate('profile')
                }}
              >
                <Person sx={{ fontSize: 16 }} /> Profile
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2.5 px-4 py-3 w-full 
                           text-left text-sm text-red-600 font-semibold 
                           hover:bg-red-50 transition-colors"
              >
                <Logout sx={{ fontSize: 16 }} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full pb-24">

        {/* Greeting */}
        <div className="flex items-start justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {getGreeting()}, {farmer?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-NG', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </p>
          </div>
          <button
            onClick={() => navigate('addFlock')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r 
                       from-primary-600 to-primary-700 text-white text-sm font-bold 
                       rounded-2xl shadow-md shadow-primary-200 hover:shadow-lg 
                       hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
          >
            <Add sx={{ fontSize: 18 }} /> New Flock
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard icon={<Agriculture sx={{ fontSize: 20 }} />} label="Active Flocks"  value={activeFlocks.length}            color="text-primary-600" bg="bg-primary-50"  delay="0s" />
          <StatCard icon={<Egg sx={{ fontSize: 20 }} />}         label="Total Birds"    value={totalBirds.toLocaleString()}    color="text-indigo-600"  bg="bg-indigo-50"   delay="0.05s" />
          <StatCard icon={<TrendingUp sx={{ fontSize: 20 }} />}  label="Avg Survival"   value={`${avgSurvival}%`}              color="text-amber-600"   bg="bg-amber-50"    delay="0.1s" />
          <StatCard icon={<CheckCircle sx={{ fontSize: 20 }} />} label="Ready to Sell"  value={readyFlocks.length}             color="text-sky-600"     bg="bg-sky-50"      delay="0.15s" />
        </div>

        {/* Ready alert */}
        {readyFlocks.length > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 border 
                          border-primary-300 rounded-2xl px-4 py-3.5 mb-5 
                          flex items-center gap-3 animate-bounce-in">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center 
                            justify-center flex-shrink-0">
              <CheckCircle sx={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <p className="font-black text-primary-800 text-sm">
                {readyFlocks.length} flock{readyFlocks.length > 1 ? 's' : ''} ready for market!
              </p>
              <p className="text-xs text-primary-600">Tap a flock card to record harvest</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {[
            { icon: <Add />,        label: 'Add Flock', color: 'text-primary-600', bg: 'bg-primary-50', action: () => navigate('addFlock') },
            { icon: <Vaccines />,   label: 'Vaccines',  color: 'text-indigo-600',  bg: 'bg-indigo-50',  action: () => navigate('vaccinationCalendar') },
            { icon: <WaterDrop />, label: 'Log Feed', color: 'text-sky-600', bg: 'bg-sky-50',
            action: () => {
              if (activeFlocks.length === 1) {
                navigate('logToday', activeFlocks[0].id)
              } else if (activeFlocks.length > 1) {
                setShowFlockPicker(true)
              }
            }
            },
            {
              icon: <Assessment />, label: 'Reports',
              color: 'text-amber-600', bg: 'bg-amber-50',
              action: () => navigate('reportsLanding')
            },
          ].map((q, i) => (
            <button
              key={i}
              onClick={q.action}
              className="card flex flex-col items-center gap-2 py-3.5 px-2 
                         hover:shadow-md hover:-translate-y-0.5 transition-all 
                         duration-200 active:scale-95"
            >
              <div className={`w-10 h-10 rounded-xl ${q.bg} ${q.color} 
                               flex items-center justify-center`}>
                {q.icon}
              </div>
              <span className="text-xs font-bold text-gray-600">{q.label}</span>
            </button>
          ))}
        </div>

        {/* Flock list */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Your Flocks</h2>
          <span className="badge bg-primary-50 text-primary-700 border-primary-200">
            {activeFlocks.length} active
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <CircularProgress size={32} sx={{ color: '#16a34a' }} />
            <p className="text-sm text-gray-400">Loading your flocks...</p>
          </div>
        ) : activeFlocks.length === 0 ? (
          <div className="card p-10 text-center border-2 border-dashed border-gray-200 
                          animate-fade-in">
            <div className="text-6xl mb-4 animate-bounce">🐣</div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No flocks yet</h3>
            <p className="text-sm text-gray-400 mb-6">
              Add your first batch of birds to start tracking
            </p>
            <button
              onClick={() => navigate('addFlock')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r 
                         from-primary-600 to-primary-700 text-white font-bold rounded-2xl 
                         shadow-md shadow-primary-200 hover:shadow-lg 
                         hover:-translate-y-0.5 transition-all duration-200"
            >
              <Add sx={{ fontSize: 18 }} /> Add First Flock
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeFlocks.map(flock => (
              <FlockCard key={flock.id} flock={flock} navigate={navigate} />
            ))}
          </div>
        )}

        {/* Past batches */}
        {flocks.filter(f => f.status === 'harvested').length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Past Batches</h2>
              <span className="badge bg-blue-50 text-blue-700 border-blue-200">
                {flocks.filter(f => f.status === 'harvested').length} harvested
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flocks.filter(f => f.status === 'harvested').map(flock => (
                <FlockCard key={flock.id} flock={flock} navigate={navigate} />
              ))}
            </div>
          </div>
        )}
      </div>



      {/* Bottom nav */}
      <BottomNav active="dashboard" navigate={navigate} />

      {/* Flock picker modal for Log Feed */}
      {showFlockPicker && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 
                    flex items-end justify-center animate-fade-in"
          onClick={() => setShowFlockPicker(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-gray-900 text-lg mb-4">
              Which flock are you logging for?
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeFlocks.map(flock => (
                <button
                  key={flock.id}
                  onClick={() => {
                    setShowFlockPicker(false)
                    navigate('logToday', flock.id)
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl 
                            border-2 border-gray-200 hover:border-primary-400 
                            hover:bg-primary-50 transition-all duration-200 
                            font-sans text-left"
                >
                  <span className="text-2xl">
                    {{'broiler':'🐔','layer':'🥚','cockerel':'🐓',
                      'turkey':'🦃','duck':'🦆'}[flock.bird_type] || '🐔'}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      {flock.batch_name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {flock.bird_type} · {flock.current_count} birds
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFlockPicker(false)}
              className="btn-ghost mt-4 py-3"
            >
              Cancel
            </button>
        </div>
      </div>
    )}
    </div>
  )
}