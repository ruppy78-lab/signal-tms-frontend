import React, { useState, useEffect } from 'react';
import { Badge, Spinner } from '../../../../shared/components';
import { formatCurrency, formatDate } from '../../../../shared/utils/formatters';
import driversApi from '../../services/driversApi';

export default function DriverFormSettlements({ driverId }) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) { setLoading(false); return; }
    driversApi.getSettlements(driverId, { limit: 100 })
      .then(r => setSettlements(r.data || []))
      .catch(() => setSettlements([]))
      .finally(() => setLoading(false));
  }, [driverId]);

  if (!driverId) return <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Save the driver first to view settlements.</div>;
  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <div className="form-section-header">Settlements</div>
      {settlements.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>No settlements found</div>
      ) : (
        <table className="tms-table">
          <thead><tr><th>Settlement #</th><th>Period</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
          <tbody>
            {settlements.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.settlement_number}</td>
                <td>{formatDate(s.period_start)} - {formatDate(s.period_end)}</td>
                <td>{formatCurrency(s.gross_pay)}</td>
                <td style={{ color: '#B71C1C' }}>{formatCurrency(s.deductions)}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(s.net_pay)}</td>
                <td><Badge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
