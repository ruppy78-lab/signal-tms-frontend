import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/Modal';
import { Button } from '../../../shared/components';

const EMPTY = {
  name: '', address: '', city: '', state: '', zip: '',
  country: 'Canada', phone: '', contact_name: '', email: '', fax: '',
  location_type: '', hours: '', special_instructions: '',
  appointment_required: false, notes: '',
};

const TYPES = [
  { value: 'shipper', label: 'Shipper' },
  { value: 'consignee', label: 'Consignee' },
  { value: 'shipper_consignee', label: 'Shipper & Consignee' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'other', label: 'Other' },
];

export default function LocationForm({ open, onClose, location, onSave, onDelete }) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!location?.id;

  useEffect(() => {
    if (open) setForm(location ? { ...EMPTY, ...location } : EMPTY);
  }, [open, location]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Location' : 'New Location'} size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div>{isEdit && onDelete && <Button variant="danger" onClick={() => { onDelete(location.id); onClose(); }}>Delete</Button>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </div>
      }>
      <form onSubmit={handleSubmit}>
        <div className="section-header">Location Details</div>
        <div className="form-grid">
          <div className="full">
            <label className="form-label">Company / Location Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="full">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div><label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
          <div><label className="form-label">Province / State</label>
            <input className="form-input" value={form.state} onChange={e => set('state', e.target.value)} /></div>
          <div><label className="form-label">Postal Code</label>
            <input className="form-input" value={form.zip} onChange={e => set('zip', e.target.value)} /></div>
          <div><label className="form-label">Country</label>
            <input className="form-input" value={form.country} onChange={e => set('country', e.target.value)} /></div>
        </div>

        <div className="section-header" style={{ marginTop: 16 }}>Contact</div>
        <div className="form-grid">
          <div><label className="form-label">Contact Name</label>
            <input className="form-input" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></div>
          <div><label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="form-label">Fax</label>
            <input className="form-input" value={form.fax} onChange={e => set('fax', e.target.value)} /></div>
        </div>

        <div className="section-header" style={{ marginTop: 16 }}>Type & Operations</div>
        <div className="form-grid">
          <div><label className="form-label">Location Type</label>
            <select className="form-input" value={form.location_type} onChange={e => set('location_type', e.target.value)}>
              <option value="">Select type...</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
          <div><label className="form-label">Hours of Operation</label>
            <input className="form-input" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="Mon-Fri 8am-5pm" /></div>
          <div className="full">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 8 }}>
              <input type="checkbox" checked={form.appointment_required} onChange={e => set('appointment_required', e.target.checked)} />
              Appointment Required
            </label>
          </div>
          <div className="full"><label className="form-label">Special Instructions (printed on BOL)</label>
            <textarea className="form-input" rows={2} value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} /></div>
          <div className="full"><label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        </div>
      </form>
    </Modal>
  );
}
