import { useState, useEffect, useCallback } from 'react';
import fleetApi from '../services/fleetApi';
import toast from 'react-hot-toast';

export default function useFleet(initialParams = {}) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fleetApi.getAll(params);
      setVehicles(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load fleet');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchAlerts = useCallback(async () => {
    try { const res = await fleetApi.getAlerts(); setAlerts(res.data || []); } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createVehicle = async (data) => {
    await fleetApi.create(data);
    toast.success('Vehicle added');
    fetchVehicles(); fetchAlerts();
  };

  const updateVehicle = async (id, data) => {
    await fleetApi.update(id, data);
    toast.success('Vehicle updated');
    fetchVehicles(); fetchAlerts();
  };

  const deleteVehicle = async (id) => {
    await fleetApi.delete(id);
    toast.success('Vehicle deactivated');
    fetchVehicles();
  };

  return { vehicles, loading, total, alerts, params, setParams, fetchVehicles, createVehicle, updateVehicle, deleteVehicle };
}
