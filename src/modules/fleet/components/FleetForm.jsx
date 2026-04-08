import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../shared/components';
import DocsPopup, { FLEET_DOC_TYPES } from '../../../shared/components/DocsPopup';
import toast from 'react-hot-toast';
import FleetFormDetails from './form/FleetFormDetails';
import FleetFormRegistration from './form/FleetFormRegistration';
import FleetFormInspection from './form/FleetFormInspection';
import FleetFormInsurance from './form/FleetFormInsurance';
import FleetFormMaintenance from './form/FleetFormMaintenance';

const TABS = ['Details', 'Registration', 'Inspection', 'Insurance', 'Maintenance', 'Documents', 'Notes'];

const empty = {
  type: 'truck', unit_number: '', make: '', model: '', year: '', vin: '', color: '',
  license_plate: '', plate_state: '', plate_expiry: '', registration_expiry: '', jurisdiction: '',
  ifta_number: '', fleet_number: '', owner_type: 'company', owner_name: '',
  cvip_date: '', cvip_expiry: '', annual_inspection_date: '', next_inspection_due: '',
  odometer: '', engine_hours: '',
  insurance_company: '', insurance_policy: '', insurance_expiry: '', insurance_amount: '',
  insurance_agent: '', insurance_agent_phone: '',
  last_oil_change_date: '', last_oil_change_odometer: '', next_oil_change_due: '', last_tire_change: '',
  assigned_driver_id: '', notes: '', status: 'active',
};

const fmtDate = (v) => v ? String(v).split('T')[0] : '';

export default function FleetForm({ open, onClose, vehicle, onSave, onDelete, initType }) {
  const isEdit = !!vehicle?.id;
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(0);
    if (isEdit) {
      const f = { ...empty };
      for (const [k, v] of Object.entries(vehicle)) { if (k in f) f[k] = v ?? empty[k]; }
      ['plate_expiry','registration_expiry','cvip_date','cvip_expiry','annual_inspection_date',
       'next_inspection_due','insurance_expiry','last_oil_change_date','last_tire_change'].forEach(k => { f[k] = fmtDate(f[k]); });
      setForm(f);
    } else {
      setForm({ ...empty, type: initType || 'truck' });
    }
  }, [open, vehicle, isEdit, initType]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.unit_number) { toast.error('Unit number is required'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.message || 'Save failed'); }
    setSaving(false);
  };

  const title = isEdit ? `Edit — ${vehicle.unit_number}` : form.type === 'trailer' ? 'Add Trailer' : 'Add Truck';

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div>{isEdit && onDelete && <Button variant="danger" onClick={() => { onDelete(vehicle.id); onClose(); }}>Delete</Button>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      }>
      {/* Top fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: 8, marginBottom: 8 }}>
        <div><label className="form-label">Type</label>
          <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="truck">Truck</option><option value="trailer">Trailer</option>
          </select></div>
        <div><label className="form-label">Unit # *</label>
          <input className="form-input" value={form.unit_number} onChange={e => set('unit_number', e.target.value)} /></div>
        <div><label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option><option value="in_shop">In Shop</option><option value="inactive">Inactive</option><option value="sold">Sold</option>
          </select></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px', gap: 8, marginBottom: 8 }}>
        <div><label className="form-label">Make</label><input className="form-input" value={form.make} onChange={e => set('make', e.target.value)} /></div>
        <div><label className="form-label">Model</label><input className="form-input" value={form.model} onChange={e => set('model', e.target.value)} /></div>
        <div><label className="form-label">Year</label><input className="form-input" type="number" value={form.year} onChange={e => set('year', e.target.value)} /></div>
        <div><label className="form-label">Color</label><input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div><label className="form-label">VIN</label><input className="form-input" value={form.vin} onChange={e => set('vin', e.target.value)} /></div>
        <div><label className="form-label">License Plate</label><input className="form-input" value={form.license_plate} onChange={e => set('license_plate', e.target.value)} /></div>
        <div><label className="form-label">Plate Province/State</label><input className="form-input" value={form.plate_state} onChange={e => set('plate_state', e.target.value)} /></div>
      </div>

      <div className="tabs" style={{ marginBottom: 12 }}>
        {TABS.map((t, i) => <button key={t} className={`tab ${tab === i && i !== 5 ? 'active' : ''}`}
          onClick={() => i === 5 ? setShowDocs(true) : setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && <FleetFormDetails form={form} set={set} />}
      {tab === 1 && <FleetFormRegistration form={form} set={set} />}
      {tab === 2 && <FleetFormInspection form={form} set={set} />}
      {tab === 3 && <FleetFormInsurance form={form} set={set} />}
      {tab === 4 && <FleetFormMaintenance fleetId={vehicle?.id} />}
      {tab === 6 && (
        <div>
          <div className="section-header">Notes</div>
          <textarea className="form-input" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
      )}
      {showDocs && (
        <DocsPopup entityType="fleet" entityId={vehicle?.id}
          title={`Documents — ${vehicle?.unit_number || 'Vehicle'}`} docTypes={FLEET_DOC_TYPES}
          onClose={() => setShowDocs(false)} />
      )}
    </Modal>
  );
}
