import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Modal, Confirm, ContextMenu, useContextMenu, Pagination,
  StatusBadge, Spinner, EmptyState, Field, DocUploadModal, DocList,
} from '../../components/common';
import { Plus, Search, Edit, Trash2, Phone, Mail, Truck, History, Copy, Upload, FileText, RefreshCw } from 'lucide-react';

const EMPTY = {
  name:'', mc_number:'', dot_number:'', scac_code:'', contact_name:'', email:'', phone:'', fax_number:'',
  address:'', insurance_company:'', insurance_policy:'', insurance_expiry:'',
  liability_amount:'', cargo_amount:'', preferred_lanes:'', status:'active', rating:'', notes:'',
};

export default function Carriers() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [tab, setTab]         = useState('details');
  const [confirmDel, setConfirmDel] = useState(null);
  const [docUpload, setDocUpload]   = useState(null);
  const { menu, openMenu, closeMenu } = useContextMenu();

  const { data, isLoading } = useQuery({
    queryKey: ['carriers', page, search],
    queryFn: () => api.get('/carriers', { params: { page, limit: 20, search } }).then(r => r.data),
    keepPreviousData: true,
  });

  const saveMut = useMutation({
    mutationFn: b => editing ? api.put(`/carriers/${editing.id}`, b) : api.post('/carriers', b),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); qc.invalidateQueries(['carriers']); closeModal(); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });
  const delMut = useMutation({
    mutationFn: id => api.delete(`/carriers/${id}`),
    onSuccess: () => { toast.success('Deactivated'); qc.invalidateQueries(['carriers']); setConfirmDel(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openModal  = (c = null) => { setEditing(c); setForm(c ? { ...EMPTY, ...c } : EMPTY); setTab('details'); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };
  const handle     = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const rowCtx = useCallback((e, c) => openMenu(e, [
    { label: 'Edit carrier',          icon: Edit,    action: () => openModal(c),                                                 shortcut: 'E' },
    { label: 'Assign to load',        icon: Truck,   action: () => toast('Assign carrier via Dispatch board') },
    { divider: true },
    { label: 'Call carrier',          icon: Phone,   action: () => c.phone && window.open(`tel:${c.phone}`) },
    { label: 'Email carrier',         icon: Mail,    action: () => c.email && window.open(`mailto:${c.email}`) },
    { divider: true },
    { label: 'Upload insurance doc',  icon: Upload,  action: () => setDocUpload({ id: c.id, label: c.name, docType: 'insurance' }) },
    { label: 'Upload document',       icon: FileText,action: () => setDocUpload({ id: c.id, label: c.name, docType: 'other' }) },
    { label: 'View all documents',    icon: FileText,action: () => { openModal(c); setTimeout(() => setTab('documents'), 50); } },
    { divider: true },
    { label: 'Copy MC#',              icon: Copy,    action: () => { if (c.mc_number) { navigator.clipboard.writeText(c.mc_number); toast.success('MC# copied!'); } else toast.error('No MC# on file'); } },
    { label: 'Copy DOT#',             icon: Copy,    action: () => { if (c.dot_number) { navigator.clipboard.writeText(c.dot_number); toast.success('DOT# copied!'); } else toast.error('No DOT# on file'); } },
    { divider: true },
    { label: 'Deactivate carrier',    icon: Trash2,  danger: true, action: () => setConfirmDel(c) },
  ]), [openMenu]);

  const rows = data?.data || []; const paging = data?.pagination;

  // Insurance expiry colour
  const expiryColor = (d) => {
    if (!d) return 'var(--gray-400)';
    const days = (new Date(d) - new Date()) / 86400000;
    return days < 0 ? 'var(--danger)' : days < 30 ? 'var(--warning)' : 'var(--success)';
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Carriers</h1><p className="page-subtitle">{paging?.total||0} carriers</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={14} />New Carrier</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} />
          <input placeholder="Search name, MC#, DOT#…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => qc.invalidateQueries(['carriers'])}><RefreshCw size={13} /></button>
      </div>

      <div className="table-wrapper">
        {isLoading ? <Spinner /> : !rows.length ? (
          <EmptyState title="No carriers yet"
            action={<button className="btn btn-primary" onClick={() => openModal()}><Plus size={14} />New Carrier</button>} />
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['NAME','CITY','ST','CONTACT','PHONE','ALT PHONE','MC #','DOT #','INS EXPIRY','LOADS','STATUS'].map(h=>(
                  <th key={h} style={{fontSize:11,fontWeight:700,padding:'7px 10px',background:'#003865',color:'#fff',textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c,i) => {
                // Parse city/state from address field
                const addrParts = (c.address||'').split(',');
                const city = addrParts.length>=2 ? addrParts[addrParts.length-3]?.trim()||addrParts[0]?.trim()||'' : addrParts[0]?.trim()||'';
                const state = addrParts.length>=2 ? addrParts[addrParts.length-2]?.trim()||'' : '';
                const expColor = expiryColor(c.insurance_expiry);
                return (
                  <tr key={c.id} onContextMenu={e=>rowCtx(e,c)} onDoubleClick={()=>openModal(c)}
                    style={{background:i%2===0?'#fff':'#fafafa',cursor:'pointer',borderBottom:'1px solid #f0f0f0'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#eef3fb'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#fafafa'}>
                    <td style={{padding:'7px 10px',fontWeight:700,fontSize:13,color:'#003865',whiteSpace:'nowrap'}}>{c.name}</td>
                    <td style={{padding:'7px 10px',fontSize:12,color:'#444',whiteSpace:'nowrap'}}>{city||'—'}</td>
                    <td style={{padding:'7px 10px',fontSize:12,fontWeight:700,color:'#555'}}>{state||'—'}</td>
                    <td style={{padding:'7px 10px',fontSize:12,color:'#555',whiteSpace:'nowrap'}}>{c.contact_name||'—'}</td>
                    <td style={{padding:'7px 10px',fontSize:12,color:'#444',whiteSpace:'nowrap'}}>
                      {c.phone ? <a href={`tel:${c.phone}`} style={{color:'#0063A3',textDecoration:'none'}}>{c.phone}</a> : '—'}
                    </td>
                    <td style={{padding:'7px 10px',fontSize:12,color:'#888',whiteSpace:'nowrap'}}>{c.fax_number||'—'}</td>
                    <td style={{padding:'7px 10px',fontFamily:'monospace',fontSize:12,color:'#555'}}>{c.mc_number||'—'}</td>
                    <td style={{padding:'7px 10px',fontFamily:'monospace',fontSize:12,color:'#555'}}>{c.dot_number||'—'}</td>
                    <td style={{padding:'7px 10px',fontSize:12,fontWeight:600,color:expColor,whiteSpace:'nowrap'}}>
                      {c.insurance_expiry ? new Date(c.insurance_expiry).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                    </td>
                    <td style={{padding:'7px 10px',textAlign:'center',fontSize:12,color:'#888'}}>{c.load_count||0}</td>
                    <td style={{padding:'7px 10px'}}><StatusBadge status={c.status}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={paging} onPage={setPage} />
      <ContextMenu {...menu} onClose={closeMenu} />

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => delMut.mutate(confirmDel?.id)} danger
        title="Deactivate Carrier" message={`Deactivate ${confirmDel?.name}?`} />

      <DocUploadModal open={!!docUpload} onClose={() => setDocUpload(null)}
        entityType="carrier" entityId={docUpload?.id} entityLabel={docUpload?.label}
        defaultDocType={docUpload?.docType || 'insurance'} />

      {/* Carrier form modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? `Edit Carrier — ${editing.name}` : 'New Carrier'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Carrier'}
          </button>
        </>}>

        <div style={{ display:'flex', borderBottom:'1px solid var(--gray-200)', marginBottom:20, gap:2 }}>
          {['details','documents'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'8px 16px', border:'none', background:'transparent', fontSize:13,
              fontWeight: tab===t ? 700 : 400, color: tab===t ? 'var(--primary)' : 'var(--gray-600)',
              borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer',
            }}>{t === 'details' ? 'Carrier Details' : 'Documents'}</button>
          ))}
        </div>

        {tab === 'details' ? (
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Company Info</p>
            <div className="form-grid">
              <Field label="Carrier Name" required className="full">
                <input name="name" className="form-input" value={form.name||''} onChange={handle} required />
              </Field>
              <Field label="MC Number"><input name="mc_number" className="form-input" value={form.mc_number||''} onChange={handle} /></Field>
              <Field label="DOT Number"><input name="dot_number" className="form-input" value={form.dot_number||''} onChange={handle} /></Field>
              <Field label="SCAC Code"><input name="scac_code" className="form-input" value={form.scac_code||''} onChange={handle} /></Field>
              <Field label="Status">
                <select name="status" className="form-input" value={form.status} onChange={handle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </Field>
              <Field label="Rating (1-5)"><input type="number" min="1" max="5" step="0.1" name="rating" className="form-input" value={form.rating||''} onChange={handle} /></Field>
              <Field label="Contact Name"><input name="contact_name" className="form-input" value={form.contact_name||''} onChange={handle} /></Field>
              <Field label="Email"><input type="email" name="email" className="form-input" value={form.email||''} onChange={handle} /></Field>
              <Field label="Phone"><input name="phone" className="form-input" value={form.phone||''} onChange={handle} /></Field>
              <Field label="Address" className="full"><textarea name="address" className="form-input" rows={2} value={form.address||''} onChange={handle} /></Field>
            </div>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:1, margin:'16px 0 12px' }}>Insurance</p>
            <div className="form-grid">
              <Field label="Insurance Company"><input name="insurance_company" className="form-input" value={form.insurance_company||''} onChange={handle} /></Field>
              <Field label="Policy Number"><input name="insurance_policy" className="form-input" value={form.insurance_policy||''} onChange={handle} /></Field>
              <Field label="Expiry Date"><input type="date" name="insurance_expiry" className="form-input" value={form.insurance_expiry||''} onChange={handle} /></Field>
              <Field label="Liability Amount ($)"><input type="number" name="liability_amount" className="form-input" value={form.liability_amount||''} onChange={handle} /></Field>
              <Field label="Cargo Amount ($)"><input type="number" name="cargo_amount" className="form-input" value={form.cargo_amount||''} onChange={handle} /></Field>
              <Field label="Preferred Lanes"><input name="preferred_lanes" className="form-input" value={form.preferred_lanes||''} onChange={handle} /></Field>
              <Field label="Notes" className="full"><textarea name="notes" className="form-input" rows={2} value={form.notes||''} onChange={handle} /></Field>
            </div>
          </div>
        ) : (
          editing ? (
            <DocList entityType="carrier" entityId={editing.id} entityLabel={editing.name} />
          ) : (
            <p style={{ color:'var(--gray-500)', fontSize:13, padding:16 }}>Save the carrier first, then upload documents.</p>
          )
        )}
      </Modal>
    </div>
  );
}
