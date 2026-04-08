import { useState, useEffect, useCallback } from 'react';
import carriersApi from '../services/carriersApi';
import toast from 'react-hot-toast';

export default function useCarriers(initialParams = {}) {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetchCarriers = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await carriersApi.getAll(p || params);
      setCarriers(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load carriers');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchCarriers(); }, [fetchCarriers]);

  const createCarrier = async (data) => {
    const res = await carriersApi.create(data);
    toast.success('Carrier created');
    fetchCarriers();
    return res;
  };

  const updateCarrier = async (id, data) => {
    const res = await carriersApi.update(id, data);
    toast.success('Carrier updated');
    fetchCarriers();
    return res;
  };

  const deleteCarrier = async (id) => {
    await carriersApi.delete(id);
    toast.success('Carrier deleted');
    fetchCarriers();
  };

  return { carriers, loading, total, params, setParams, fetchCarriers, createCarrier, updateCarrier, deleteCarrier };
}
