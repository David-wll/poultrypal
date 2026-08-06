import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FlockProvider } from './context/FlockContext'

//pages

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AddFlock from './pages/AddFlock'
import FlockDetail from './pages/FlockDetail'
import LogToday from './pages/LogToday'
import VaccinationCalendar from './pages/VaccinationCalendar'
import Reports from './pages/Reports'
import SetupProfile from './pages/SetupProfile'
import Profile from './pages/Profile'

import { useFlocks } from './context/FlockContext'

function ReportsLanding({ navigate }) {
  const { flocks } = useFlocks()
  const activeFlocks = flocks.filter(f => f.status === 'active')
  const allFlocks = flocks

  const BIRD_EMOJI = {
    broiler: '🐔', layer: '🥚', cockerel: '🐓', turkey: '🦃', duck: '🦆'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 py-4 max-w-2xl mx-auto w-full">
          <h1 className="font-black text-gray-900 text-base">Reports</h1>
          <p className="text-xs text-gray-400">Select a flock to view its report</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">

        {allFlocks.length === 0 ? (
          <div className="card p-10 text-center border-2 border-dashed border-gray-200 mt-4">
            <div className="text-5xl mb-3">📊</div>
            <p className="font-bold text-gray-500">No flocks yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add a flock to start generating reports
            </p>
          </div>
        ) : (
          <>
            {/* Active flocks */}
            {activeFlocks.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-gray-900 text-sm">Active Flocks</h2>
                  <span className="badge bg-primary-50 text-primary-700 
                                   border-primary-200 text-xs">
                    {activeFlocks.length} active
                  </span>
                </div>
                <div className="space-y-3 mb-6">
                  {activeFlocks.map((flock, i) => (
                    <button
                      key={flock.id}
                      onClick={() => navigate('reports', flock.id)}
                      className="w-full card card-hover p-4 flex items-center 
                                 gap-4 text-left animate-slide-up"
                      style={{ animationDelay: `${i * 0.07}s` }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br 
                                      from-primary-50 to-primary-100 border 
                                      border-primary-200 flex items-center 
                                      justify-center text-2xl flex-shrink-0">
                        {BIRD_EMOJI[flock.bird_type] || '🐔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 truncate">
                          {flock.batch_name}
                        </p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {flock.bird_type} · {flock.current_count.toLocaleString()} birds
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="badge bg-primary-50 text-primary-700 
                                         border-primary-200 text-xs">
                          Active
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          View Report →
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Harvested flocks */}
            {allFlocks.filter(f => f.status === 'harvested').length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-gray-900 text-sm">Past Batches</h2>
                  <span className="badge bg-blue-50 text-blue-700 
                                   border-blue-200 text-xs">
                    {allFlocks.filter(f => f.status === 'harvested').length} harvested
                  </span>
                </div>
                <div className="space-y-3">
                  {allFlocks.filter(f => f.status === 'harvested').map((flock, i) => (
                    <button
                      key={flock.id}
                      onClick={() => navigate('reports', flock.id)}
                      className="w-full card card-hover p-4 flex items-center 
                                 gap-4 text-left animate-slide-up"
                      style={{ animationDelay: `${i * 0.07}s` }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border 
                                      border-blue-100 flex items-center 
                                      justify-center text-2xl flex-shrink-0">
                        {BIRD_EMOJI[flock.bird_type] || '🐔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 truncate">
                          {flock.batch_name}
                        </p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {flock.bird_type} · {flock.initial_count.toLocaleString()} birds
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="badge bg-blue-50 text-blue-700 
                                         border-blue-200 text-xs">
                          Harvested
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          View Report →
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 
                      shadow-lg flex z-50">
        {[
          { icon: '🏠', label: 'Flocks',   action: () => navigate('dashboard') },
          { icon: '💉', label: 'Vaccines', action: () => navigate('vaccinationCalendar') },
          { icon: '📊', label: 'Reports',  action: () => {},                              active: true },
          { icon: '👤', label: 'Profile',  action: () => navigate('profile') },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors
              ${item.active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function AppRoutes() {
  const { farmer, refreshFarmerProfile } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [selectedFlockId, setSelectedFlockId] = useState(null)

  // Refresh farmer data from DB on every app load
  useEffect(() => {
    if (farmer) {
      refreshFarmerProfile()
    }
  }, [])

  const navigate = (destination, flockId = null) => {
    setSelectedFlockId(flockId)
    setPage(destination)
  }

  if (!farmer) return <Login onLogin={() => navigate('dashboard')} />

  if (!farmer.farm_name) {
    return <SetupProfile onComplete={() => {
      refreshFarmerProfile()
      navigate('dashboard')
    }} />
  }

  const pages = {
    dashboard: <Dashboard navigate={navigate} />,
    addFlock: <AddFlock navigate={navigate} />,
    flockDetail: <FlockDetail flockId={selectedFlockId} navigate={navigate} />,
    logToday: <LogToday flockId={selectedFlockId} navigate={navigate} />,
    vaccinationCalendar: <VaccinationCalendar navigate={navigate} />,
    reports: <Reports flockId={selectedFlockId} navigate={navigate} />,
    reportsLanding:      <ReportsLanding navigate={navigate} />,
    profile:              <Profile navigate={navigate} />,
  }

  return pages[page] || pages.dashboard
}

export default function App() {
  return (
    <AuthProvider>
      <FlockProvider>
        <AppRoutes />
      </FlockProvider>
    </AuthProvider>
  )
}