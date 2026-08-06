export function calcSurvivalRate(initial, current) {
  if (!initial || initial === 0) return '0%'
  return ((current / initial) * 100).toFixed(1) + '%'
}