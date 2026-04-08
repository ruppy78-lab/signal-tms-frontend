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
      <AlertTriangle size={12} />
      {expired ? `${label} EXPIRED` : `${label} expires in ${days} days`}
    </div>
  );
}

export default function FleetFormRegistration({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header">Registration & Licensing</div>
      <ExpiryAlert date={form.registration_expiry} label="Registration" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Plate Number</label>
          <input className="form-input" value={form.license_plate} onChange={e => set('license_plate', e.target.value)} /></div>
        <div><label className="form-label">Plate Province/State</label>
          <input className="form-input" value={form.plate_state} onChange={e => set('plate_state', e.target.value)} /></div>
        <div><label className="form-label">Plate Expiry</label>
          <input className="form-input" type="date" value={form.plate_expiry} onChange={e => set('plate_expiry', e.target.value)} /></div>
        <div><label className="form-label">Registration Expiry</label>
          <input className="form-input" type="date" value={form.registration_expiry} onChange={e => set('registration_expiry', e.target.value)} /></div>
        <div><label className="form-label">Jurisdiction</label>
          <input className="form-input" value={form.jurisdiction} onChange={e => set('jurisdiction', e.target.value)} /></div>
        <div><label className="form-label">IFTA Number</label>
          <input className="form-input" value={form.ifta_number} onChange={e => set('ifta_number', e.target.value)} /></div>
      </div>
    </div>
  );
}
