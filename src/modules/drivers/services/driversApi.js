import api from '../../../shared/services/api';

const driversApi = {
  getAll: (params) => api.get('/drivers', { params }),
  getAvailable: () => api.get('/drivers/available'),
  getAlerts: () => api.get('/drivers/alerts'),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  getTrips: (id, params) => api.get(`/drivers/${id}/trips`, { params }),
  getSettlements: (id, params) => api.get(`/drivers/${id}/settlements`, { params }),
  getPalletRates: () => api.get('/drivers/pallet-rates'),
  updatePalletRates: (data) => api.put('/drivers/pallet-rates', data),
};

export default driversApi;
