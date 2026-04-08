import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../shared/components';
import { ArrowRight, Download, Mail } from 'lucide-react';
import { formatDate, formatCurrency } from '../../../shared/utils/formatters';
import { buildQuotePdf } from '../buildQuotePdf';
import api from '../../../shared/services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Pending' },
  reviewed: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'Reviewed' },
  approved: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Approved' },
  converted: { bg: '#D1FAE5', color: '#047857', border: '#6EE7B7', label: 'Converted' },
  declined: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Declined' },
};
const SOURCE_STYLES = {
  internal: { bg: '#F3F4F6', color: '#4B5563', label: 'INTERNAL' },
  portal: { bg: '#DBEAFE', color: '#1D4ED8', label: 'PORTAL' },
};

const bdg = (s) => ({ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
  background: s.bg, color: s.color, border: `1px solid ${s.border || s.bg}` });
const kv = { display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4, fontSize: 12, padding: '4px 0' };
const kvL = { color: 'var(--text-muted)', fontWeight: 500 };

export default function QuoteDetailModal({ open, onClose, quote, onConvert, onRefresh }) {
  const [emailOpen, setEmailOpen] = useState(false);

  if (!open || !quote) return null;
  const q = quote;
  const st = STATUS_STYLES[q.status] || STATUS_STYLES.pending;
  const src = SOURCE_STYLES[q.source] || SOURCE_STYLES.internal;

  const getPdfData = () => ({
    quoteNumber: q.quote_number, date: formatDate(q.created_at), validUntil: q.valid_until ? formatDate(q.valid_until) : '',
    customerName: q.customer_name, originCity: q.origin_city, originState: q.origin_state,
    destCity: q.dest_city, destState: q.dest_state, equipment: q.equipment,
    pickupDate: q.pickup_date ? formatDate(q.pickup_date) : '', commodity: q.commodity,
    pallets: [], breakdown: [], total: Number(q.estimated_rate) || 0,
    totalPieces: q.pieces, totalWeight: Number(q.weight) || 0,
  });

  const handleDownload = async () => {
    try {
      const bytes = await buildQuotePdf(getPdfData());
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `Quote_${q.quote_number}_${(q.customer_name || 'Customer').replace(/\s+/g, '_')}.pdf`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { toast.error('PDF failed: ' + e.message); }
  };

  return (<>
    <Modal open={open && !emailOpen} onClose={onClose} title={`Quote ${q.quote_number || ''}`} size="md"
      footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button icon={Download} variant="secondary" onClick={handleDownload}>Download PDF</Button>
        <Button icon={Mail} variant="secondary" onClick={() => setEmailOpen(true)}>Email Customer</Button>
        {q.status !== 'converted' && q.status !== 'declined' && (
          <Button icon={ArrowRight} onClick={() => { onClose(); onConvert?.(q); }}>Convert to Load</Button>
        )}
      </div>}>
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={bdg(st)}>{st.label}</span>
          <span style={bdg(src)}>{src.label}</span>
          {q.emailed_at && <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>Emailed {formatDate(q.emailed_at)}</span>}
          {q.converted_load_number && (
            <a href={`/loads?load=${q.converted_load_number}`} style={{ fontSize: 11, color: '#047857', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>{q.converted_load_number}</a>
          )}
        </div>

        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
          <div style={kv}><span style={kvL}>Quote #:</span><strong>{q.quote_number}</strong></div>
          <div style={kv}><span style={kvL}>Date:</span><span>{formatDate(q.created_at)}</span></div>
          <div style={kv}><span style={kvL}>Source:</span><span style={bdg(src)}>{src.label}</span></div>
          {q.valid_until && <div style={kv}><span style={kvL}>Valid Until:</span><span>{formatDate(q.valid_until)}</span></div>}
        </div>

        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
          <div style={kv}><span style={kvL}>Customer:</span><strong>{q.customer_name || '—'}</strong></div>
        </div>

        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
          <div style={kv}>
            <span style={kvL}>Route:</span>
            <span><strong>{q.origin_city}{q.origin_state ? `, ${q.origin_state}` : ''}</strong> → <strong>{q.dest_city}{q.dest_state ? `, ${q.dest_state}` : ''}</strong></span>
          </div>
          <div style={kv}><span style={kvL}>Equipment:</span><span>{q.equipment || 'Dry Van'}</span></div>
          <div style={kv}><span style={kvL}>Weight:</span><span>{q.weight ? `${Number(q.weight).toLocaleString()} lb` : '—'}</span></div>
          <div style={kv}><span style={kvL}>Pieces:</span><span>{q.pieces || '—'}</span></div>
        </div>

        {/* Pallets */}
        <PalletTable data={q.pallet_data} />

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
            <span>Estimated Rate:</span>
            <span style={{ color: 'var(--success)' }}>{q.estimated_rate ? formatCurrency(q.estimated_rate) : '—'}</span>
          </div>
        </div>

        {(q.notes || q.internal_notes || q.special_instructions) && (
          <div style={{ fontSize: 12 }}>
            {q.notes && <div style={kv}><span style={kvL}>Notes:</span><span>{q.notes}</span></div>}
            {q.internal_notes && <div style={kv}><span style={kvL}>Internal Notes:</span><span>{q.internal_notes}</span></div>}
            {q.special_instructions && <div style={kv}><span style={kvL}>Instructions:</span><span>{q.special_instructions}</span></div>}
          </div>
        )}
      </div>
    </Modal>

    {emailOpen && (
      <DetailEmailModal quote={q} getPdfData={getPdfData} onClose={() => setEmailOpen(false)}
        onSent={() => { setEmailOpen(false); onRefresh?.(); }} />
    )}
  </>);
}

function PalletTable({ data }) {
  const pallets = Array.isArray(data) ? data : (typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : null);
  if (!pallets || pallets.length === 0) {
    return <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4, fontSize: 12, padding: '4px 0', marginBottom: 8 }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pallets:</span><span>—</span></div>;
  }
  const th = { padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', borderBottom: '1px solid var(--border)' };
  const td = { padding: '3px 8px', fontSize: 11, textAlign: 'center', borderBottom: '1px solid var(--border-light, #f0f0f0)' };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>PALLETS</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={{ ...th, textAlign: 'left', width: 30 }}>#</th>
          <th style={th}>Qty</th><th style={th}>L (in)</th><th style={th}>W (in)</th><th style={th}>H (in)</th><th style={th}>Weight</th>
        </tr></thead>
        <tbody>
          {pallets.map((p, i) => (
            <tr key={i}>
              <td style={{ ...td, textAlign: 'left' }}>{i + 1}</td>
              <td style={td}>{p.count || 1}</td>
              <td style={td}>{p.len || 48}</td>
              <td style={td}>{p.wid || 48}</td>
              <td style={td}>{p.ht || 0}</td>
              <td style={td}>{(p.weight || 0).toLocaleString()} lb</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailEmailModal({ quote, getPdfData, onClose, onSent }) {
  const q = quote;
  const [to, setTo] = useState(q.emailed_to || '');
  const [subject, setSubject] = useState(`Quote ${q.quote_number} from Signal Transportation`);
  const [message, setMessage] = useState(
    `Please find attached your freight quote ${q.quote_number}.\n${q.valid_until ? 'This quote is valid until ' + formatDate(q.valid_until) + '.\n' : ''}Total: ${q.estimated_rate ? '$' + Number(q.estimated_rate).toFixed(2) : 'TBD'}\n\nCall us at 604-867-5543 to book this shipment.`
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!to && q.customer_id) {
      api.get(`/customers/${q.customer_id}`).then(r => { if (r.data?.main_email) setTo(r.data.main_email); }).catch(() => {});
    }
  }, [q.customer_id, to]);

  const handleSend = async () => {
    if (!to) { toast.error('Enter email address'); return; }
    setSending(true);
    try {
      const bytes = await buildQuotePdf(getPdfData());
      const base64 = btoa(String.fromCharCode(...bytes));
      await api.post(`/portal/admin/quotes/${q.id}/email`, { to, subject, message, pdf_base64: base64 });
      toast.success(`Quote emailed to ${to}`);
      onSent();
    } catch (e) { toast.error('Email failed: ' + (e.response?.data?.message || e.message)); }
    setSending(false);
  };

  const inpS = { width: '100%', height: 32, fontSize: 12, padding: '0 10px', border: '1px solid var(--input-border)', borderRadius: 4, boxSizing: 'border-box' };

  return (
    <Modal open={true} onClose={onClose} title="Send Quote to Customer" size="sm"
      footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button icon={Mail} onClick={handleSend} loading={sending}>Send Email</Button>
      </div>}>
      <div>
        <div style={{ marginBottom: 10 }}><label className="form-label">To</label>
          <input style={inpS} type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="customer@example.com" /></div>
        <div style={{ marginBottom: 10 }}><label className="form-label">Subject</label>
          <input style={inpS} value={subject} onChange={e => setSubject(e.target.value)} /></div>
        <div><label className="form-label">Message</label>
          <textarea className="form-input" style={{ height: 140, fontSize: 12 }} value={message} onChange={e => setMessage(e.target.value)} /></div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>PDF quote attached automatically. CC: signaltrucking@gmail.com</div>
      </div>
    </Modal>
  );
}
