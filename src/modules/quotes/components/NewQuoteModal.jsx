import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button } from '../../../shared/components';
import { Save, Plus, Trash2, Download, Mail } from 'lucide-react';
import api from '../../../shared/services/api';
import toast from 'react-hot-toast';
import { calculateRate, CITY_GROUPS, getRegion } from '../rateEngine';
import { buildQuotePdf } from '../buildQuotePdf';

const fmt = v => '$' + (v || 0).toFixed(2);
const defaultValid = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; };
const inputS = { width: '100%', height: 28, fontSize: 12, padding: '0 8px', border: '1px solid var(--input-border)', borderRadius: 4, boxSizing: 'border-box' };
const today = () => new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

export default function NewQuoteModal({ open, onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null);
  const [emailModal, setEmailModal] = useState(false);
  const [form, setForm] = useState({ customer_id: '', customer_name: '',
    pickup_city: 'Surrey', delivery_city: 'Seattle', equipment: 'Dry Van', pickup_date: '',
    special_instructions: '', rate_override: '', valid_until: defaultValid(), internal_notes: '', commodity: '' });
  const [pallets, setPallets] = useState([{ count: 1, len: 48, wid: 48, ht: 60, weight: 500 }]);
  const [svc, setSvc] = useState({});

  useEffect(() => {
    if (open) { api.get('/customers', { params: { limit: 500 } }).then(r => setCustomers(r.data?.rows || r.data || [])).catch(() => {}); setSavedQuote(null); }
  }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPallet = (i, k, v) => setPallets(p => p.map((r, j) => j === i ? { ...r, [k]: Number(v) || 0 } : r));
  const addPallet = () => setPallets(p => [...p, { count: 1, len: 48, wid: 48, ht: 60, weight: 0 }]);
  const removePallet = (i) => setPallets(p => p.filter((_, j) => j !== i));
  const toggleSvc = (k) => setSvc(s => ({ ...s, [k]: !s[k] }));

  const result = useMemo(() => calculateRate({ pickupCity: form.pickup_city, deliveryCity: form.delivery_city, pallets, accessories: svc }),
    [form.pickup_city, form.delivery_city, pallets, svc]);

  const estRate = form.rate_override ? Number(form.rate_override) : (result.valid ? result.total : 0);

  const buildPayload = () => {
    const pR = getRegion(form.pickup_city);
    const dR = getRegion(form.delivery_city);
    return {
      customer_id: form.customer_id || null, customer_name: form.customer_name,
      origin_city: form.pickup_city, origin_state: pR?.startsWith('BC') ? 'BC' : dR === 'PDX' ? 'OR' : 'WA',
      dest_city: form.delivery_city, dest_state: dR?.startsWith('BC') ? 'BC' : dR === 'PDX' ? 'OR' : 'WA',
      equipment: form.equipment, weight: result.totalWeight || null, pieces: result.totalPieces || null,
      estimated_rate: estRate, commodity: form.commodity || null, pickup_date: form.pickup_date || null,
      special_instructions: form.special_instructions || null, valid_until: form.valid_until, internal_notes: form.internal_notes || null,
      pallet_data: pallets,
    };
  };

  const saveQuote = async () => {
    if (savedQuote) return savedQuote;
    if (!form.pickup_city || !form.delivery_city) { toast.error('Origin and destination required'); return null; }
    setSaving(true);
    try {
      const res = await api.post('/portal/admin/quotes', buildPayload());
      const q = res.data;
      setSavedQuote(q);
      onCreated?.();
      return q;
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); return null; }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    const q = await saveQuote();
    if (q) { toast.success(`Quote ${q.quote_number} created`); onClose(); }
  };

  const getPdfData = (quoteNum) => ({
    quoteNumber: quoteNum || savedQuote?.quote_number || 'DRAFT',
    date: today(), validUntil: form.valid_until, customerName: form.customer_name,
    originCity: form.pickup_city, originState: getRegion(form.pickup_city)?.startsWith('BC') ? 'BC' : 'WA',
    destCity: form.delivery_city, destState: getRegion(form.delivery_city)?.startsWith('BC') ? 'BC' : (getRegion(form.delivery_city) === 'PDX' ? 'OR' : 'WA'),
    equipment: form.equipment, pickupDate: form.pickup_date, commodity: form.commodity,
    pallets, breakdown: result.breakdown || [], total: estRate,
    totalPieces: result.totalPieces, totalWeight: result.totalWeight,
  });

  const handleDownload = async () => {
    try {
      const q = await saveQuote();
      const bytes = await buildQuotePdf(getPdfData(q?.quote_number));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `Quote_${q?.quote_number || 'DRAFT'}_${(form.customer_name || 'Customer').replace(/\s+/g, '_')}.pdf`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { toast.error('PDF failed: ' + e.message); }
  };

  const handleEmailClick = async () => {
    const q = await saveQuote();
    if (q) setEmailModal(true);
  };

  if (!open) return null;

  return (<>
    <Modal open={open && !emailModal} onClose={onClose} title="New Quote" size="lg"
      footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button icon={Download} variant="secondary" onClick={handleDownload}>Download PDF</Button>
        <Button icon={Mail} variant="secondary" onClick={handleEmailClick}>Email Customer</Button>
        <Button icon={Save} onClick={handleSave} loading={saving}>Save Quote</Button>
      </div>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left */}
        <div>
          <div className="section-header">Customer</div>
          <div style={{ marginBottom: 6 }}>
            <label className="form-label">Customer</label>
            <select className="form-input" style={{ height: 28, fontSize: 12 }} value={form.customer_id}
              onChange={e => { set('customer_id', e.target.value); const c = customers.find(c => c.id === e.target.value); if (c) set('customer_name', c.company_name); }}>
              <option value="">— Select or enter manually —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div className="section-header">Route</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label className="form-label">From City</label>
              <select style={inputS} value={form.pickup_city} onChange={e => set('pickup_city', e.target.value)}>
                {CITY_GROUPS.map(g => <optgroup key={g.label} label={g.label}>{g.cities.sort().map(c => <option key={c}>{c}</option>)}</optgroup>)}
              </select></div>
            <div><label className="form-label">To City</label>
              <select style={inputS} value={form.delivery_city} onChange={e => set('delivery_city', e.target.value)}>
                {CITY_GROUPS.map(g => <optgroup key={g.label} label={g.label}>{g.cities.sort().map(c => <option key={c}>{c}</option>)}</optgroup>)}
              </select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label className="form-label">Equipment</label>
              <select style={inputS} value={form.equipment} onChange={e => set('equipment', e.target.value)}>
                <option>Dry Van</option><option>Flatbed</option><option>Reefer</option><option>LTL</option>
              </select></div>
            <div><label className="form-label">Pickup Date</label><input style={inputS} type="date" value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)} /></div>
            <div><label className="form-label">Commodity</label><input style={inputS} value={form.commodity} onChange={e => set('commodity', e.target.value)} /></div>
          </div>
          <div className="section-header">Pallets</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '4px 2px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '4px 2px' }}>Qty</th><th style={{ padding: '4px 2px' }}>L</th>
              <th style={{ padding: '4px 2px' }}>W</th><th style={{ padding: '4px 2px' }}>H</th>
              <th style={{ padding: '4px 2px' }}>Weight</th><th style={{ padding: '4px 2px', width: 28 }}></th>
            </tr></thead>
            <tbody>
              {pallets.map((p, i) => (
                <tr key={i}>
                  <td style={{ padding: '2px', color: 'var(--text-muted)', fontSize: 10 }}>{i + 1}</td>
                  {['count','len','wid','ht','weight'].map(k => (
                    <td key={k} style={{ padding: '1px' }}>
                      <input type="number" value={p[k] || ''} onChange={e => setPallet(i, k, e.target.value)}
                        style={{ ...inputS, height: 24, padding: '0 4px', textAlign: 'center' }}
                        placeholder={k === 'weight' ? 'lb' : k === 'count' ? 'qty' : 'in'} />
                    </td>))}
                  <td style={{ padding: '1px' }}>
                    <button onClick={() => removePallet(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 2 }}><Trash2 size={12} /></button>
                  </td>
                </tr>))}
            </tbody>
          </table>
          <button onClick={addPallet} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fff', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
            <Plus size={10} /> Add Pallet</button>
        </div>
        {/* Right */}
        <div>
          <div className="section-header">Pickup Services</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, marginBottom: 8 }}>
            {[['liftPU','Liftgate'],['apptPU','Appointment'],['limitedPU','Limited Access'],['notifyPU','Notify Before'],['jobPU','Job Site']].map(([k, l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!svc[k]} onChange={() => toggleSvc(k)} /> {l}</label>))}
          </div>
          <div className="section-header">Delivery Services</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, marginBottom: 10 }}>
            {[['liftDEL','Liftgate'],['apptDEL','Appointment'],['limitedDEL','Limited Access'],['notifyDEL','Notify Before'],['jobDEL','Job Site']].map(([k, l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!svc[k]} onChange={() => toggleSvc(k)} /> {l}</label>))}
          </div>
          <div className="section-header">Rate Breakdown</div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
            {result.error ? (
              <div style={{ color: 'var(--danger)', fontSize: 12 }}>{result.error}</div>
            ) : (<>
              {result.breakdown.map((line, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed var(--border)', fontSize: 12 }}>
                  <span>{line.label}</span><span>{fmt(line.amt)}</span></div>))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontSize: 15, fontWeight: 700 }}>
                <span>Total</span><span>{fmt(result.total)}</span></div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{result.totalPieces} pcs, {(result.totalWeight || 0).toLocaleString()} lb, {result.totalSpots} spot(s)</div>
            </>)}
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="form-label">Rate Override (dispatcher)</label>
            <input style={inputS} type="number" step="0.01" placeholder={result.valid ? result.total.toFixed(2) : '0.00'}
              value={form.rate_override} onChange={e => set('rate_override', e.target.value)} />
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
            <span>Final Rate:</span><span style={{ color: 'var(--success)' }}>{fmt(estRate)}</span>
          </div>
          <div className="section-header">Quote Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label className="form-label">Valid Until</label><input style={inputS} type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} /></div>
          </div>
          <div>
            <label className="form-label">Internal Notes</label>
            <textarea className="form-input" style={{ height: 60, fontSize: 11 }} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>

    {emailModal && savedQuote && (
      <EmailQuoteModal quoteId={savedQuote.id} quoteNumber={savedQuote.quote_number}
        customerName={form.customer_name} customerId={form.customer_id} estRate={estRate}
        validUntil={form.valid_until} getPdfData={getPdfData}
        onClose={() => setEmailModal(false)} onSent={() => { setEmailModal(false); onCreated?.(); }} />
    )}
  </>);
}

