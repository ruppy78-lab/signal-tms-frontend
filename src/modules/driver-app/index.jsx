import React, { useState, useEffect, useCallback } from 'react';
import Login from './Login';
import LoadList from './LoadList';
import LoadDetail from './LoadDetail';
import { driverApi } from './api';

export default function DriverApp() {
  const [driver, setDriver] = useState(null);
  const [loads, setLoads] = useState([]);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLoads = useCallback(async () => {
    try {
      const res = await driverApi.loads();
      setLoads(res.data || []);
    } catch { /* session expired */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    const info = localStorage.getItem('driver_info');
    if (token && info) {
      setDriver(JSON.parse(info));
      fetchLoads();
    }
    setLoading(false);
  }, [fetchLoads]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!driver) return;
    const interval = setInterval(fetchLoads, 60000);
    return () => clearInterval(interval);
  }, [driver, fetchLoads]);

  // Register service worker for push notifications
  useEffect(() => {
    if (!driver) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, [driver]);

  const handleLogin = (d) => {
    setDriver(d);
    fetchLoads();
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_info');
    setDriver(null);
    setLoads([]);
    setSelectedLoad(null);
  };

  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#003865',color:'#fff' }}>Loading...</div>;

  if (!driver) return <Login onLogin={handleLogin} />;

  if (selectedLoad) return <LoadDetail loadId={selectedLoad.id} onBack={() => { setSelectedLoad(null); fetchLoads(); }} />;

  return <LoadList loads={loads} onSelect={setSelectedLoad} driver={driver} onLogout={handleLogout} />;
}
