import api from '../../../shared/services/api';

const invoicingApi = {
  getInvoices: (params) => api.get('/invoicing', { params }),
  getInvoice: (id) => api.get(`/invoicing/${id}`),
  createInvoice: (data) => api.post('/invoicing', data),
  updateInvoice: (id, data) => api.put(`/invoicing/${id}`, data),
  sendInvoice: (id) => api.put(`/invoicing/${id}/send`),
  payInvoice: (id) => api.put(`/invoicing/${id}/pay`),
  voidInvoice: (id) => api.put(`/invoicing/${id}/void`),
  recordPayment: (id, data) => api.post(`/invoicing/${id}/payment`, data),
  addLineItem: (id, data) => api.post(`/invoicing/${id}/line-items`, data),
  deleteLineItem: (id, itemId) => api.delete(`/invoicing/${id}/line-items/${itemId}`),
  moveToDraft: (id) => api.put(`/invoicing/${id}/draft`),
  getCustomers: () => api.get('/customers', { params: { limit: 500 } }),
  getLoads: (params) => api.get('/loads', { params }),
};

export default invoicingApi;
