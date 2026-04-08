import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '../../../../shared/components';
import { AddressSearch } from '../../../../shared/components';

const emptyStop = {
  stop_type: 'pickup', company_name: '', address: '', city: '', state: '', zip: '',
  contact_name: '', phone: '', date: '', time_from: '', time_to: '',
  appointment_required: false, appointment_ref: '', po_number: '', pieces: 0, weight: 0, pallets: 0,
  commodity: '', reference_number: '', notes: '', save_address: true,
  residential: false, construction_site: false, limited_access: false,
  inside_delivery: false, liftgate_required: false, hazmat: false,
};
const secHead = {
  fontSize: 11, fontWeight: 600, color: 'var(--section-header-text)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  padding: '5px 10px', background: 'var(--section-header-bg)',
  borderLeft: '3px solid var(--brand-accent)',
  borderRadius: '0 4px 4px 0', marginBottom: 0,
  margin: '0 -12px', width: 'calc(100% + 24px)',
};
const gr = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 });

function normDate(v) { return v ? String(v).split('T')[0] : ''; }
function normTime(v) { return v ? String(v).slice(0, 5) : ''; }

export default function StopEditor({ stop, onSave, onCancel }) {
  const clean = {};
  if (stop) { for (const [k, v] of Object.entries(stop)) { clean[k] = v === null ? '' : v; } }
  const init = { ...emptyStop, ...clean };
  init.date = normDate(init.date);
  init.time_from = normTime(init.time_from);
  init.time_to = normTime(init.time_to);
  const [form, setForm] = useState(init);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isPickup = form.stop_type === 'pickup';
  const isNew = !stop?.company_name;

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onCancel?.();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const handleAddressSelect = (addr) => {
    setForm(p => ({ ...p, company_name: addr.company_name || '', address: addr.address || '',
      city: addr.city || '', state: addr.state || '', zip: addr.zip || '',
      contact_name: addr.contact_name || '', phone: addr.phone || '', save_address: false }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div style={{ background: 'var(--bg-card)', width: 580, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', border: '1px solid var(--border-dark)',
        boxShadow: 'var(--shadow-lg)', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', background: 'var(--modal-header)', color: 'var(--text-white)', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {isNew ? 'Add' : 'Edit'} {isPickup ? 'Pickup' : 'Delivery'} Stop
            {!isNew && stop?.stop_number ? ` #${stop.stop_number}` : ''}
          </span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-white)', display: 'flex', padding: 2 }}>
            <X size={14} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {/* LOCATION */}
          <div style={secHead}>Location</div>
          <div style={{ marginTop: 8, marginBottom: 6 }}>
            <label className="form-label">Company Name *</label>
            <AddressSearch value={form.company_name} onChange={v => set('company_name', v)}
              onSelect={handleAddressSelect} placeholder="Search address book..." />
          </div>
          <div style={gr(3)}>
            <div style={{ gridColumn: 'span 2' }}>
              <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
            <Input label="State" value={form.state} onChange={e => set('state', e.target.value)} />
            <Input label="ZIP" value={form.zip} onChange={e => set('zip', e.target.value)} />
            <Input label="Contact" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>

          {/* SCHEDULE */}
          <div style={{ ...secHead, marginTop: 12 }}>Schedule</div>
          <div style={{ ...gr(3), marginTop: 8 }}>
            <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            <Input label="Time From" type="time" value={form.time_from} onChange={e => set('time_from', e.target.value)} />
            <Input label="Time To" type="time" value={form.time_to} onChange={e => set('time_to', e.target.value)} />
          </div>
          <div style={{ ...gr(2), marginTop: 6 }}>
            <Input label="PO #" value={form.po_number} onChange={e => set('po_number', e.target.value)} />
            <Input label="Appt Ref #" value={form.appointment_ref} onChange={e => set('appointment_ref', e.target.value)} />
          </div>
          <div style={{ marginTop: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.appointment_required} onChange={e => set('appointment_required', e.target.checked)} />
              Appointment Required
            </label>
          </div>

          {/* FLAGS */}
          <div style={{ ...secHead, marginTop: 12 }}>Flags</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {[['liftgate_required','Liftgate'],['residential','Residential'],['construction_site','Construction'],
              ['limited_access','Ltd Access'],['inside_delivery','Inside Del'],['hazmat','Hazmat']
            ].map(([k, lbl]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={form[k] || false} onChange={e => set(k, e.target.checked)} />
                {lbl}
              </label>
            ))}
          </div>

          {/* NOTES */}
          <div style={{ ...secHead, marginTop: 12 }}>Notes</div>
          <textarea className="form-input" rows={2} value={form.notes || ''}
            onChange={e => set('notes', e.target.value)} placeholder="Stop notes..."
            style={{ width: '100%', resize: 'vertical', fontSize: 12, marginTop: 8 }} />

          {/* SAVE ADDRESS */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
            fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.save_address !== false}
              onChange={e => set('save_address', e.target.checked)} />
            Save this address to address book
          </label>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6,
          padding: '8px 12px', borderTop: '1px solid var(--border)',
          background: 'var(--bg-main)', flexShrink: 0 }}>
          <button className="btn btn-sm btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={() => onSave(form)}>Save Stop</button>
        </div>
      </div>
    </div>
  );
}
