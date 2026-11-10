import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { setPasswordRequest } from '../services/authService'

export default function SetPasswordCard() {
  const { farmer, refreshFarmerProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [confirm, setConfirm] = useState('')

  const hasPassword = !!farmer?.has_password

  const save = async () => {
    if (next !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await setPasswordRequest(next, current)
      await refreshFarmerProfile()
      setDone(true)
      setOpen(false)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 mb-5 animate-slide-up">
      <h3 className="font-black text-gray-900 text-sm mb-1">
        {hasPassword ? 'Password' : 'Sign in with a password'}
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        {hasPassword
          ? 'You can sign in with your phone number and password.'
          : 'Add a password so you can sign in without waiting for an OTP.'}
      </p>

      {done && !open && (
        <p className="text-xs font-bold text-primary-700 mb-3">✓ Password saved</p>
      )}

      {!open ? (
        <button
          className="btn-ghost"
          onClick={() => { setOpen(true); setDone(false) }}
        >
          {hasPassword ? 'Change password' : 'Set a password'}
        </button>
      ) : (
        <div>
          {hasPassword && (
            <input
              type="password"
              placeholder="Current password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              autoComplete="current-password"
              className="w-full py-3 px-4 mb-3 border-2 border-gray-200 rounded-2xl
                         bg-gray-50 text-sm outline-none focus:border-primary-500"
            />
          )}
          <input
            type="password"
            placeholder="New password (8+ characters)"
            value={next}
            onChange={e => setNext(e.target.value)}
            autoComplete="new-password"
            className="w-full py-3 px-4 mb-3 border-2 border-gray-200 rounded-2xl
                       bg-gray-50 text-sm outline-none focus:border-primary-500"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full py-3 px-4 mb-3 border-2 border-gray-200 rounded-2xl
                       bg-gray-50 text-sm outline-none focus:border-primary-500"
          />
          {error && (
            <p className="text-xs text-red-600 mb-3">⚠️ {error}</p>
          )}
          <button className="btn-primary mb-2" onClick={save} disabled={loading || !next || !confirm}>
            {loading ? 'Saving...' : 'Save password'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => { setOpen(false); setError(''); setConfirm('') }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}