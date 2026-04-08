import { useState, useEffect, useCallback } from 'react';
import locationsApi from '../services/locationsApi';
import toast from 'react-hot-toast';

export default function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ page: 1, limit: 50, search: '' });

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await locationsApi.getLocations(params);
      setLocations(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const createLocation = async (data) => {
    try {
      await locationsApi.createLocation(data);
      toast.success('Location created');
      fetchLocations();
    } catch (e) {
      toast.error(e.message || 'Failed to create location');
    }
  };

  const updateLocation = async (id, data) => {
    try {
      await locationsApi.updateLocation(id, data);
      toast.success('Location updated');
      fetchLocations();
    } catch (e) {
      toast.error(e.message || 'Failed to update location');
    }
  };

  const deleteLocation = async (id) => {
    try {
      await locationsApi.deleteLocation(id);
      toast.success('Location deleted');
      fetchLocations();
    } catch (e) {
      toast.error(e.message || 'Failed to delete location');
    }
  };

  return { locations, loading, total, params, setParams, createLocation, updateLocation, deleteLocation };
}
