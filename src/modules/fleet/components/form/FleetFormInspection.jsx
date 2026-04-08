import React from 'react';
import { AlertTriangle } from 'lucide-react';

function ExpiryAlert({ date, label }) {
  if (!date) return null;
  const days = Math.floor((new Date(date) - new Date()) / 86400000);
  if (days > 60) return null;
  const expired = days < 0;
  const color = expired || days < 30 ? 'var(--danger)' : 'var(--warning)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginBottom: 8,
      borderRadius: 4, background: expired ? 'var(--danger-bg)' : 'var(--warning-bg)', fontSize: 11, color }}>
      <AlertTriangle size={12} />{expired ? `${label} EXPIRED` : `${label} expires in ${days} days`}
    </div>
  );
}

export default function FleetFormInspection({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header">Inspection Records</div>
      <ExpiryAlert date={form.cvip_expiry} label="CVIP" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Last CVIP Date</label>
          <input className="form-input" type="date" value={form.cvip_date} onChange={e => set('cvip_date', e.target.value)} /></div>
        <div><label className="form-label">CVIP Expiry</label>
          <input className="form-input" type="date" value={form.cvip_expiry} onChange={e => set('cvip_expiry', e.target.value)} /></div>
        <div><label className="form-label">Last Annual Inspection</label>
          <input className="form-input" type="date" value={form.annual_inspection_date} onChange={e => set('annual_inspection_date', e.target.value)} /></div>
        <div><label className="form-label">Next Inspection Due</label>
          <input className="form-input" type="date" value={form.next_inspection_due} onChange={e => set('next_inspection_due', e.target.value)} /></div>
      </div>
      <div className="section-header">Odometer / Hours</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Current Odometer</label>
          <input className="form-input" type="number" value={form.odometer} onChange={e => set('odometer', e.target.value)} /></div>
        <div><label className="form-label">Engine Hours</label>
          <input className="form-input" type="number" value={form.engine_hours} onChange={e => set('engine_hours', e.target.value)} /></div>
      </div>
    </div>
  );
}
