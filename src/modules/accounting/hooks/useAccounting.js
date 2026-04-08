import { useState, useEffect, useCallback } from 'react';
import accountingApi from '../services/accountingApi';
import toast from 'react-hot-toast';

export function useCarrierPayables() {
  const [payables, setPayables] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountingApi.getCarrierPayables();
      setPayables(res.data || res.payables || []);
      setSummary(res.summary || {});
    } catch { toast.error('Failed to load carrier payables'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const payCarrier = async (id, data) => {
    await accountingApi.payCarrier(id, data);
    toast.success('Payment recorded');
    fetch();
  };

  return { payables, summary, loading, fetch, payCarrier };
}

export function useExpenses(initialParams = {}) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetch = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await accountingApi.getExpenses(p || params);
      setExpenses(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { fetch(); }, [fetch]);

  const createExpense = async (data) => {
    await accountingApi.createExpense(data);
    toast.success('Expense created');
    fetch();
  };

  return { expenses, loading, total, params, setParams, fetch, createExpense };
}

function getDateRange(period, dateFrom, dateTo) {
  const now = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (period === 'custom' && dateFrom && dateTo) return { date_from: dateFrom, date_to: dateTo };
  if (period === 'week') {
    const start = new Date(now); start.setDate(start.getDate() - start.getDay());
    return { date_from: fmt(start), date_to: fmt(now) };
  }
  if (period === 'quarter') {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return { date_from: fmt(qStart), date_to: fmt(now) };
  }
  // default: month
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { date_from: fmt(mStart), date_to: fmt(now) };
}

export function useProfitLoss(initialParams = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ period: 'month', ...initialParams });

  const fetch = useCallback(async (p) => {
    setLoading(true);
    try {
      const curr = p || params;
      const range = getDateRange(curr.period, curr.dateFrom, curr.dateTo);
      const res = await accountingApi.getProfitLoss(range);
      setData(res);
    } catch { toast.error('Failed to load P&L data'); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, params, setParams, fetch };
}
