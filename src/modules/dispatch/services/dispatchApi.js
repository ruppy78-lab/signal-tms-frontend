import api from '../../../shared/services/api';

const dispatchApi = {
  // Board
  getBoard: () => api.get('/dispatch/board'),
  getHistory: (params) => api.get('/dispatch/history', { params }),

  // Trips CRUD
  createTrip: (data) => api.post('/dispatch/trips', data),
  getTrip: (id) => api.get(`/dispatch/trips/${id}`),
  updateTrip: (id, data) => api.put(`/dispatch/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/dispatch/trips/${id}`),
  updateTripStatus: (id, status) => api.put(`/dispatch/trips/${id}/status`, { status }),

  // Trip loads
  addLoadsToTrip: (id, loadIds, tripType) =>
    api.post(`/dispatch/trips/${id}/loads`, { load_ids: loadIds, tripType }),
  removeLoadFromTrip: (id, loadId) =>
    api.delete(`/dispatch/trips/${id}/loads/${loadId}`),

  // Leg status
  updateLegStatus: (tripId, legId, status) =>
    api.put(`/dispatch/trips/${tripId}/legs/${legId}/status`, { status }),
  reverseLoadAction: (tripId, loadId) =>
    api.put(`/dispatch/trips/${tripId}/loads/${loadId}/reverse`),

  // Route management
  reorderStops: (id, stopIds) =>
    api.put(`/dispatch/trips/${id}/reorder`, { stop_order: stopIds }),
  optimizeRoute: (id) => api.post(`/dispatch/trips/${id}/optimize`),

  // Notifications & activity
  notifyDriver: (id) => api.post(`/dispatch/trips/${id}/notify`),
  getTripActivity: (id) => api.get(`/dispatch/trips/${id}/activity`),
};

export default dispatchApi;
