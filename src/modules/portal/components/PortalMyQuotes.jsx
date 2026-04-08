import React, { useState, useEffect } from 'react';
import { Spinner } from '../../../shared/components';
import { formatDate, formatCurrency } from '../../../shared/utils/formatters';

const STATUS_STYLES = {
  pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Pending' },
  reviewed: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'Reviewed' },
  approved: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Approved' },
  converted: { bg: '#D1FAE5', color: '#047857', border: '#6EE7B7', label: 'Converted' },
  declined: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Declined' },
};

export default function PortalMyQuotes({ portalApi }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.get('/portal/quotes')
      .then(r => setQuotes(r.data || []))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, [portalApi]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B3A', marginBottom: 16 }}>My Quotes</h2>
      {quotes.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No quotes submitted yet. Use the Quote Calculator to request a rate.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table className="tms-table">
            <thead><tr>
              <th>Quote #</th><th>Date</th><th>From</th><th>To</th>
              <th>Equipment</th><th>Weight</th><th>Est. Rate</th><th>Status</th>
            </tr></thead>
            <tbody>
              {quotes.map(q => {
                const st = STATUS_STYLES[q.status] || STATUS_STYLES.pending;
                return (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>{q.quote_number || '—'}</td>
                    <td>{formatDate(q.created_at)}</td>
                    <td>{q.origin_city}{q.origin_state ? `, ${q.origin_state}` : ''}</td>
                    <td>{q.dest_city}{q.dest_state ? `, ${q.dest_state}` : ''}</td>
                    <td>{q.equipment || 'Dry Van'}</td>
                    <td>{q.weight ? `${Number(q.weight).toLocaleString()} lb` : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{q.estimated_rate ? formatCurrency(q.estimated_rate) : '—'}</td>
                    <td>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                      {q.status === 'converted' && q.converted_load_number && (
                        <span style={{ fontSize: 10, marginLeft: 4, color: '#047857' }}>{q.converted_load_number}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
