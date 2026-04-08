import { useState, useCallback } from 'react';
import dispatchApi from '../services/dispatchApi';
import toast from 'react-hot-toast';

export default function useLegActions(refreshTrip) {
  const [saving, setSaving] = useState(false);

  const updateLegStatus = useCallback(async (tripId, legId, status) => {
    setSaving(true);
    try {
      await dispatchApi.updateLegStatus(tripId, legId, status);
      const label = status.replace(/_/g, ' ');
      toast.success(`Leg ${label}`);
      await refreshTrip(tripId);
    } catch (err) {
      toast.error(err?.message || 'Failed to update leg');
    } finally {
      setSaving(false);
    }
  }, [refreshTrip]);

  const reverseAction = useCallback(async (tripId, loadId) => {
    setSaving(true);
    try {
      await dispatchApi.reverseLoadAction(tripId, loadId);
      toast.success('Action reversed');
      await refreshTrip(tripId);
    } catch (err) {
      toast.error(err?.message || 'Failed to reverse action');
    } finally {
      setSaving(false);
    }
  }, [refreshTrip]);

  return { saving, updateLegStatus, reverseAction };
}
