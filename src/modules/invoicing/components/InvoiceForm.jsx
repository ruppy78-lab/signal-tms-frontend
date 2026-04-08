import React, { useState, useEffect } from 'react';
import { Modal, Button, Select } from '../../../shared/components';
import { FormGrid, FormSection } from '../../../shared/components/Form';
import invoicingApi from '../services/invoicingApi';
import toast from 'react-hot-toast';

const empty = {
  customerId: '', loadId: '', invoiceDate: '', dueDate: '',
  subtotal: '', fuelSurcharge: '', accessorials: '', tax: '', notes: '',
};

export default function InvoiceForm({ open, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [customers, setCustomers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty);
      invoicingApi.getCustomers().then(r => setCustomers(r.data || r.customers || [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (form.customerId) {
      invoicingApi.getLoads({ customerId: form.customerId, status: 'delivered', limit: 200 })
        .then(r => setLoads(r.data || r.loads || []))
        .catch(() => setLoads([]));
    } else { setLoads([]); }
  }, [form.customerId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLoadSelect = (loadId) => {
    set('loadId', loadId);
    const load = loads.find(l => String(l.id) === String(loadId));
    if (load) {
      set('subtotal', load.base_rate || load.total_revenue || '');
      set('fuelSurcharge', load.fuel_surcharge || '');
    }
  };

  const handleSubmit = async () => {
    if (!form.customerId) { toast.error('Select a customer'); return; }
    setSaving(true);
    try {
      await onSave({
        customer_id: form.customerId,
        load_id: form.loadId || null,
        subtotal: Number(form.subtotal) || 0,
        fuel_surcharge: Number(form.fuelSurcharge) || 0,
        accessorials: Number(form.accessorials) || 0,
        tax_amount: Number(form.tax) || 0,
        due_date: form.dueDate || null,
        notes: form.notes,
      });
      onClose();
    } catch (e) {
      toast.error(e?.message || 'Failed to create invoice');
    } finally { setSaving(false); }
  };

  const customerOpts = [{ value: '', label: 'Select Customer' }, ...customers.map(c => ({ value: c.id, label: c.company_name || c.name || c.company }))];
  const loadOpts = [{ value: '', label: 'Select Load (optional)' }, ...loads.map(l => ({ value: l.id, label: `${l.load_number} — ${l.origin_city || ''} to ${l.dest_city || ''}` }))];

  const total = (Number(form.subtotal) || 0) + (Number(form.fuelSurcharge) || 0) +
    (Number(form.accessorials) || 0) + (Number(form.tax) || 0);

  return (
    <Modal open={open} onClose={onClose} title="Create Invoice" width={550}>
      <FormSection title="Customer & Load">
        <FormGrid cols={2}>
          <div style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Customer *</label>
            <select className="form-input" value={form.customerId} onChange={e => set('customerId', e.target.value)}>
              {customerOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Load</label>
            <select className="form-input" value={form.loadId} onChange={e => handleLoadSelect(e.target.value)}>
              {loadOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div><label className="form-label">Invoice Date</label>
            <input className="form-input" type="date" value={form.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} /></div>
          <div><label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
        </FormGrid>
      </FormSection>

      <FormSection title="Amounts">
        <FormGrid cols={2}>
          <div><label className="form-label">Base Rate ($)</label>
            <input className="form-input" type="number" step="0.01" value={form.subtotal} onChange={e => set('subtotal', e.target.value)} /></div>
          <div><label className="form-label">Fuel Surcharge ($)</label>
            <input className="form-input" type="number" step="0.01" value={form.fuelSurcharge} onChange={e => set('fuelSurcharge', e.target.value)} /></div>
          <div><label className="form-label">Accessorials ($)</label>
            <input className="form-input" type="number" step="0.01" value={form.accessorials} onChange={e => set('accessorials', e.target.value)} /></div>
          <div><label className="form-label">Tax ($)</label>
            <input className="form-input" type="number" step="0.01" value={form.tax} onChange={e => set('tax', e.target.value)} /></div>
        </FormGrid>
        <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, marginTop: 12 }}>
          Total: ${total.toFixed(2)}
        </div>
      </FormSection>

      <div><label className="form-label">Notes</label>
        <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Create Invoice'}</Button>
      </div>
    </Modal>
  );
}
