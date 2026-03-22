import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Modal, Confirm, ContextMenu, useContextMenu, Pagination,
  StatusBadge, Spinner, EmptyState, Field, DocUploadModal, DocList,
} from '../../components/common';
import { Plus, Search, Edit, Trash2, Phone, Truck, Map, DollarSign, CheckCircle, Clock, RefreshCw, FileText } from 'lucide-react';

const EMPTY = {
  first_name:'', last_name:'', email:'', phone:'', license_number:'', license_class:'',
  license_expiry:'', date_of_birth:'', address:'',
  status:'available', pay_type:'per_mile', pay_rate:'', notes:'',
};
const STATUS_OPTS = ['available','on_load','off_duty','inactive'];

export default function Drivers() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [tab, setTab]         = useState('details');
  const [confirmDel, setConfirmDel] = useState(null);
  const [docUpload, setDocUpload]   = useState(null);
  const { menu, openMenu, closeMenu } = useContextMenu();

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, search, status],
    queryFn: () => api.get('/drivers', { params: { page, limit:20, search, status } }).then(r => r.data),
    keepPreviousData: true,
  });

  const saveMut = useMutation({
    mutationFn: b => editing ? api.put(`/drivers/${editing.id}`, b) : api.post('/drivers', b),
    onSuccess: () => { toast.success(editing ? 'Driver updated' : 'Driver created'); qc.invalidateQueries(['drivers']); closeModal(); },
    onError: e => toast.error(e.response?.data?.message || 'Save failed'),
  });
  const delMut = useMutation({
    mutationFn: id => api.delete(`/drivers/${id}`),
    onSuccess: () => { toast.success('Driver deactivated'); qc.invalidateQueries(['drivers']); setConfirmDel(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, s }) => api.put(`/drivers/${id}`, { status: s }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['drivers']); },
    onError: () => toast.error('Failed'),
  });

  const openModal  = (d = null) => { setEditing(d); setForm(d ? { ...EMPTY, ...d } : EMPTY); setTab('details'); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };
  const handle     = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const rowCtx = useCallback((e, d) => openMenu(e, [
    { label: 'Edit driver',           icon: Edit,         action: () => openModal(d),                                           shortcut: 'E' },
    { label: 'Assign to load',        icon: Truck,        action: () => toast('Assign driver via Dispatch board') },
    { label: 'View on map',           icon: Map,          action: () => toast('Live map coming in Phase 2') },
    { divider: true },
    { label: 'Call driver',           icon: Phone,        action: () => d.phone && window.open(`tel:${d.phone}`) },
    { divider: true },
    { label: 'Upload license',        icon: FileText,     action: () => setDocUpload({ id:d.id, label:`${d.first_name} ${d.last_name}`, docType:'license' }) },
    { label: 'Upload document',       icon: FileText,     action: () => setDocUpload({ id:d.id, label:`${d.first_name} ${d.last_name}`, docType:'other' }) },
    { label: 'View documents',        icon: FileText,     action: () => { openModal(d); setTimeout(() => setTab('documents'), 50); } },
    { divider: true },
    { label: 'View settlements',      icon: DollarSign,   action: () => { window.location.href='/settlements'; } },
    { divider: true },
    { label: 'Set available',         icon: CheckCircle,  action: () => statusMut.mutate({ id:d.id, s:'available' }) },
    { label: 'Set off duty',          icon: Clock,        action: () => statusMut.mutate({ id:d.id, s:'off_duty' }) },
    { divider: true },
    { label: 'Deactivate driver',     icon: Trash2,       danger:true, action: () => setConfirmDel(d) },
  ]), [openMenu]);

  const rows = data?.data || []; const paging = data?.pagination;

  const licExpiry = (d) => {
    if (!d) return null;
    const days = (new Date(d) - new Date()) / 86400000;
    return days < 0 ? 'var(--danger)' : days < 60 ? 'var(--warning)' : null;
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Drivers</h1><p className="page-subtitle">{paging?.total||0} drivers</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={14} />New Driver</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} />
          <input placeholder="Search name, phone, license…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => qc.invalidateQueries(['drivers'])}><RefreshCw size={13} /></button>
      </div>

      <div className="table-wrapper">
        {isLoading ? <Spinner /> : !rows.length ? (
          <EmptyState title="No drivers yet"
            action={<button className="btn btn-primary" onClick={() => openModal()}><Plus size={14} />New Driver</button>} />
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>License</th><th>License Expiry</th><th>Pay Type</th><th>Pay Rate</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map(d => (
                <tr key={d.id} onContextMenu={e => rowCtx(e, d)} onDoubleClick={() => openModal(d)}>
                  <td style={{ fontWeight:600 }}>{d.first_name} {d.last_name}</td>
                  <td className="text-muted">{d.phone||'—'}</td>
                  <td className="text-muted" style={{ fontFamily:'monospace',fontSize:12 }}>{d.license_number||'—'} {d.license_class && <span style={{ color:'var(--gray-400)',fontSize:11 }}>({d.license_class})</span>}</td>
                  <td style={{ fontSize:12, fontWeight:600, color: licExpiry(d.license_expiry) || 'var(--gray-700)' }}>
                    {d.license_expiry ? new Date(d.license_expiry).toLocaleDateString() : '—'}
                    {licExpiry(d.license_expiry) === 'var(--danger)' && <span style={{ fontSize:10, marginLeft:4 }}>EXPIRED</span>}
                  </td>
                  <td className="text-muted" style={{ textTransform:'capitalize' }}>{(d.pay_type||'').replace(/_/g,' ')}</td>
                  <td className="text-muted">{d.pay_rate ? `$${parseFloat(d.pay_rate).toFixed(4)}` : '—'}</td>
                  <td><StatusBadge status={d.status} /></td>
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
        title="Deactivate Driver"
        message={`Deactivate ${confirmDel?.first_name} ${confirmDel?.last_name}? They will be set to inactive.`} />

      <DocUploadModal open={!!docUpload} onClose={() => setDocUpload(null)}
        entityType="driver" entityId={docUpload?.id} entityLabel={docUpload?.label}
        defaultDocType={docUpload?.docType || 'other'} />

      {/* Driver form modal */}
      <Modal open={modal} onClose={closeModal}
        title={editing ? `Edit Driver — ${editing.first_name} ${editing.last_name}` : 'New Driver'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Driver'}
          </button>
        </>}>

        <div style={{ display:'flex', borderBottom:'1px solid var(--gray-200)', marginBottom:20, gap:2 }}>
          {['details','documents'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'8px 16px', border:'none', background:'transparent', fontSize:13,
              fontWeight: tab===t ? 700 : 400, color: tab===t ? 'var(--primary)' : 'var(--gray-600)',
              borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer',
            }}>{t === 'details' ? 'Driver Details' : 'Documents'}</button>
          ))}
        </div>

        {tab === 'details' ? (
          <div className="form-grid">
            <Field label="First Name" required><input name="first_name" className="form-input" value={form.first_name} onChange={handle} required /></Field>
            <Field label="Last Name" required><input name="last_name" className="form-input" value={form.last_name} onChange={handle} required /></Field>
            <Field label="Email"><input type="email" name="email" className="form-input" value={form.email||''} onChange={handle} /></Field>
            <Field label="Phone"><input name="phone" className="form-input" value={form.phone||''} onChange={handle} /></Field>
            <Field label="Date of Birth"><input type="date" name="date_of_birth" className="form-input" value={form.date_of_birth||''} onChange={handle} /></Field>
            <Field label="Status">
              <select name="status" className="form-input" value={form.status} onChange={handle}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
            <Field label="License Number"><input name="license_number" className="form-input" value={form.license_number||''} onChange={handle} /></Field>
            <Field label="License Class"><input name="license_class" className="form-input" value={form.license_class||''} onChange={handle} placeholder="e.g. Class A, AZ" /></Field>
            <Field label="License Expiry"><input type="date" name="license_expiry" className="form-input" value={form.license_expiry||''} onChange={handle} /></Field>
            <Field label="Pay Type">
              <select name="pay_type" className="form-input" value={form.pay_type} onChange={handle}>
                <option value="per_mile">Per Mile</option>
                <option value="percentage">% of Load Revenue</option>
                <option value="flat">Flat Rate per Load</option>
              </select>
            </Field>
            <Field label={form.pay_type === 'per_mile' ? 'Rate per Mile ($)' : form.pay_type === 'percentage' ? 'Percentage (%)' : 'Flat Rate ($)'}>
              <input type="number" step="0.0001" name="pay_rate" className="form-input" value={form.pay_rate||''} onChange={handle} />
            </Field>
            <Field label="Address" className="full">
              <textarea name="address" className="form-input" rows={2} value={form.address||''} onChange={handle} />
            </Field>
            <Field label="Notes" className="full">
              <textarea name="notes" className="form-input" rows={2} value={form.notes||''} onChange={handle} />
            </Field>
          </div>
        ) : (
          editing ? (
            <DocList entityType="driver" entityId={editing.id} entityLabel={`${editing.first_name} ${editing.last_name}`} />
          ) : (
            <p style={{ color:'var(--gray-500)', fontSize:13, padding:16 }}>Save the driver first, then upload documents.</p>
          )
        )}
      </Modal>
    </div>
  );
}
