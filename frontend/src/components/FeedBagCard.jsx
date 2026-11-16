import { useState, useEffect, useCallback } from 'react'
import { getFeedBags, openFeedBag, finishFeedBag } from '../services/logService'

const today = () => new Date().toISOString().split('T')[0]

function readPrefs() {
  try { return JSON.parse(localStorage.getItem('feedBagPrefs')) || {} }
  catch { return {} }
}

function savePrefs(size, price) {
  try {
    localStorage.setItem('feedBagPrefs', JSON.stringify({
      ...readPrefs(), bag_size_kg: size, bag_price: price,
    }))
  } catch { /* storage unavailable, ignore */ }
}

function errText(err) {
  const d = err.response?.data
  if (!d) return 'Could not reach the server.'
  if (d.error) return d.error
  const first = Object.values(d)[0]
  return Array.isArray(first) ? first[0] : 'Something went wrong. Try again.'
}

export default function FeedBagCard({ flockId, onChange, feedLogs = [] }) {
  const [data, setData] = useState(null)
  const [mode, setMode] = useState(null) // null | 'open' | 'finish'
  const [size, setSize] = useState(readPrefs().bag_size_kg || '25')
  const [price, setPrice] = useState(readPrefs().bag_price || '')
  const [finishDate, setFinishDate] = useState(today())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await getFeedBags(flockId)
      setData(res.data)
    } catch {
      setError('Could not load feed bags')
    }
  }, [flockId])

  useEffect(() => { load() }, [load])

  const startBag = async () => {
    if (!parseFloat(size)) { setError('Enter the bag size'); return }
    setBusy(true)
    setError('')
    try {
      await openFeedBag(flockId, {
        bag_size_kg: parseFloat(size),
        price_naira: parseFloat(price) || 0,
      })
      savePrefs(size, price)
      setMode(null)
      await load()
      onChange?.()
    } catch (err) {
      setError(errText(err))
    } finally {
      setBusy(false)
    }
  }

  const finishBag = async (openNext) => {
    const bag = data.open_bag
    setBusy(true)
    setError('')
    try {
      await finishFeedBag(flockId, bag.id, { finished_on: finishDate })
      if (openNext) {
        await openFeedBag(flockId, {
          bag_size_kg: parseFloat(bag.bag_size_kg),
          price_naira: parseFloat(bag.price_naira) || 0,
          feed_type: bag.feed_type,
          opened_on: finishDate,
        })
      }
      setMode(null)
      await load()
      onChange?.()
    } catch (err) {
      setError(errText(err))
    } finally {
      setBusy(false)
    }
  }

  if (!data) return null
  const bag = data.open_bag
  const s = data.summary

  // Feed she logged herself during this bag (shown before she confirms)
  const ownLogs = bag
    ? feedLogs.filter(l => !l.is_estimate && l.date >= bag.opened_on && l.date <= finishDate)
    : []
  const ownKg = ownLogs.reduce((sum, l) => sum + parseFloat(l.quantity_kg), 0)
  const ownDays = new Set(ownLogs.map(l => l.date)).size
  const totalDays = bag
    ? Math.max(1, Math.round((new Date(finishDate) - new Date(bag.opened_on)) / 86400000) + 1)
    : 0
  const otherDays = totalDays - ownDays
  const leftKg = bag ? Math.max(0, parseFloat(bag.bag_size_kg) - ownKg) : 0
  const round2 = n => Math.round(n * 100) / 100

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-gray-900 text-sm">🌾 Feed Bag</h3>
        {bag && (
          <span className="badge bg-amber-50 text-amber-700 border-amber-200 text-xs">
            Day {bag.days_used}
          </span>
        )}
      </div>

      {bag ? (
        <p className="text-sm text-gray-600 mb-4">
          Current bag: {parseFloat(bag.bag_size_kg)} kg, opened{' '}
          {new Date(bag.opened_on + 'T00:00:00').toLocaleDateString('en-NG', {
            day: 'numeric', month: 'short',
          })}
          <span className="block text-xs text-gray-400 mt-1">
            Feed for this bag is worked out when you tap Bag finished, so you
            don't need to log it every day.
          </span>
        </p>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          No bag open. Tap below when you start a new bag.
        </p>
      )}

      {s && (
        <div className="bg-amber-50 rounded-2xl p-4 mb-4 text-sm text-amber-900">
          <p className="font-bold">
            A bag lasts about {s.avg_days} days
          </p>
          <p className="text-xs mt-1">
            ~{s.avg_kg_per_day} kg/day · ₦{Math.round(s.avg_cost_per_day).toLocaleString()}/day
            {s.avg_grams_per_bird_per_day && ` · ~${s.avg_grams_per_bird_per_day} g per bird/day`}
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mb-3">⚠️ {error}</p>}

      {/* Open a new bag */}
      {!bag && mode !== 'open' && (
        <button className="btn-primary" onClick={() => { setMode('open'); setError('') }}>
          Opened a new bag
        </button>
      )}
      {!bag && mode === 'open' && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Bag size (kg)
              </label>
              <input
                className="input-field"
                type="number"
                value={size}
                onChange={e => setSize(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Price (₦)
              </label>
              <input
                className="input-field"
                type="number"
                placeholder="optional"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min={0}
              />
            </div>
          </div>
          <button className="btn-primary mb-2" onClick={startBag} disabled={busy}>
            {busy ? 'Saving...' : 'Start bag'}
          </button>
          <button className="btn-ghost" onClick={() => { setMode(null); setError('') }}>
            Cancel
          </button>
        </div>
      )}

      {/* Finish the current bag */}
      {bag && mode !== 'finish' && (
        <button className="btn-primary" onClick={() => { setMode('finish'); setError('') }}>
          Bag finished ✓
        </button>
      )}
      {bag && mode === 'finish' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Finished on
          </label>
          <input
            className="input-field mb-3"
            type="date"
            value={finishDate}
            min={bag.opened_on}
            onChange={e => setFinishDate(e.target.value)}
          />
          {ownLogs.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-3
                            text-xs text-blue-900 leading-relaxed">
              {leftKg > 0 && otherDays > 0 ? (
                <>
                  You also logged {round2(ownKg)} kg yourself on {ownDays}{' '}
                  {ownDays === 1 ? 'day' : 'days'} during this bag. Those entries stay
                  exactly as you entered them. The remaining {round2(leftKg)} kg will be
                  shared evenly across the other {otherDays}{' '}
                  {otherDays === 1 ? 'day' : 'days'}, so those days may look lighter.
                </>
              ) : (
                <>
                  You've already logged feed yourself for this whole bag, so no
                  estimated days will be added.
                </>
              )}
            </div>
          )}
          <button
            className="btn-primary mb-2"
            onClick={() => finishBag(true)}
            disabled={busy}
          >
            {busy ? 'Saving...' : 'Finished, open a new bag'}
          </button>
          <button
            className="btn-ghost mb-2"
            onClick={() => finishBag(false)}
            disabled={busy}
          >
            Finished, no new bag yet
          </button>
          <button className="btn-ghost" onClick={() => { setMode(null); setError('') }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}