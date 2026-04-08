import { useState, useEffect, useCallback } from 'react';
import driversApi from '../services/driversApi';
import toast from 'react-hot-toast';

export default function useDrivers(initialParams = {}) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driversApi.getAll(params);
      setDrivers(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await driversApi.getAlerts();
      setAlerts(res.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createDriver = async (data) => {
    const result = await driversApi.create(data);
    toast.success('Driver created');
    fetchDrivers();
    fetchAlerts();
    return result;
  };

  const updateDriver = async (id, data) => {
    const result = await driversApi.update(id, data);
    toast.success('Driver updated');
    fetchDrivers();
    fetchAlerts();
    return result;
  };

  const deleteDriver = async (id) => {
    await driversApi.delete(id);
    toast.success('Driver deactivated');
    fetchDrivers();
  };

  return { drivers, loading, total, alerts, params, setParams, fetchDrivers, createDriver, updateDriver, deleteDriver };
}
