 import { Agriculture, Vaccines, Assessment, Person } from '@mui/icons-material'

const TABS = [
  { key: 'dashboard',           icon: <Agriculture />, label: 'Flocks',   target: 'dashboard' },
  { key: 'vaccinationCalendar', icon: <Vaccines />,    label: 'Vaccines', target: 'vaccinationCalendar' },
  { key: 'reportsLanding',      icon: <Assessment />,  label: 'Reports',  target: 'reportsLanding' },
  { key: 'profile',             icon: <Person />,      label: 'Profile',  target: 'profile' },
]

export default function BottomNav({ active, navigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 
                    shadow-lg flex z-50">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => navigate(tab.target)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 
                      transition-colors
            ${active === tab.key
              ? 'text-primary-600'
              : 'text-gray-400 hover:text-gray-600'}`}
        >
          {tab.icon}
          <span className="text-xs font-bold">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}