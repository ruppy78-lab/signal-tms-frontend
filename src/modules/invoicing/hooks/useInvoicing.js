import { useState, useEffect, useCallback } from 'react';
import invoicingApi from '../services/invoicingApi';
import toast from 'react-hot-toast';

export default function useInvoicing(initialParams = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetchInvoices = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await invoicingApi.getInvoices(p || params);
      setInvoices(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const createInvoice = async (data) => {
    const res = await invoicingApi.createInvoice(data);
    toast.success('Invoice created');
    fetchInvoices();
    return res;
  };

  const updateInvoice = async (id, data) => {
    const res = await invoicingApi.updateInvoice(id, data);
    toast.success('Invoice updated');
    fetchInvoices();
    return res;
  };

  const sendInvoice = async (id) => {
    await invoicingApi.sendInvoice(id);
    toast.success('Invoice sent');
    fetchInvoices();
  };

  const recordPayment = async (id, data) => {
    await invoicingApi.recordPayment(id, data);
    toast.success('Payment recorded');
    fetchInvoices();
  };

  const voidInvoice = async (id) => {
    await invoicingApi.voidInvoice(id);
    toast.success('Invoice voided');
    fetchInvoices();
  };

  return {
    invoices, loading, total, params, setParams, fetchInvoices,
    createInvoice, updateInvoice, sendInvoice, recordPayment, voidInvoice,
  };
}
