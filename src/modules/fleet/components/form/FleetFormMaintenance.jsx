import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Button, Spinner } from '../../../../shared/components';
import { formatCurrency, formatDate } from '../../../../shared/utils/formatters';
import fleetApi from '../../services/fleetApi';
import toast from 'react-hot-toast';

const SERVICE_TYPES = ['Oil Change', 'Tire Change', 'Brake Service', 'Engine Service', 'Transmission', 'Electrical', 'Body Work', 'CVIP', 'Annual Inspection', 'Other'];
const emptyRecord = { service_type: 'Oil Change', service_date: '', odometer: '', description: '', cost: '', shop_name: '', next_service_date: '', next_service_odometer: '', performed_by: '', notes: '' };

export default function FleetFormMaintenance({ fleetId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyRecord);
  const [editId, setEditId] = useState(null);

  const fetch = useCallback(() => {
    if (!fleetId) { setLoading(false); return; }
    fleetApi.getMaintenance(fleetId).then(r => setRecords(r.data || [])).catch(() => setRecords([])).finally(() => setLoading(false));
  }, [fleetId]);
  useEffect(() => { fetch(); }, [fetch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.service_type) return;
    try {
      if (editId) await fleetApi.updateMaintenance(fleetId, editId, form);
      else await fleetApi.addMaintenance(fleetId, form);
      toast.success(editId ? 'Record updated' : 'Record added');
      setFormOpen(false); setEditId(null); setForm(emptyRecord); fetch();
    } catch { toast.error('Save failed'); }
  };

  const handleEdit = (r) => {
    setEditId(r.id);
    const f = { ...emptyRecord };
    for (const [k, v] of Object.entries(r)) { if (k in f) f[k] = v ?? ''; }
    if (f.service_date) f.service_date = String(f.service_date).split('T')[0];
    if (f.next_service_date) f.next_service_date = String(f.next_service_date).split('T')[0];
    setForm(f); setFormOpen(true);
  };

  const handleDelete = async (r) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try { await fleetApi.deleteMaintenance(fleetId, r.id); toast.success('Deleted'); fetch(); } catch { toast.error('Delete failed'); }
  };

  if (!fleetId) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Save the vehicle first to add maintenance records.</div>;
  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="section-header" style={{ marginBottom: 0 }}>Maintenance History</div>
        <Button size="sm" icon={Plus} onClick={() => { setEditId(null); setForm(emptyRecord); setFormOpen(true); }}>Add Record</Button>
      </div>

      {formOpen && (
        <div style={{ background: 'var(--section-header-bg)', padding: 10, borderRadius: 6, marginBottom: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <div><label className="form-label">Service Type</label>
              <select className="form-input" value={form.service_type} onChange={e => set('service_type', e.target.value)}>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="form-label">Date</label><input className="form-input" type="date" value={form.service_date} onChange={e => set('service_date', e.target.value)} /></div>
            <div><label className="form-label">Odometer</label><input className="form-input" type="number" value={form.odometer} onChange={e => set('odometer', e.target.value)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><label className="form-label">Cost ($)</label><input className="form-input" type="number" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} /></div>
            <div><label className="form-label">Shop</label><input className="form-input" value={form.shop_name} onChange={e => set('shop_name', e.target.value)} /></div>
            <div><label className="form-label">Performed By</label><input className="form-input" value={form.performed_by} onChange={e => set('performed_by', e.target.value)} /></div>
            <div><label className="form-label">Next Service Date</label><input className="form-input" type="date" value={form.next_service_date} onChange={e => set('next_service_date', e.target.value)} /></div>
            <div><label className="form-label">Next Service Odometer</label><input className="form-input" type="number" value={form.next_service_odometer} onChange={e => set('next_service_odometer', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" onClick={() => { setFormOpen(false); setEditId(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>{editId ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No maintenance records</div>
      ) : (
        <table className="tms-table">
          <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Odometer</th><th>Cost</th><th>Shop</th><th style={{ width: 60 }}></th></tr></thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{formatDate(r.service_date)}</td>
                <td>{r.service_type}</td>
                <td>{r.description || '--'}</td>
                <td>{r.odometer ? r.odometer.toLocaleString() : '--'}</td>
                <td>{r.cost ? formatCurrency(r.cost) : '--'}</td>
                <td>{r.shop_name || '--'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button className="btn btn-xs btn-secondary" onClick={() => handleEdit(r)}><Edit2 size={10} /></button>
                    <button className="btn btn-xs btn-secondary" onClick={() => handleDelete(r)}><Trash2 size={10} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