function EmailQuoteModal({ quoteId, quoteNumber, customerName, customerId, estRate, validUntil, getPdfData, onClose, onSent }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState(`Quote ${quoteNumber} from Signal Transportation`);
  const [message, setMessage] = useState(
    `Please find attached your freight quote ${quoteNumber}.\nThis quote is valid until ${validUntil}.\nTotal: $${(estRate || 0).toFixed(2)}\n\nCall us at 604-867-5543 to book this shipment.`
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (customerId) {
      api.get(`/customers/${customerId}`).then(r => {
        const c = r.data;
        if (c?.main_email) setTo(c.main_email);
      }).catch(() => {});
    }
  }, [customerId]);

  const handleSend = async () => {
    if (!to) { toast.error('Enter email address'); return; }
    setSending(true);
    try {
      const bytes = await buildQuotePdf(getPdfData(quoteNumber));
      const base64 = btoa(String.fromCharCode(...bytes));
      await api.post(`/portal/admin/quotes/${quoteId}/email`, { to, subject, message, pdf_base64: base64 });
      toast.success(`Quote emailed to ${to}`);
      onSent();
    } catch (e) { toast.error('Email failed: ' + (e.response?.data?.message || e.message)); }
    setSending(false);
  };

  const inputS = { width: '100%', height: 32, fontSize: 12, padding: '0 10px', border: '1px solid var(--input-border)', borderRadius: 4, boxSizing: 'border-box' };

  return (
    <Modal open={true} onClose={onClose} title="Send Quote to Customer" size="sm"
      footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button icon={Mail} onClick={handleSend} loading={sending}>Send Email</Button>
      </div>}>
      <div>
        <div style={{ marginBottom: 10 }}>
          <label className="form-label">To</label>
          <input style={inputS} type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="customer@example.com" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label className="form-label">Subject</label>
          <input style={inputS} value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Message</label>
          <textarea className="form-input" style={{ height: 140, fontSize: 12 }} value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          PDF quote will be attached automatically. CC: signaltrucking@gmail.com
        </div>
      </div>
    </Modal>
  );
}
