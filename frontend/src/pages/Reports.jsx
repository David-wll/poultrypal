import { useState, useEffect } from 'react'
import {
  ArrowBack, TrendingUp, TrendingDown,
  Agriculture, Assessment, Receipt,
  CheckCircle, Warning, Vaccines, Person,
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import api from '../services/api'
import { calcSurvivalRate } from '../utils/survivalRate'
import BottomNav from '../components/BottomNav'

const BIRD_EMOJI = {
  broiler: '🐔', layer: '🥚', cockerel: '🐓', turkey: '🦃', duck: '🦆'
}

function MetricCard({ label, value, sub, color, bg, icon, delay }) {
  return (
    <div
      className={`${bg} rounded-2xl p-4 animate-slide-up`}
      style={{ animationDelay: delay }}
    >
      <div className={`flex items-center gap-1.5 text-xs font-bold 
                       uppercase tracking-wide mb-2 ${color}`}>
        {icon} {label}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ label, value, displayValue, max, color, bg }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-black text-gray-900">{displayValue}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Reports({ flockId, navigate }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/reports/${flockId}/`)
        setReport(res.data)
      } catch {
        setError('Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    if (flockId) load()
  }, [flockId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={32} sx={{ color: '#16a34a' }} />
          <p className="text-sm text-gray-400">Generating report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500 font-bold mb-2">Could not load report</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const flock         = report.flock
  const isProfit      = report.net_profit >= 0
  const profitColor   = isProfit ? 'text-primary-600' : 'text-red-600'
  const profitBg      = isProfit ? 'bg-primary-50' : 'bg-red-50'
  const survivalNum   = parseFloat(report.survival_rate)

  const TABS = [
    { id: 'summary',  label: 'Summary',  emoji: '📊' },
    { id: 'costs',    label: 'Costs',    emoji: '💰' },
    { id: 'health',   label: 'Health',   emoji: '❤️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto w-full">
          <button
            onClick={() => navigate('flockDetail', flockId)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center 
                       hover:bg-gray-200 transition-colors active:scale-95"
          >
            <ArrowBack sx={{ fontSize: 18, color: '#374151' }} />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-gray-900 text-base">Batch Report</h1>
            <p className="text-xs text-gray-400">{flock?.batch_name}</p>
          </div>
          <span className="text-2xl">
            {BIRD_EMOJI[flock?.bird_type] || '🐔'}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-32">

        {/* Hero P&L card */}
        <div className={`card overflow-hidden mb-5 animate-bounce-in`}>
          <div className={`p-6 text-center
            ${isProfit
              ? 'bg-gradient-to-br from-primary-600 to-primary-800'
              : 'bg-gradient-to-br from-red-500 to-red-700'}`}
          >
            <p className="text-white text-opacity-80 text-sm font-bold mb-1">
              Net Profit / Loss
            </p>
            <p className="text-4xl font-black text-white mb-1">
              {isProfit ? '+' : ''}₦{Math.abs(report.net_profit).toLocaleString()}
            </p>
            <p className="text-white text-opacity-70 text-xs">
              {isProfit ? '🎉 Profitable batch!' : '📉 Loss on this batch'}
            </p>
          </div>

          {/* Revenue vs Expenses */}
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
              <p className="text-lg font-black text-primary-600">
                ₦{parseFloat(report.total_revenue).toLocaleString()}
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Expenses</p>
              <p className="text-lg font-black text-red-600">
                ₦{parseFloat(report.total_expenses).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm 
                          font-bold transition-all duration-200 font-sans
                ${activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Summary Tab ── */}
        {activeTab === 'summary' && (
          <div className="space-y-4 animate-slide-up">

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Birds Sold"
                value={flock?.current_count?.toLocaleString()}
                sub={`of ${flock?.initial_count?.toLocaleString()} initial`}
                color="text-primary-600"
                bg="bg-primary-50"
                icon="🐔"
                delay="0s"
              />
              <MetricCard
                label="Survival Rate"
                value={`${report.survival_rate}%`}
                sub={`${report.total_deaths} deaths`}
                color={survivalNum >= 95 ? 'text-primary-600' : survivalNum >= 85 ? 'text-amber-600' : 'text-red-600'}
                bg={survivalNum >= 95 ? 'bg-primary-50' : survivalNum >= 85 ? 'bg-amber-50' : 'bg-red-50'}
                icon="📈"
                delay="0.05s"
              />
              <MetricCard
                label="Cost per Bird"
                value={`₦${parseFloat(report.cost_per_bird).toLocaleString()}`}
                sub="feed cost only"
                color="text-purple-600"
                bg="bg-purple-50"
                icon="💰"
                delay="0.1s"
              />
              <MetricCard
                label="Feed Cost"
                value={`₦${parseFloat(report.feed_cost).toLocaleString()}`}
                sub="total feed spend"
                color="text-amber-600"
                bg="bg-amber-50"
                icon="🌾"
                delay="0.15s"
              />
            </div>

            {/* Batch info */}
            <div className="card p-5">
              <p className="font-black text-gray-900 text-sm mb-3">Batch Information</p>
              {[
                { label: 'Bird Type',    value: flock?.bird_type,   icon: '🐔' },
                { label: 'Breed',        value: flock?.breed || 'Mixed breed', icon: '🧬' },
                { label: 'Arrival Date', value: flock?.arrival_date ? new Date(flock.arrival_date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: '📅' },
                { label: 'Harvest Date', value: flock?.expected_harvest_date ? new Date(flock.expected_harvest_date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: '🛒' },
                { label: 'Status',       value: flock?.status,      icon: '📌' },
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

        {/* ── Costs Tab ── */}
        {activeTab === 'costs' && (
          <div className="space-y-4 animate-slide-up">

            {/* Cost breakdown */}
            <div className="card p-5">
              <p className="font-black text-gray-900 text-sm mb-4">
                Cost Breakdown
              </p>

              <ProgressBar
                label="Feed Cost"
                value={parseFloat(report.feed_cost)}
                displayValue={`₦${parseFloat(report.feed_cost).toLocaleString()}`}
                max={report.total_expenses}
                color="text-amber-600"
                bg="bg-amber-400"
              />
              <ProgressBar
                label="Medication Cost"
                value={parseFloat(report.medication_cost)}
                displayValue={`₦${parseFloat(report.medication_cost).toLocaleString()}`}
                max={report.total_expenses}
                color="text-teal-600"
                bg="bg-teal-400"
              />
              <ProgressBar
                label="Vaccine Cost"
                value={parseFloat(report.vaccine_cost)}
                displayValue={`₦${parseFloat(report.vaccine_cost).toLocaleString()}`}
                max={report.total_expenses}
                color="text-indigo-600"
                bg="bg-indigo-400"
              />
              <ProgressBar
                label="Other Expenses"
                value={parseFloat(report.other_expenses)}
                displayValue={`₦${parseFloat(report.other_expenses).toLocaleString()}`}
                max={report.total_expenses}
                color="text-purple-600"
                bg="bg-purple-400"
              />

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-900 text-sm">
                    Total Expenses
                  </span>
                  <span className="font-black text-red-600">
                    ₦{parseFloat(report.total_expenses).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="card p-5">
              <p className="font-black text-gray-900 text-sm mb-4">Revenue</p>
              <div className="flex items-center justify-between py-3 
                              border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span>💵</span>
                  <span className="text-sm text-gray-500">Total Revenue</span>
                </div>
                <span className="font-black text-primary-600">
                  ₦{parseFloat(report.total_revenue).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <span>{isProfit ? '📈' : '📉'}</span>
                  <span className="text-sm text-gray-500">Net Profit/Loss</span>
                </div>
                <span className={`font-black text-lg ${profitColor}`}>
                  {isProfit ? '+' : ''}₦{Math.abs(report.net_profit).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Profitability insight */}
            <div className={`${profitBg} border rounded-2xl p-4
              ${isProfit ? 'border-primary-200' : 'border-red-200'}`}
            >
              <p className={`font-black text-sm mb-1 ${profitColor}`}>
                {isProfit ? '🎉 Profitable Batch!' : '⚠️ Loss on this Batch'}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {isProfit
                  ? `You made ₦${report.net_profit.toLocaleString()} profit on this batch. Your cost per bird was ₦${parseFloat(report.cost_per_bird).toFixed(0)}.`
                  : `You lost ₦${Math.abs(report.net_profit).toLocaleString()} on this batch. Consider reducing feed costs or increasing selling price.`
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Health Tab ── */}
        {activeTab === 'health' && (
          <div className="space-y-4 animate-slide-up">

            {/* Survival summary */}
            <div className="card p-5">
              <p className="font-black text-gray-900 text-sm mb-4">
                Flock Health Summary
              </p>

              {/* Big survival rate */}
              <div className="text-center py-4 mb-4">
                <div className={`text-6xl font-black mb-2
                  ${survivalNum >= 95 ? 'text-primary-600' :
                    survivalNum >= 85 ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {report.survival_rate}%
                </div>
                <p className="text-sm text-gray-500">Overall Survival Rate</p>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-1000
                      ${survivalNum >= 95 ? 'bg-gradient-to-r from-primary-500 to-primary-400' :
                        survivalNum >= 85 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                            'bg-gradient-to-r from-red-500 to-red-400'}`}
                    style={{ width: `${survivalNum}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {[
                { label: 'Initial Count',  value: flock?.initial_count?.toLocaleString(), icon: '🐣' },
                { label: 'Current Count',  value: flock?.current_count?.toLocaleString(), icon: '🐔' },
                { label: 'Total Deaths',   value: report.total_deaths, icon: '💀' },
                { label: 'Mortality Rate', value: `${(100 - survivalNum).toFixed(1)}%`, icon: '📉' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 
                                        border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{row.icon}</span>
                    <span className="text-sm text-gray-500">{row.label}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Health rating */}
            <div className={`card p-5 border-2
              ${survivalNum >= 95 ? 'border-primary-200 bg-primary-50' :
                survivalNum >= 85 ? 'border-amber-200 bg-amber-50' :
                                    'border-red-200 bg-red-50'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">
                  {survivalNum >= 95 ? '🏆' : survivalNum >= 85 ? '👍' : '⚠️'}
                </span>
                <div>
                  <p className={`font-black text-sm
                    ${survivalNum >= 95 ? 'text-primary-700' :
                      survivalNum >= 85 ? 'text-amber-700' : 'text-red-700'}`}
                  >
                    {survivalNum >= 95 ? 'Excellent Health' :
                     survivalNum >= 85 ? 'Good Health' : 'Poor Health'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {survivalNum >= 95
                      ? 'Outstanding survival rate — great farm management!'
                      : survivalNum >= 85
                      ? 'Good survival rate — monitor closely going forward.'
                      : 'High mortality rate — review feeding and disease control.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Bottom nav */}
      <BottomNav active="reportsLanding" navigate={navigate} />
    </div>
  )
}