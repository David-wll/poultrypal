export default function RiskCard({ result }) {
  if (!result) return null

  const { predictions, is_confident, message } = result
  const topLabel = predictions[0]?.label

  return (
    <div className="card p-5 mt-4 animate-slide-down">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🩺</span>
        <p className="font-black text-gray-900 text-sm">Health Risk Assessment</p>
      </div>

      <div className={`rounded-2xl px-4 py-3 mb-4 text-sm font-medium
        ${is_confident
          ? 'bg-blue-50 text-blue-700 border border-blue-100'
          : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
      >
        {is_confident ? 'ℹ️' : '⚠️'} {message}
      </div>

      <div className="space-y-3">
        {predictions.map((pred, i) => (
          <div key={pred.label}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm ${i === 0 ? 'font-black text-gray-900' : 'font-medium text-gray-500'}`}>
                {pred.label}
              </span>
              <span className={`text-sm ${i === 0 ? 'font-black text-primary-600' : 'text-gray-400'}`}>
                {Math.round(pred.probability * 100)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700
                  ${i === 0
                    ? 'bg-gradient-to-r from-primary-600 to-primary-400'
                    : 'bg-gray-300'}`}
                style={{ width: `${pred.probability * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <span className="badge bg-gray-50 text-gray-500 border-gray-200 text-xs">
          Triage estimate for {topLabel} · not a diagnosis
        </span>
      </div>
    </div>
  )
}