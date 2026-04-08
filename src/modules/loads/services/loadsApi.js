import api from '../../../shared/services/api';

const loadsApi = {
  getAll: (params) => api.get('/loads', { params }),
  getById: (id) => api.get(`/loads/${id}`),
  create: (data) => api.post('/loads', data),
  update: (id, data) => api.put(`/loads/${id}`, data),
  delete: (id) => api.delete(`/loads/${id}`),
  clone: (id) => api.post(`/loads/${id}/clone`),
  updateStatus: (id, status) => api.put(`/loads/${id}/status`, { status }),
  searchAddress: (q) => api.get('/loads/address-search', { params: { q } }),
};

export default loadsApi;
