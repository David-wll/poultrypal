import { useState } from 'react'
import {
  ArrowBack, Edit, Save, Logout,
  Person, Phone, Home, Language,
  LocationOn, Agriculture,
  Vaccines, Assessment,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
  'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT',
  'Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
  'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo',
  'Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
]

const LANGUAGES = [
  { code: 'en',     label: 'English',  flag: '🇬🇧' },
  { code: 'pidgin', label: 'Pidgin',   flag: '🇳🇬' },
  { code: 'yo',     label: 'Yoruba',   flag: '🟢' },
  { code: 'ha',     label: 'Hausa',    flag: '🔵' },
  { code: 'ig',     label: 'Igbo',     flag: '🔴' },
]

export default function Profile({ navigate }) {
  const { farmer, logout, updateFarmerProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: farmer?.full_name || '',
    email: farmer?.email || '',
    farm_name: farmer?.farm_name || '',
    state: farmer?.state || '',
    lga: farmer?.lga || '',
    preferred_language: farmer?.preferred_language || 'en',
  })

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setError('')
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      await updateFarmerProfile(form)
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedLang = LANGUAGES.find(l => l.code === farmer?.preferred_language)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">

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
            <h1 className="font-black text-gray-900 text-base">My Profile</h1>
            <p className="text-xs text-gray-400">Manage your account</p>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm 
                        font-bold transition-all duration-200
              ${editing
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {editing
              ? <><Save sx={{ fontSize: 16 }} /> Save</>
              : <><Edit sx={{ fontSize: 16 }} /> Edit</>
            }
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">

        {/* Success banner */}
        {success && (
          <div className="bg-primary-50 border border-primary-300 rounded-2xl px-4 
                          py-3 mb-5 flex items-center gap-2 animate-slide-down">
            <span>✅</span>
            <span className="text-sm font-bold text-primary-700">
              Profile updated successfully!
            </span>
          </div>
        )}

        {/* Avatar card */}
        <div className="card p-6 mb-5 flex items-center gap-4 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 
                          to-primary-700 flex items-center justify-center 
                          text-3xl font-black text-white shadow-lg shadow-primary-200 
                          flex-shrink-0">
            {farmer?.full_name?.[0]?.toUpperCase() || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-900 truncate">
              {farmer?.full_name || 'Farmer'}
            </h2>
            <p className="text-sm text-primary-600 font-bold">
              {farmer?.farm_name || 'My Farm'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Phone sx={{ fontSize: 13, color: '#9ca3af' }} />
              <span className="text-xs text-gray-400">{farmer?.phone_number}</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-2xl">
            {selectedLang?.flag}
          </div>
        </div>

        {/* Profile details */}
        <div className="card p-5 mb-5 animate-slide-up">
          <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Person sx={{ fontSize: 16, color: '#16a34a' }} />
            Personal Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              {editing ? (
                <input
                  className="input-field"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  placeholder="Your full name"
                />
              ) : (
                <p className="text-sm font-bold text-gray-900 py-2">
                  {farmer?.full_name || '—'}
                </p>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              {editing ? (
                <input
                  className="input-field"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="Optional"
                />
              ) : (
                <p className="text-sm font-bold text-gray-900 py-2">
                  {farmer?.email || '—'}
                </p>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Phone Number
              </label>
              <p className="text-sm font-bold text-gray-900 py-2 flex items-center gap-2">
                {farmer?.phone_number}
                <span className="badge bg-primary-50 text-primary-700 
                                 border-primary-200 text-xs">
                  Verified ✓
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Farm details */}
        <div className="card p-5 mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Agriculture sx={{ fontSize: 16, color: '#16a34a' }} />
            Farm Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Farm Name
              </label>
              {editing ? (
                <input
                  className="input-field"
                  value={form.farm_name}
                  onChange={e => set('farm_name', e.target.value)}
                  placeholder="Your farm name"
                />
              ) : (
                <p className="text-sm font-bold text-gray-900 py-2">
                  {farmer?.farm_name || '—'}
                </p>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                State
              </label>
              {editing ? (
                <select
                  className="input-field"
                  value={form.state}
                  onChange={e => set('state', e.target.value)}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-bold text-gray-900 py-2 flex items-center gap-2">
                  <LocationOn sx={{ fontSize: 14, color: '#9ca3af' }} />
                  {farmer?.state || '—'}
                </p>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                LGA
              </label>
              {editing ? (
                <input
                  className="input-field"
                  value={form.lga}
                  onChange={e => set('lga', e.target.value)}
                  placeholder="Local Government Area"
                />
              ) : (
                <p className="text-sm font-bold text-gray-900 py-2">
                  {farmer?.lga || '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="card p-5 mb-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Language sx={{ fontSize: 16, color: '#16a34a' }} />
            Language Preference
          </h3>

          {editing ? (
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => set('preferred_language', lang.code)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 
                              transition-all duration-200 font-sans text-left
                    ${form.preferred_language === lang.code
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-sm font-bold
                    ${form.preferred_language === lang.code
                      ? 'text-primary-700' : 'text-gray-600'}`}>
                    {lang.label}
                  </span>
                  {form.preferred_language === lang.code && (
                    <span className="ml-auto text-primary-500 text-xs font-black">✓</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1">
              <span className="text-3xl">{selectedLang?.flag}</span>
              <span className="font-bold text-gray-900">{selectedLang?.label}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl 
                          px-4 py-3 text-sm mb-5 animate-slide-down">
            ⚠️ {error}
          </div>
        )}

        {/* Sign out */}
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-black text-gray-900 text-sm mb-4">Account</h3>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl 
                       border-2 border-red-200 bg-red-50 text-red-600 font-bold 
                       text-sm transition-all duration-200 hover:bg-red-100 
                       active:scale-95 font-sans"
          >
            <Logout sx={{ fontSize: 18 }} />
            Sign Out of PoultryPal
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 
                      shadow-lg flex z-50">
        {[
          { icon: <Agriculture />, label: 'Flocks',   active: false, action: () => navigate('dashboard') },
          { icon: <Vaccines />,    label: 'Vaccines', active: false, action: () => navigate('vaccinationCalendar') },
          { icon: <Assessment />, label: 'Reports',   active: false, action: () => navigate('reportsLanding') },
          { icon: <Person />,      label: 'Profile',  active: true, action: () => navigate('profile') },
          
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors
              ${item.active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {item.icon}
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

