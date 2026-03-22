import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Modal, Pagination, StatusBadge, Spinner, EmptyState, Field, Currency,
  ContextMenu, useContextMenu, Confirm,
} from '../../components/common';
import { Plus, X, Edit, Download, Mail, DollarSign, CheckCircle, XCircle, Search, RefreshCw, Trash2 } from 'lucide-react';

const EMPTY_LINE = { description:'', line_type:'pay', amount:'', load_id:'' };

export default function Settlements() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [form, setForm]     = useState({ driver_id:'', period_start:'', period_end:'', notes:'', lines:[] });
  const [line, setLine]     = useState({ ...EMPTY_LINE });
  const [confirmVoid, setConfirmVoid] = useState(null);
  const { menu, openMenu, closeMenu } = useContextMenu();

  const { data, isLoading } = useQuery({
    queryKey: ['settlements', page, status, search],
    queryFn: () => api.get('/settlements', { params: { page, limit:20, status, search } }).then(r => r.data),
    keepPreviousData: true,
  });
  const { data: drivers } = useQuery({
    queryKey: ['drivers-dropdown'],
    queryFn: () => api.get('/drivers', { params: { limit:200 } }).then(r => r.data.data),
  });
  const { data: loads } = useQuery({
    queryKey: ['loads-dropdown-stl'],
    queryFn: () => api.get('/loads', { params: { limit:200, status:'delivered' } }).then(r => r.data.data),
  });
  const { data: detail } = useQuery({
    queryKey: ['settlement-detail', detailModal?.id],
    queryFn: () => api.get(`/settlements/${detailModal.id}`).then(r => r.data.data),
    enabled: !!detailModal?.id,
  });

  const saveMut = useMutation({
    mutationFn: b => api.post('/settlements', b),
    onSuccess: () => {
      toast.success('Settlement created');
      qc.invalidateQueries(['settlements']);
      setModal(false);
      setForm({ driver_id:'', period_start:'', period_end:'', notes:'', lines:[] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });
  const approveMut = useMutation({
    mutationFn: id => api.put(`/settlements/${id}/approve`),
    onSuccess: () => { toast.success('Approved'); qc.invalidateQueries(['settlements']); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });
  const paidMut = useMutation({
    mutationFn: id => api.put(`/settlements/${id}/paid`),
    onSuccess: () => { toast.success('Marked paid'); qc.invalidateQueries(['settlements']); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });
  const voidMut = useMutation({
    mutationFn: id => api.put(`/settlements/${id}/void`),
    onSuccess: () => { toast.success('Voided'); qc.invalidateQueries(['settlements']); setConfirmVoid(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const addLine = () => {
    if (!line.description.trim() || !line.amount) { toast.error('Description and amount required'); return; }
    setForm(f => ({ ...f, lines: [...f.lines, { ...line, amount: parseFloat(line.amount) }] }));
    setLine({ ...EMPTY_LINE });
  };
  const removeLine = (i) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));

  const gross      = form.lines.filter(l => l.line_type !== 'deduction').reduce((a, l) => a + (parseFloat(l.amount)||0), 0);
  const deductions = form.lines.filter(l => l.line_type === 'deduction').reduce((a, l) => a + (parseFloat(l.amount)||0), 0);
  const netPay     = gross - deductions;

  const rowCtx = useCallback((e, s) => openMenu(e, [
    { label: 'View details',       icon: Edit,         action: () => setDetailModal(s) },
    { label: 'Download PDF',       icon: Download,     action: () => toast('PDF export coming in Phase 2') },
    { label: 'Email to driver',    icon: Mail,         action: () => toast('Email driver feature coming in Phase 2') },
    { divider: true },
    { label: 'Approve',            icon: CheckCircle,  action: () => s.status==='draft' ? approveMut.mutate(s.id) : toast.error('Only draft settlements can be approved') },
    { label: 'Mark paid',          icon: DollarSign,   action: () => s.status==='approved' ? paidMut.mutate(s.id) : toast.error('Must be approved first') },
    { divider: true },
    { label: 'Void settlement',    icon: XCircle,      danger:true, action: () => setConfirmVoid(s) },
  ]), [openMenu]);

  const rows = data?.data || []; const paging = data?.pagination;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Driver Settlements</h1><p className="page-subtitle">{paging?.total||0} settlements</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} />New Settlement</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} />
          <input placeholder="Search driver name, settlement #…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          {['draft','approved','paid','void'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => qc.invalidateQueries(['settlements'])}><RefreshCw size={13} /></button>
      </div>

      <div className="table-wrapper">
        {isLoading ? <Spinner /> : !rows.length ? (
          <EmptyState title="No settlements yet"
            action={<button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} />New Settlement</button>} />
        ) : (
          <table>
            <thead>
              <tr><th>Settlement #</th><th>Driver</th><th>Period</th><th>Gross Pay</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id} onContextMenu={e => rowCtx(e, s)} onDoubleClick={() => setDetailModal(s)}>
                  <td style={{ fontWeight:700, fontFamily:'monospace', fontSize:12 }}>{s.settlement_number}</td>
                  <td style={{ fontWeight:600 }}>{s.driver_name}</td>
                  <td className="text-muted" style={{ fontSize:12 }}>
                    {new Date(s.period_start).toLocaleDateString()} – {new Date(s.period_end).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight:600, color:'var(--success)' }}><Currency value={s.gross_pay} /></td>
                  <td style={{ color:'var(--danger)' }}><Currency value={s.total_deductions} /></td>
                  <td style={{ fontWeight:700 }}><Currency value={s.net_pay} /></td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={paging} onPage={setPage} />
      <ContextMenu {...menu} onClose={closeMenu} />

      <Confirm open={!!confirmVoid} onClose={() => setConfirmVoid(null)}
        onConfirm={() => voidMut.mutate(confirmVoid?.id)} danger
        title="Void Settlement" message={`Void settlement ${confirmVoid?.settlement_number}?`} />

      {/* Detail modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)}
        title={`Settlement — ${detailModal?.settlement_number}`} size="lg"
        footer={<>
          {detail?.status === 'draft' && <button className="btn btn-secondary" onClick={() => { approveMut.mutate(detailModal.id); setDetailModal(null); }}>Approve</button>}
          {detail?.status === 'approved' && <button className="btn btn-success" onClick={() => { paidMut.mutate(detailModal.id); setDetailModal(null); }}><DollarSign size={14} /> Mark Paid</button>}
          <button className="btn btn-secondary" onClick={() => setDetailModal(null)}>Close</button>
        </>}>
        {detail && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
              {[
                { label:'Driver', value: detail.driver_name },
                { label:'Period', value: `${new Date(detail.period_start).toLocaleDateString()} – ${new Date(detail.period_end).toLocaleDateString()}` },
                { label:'Status', value: <StatusBadge status={detail.status} /> },
                { label:'Gross Pay', value: <Currency value={detail.gross_pay} />, green: true },
                { label:'Deductions', value: <Currency value={detail.total_deductions} />, red: true },
                { label:'Net Pay', value: <Currency value={detail.net_pay} />, bold: true },
              ].map(({ label, value, green, red, bold }) => (
                <div key={label} style={{ background:'var(--gray-50)', padding:'10px 14px', borderRadius:6 }}>
                  <p style={{ fontSize:11, color:'var(--gray-500)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{label}</p>
                  <p style={{ fontSize:14, fontWeight: bold ? 700 : 600, color: green ? 'var(--success)' : red ? 'var(--danger)' : 'var(--gray-900)' }}>{value}</p>
                </div>
              ))}
            </div>
            <table>
              <thead><tr><th>Description</th><th>Load #</th><th>Type</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
              <tbody>
                {(detail.lines||[]).map((l, i) => (
                  <tr key={i}>
                    <td>{l.description}</td>
                    <td className="text-muted" style={{ fontFamily:'monospace',fontSize:12 }}>{l.load_number||'—'}</td>
                    <td><StatusBadge status={l.line_type} /></td>
                    <td style={{ textAlign:'right', fontWeight:600, color: l.line_type==='deduction' ? 'var(--danger)' : 'var(--success)' }}>
                      {l.line_type==='deduction' ? '-' : '+'}<Currency value={l.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {detail.notes && <p style={{ marginTop:12, fontSize:13, color:'var(--gray-600)', fontStyle:'italic' }}>{detail.notes}</p>}
          </div>
        )}
      </Modal>

      {/* Create settlement modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Settlement" size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.lines.length}>
            {saveMut.isPending ? 'Creating…' : `Create Settlement (Net: $${netPay.toFixed(2)})`}
          </button>
        </>}>
        <div className="form-grid">
          <Field label="Driver" required>
            <select name="driver_id" className="form-input" value={form.driver_id}
              onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))} required>
              <option value="">Select driver…</option>
              {(drivers||[]).map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <input name="notes" className="form-input" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>
          <Field label="Period Start" required>
            <input type="date" className="form-input" value={form.period_start}
              onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} required />
          </Field>
          <Field label="Period End" required>
            <input type="date" className="form-input" value={form.period_end}
              onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} required />
          </Field>
        </div>

        {/* Line item builder */}
        <div style={{ marginTop:20 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Pay Items</p>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:8, alignItems:'end', marginBottom:8 }}>
            <Field label="Description">
              <input className="form-input" placeholder="e.g. Load LD-1234 — Toronto to Vancouver" value={line.description}
                onChange={e => setLine(l => ({ ...l, description: e.target.value }))} />
            </Field>
            <Field label="Type">
              <select className="form-input" value={line.line_type} onChange={e => setLine(l => ({ ...l, line_type: e.target.value }))}>
                <option value="pay">Pay</option>
                <option value="bonus">Bonus</option>
                <option value="deduction">Deduction</option>
              </select>
            </Field>
            <Field label="Load (opt.)">
              <select className="form-input" value={line.load_id} onChange={e => setLine(l => ({ ...l, load_id: e.target.value }))}>
                <option value="">—</option>
                {(loads||[]).map(ld => <option key={ld.id} value={ld.id}>{ld.load_number}</option>)}
              </select>
            </Field>
            <Field label="Amount ($)">
              <input type="number" step="0.01" className="form-input" value={line.amount}
                onChange={e => setLine(l => ({ ...l, amount: e.target.value }))} />
            </Field>
            <button className="btn btn-primary" style={{ marginBottom:2 }} onClick={addLine}><Plus size={14} /></button>
          </div>

          {form.lines.length > 0 ? (
            <div style={{ border:'1px solid var(--gray-200)', borderRadius:6, overflow:'hidden' }}>
              <table>
                <thead><tr><th>Description</th><th>Type</th><th>Load</th><th style={{ textAlign:'right' }}>Amount</th><th></th></tr></thead>
                <tbody>
                  {form.lines.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontSize:13 }}>{l.description}</td>
                      <td><StatusBadge status={l.line_type} /></td>
                      <td className="text-muted" style={{ fontFamily:'monospace',fontSize:12 }}>
                        {l.load_id ? (loads||[]).find(ld => ld.id === l.load_id)?.load_number || l.load_id.slice(0,8) : '—'}
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600, color: l.line_type==='deduction' ? 'var(--danger)' : 'var(--success)' }}>
                        {l.line_type==='deduction' ? '-' : '+'}<Currency value={l.amount} />
                      </td>
                      <td><button className="btn-icon" onClick={() => removeLine(i)} style={{ color:'var(--danger)' }}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding:'10px 14px', borderTop:'1px solid var(--gray-200)', display:'flex', justifyContent:'flex-end', gap:24, fontSize:13 }}>
                <span style={{ color:'var(--success)' }}>Gross: <strong><Currency value={gross} /></strong></span>
                <span style={{ color:'var(--danger)' }}>Deductions: <strong><Currency value={deductions} /></strong></span>
                <span style={{ fontWeight:700, fontSize:14 }}>Net: <Currency value={netPay} /></span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize:13, color:'var(--gray-400)', fontStyle:'italic', marginTop:8 }}>No pay items yet — add at least one line above.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
