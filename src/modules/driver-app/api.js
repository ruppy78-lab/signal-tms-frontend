const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('driver_token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const json = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const driverApi = {
  login: (phone_number, pin) =>
    fetch(`${BASE}/driver/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ phone_number, pin }) }).then(json),
  me: () =>
    fetch(`${BASE}/driver/me`, { headers: headers() }).then(json),
  loads: () =>
    fetch(`${BASE}/driver/loads`, { headers: headers() }).then(json),
  loadDetail: (id) =>
    fetch(`${BASE}/driver/loads/${id}`, { headers: headers() }).then(json),
  addEvent: (id, data) =>
    fetch(`${BASE}/driver/loads/${id}/events`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(json),
  savePOD: (id, formData) =>
    fetch(`${BASE}/driver/loads/${id}/pod`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData }).then(json),
  uploadPhoto: (id, formData) =>
    fetch(`${BASE}/driver/loads/${id}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData }).then(json),
  getMessages: (loadId) =>
    fetch(`${BASE}/driver/messages/${loadId}`, { headers: headers() }).then(json),
  sendMessage: (loadId, message) =>
    fetch(`${BASE}/driver/messages/${loadId}`, { method: 'POST', headers: headers(), body: JSON.stringify({ message }) }).then(json),
};
