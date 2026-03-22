import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Modal, Confirm, ContextMenu, useContextMenu, Pagination,
  StatusBadge, Spinner, EmptyState, Field, DocUploadModal, DocList,
} from '../../components/common';
import { Plus, Search, Edit, Trash2, Wrench, Truck, History, CheckCircle, AlertCircle, XCircle, RefreshCw, FileText } from 'lucide-react';

const EMPTY      = { unit_number:'', type:'truck', make:'', model:'', year:'', vin:'', plate_number:'', plate_state:'', status:'active', last_inspection:'', inspection_expiry:'', registration_expiry:'', notes:'' };
const MAINT_EMPTY = { service_date:'', service_type:'', description:'', cost:'', odometer:'', vendor:'', next_service:'' };

export default function Fleet() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [type, setType]       = useState('');
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [tab, setTab]         = useState('details');
  const [maintModal, setMaintModal] = useState(null);
  const [maintForm, setMaintForm]   = useState(MAINT_EMPTY);
  const [histModal, setHistModal]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [docUpload, setDocUpload]   = useState(null);
  const { menu, openMenu, closeMenu } = useContextMenu();

  const { data, isLoading } = useQuery({
    queryKey: ['fleet', page, search, type],
    queryFn: () => api.get('/fleet', { params: { page, limit:20, search, type } }).then(r => r.data),
    keepPreviousData: true,
  });
  const { data: maintHistory } = useQuery({
    queryKey: ['fleet-maint', histModal?.id],
    queryFn: () => api.get(`/fleet/${histModal.id}/maintenance`).then(r => r.data.data),
    enabled: !!histModal?.id,
  });

  const saveMut = useMutation({
    mutationFn: b => editing ? api.put(`/fleet/${editing.id}`, b) : api.post('/fleet', b),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); qc.invalidateQueries(['fleet']); closeModal(); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });
  const maintMut = useMutation({
    mutationFn: b => api.post(`/fleet/${maintModal?.id}/maintenance`, b),
    onSuccess: () => { toast.success('Maintenance logged'); qc.invalidateQueries(['fleet']); setMaintModal(null); setMaintForm(MAINT_EMPTY); },
    onError: () => toast.error('Failed to log maintenance'),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status, vehicle }) => api.put(`/fleet/${id}`, { ...vehicle, status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['fleet']); },
    onError: () => toast.error('Failed'),
  });
  const delMut = useMutation({
    mutationFn: id => api.delete(`/fleet/${id}`),
    onSuccess: () => { toast.success('Vehicle retired'); qc.invalidateQueries(['fleet']); setConfirmDel(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openModal  = (v = null) => { setEditing(v); setForm(v ? { ...EMPTY, ...v } : EMPTY); setTab('details'); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };
  const handle     = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const mHandle    = e => setMaintForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const rowCtx = useCallback((e, v) => openMenu(e, [
    { label: 'Edit vehicle',          icon: Edit,         action: () => openModal(v),                                           shortcut: 'E' },
    { label: 'Assign to load',        icon: Truck,        action: () => toast('Assign via Dispatch board') },
    { label: 'Log maintenance',       icon: Wrench,       action: () => { setMaintModal(v); setMaintForm(MAINT_EMPTY); } },
    { label: 'View service history',  icon: History,      action: () => setHistModal(v) },
    { label: 'Upload document',       icon: FileText,     action: () => setDocUpload({ id: v.id, label: v.unit_number }) },
    { divider: true },
    { label: 'Set active',            icon: CheckCircle,  action: () => statusMut.mutate({ id:v.id, status:'active', vehicle:v }) },
    { label: 'Set in maintenance',    icon: AlertCircle,  action: () => statusMut.mutate({ id:v.id, status:'maintenance', vehicle:v }) },
    { divider: true },
    { label: 'Retire vehicle',        icon: XCircle,      danger: true, action: () => setConfirmDel(v) },
  ]), [openMenu]);

  const rows = data?.data || []; const paging = data?.pagination;

  const expiryColor = (d) => {
    if (!d) return 'var(--gray-400)';
    const days = (new Date(d) - new Date()) / 86400000;
    return days < 0 ? 'var(--danger)' : days < 30 ? 'var(--warning)' : 'var(--gray-800)';
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Fleet</h1><p className="page-subtitle">{paging?.total||0} vehicles</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={14} />Add Vehicle</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} />
          <input placeholder="Search unit #, VIN, plate…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          <option value="truck">Trucks</option>
          <option value="trailer">Trailers</option>
          <option value="other">Other</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => qc.invalidateQueries(['fleet'])}><RefreshCw size={13} /></button>
      </div>

      <div className="table-wrapper">
        {isLoading ? <Spinner /> : !rows.length ? (
          <EmptyState title="No vehicles yet"
            action={<button className="btn btn-primary" onClick={() => openModal()}><Plus size={14} />Add Vehicle</button>} />
        ) : (
          <table>
            <thead>
              <tr><th>Unit #</th><th>Type</th><th>Year / Make / Model</th><th>Plate</th><th>Inspection Expiry</th><th>Reg. Expiry</th><th>Loads</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map(v => (
                <tr key={v.id} onContextMenu={e => rowCtx(e, v)} onDoubleClick={() => openModal(v)}>
                  <td style={{ fontWeight:700, fontFamily:'monospace' }}>{v.unit_number}</td>
                  <td className="text-muted" style={{ textTransform:'capitalize' }}>{v.type}</td>
                  <td>{[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}</td>
                  <td className="text-muted" style={{ fontFamily:'monospace', fontSize:12 }}>{v.plate_number||'—'} {v.plate_state && <span style={{ color:'var(--gray-400)' }}>{v.plate_state}</span>}</td>
                  <td style={{ color: expiryColor(v.inspection_expiry), fontSize:12, fontWeight:600 }}>
                    {v.inspection_expiry ? new Date(v.inspection_expiry).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ color: expiryColor(v.registration_expiry), fontSize:12, fontWeight:600 }}>
                    {v.registration_expiry ? new Date(v.registration_expiry).toLocaleDateString() : '—'}
                  </td>
                  <td className="text-muted">{v.total_loads||0}</td>
                  <td><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={paging} onPage={setPage} />
      <ContextMenu {...menu} onClose={closeMenu} />

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => delMut.mutate(confirmDel?.id)} danger
        title="Retire Vehicle" message={`Retire unit ${confirmDel?.unit_number}? It will be marked retired.`} />

      <DocUploadModal open={!!docUpload} onClose={() => setDocUpload(null)}
        entityType="fleet" entityId={docUpload?.id} entityLabel={docUpload?.label} />

      {/* Service history modal */}
      <Modal open={!!histModal} onClose={() => setHistModal(null)}
        title={`Service History — ${histModal?.unit_number}`} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => { setMaintModal(histModal); setHistModal(null); setMaintForm(MAINT_EMPTY); }}>
            <Wrench size={14} /> Log Service
          </button>
          <button className="btn btn-secondary" onClick={() => setHistModal(null)}>Close</button>
        </>}>
        {!maintHistory?.length ? (
          <EmptyState title="No service records" message="Log the first maintenance event." />
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Cost</th><th>Vendor</th><th>Next Service</th></tr></thead>
            <tbody>
              {maintHistory.map(m => (
                <tr key={m.id}>
                  <td style={{ fontSize:12 }}>{new Date(m.service_date).toLocaleDateString()}</td>
                  <td style={{ fontWeight:600, fontSize:12 }}>{m.service_type}</td>
                  <td className="text-muted" style={{ fontSize:12 }}>{m.description||'—'}</td>
                  <td style={{ fontSize:12 }}>{m.cost ? `$${parseFloat(m.cost).toFixed(2)}` : '—'}</td>
                  <td className="text-muted" style={{ fontSize:12 }}>{m.vendor||'—'}</td>
                  <td style={{ fontSize:12 }}>{m.next_service ? new Date(m.next_service).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      {/* Log maintenance modal */}
      <Modal open={!!maintModal} onClose={() => setMaintModal(null)}
        title={`Log Maintenance — ${maintModal?.unit_number}`} size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setMaintModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => maintMut.mutate(maintForm)} disabled={maintMut.isPending}>
            {maintMut.isPending ? 'Saving…' : 'Log Service'}
          </button>
        </>}>
        <div className="form-grid">
          <Field label="Service Date" required>
            <input type="date" name="service_date" className="form-input" value={maintForm.service_date} onChange={mHandle} required />
          </Field>
          <Field label="Service Type" required>
            <select name="service_type" className="form-input" value={maintForm.service_type} onChange={mHandle} required>
              <option value="">Select type…</option>
              {['Oil Change','Tire Rotation','Brake Service','DOT Inspection','Annual Inspection','Transmission','Engine','Electrical','Cooling System','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Odometer (km/mi)">
            <input type="number" name="odometer" className="form-input" value={maintForm.odometer} onChange={mHandle} />
          </Field>
          <Field label="Cost ($)">
            <input type="number" step="0.01" name="cost" className="form-input" value={maintForm.cost} onChange={mHandle} />
          </Field>
          <Field label="Vendor / Shop">
            <input name="vendor" className="form-input" value={maintForm.vendor} onChange={mHandle} />
          </Field>
          <Field label="Next Service Date">
            <input type="date" name="next_service" className="form-input" value={maintForm.next_service} onChange={mHandle} />
          </Field>
          <Field label="Description" className="full">
            <textarea name="description" className="form-input" rows={3} value={maintForm.description} onChange={mHandle} />
          </Field>
        </div>
      </Modal>

      {/* Fleet form modal */}
      <Modal open={modal} onClose={closeModal}
        title={editing ? `Edit Vehicle — ${editing.unit_number}` : 'Add Vehicle'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </>}>

        <div style={{ display:'flex', borderBottom:'1px solid var(--gray-200)', marginBottom:20, gap:2 }}>
          {['details','documents'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'8px 16px', border:'none', background:'transparent', fontSize:13,
              fontWeight: tab===t ? 700 : 400, color: tab===t ? 'var(--primary)' : 'var(--gray-600)',
              borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer',
            }}>{t === 'details' ? 'Vehicle Details' : 'Documents'}</button>
          ))}
        </div>

        {tab === 'details' ? (
          <div className="form-grid">
            <Field label="Unit Number" required>
              <input name="unit_number" className="form-input" value={form.unit_number} onChange={handle} required />
            </Field>
            <Field label="Type" required>
              <select name="type" className="form-input" value={form.type} onChange={handle}>
                <option value="truck">Truck</option>
                <option value="trailer">Trailer</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Year"><input type="number" name="year" className="form-input" value={form.year||''} onChange={handle} /></Field>
            <Field label="Make"><input name="make" className="form-input" value={form.make||''} onChange={handle} /></Field>
            <Field label="Model"><input name="model" className="form-input" value={form.model||''} onChange={handle} /></Field>
            <Field label="VIN"><input name="vin" className="form-input" value={form.vin||''} onChange={handle} /></Field>
            <Field label="Plate Number"><input name="plate_number" className="form-input" value={form.plate_number||''} onChange={handle} /></Field>
            <Field label="Plate State/Prov."><input name="plate_state" className="form-input" value={form.plate_state||''} onChange={handle} /></Field>
            <Field label="Status">
              <select name="status" className="form-input" value={form.status} onChange={handle}>
                <option value="active">Active</option>
                <option value="maintenance">In Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </Field>
            <Field label="Last Inspection"><input type="date" name="last_inspection" className="form-input" value={form.last_inspection||''} onChange={handle} /></Field>
            <Field label="Inspection Expiry"><input type="date" name="inspection_expiry" className="form-input" value={form.inspection_expiry||''} onChange={handle} /></Field>
            <Field label="Registration Expiry"><input type="date" name="registration_expiry" className="form-input" value={form.registration_expiry||''} onChange={handle} /></Field>
            <Field label="Notes" className="full">
              <textarea name="notes" className="form-input" rows={2} value={form.notes||''} onChange={handle} />
            </Field>
          </div>
        ) : (
          editing ? (
            <DocList entityType="fleet" entityId={editing.id} entityLabel={editing.unit_number} />
          ) : (
            <p style={{ color:'var(--gray-500)', fontSize:13, padding:16 }}>Save the vehicle first, then upload documents.</p>
          )
        )}
      </Modal>
    </div>
  );
}
