import React from 'react';
import { formatDateTime } from '../../../../shared/utils/formatters';

const row = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '3px 6px', borderBottom: '1px solid var(--border)',
  fontSize: 'var(--font-size-xs)',
};
const lbl = { color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' };
const val = { color: 'var(--text-primary)', fontWeight: 600 };

export default function InfoTab({ load }) {
  if (!load?.id) {
    return (
      <div style={{ padding: 12, textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        Save load first to see details
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--gray-300)', background: 'var(--bg-card)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-white)', textTransform: 'uppercase',
        letterSpacing: '0.05em', padding: '2px 8px', background: 'var(--secondary)' }}>
        Load Details
      </div>
      <div style={row}>
        <span style={lbl}>Load #</span><span style={val}>{load.load_number || '—'}</span>
      </div>
      <div style={row}>
        <span style={lbl}>Created</span><span style={val}>{formatDateTime(load.created_at)}</span>
      </div>
      <div style={row}>
        <span style={lbl}>Created By</span><span style={val}>{load.created_by_name || 'Admin'}</span>
      </div>
      <div style={row}>
        <span style={lbl}>Updated</span><span style={val}>{formatDateTime(load.updated_at)}</span>
      </div>
      <div style={row}>
        <span style={lbl}>Status</span>
        <span style={{ ...val, textTransform: 'uppercase', color: 'var(--primary)' }}>{load.status}</span>
      </div>
      {load.trip_id && (
        <div style={row}>
          <span style={lbl}>Trip #</span>
          <span style={{ ...val, color: 'var(--primary)' }}>{load.trip_number || load.trip_id}</span>
        </div>
      )}
      {load.driver_name && (
        <div style={row}>
          <span style={lbl}>Driver</span><span style={val}>{load.driver_name}</span>
        </div>
      )}
      <div style={{ ...row, background: 'var(--gray-50)' }}>
        <span style={lbl}>Customer</span><span style={val}>{load.customer_name || '—'}</span>
      </div>
      <div style={{ ...row, background: 'var(--gray-50)' }}>
        <span style={lbl}>Equipment</span><span style={val}>{load.equipment_type || '—'}</span>
      </div>
    </div>
  );
}
