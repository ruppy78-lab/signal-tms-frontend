import api from '../../../shared/services/api';

const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),

  // Loads & Invoices
  getLoads: (id, params) => api.get(`/customers/${id}/loads`, { params }),
  getInvoices: (id, params) => api.get(`/customers/${id}/invoices`, { params }),

  // Contacts
  getContacts: (id) => api.get(`/customers/${id}/contacts`),
  addContact: (id, data) => api.post(`/customers/${id}/contacts`, data),
  updateContact: (id, contactId, data) => api.put(`/customers/${id}/contacts/${contactId}`, data),
  deleteContact: (id, contactId) => api.delete(`/customers/${id}/contacts/${contactId}`),

  // Notes
  getNotes: (id) => api.get(`/customers/${id}/notes`),
  addNote: (id, note) => api.post(`/customers/${id}/notes`, { note }),

  // Credit
  getBalance: (id) => api.get(`/customers/${id}/balance`),
  getCreditAlerts: () => api.get('/customers/credit-alerts'),

  // Documents
  getDocuments: (id) => api.get(`/customers/${id}/documents`),

  // Portal
  setPortalAccess: (id, data) => api.put(`/customers/${id}/portal`, data),
};

export default customersApi;
