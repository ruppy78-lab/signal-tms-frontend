import { useState, useCallback } from 'react';
import dispatchApi from '../services/dispatchApi';
import toast from 'react-hot-toast';

export default function useTripActions(refresh, refreshTrip) {
  const [saving, setSaving] = useState(false);

  const withSave = useCallback(async (fn, successMsg) => {
    setSaving(true);
    try {
      const result = await fn();
      toast.success(successMsg || 'Done');
      return result;
    } catch (err) {
      toast.error(err?.message || 'Action failed');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const createTrip = useCallback(async (data) => {
    const trip = await withSave(
      () => dispatchApi.createTrip(data),
      'Trip created'
    );
    await refresh();
    return trip;
  }, [withSave, refresh]);

  const updateTrip = useCallback(async (id, data) => {
    await withSave(
      () => dispatchApi.updateTrip(id, data),
      'Trip updated'
    );
    await refreshTrip(id);
  }, [withSave, refreshTrip]);

  const deleteTrip = useCallback(async (id) => {
    await withSave(
      () => dispatchApi.deleteTrip(id),
      'Trip deleted'
    );
    await refresh();
  }, [withSave, refresh]);

  const updateTripStatus = useCallback(async (id, status) => {
    await withSave(
      () => dispatchApi.updateTripStatus(id, status),
      `Trip ${status}`
    );
    await refreshTrip(id);
  }, [withSave, refreshTrip]);

  const addLoads = useCallback(async (id, loadIds, tripType) => {
    await withSave(
      () => dispatchApi.addLoadsToTrip(id, loadIds, tripType),
      `${loadIds.length} load(s) added`
    );
    await refreshTrip(id);
  }, [withSave, refreshTrip]);

  const removeLoad = useCallback(async (tripId, loadId) => {
    await withSave(
      () => dispatchApi.removeLoadFromTrip(tripId, loadId),
      'Load removed'
    );
    await refreshTrip(tripId);
  }, [withSave, refreshTrip]);

  const notifyDriver = useCallback(async (id) => {
    await withSave(
      () => dispatchApi.notifyDriver(id),
      'Driver notified'
    );
  }, [withSave]);

  const reorderStops = useCallback(async (id, stopIds) => {
    await withSave(
      () => dispatchApi.reorderStops(id, stopIds),
      'Stops reordered'
    );
    await refreshTrip(id);
  }, [withSave, refreshTrip]);

  const optimizeRoute = useCallback(async (id) => {
    await withSave(
      () => dispatchApi.optimizeRoute(id),
      'Route optimized'
    );
    await refreshTrip(id);
  }, [withSave, refreshTrip]);

  return {
    saving, createTrip, updateTrip, deleteTrip,
    updateTripStatus, addLoads, removeLoad,
    notifyDriver, reorderStops, optimizeRoute,
  };
}
