import { useState, useEffect, useCallback } from 'react';
import customersApi from '../services/customersApi';
import toast from 'react-hot-toast';

export default function useCustomers(initialParams = {}) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ page: 1, limit: 50, ...initialParams });

  const fetchCustomers = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await customersApi.getAll(p || params);
      setCustomers(res.data || []);
      setTotal(res.pagination?.total || res.total || 0);
    } catch (e) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const createCustomer = async (data) => {
    const res = await customersApi.create(data);
    toast.success('Customer created');
    fetchCustomers();
    return res;
  };

  const updateCustomer = async (id, data) => {
    const res = await customersApi.update(id, data);
    toast.success('Customer updated');
    fetchCustomers();
    return res;
  };

  const deleteCustomer = async (id) => {
    await customersApi.delete(id);
    toast.success('Customer deactivated');
    fetchCustomers();
  };

  const fetchBalance = async (id) => {
    const res = await customersApi.getBalance(id);
    return res.data || res;
  };

  const checkCreditLimit = async (customerId) => {
    const balance = await fetchBalance(customerId);
    return balance;
  };

  const fetchCreditAlerts = async () => {
    const res = await customersApi.getCreditAlerts();
    return res.data || [];
  };

  return {
    customers, loading, total, params, setParams,
    fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
    fetchBalance, checkCreditLimit, fetchCreditAlerts,
  };
}
