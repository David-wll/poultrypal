import api from './api'

export const getFeedLogs = (flockId) =>
  api.get(`/logs/${flockId}/feed/`)

export const logFeed = (flockId, data) =>
  api.post(`/logs/${flockId}/feed/`, data)

export const getMortalityLogs = (flockId) =>
  api.get(`/logs/${flockId}/mortality/`)

export const logMortality = (flockId, data) =>
  api.post(`/logs/${flockId}/mortality/`, data)

export const getEggLogs = (flockId) =>
  api.get(`/logs/${flockId}/eggs/`)

export const logEggs = (flockId, data) =>
  api.post(`/logs/${flockId}/eggs/`, data)

export const getExpenseLogs = (flockId) =>
  api.get(`/logs/${flockId}/expenses/`)

export const logExpense = (flockId, data) =>
  api.post(`/logs/${flockId}/expenses/`, data)