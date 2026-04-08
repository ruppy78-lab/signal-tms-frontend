import { useState, useEffect, useCallback } from 'react';
import settlementsApi from '../services/settlementsApi';
import toast from 'react-hot-toast';

export default function useSettlements(initialParams = {}) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetchSettlements = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await settlementsApi.getSettlements(p || params);
      setSettlements(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const createSettlement = async (data) => {
    const res = await settlementsApi.createSettlement(data);
    toast.success('Settlement created');
    fetchSettlements();
    return res;
  };

  const updateSettlement = async (id, data) => {
    const res = await settlementsApi.updateSettlement(id, data);
    toast.success('Settlement updated');
    fetchSettlements();
    return res;
  };

  const approveSettlement = async (id) => {
    await settlementsApi.approveSettlement(id);
    toast.success('Settlement approved');
    fetchSettlements();
  };

  const paySettlement = async (id) => {
    await settlementsApi.paySettlement(id);
    toast.success('Settlement paid');
    fetchSettlements();
  };

  return {
    settlements, loading, total, params, setParams, fetchSettlements,
    createSettlement, updateSettlement, approveSettlement, paySettlement,
  };
}
