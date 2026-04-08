import api from '../../../shared/services/api';

const accountingApi = {
  getCarrierPayables: (params) => api.get('/accounting/carrier-payables', { params }),
  payCarrier: (id, data) => api.post(`/carriers/${id}/pay`, data),
  getExpenses: (params) => api.get('/accounting/expenses', { params }),
  createExpense: (data) => api.post('/accounting/expenses', data),
  updateExpense: (id, data) => api.put(`/accounting/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/accounting/expenses/${id}`),
  getProfitLoss: (params) => api.get('/accounting/profit-loss', { params }),
  getSummary: () => api.get('/accounting/summary'),
};

export default accountingApi;
