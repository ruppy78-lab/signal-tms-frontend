import api from '../../../shared/services/api';

const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
};

export default authApi;
