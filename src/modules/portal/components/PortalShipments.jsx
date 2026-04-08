import React, { useState, useEffect } from 'react';
import { Badge, Spinner } from '../../../shared/components';
import { formatDate, formatWeight } from '../../../shared/utils/formatters';

export default function PortalShipments({ portalApi }) {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.get('/portal/loads', { params: { limit: 100 } })
      .then(r => setLoads(r.data || []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, [portalApi]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B3A', marginBottom: 16 }}>My Shipments</h2>
      {loads.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No shipments found</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table className="tms-table">
            <thead><tr>
              <th>Load #</th><th>Origin</th><th>Destination</th><th>PU Date</th><th>Del Date</th>
              <th>PCS</th><th>Weight</th><th>Status</th>
            </tr></thead>
            <tbody>
              {loads.map(l => (
                <tr key={l.load_number}>
                  <td style={{ fontWeight: 600 }}>{l.load_number}</td>
                  <td>{l.origin_city}{l.origin_state ? `, ${l.origin_state}` : ''}</td>
                  <td>{l.dest_city}{l.dest_state ? `, ${l.dest_state}` : ''}</td>
                  <td>{formatDate(l.pickup_date)}</td>
                  <td>{formatDate(l.delivery_date)}</td>
                  <td>{l.total_pieces || '—'}</td>
                  <td>{formatWeight(l.total_weight)}</td>
                  <td><Badge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
