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

export default function FleetFormInsurance({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header">Insurance</div>
      <ExpiryAlert date={form.insurance_expiry} label="Insurance" />
      <div><label className="form-label">Insurance Company</label>
        <input className="form-input" value={form.insurance_company} onChange={e => set('insurance_company', e.target.value)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Policy Number</label>
          <input className="form-input" value={form.insurance_policy} onChange={e => set('insurance_policy', e.target.value)} /></div>
        <div><label className="form-label">Expiry Date</label>
          <input className="form-input" type="date" value={form.insurance_expiry} onChange={e => set('insurance_expiry', e.target.value)} /></div>
        <div><label className="form-label">Coverage Amount ($)</label>
          <input className="form-input" type="number" value={form.insurance_amount} onChange={e => set('insurance_amount', e.target.value)} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Agent Name</label>
          <input className="form-input" value={form.insurance_agent} onChange={e => set('insurance_agent', e.target.value)} /></div>
        <div><label className="form-label">Agent Phone</label>
          <input className="form-input" value={form.insurance_agent_phone} onChange={e => set('insurance_agent_phone', e.target.value)} /></div>
      </div>
    </div>
  );
}
