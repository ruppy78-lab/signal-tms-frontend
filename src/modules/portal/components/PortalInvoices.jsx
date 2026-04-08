import React, { useState, useEffect } from 'react';
import { Badge, Spinner } from '../../../shared/components';
import { formatDate, formatCurrency } from '../../../shared/utils/formatters';

export default function PortalInvoices({ portalApi }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.get('/portal/invoices', { params: { limit: 100 } })
      .then(r => setInvoices(r.data || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [portalApi]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B3A', marginBottom: 16 }}>Invoices</h2>
      {invoices.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No invoices found</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table className="tms-table">
            <thead><tr>
              <th>Invoice #</th><th>Load #</th><th>Date</th><th>Amount</th><th>Balance</th><th>Due Date</th><th>Status</th>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.invoice_number}>
                  <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                  <td>{inv.load_number || '—'}</td>
                  <td>{formatDate(inv.created_at)}</td>
                  <td>{formatCurrency(inv.total_amount)}</td>
                  <td style={{ color: parseFloat(inv.balance_due) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                    {formatCurrency(inv.balance_due)}</td>
                  <td>{formatDate(inv.due_date)}</td>
                  <td><Badge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
