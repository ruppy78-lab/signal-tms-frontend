import api from '../../../shared/services/api';

const fleetApi = {
  getAll: (params) => api.get('/fleet', { params }),
  getAvailable: () => api.get('/fleet/available'),
  getAlerts: () => api.get('/fleet/alerts'),
  getById: (id) => api.get(`/fleet/${id}`),
  create: (data) => api.post('/fleet', data),
  update: (id, data) => api.put(`/fleet/${id}`, data),
  delete: (id) => api.delete(`/fleet/${id}`),
  getMaintenance: (id) => api.get(`/fleet/${id}/maintenance`),
  addMaintenance: (id, data) => api.post(`/fleet/${id}/maintenance`, data),
  updateMaintenance: (id, mainId, data) => api.put(`/fleet/${id}/maintenance/${mainId}`, data),
  deleteMaintenance: (id, mainId) => api.delete(`/fleet/${id}/maintenance/${mainId}`),
};

export default fleetApi;
