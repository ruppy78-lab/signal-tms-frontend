import api from '../../../shared/services/api';

const settlementsApi = {
  getSettlements: (params) => api.get('/settlements', { params }),
  getSettlement: (id) => api.get(`/settlements/${id}`),
  createSettlement: (data) => api.post('/settlements', data),
  updateSettlement: (id, data) => api.put(`/settlements/${id}`, data),
  approveSettlement: (id) => api.put(`/settlements/${id}/approve`),
  paySettlement: (id) => api.put(`/settlements/${id}/pay`),
  getDrivers: () => api.get('/drivers', { params: { limit: 500 } }),
};

export default settlementsApi;
