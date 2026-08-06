import api from './api'

export const getFlocks = () =>
  api.get('/flocks/')

export const createFlock = (data) =>
  api.post('/flocks/', data)

export const getFlockById = (id) =>
  api.get(`/flocks/${id}/`)

export const updateFlock = (id, data) =>
  api.put(`/flocks/${id}/`, data)

export const deleteFlock = (id) =>
  api.delete(`/flocks/${id}/`)

export const harvestFlock = (id) =>
  api.post(`/flocks/${id}/harvest/`)