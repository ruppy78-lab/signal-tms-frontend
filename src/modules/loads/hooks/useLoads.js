import { useState, useEffect, useCallback } from 'react';
import loadsApi from '../services/loadsApi';
import toast from 'react-hot-toast';

export default function useLoads(initialParams = {}) {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetchLoads = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await loadsApi.getAll(p || params);
      setLoads(res.data || []);
      setTotal(res.pagination?.total || res.total || 0);
    } catch (e) {
      toast.error('Failed to load loads');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const createLoad = async (data) => {
    const res = await loadsApi.create(data);
    toast.success('Load created');
    fetchLoads();
    return res;
  };

  const updateLoad = async (id, data) => {
    const res = await loadsApi.update(id, data);
    toast.success('Load updated');
    fetchLoads();
    return res;
  };

  const deleteLoad = async (id) => {
    await loadsApi.delete(id);
    toast.success('Load deleted');
    fetchLoads();
  };

  const cloneLoad = async (id) => {
    const res = await loadsApi.clone(id);
    toast.success('Load cloned');
    fetchLoads();
    return res;
  };

  return { loads, loading, total, params, setParams, fetchLoads, createLoad, updateLoad, deleteLoad, cloneLoad };
}
