import api from '../../../shared/services/api';

const carriersApi = {
  getAll: (params) => api.get('/carriers', { params }),
  getById: (id) => api.get(`/carriers/${id}`),
  create: (data) => api.post('/carriers', data),
  update: (id, data) => api.put(`/carriers/${id}`, data),
  delete: (id) => api.delete(`/carriers/${id}`),
  getLoadHistory: (id, params) => api.get(`/carriers/${id}/loads`, { params }),
  getDocuments: (id) => api.get(`/carriers/${id}/documents`),
  sendTender: (id, data) => api.post(`/carriers/${id}/tender`, data),
  getPayables: (params) => api.get('/carriers/payables', { params }),
  payCarrier: (id, data) => api.post(`/carriers/${id}/pay`, data),
};

export default carriersApi;
