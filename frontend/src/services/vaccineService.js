import api from './api'

export const getVaccineSchedule = (flockId) =>
  api.get(`/vaccines/${flockId}/schedule/`)

export const markAdministered = (vaccineId, data) =>
  api.patch(`/vaccines/${vaccineId}/administer/`, data)

export const rescheduleVaccine = (vaccineId, scheduled_date) =>
  api.patch(`/vaccines/${vaccineId}/reschedule/`, { scheduled_date })

export const getDrugs = (drugType) =>
  api.get('/vaccines/drugs/', { params: drugType ? { drug_type: drugType } : {} })

export const getMedicationLogs = (flockId) =>
  api.get(`/vaccines/${flockId}/medications/`)

export const logMedication = (flockId, data) =>
  api.post(`/vaccines/${flockId}/medications/`, data)