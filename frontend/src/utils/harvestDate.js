export const GROW_OUT_DAYS = {
  broiler: 42,
  cockerel: 84,
  layer: 154,
  turkey: 112,
  duck: 56,
}

export function calculateHarvestDate(birdType, arrivalDate) {
  const days = GROW_OUT_DAYS[birdType?.toLowerCase()] || 42
  const d = new Date(arrivalDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function daysRemaining(harvestDate) {
  const diff = new Date(harvestDate) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function daysAlive(arrivalDate) {
  const diff = new Date() - new Date(arrivalDate)
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}