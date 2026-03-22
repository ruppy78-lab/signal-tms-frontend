import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tms_user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('tms_token', data.data.token);
      localStorage.setItem('tms_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => roles.includes(user?.role), [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
