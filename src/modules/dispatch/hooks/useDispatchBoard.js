import { useState, useEffect, useCallback, useRef } from 'react';
import dispatchApi from '../services/dispatchApi';
import toast from 'react-hot-toast';

const REFRESH_INTERVAL = 30000;

export default function useDispatchBoard() {
  const [board, setBoard] = useState({
    available: [], onDock: [], enroute: [], trips: [], stats: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('board');
  const intervalRef = useRef(null);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await dispatchApi.getBoard();
      const data = res.data || res;
      setBoard({
        available: data.available || [],
        onDock: data.onDock || data.on_dock || [],
        enroute: data.enroute || [],
        trips: data.trips || [],
        stats: data.stats || {},
      });
    } catch (err) {
      console.error('Board fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchBoard();
  }, [fetchBoard]);

  const refreshTrip = useCallback(async (tripId) => {
    try {
      const res = await dispatchApi.getTrip(tripId);
      setSelectedTrip(res.data || res);
    } catch (err) {
      toast.error('Failed to refresh trip');
    }
    await fetchBoard();
  }, [fetchBoard]);

  const selectTrip = useCallback(async (trip) => {
    if (!trip) { setSelectedTrip(null); return; }
    try {
      const res = await dispatchApi.getTrip(trip.id);
      setSelectedTrip(res.data || res);
    } catch {
      setSelectedTrip(trip);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
    intervalRef.current = setInterval(fetchBoard, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchBoard]);

  return {
    board, loading, selectedTrip, setSelectedTrip,
    selectTrip, refresh, refreshTrip,
    activeTab, setActiveTab,
  };
}
