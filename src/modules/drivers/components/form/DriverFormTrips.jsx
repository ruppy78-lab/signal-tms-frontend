import React, { useState, useEffect } from 'react';
import { Badge, Spinner } from '../../../../shared/components';
import { formatCurrency, formatDate } from '../../../../shared/utils/formatters';
import driversApi from '../../services/driversApi';

export default function DriverFormTrips({ driverId }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) { setLoading(false); return; }
    driversApi.getTrips(driverId, { limit: 50 })
      .then(r => setTrips(r.data || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [driverId]);

  if (!driverId) return <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Save the driver first to view trip history.</div>;
  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <div className="form-section-header">Trip History</div>
      {trips.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>No trip history for this driver yet</div>
      ) : (
        <table className="tms-table">
          <thead><tr><th>Trip #</th><th>Date</th><th>Loads</th><th>Revenue</th><th>Status</th></tr></thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.trip_number}</td>
                <td>{formatDate(t.created_at)}</td>
                <td>{t.total_loads || 0}</td>
                <td style={{ color: '#2E7D32' }}>{formatCurrency(t.total_revenue)}</td>
                <td><Badge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
