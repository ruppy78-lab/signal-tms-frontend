import React, { useState, useEffect } from 'react';
import { Modal, Button, Confirm } from '../../../shared/components';
import { FormSection } from '../../../shared/components/Form';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { statusColor } from '../../../shared/utils/helpers';
import { Send, CreditCard, XCircle, Printer, Plus, Trash2, Upload, FileText } from 'lucide-react';
import api from '../../../shared/services/api';
import invoicingApi from '../services/invoicingApi';
import toast from 'react-hot-toast';

const PAY_METHODS = ['Cheque', 'EFT', 'Wire', 'Credit Card', 'Cash'];

export default function InvoiceDetail({ open, onClose, invoice, onSend, onRecordPayment, onVoid }) {
  const [inv, setInv] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [voidConfirm, setVoidConfirm] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [newCharge, setNewCharge] = useState({ description: '', amount: '' });
  const [pay, setPay] = useState({ amount: '', method: 'EFT', reference: '', date: '', notes: '' });

  const fetchDetail = () => {
    if (invoice?.id) invoicingApi.getInvoice(invoice.id).then(r => setInv(r.data || r)).catch(() => {});
    else setInv(null);
  };

  useEffect(() => { fetchDetail(); }, [invoice]);

  if (!open || !inv) return null;

  const payments = inv.payments || [];
  const lineItems = inv.line_items || [];
  const loadAcc = inv.load_accessorials || [];
  const canSend = inv.status === 'draft';
  const canPay = ['sent', 'unpaid', 'partial'].includes(inv.status);
  const canVoid = inv.status !== 'void' && inv.status !== 'paid';

  const extraTotal = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);
  const grandTotal = parseFloat(inv.total_amount || 0) + extraTotal;

  const handlePaySubmit = () => {
    if (!pay.amount || Number(pay.amount) <= 0) return;
    onRecordPayment(inv.id, { amount: Number(pay.amount), payment_method: pay.method, reference_number: pay.reference, payment_date: pay.date, notes: pay.notes });
    setPayOpen(false);
    setPay({ amount: '', method: 'EFT', reference: '', date: '', notes: '' });
  };

  const handleAddCharge = async () => {
    if (!newCharge.description || !newCharge.amount) return;
    try {
      await invoicingApi.addLineItem(inv.id, newCharge);
      toast.success('Charge added');
      setNewCharge({ description: '', amount: '' });
      setAddChargeOpen(false);
      fetchDetail();
    } catch { toast.error('Failed to add charge'); }
  };

  const handleDeleteCharge = async (itemId) => {
    try { await invoicingApi.deleteLineItem(inv.id, itemId); toast.success('Removed'); fetchDetail(); }
    catch { toast.error('Failed'); }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const fmt = v => '$' + (parseFloat(v) || 0).toFixed(2);
    const fmtD = v => v ? new Date(v).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const css = `body{font-family:Arial,sans-serif;font-size:12px;padding:30px;max-width:800px;margin:0 auto;color:#1C2B3A}
      .hdr{display:flex;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1C2B3A}
      .co{font-size:18px;font-weight:700;color:#1a3a6b}.addr{font-size:11px;color:#6B7280;margin-top:4px}
      .inv-num{font-size:20px;font-weight:700;color:#1a3a6b}
      h3{font-size:12px;text-transform:uppercase;color:#1a3a6b;border-bottom:1px solid #E5E7EB;padding-bottom:4px;margin:16px 0 8px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #E5E7EB;font-size:11px}
      th{background:#F8FAFC;font-weight:700;font-size:10px;text-transform:uppercase}
      .totals{max-width:280px;margin-left:auto}.totals div{display:flex;justify-content:space-between;padding:3px 0;font-size:12px}
      .totals .grand{font-size:14px;font-weight:700;border-top:2px solid #1C2B3A;padding-top:6px;margin-top:6px}
      .parties{display:flex;gap:16px;margin-bottom:16px}.parties .party{flex:1}.parties .party-label{font-size:10px;text-transform:uppercase;font-weight:700;color:#6B7280;margin-bottom:4px;letter-spacing:0.04em}.parties .party-name{font-weight:700;font-size:12px}.parties .party-addr{font-size:11px;color:#4B5563;margin-top:2px;line-height:1.4}
      .footer{margin-top:32px;text-align:center;color:#9CA3AF;font-size:11px;border-top:1px solid #E5E7EB;padding-top:12px}
      .no-print{text-align:center;margin-bottom:16px}.no-print button{padding:8px 24px;background:#1a3a6b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px}
      @media print{.no-print{display:none}}`;
    w.document.write(`<!DOCTYPE html><html><head><title>${inv.invoice_number}</title><style>${css}</style></head><body>
      <div class="no-print"><button onclick="window.print()">Print Invoice</button></div>
      <div class="hdr"><div><div class="co">Signal Transportation Ltd</div><div class="addr">3170 194th St Unit 102, Surrey BC V3Z 0N4<br>604-867-5543 | signaltrucking@gmail.com</div></div>
        <div style="text-align:right"><div class="inv-num">${inv.invoice_number}</div><div style="font-size:11px;color:#6B7280;margin-top:4px">Date: ${fmtD(inv.created_at)}<br>Due: ${fmtD(inv.due_date)}</div></div></div>
      <div class="parties">
        <div class="party"><div class="party-label">Bill To</div><div class="party-name">${inv.customer_name || ''}</div>${inv.customer_address ? `<div class="party-addr">${inv.customer_address}<br>${inv.customer_city || ''}, ${inv.customer_state || ''} ${inv.customer_zip || ''}</div>` : ''}</div>
        <div class="party"><div class="party-label">Ship From</div><div class="party-name">${inv.shipper_name || '—'}</div>${inv.shipper_address ? `<div class="party-addr">${inv.shipper_address}<br>` : '<div class="party-addr">'}${inv.origin_city || ''}${inv.origin_state ? ', ' + inv.origin_state : ''} ${inv.shipper_zip || ''}</div></div>
        <div class="party"><div class="party-label">Ship To</div><div class="party-name">${inv.consignee_name || '—'}</div>${inv.consignee_address ? `<div class="party-addr">${inv.consignee_address}<br>` : '<div class="party-addr">'}${inv.dest_city || ''}${inv.dest_state ? ', ' + inv.dest_state : ''} ${inv.consignee_zip || ''}</div></div>
      </div>
      ${inv.load_number ? `<h3>Load Details</h3><div style="font-size:11px;margin-bottom:12px">Load: <strong>${inv.load_number}</strong> | ${inv.origin_city || ''},${inv.origin_state || ''} → ${inv.dest_city || ''},${inv.dest_state || ''} | ${inv.total_pieces || 0} pcs ${inv.total_weight ? Number(inv.total_weight).toLocaleString() + ' lb' : ''}</div>` : ''}
      <h3>Charges</h3><table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>
        <tr><td>Base Rate</td><td style="text-align:right">${fmt(inv.subtotal)}</td></tr>
        ${parseFloat(inv.fuel_surcharge) > 0 ? `<tr><td>Fuel Surcharge</td><td style="text-align:right">${fmt(inv.fuel_surcharge)}</td></tr>` : ''}
        ${loadAcc.map(a => `<tr><td>${a.charge_type}</td><td style="text-align:right">${fmt(a.amount)}</td></tr>`).join('')}
        ${lineItems.map(li => `<tr><td>${li.description}</td><td style="text-align:right">${fmt(li.amount)}</td></tr>`).join('')}
      </tbody></table>
      <div class="totals">
        <div><span>Subtotal</span><span>${fmt(inv.subtotal)}</span></div>
        ${parseFloat(inv.fuel_surcharge) > 0 ? `<div><span>FSC</span><span>${fmt(inv.fuel_surcharge)}</span></div>` : ''}
        <div><span>Tax</span><span>${fmt(inv.tax_amount)}</span></div>
        <div class="grand"><span>Total</span><span>${fmt(grandTotal)}</span></div>
        <div><span>Paid</span><span style="color:#059669">${fmt(inv.amount_paid)}</span></div>
        <div><span><strong>Balance</strong></span><span style="color:${parseFloat(inv.balance_due) > 0 ? '#DC2626' : '#059669'}"><strong>${fmt(inv.balance_due)}</strong></span></div>
      </div>
      <div class="footer">Thank you for your business!<br>Signal Transportation Ltd — signaltrucking@gmail.com</div>
      <script>setTimeout(function(){window.print()},500)</script></body></html>`);
    w.document.close();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Invoice ${inv.invoice_number}`} size="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div><span style={{ fontSize: 18, fontWeight: 700, marginRight: 8 }}>{inv.invoice_number}</span>
          <span className={`badge ${statusColor(inv.status)}`}>{inv.status}</span></div>
        <Button size="sm" icon={Printer} variant="secondary" onClick={handlePrint}>Print</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormSection title="Bill To">
          <div style={{ fontSize: 12 }}><strong>{inv.customer_name}</strong>
            {inv.customer_address && <div>{inv.customer_address}</div>}
            {inv.customer_city && <div>{inv.customer_city}, {inv.customer_state} {inv.customer_zip}</div>}
            {inv.customer_phone && <div>{inv.customer_phone}</div>}</div>
        </FormSection>
        <FormSection title="Ship From">
          <div style={{ fontSize: 12 }}><strong>{inv.shipper_name || '—'}</strong>
            {inv.shipper_address && <div>{inv.shipper_address}</div>}
            <div>{inv.origin_city}{inv.origin_state ? `, ${inv.origin_state}` : ''} {inv.shipper_zip || ''}</div></div>
        </FormSection>
        <FormSection title="Ship To">
          <div style={{ fontSize: 12 }}><strong>{inv.consignee_name || '—'}</strong>
            {inv.consignee_address && <div>{inv.consignee_address}</div>}
            <div>{inv.dest_city}{inv.dest_state ? `, ${inv.dest_state}` : ''} {inv.consignee_zip || ''}</div></div>
        </FormSection>
      </div>

      {inv.load_number && (
        <FormSection title="Load Details">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Load:</span> <strong>{inv.load_number}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Pickup:</span> {formatDate(inv.pickup_date)}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Delivery:</span> {formatDate(inv.delivery_date)}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Equipment:</span> {inv.equipment_type || 'Dry Van'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>PCS:</span> {inv.total_pieces || 0}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Weight:</span> {inv.total_weight ? Number(inv.total_weight).toLocaleString() + ' lb' : '—'}</div>
          </div>
          {inv.pod ? (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--success)' }}>POD on file — uploaded {formatDate(inv.pod.created_at)}</span>
              <a href={`${api.defaults.baseURL.replace('/api', '')}${inv.pod.file_url}`} target="_blank" rel="noreferrer"
                className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <FileText size={11} /> View POD</a>
            </div>
          ) : (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>POD not yet received</span>
              <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Upload size={11} /> Upload POD
                <input type="file" hidden accept=".jpg,.jpeg,.png,.pdf" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !inv.load_id) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('doc_type', 'POD');
                  fd.append('entity_type', 'load');
                  fd.append('entity_id', inv.load_id);
                  try {
                    await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    toast.success('POD uploaded');
                    fetchDetail();
                  } catch { toast.error('Upload failed'); }
                  e.target.value = '';
                }} />
              </label>
            </div>
          )}
        </FormSection>
      )}

      <FormSection title="Charges">
        <table className="tms-table" style={{ fontSize: 12 }}>
          <thead><tr><th>Description</th><th style={{ textAlign: 'right', width: 100 }}>Amount</th><th style={{ width: 30 }}></th></tr></thead>
          <tbody>
            <tr><td>Base Rate</td><td style={{ textAlign: 'right' }}>{formatCurrency(inv.subtotal)}</td><td></td></tr>
            {parseFloat(inv.fuel_surcharge) > 0 && <tr><td>Fuel Surcharge</td><td style={{ textAlign: 'right' }}>{formatCurrency(inv.fuel_surcharge)}</td><td></td></tr>}
            {loadAcc.map((a, i) => <tr key={'a'+i}><td>{a.charge_type}</td><td style={{ textAlign: 'right' }}>{formatCurrency(a.amount)}</td><td></td></tr>)}
            {lineItems.map(li => (
              <tr key={li.id}><td>{li.description}</td><td style={{ textAlign: 'right' }}>{formatCurrency(li.amount)}</td>
                <td><button onClick={() => handleDeleteCharge(li.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}><Trash2 size={11} /></button></td></tr>
            ))}
          </tbody>
        </table>
        {addChargeOpen ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <input className="form-input" placeholder="Description" value={newCharge.description} onChange={e => setNewCharge(c => ({ ...c, description: e.target.value }))} style={{ flex: 1, height: 28, fontSize: 12 }} />
            <input className="form-input" type="number" step="0.01" placeholder="$0.00" value={newCharge.amount} onChange={e => setNewCharge(c => ({ ...c, amount: e.target.value }))} style={{ width: 100, height: 28, fontSize: 12 }} />
            <Button size="xs" onClick={handleAddCharge}>Add</Button>
            <Button size="xs" variant="secondary" onClick={() => setAddChargeOpen(false)}>X</Button>
          </div>
        ) : (
          <button onClick={() => setAddChargeOpen(true)} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px dashed var(--border-dark)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>
            <Plus size={11} /> Add Charge</button>
        )}
      </FormSection>

      <FormSection title="Totals">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 24px', fontSize: 13, maxWidth: 300, marginLeft: 'auto' }}>
          <span>Subtotal</span><span style={{ textAlign: 'right' }}>{formatCurrency(inv.subtotal)}</span>
          {parseFloat(inv.fuel_surcharge) > 0 && <><span>Fuel Surcharge</span><span style={{ textAlign: 'right' }}>{formatCurrency(inv.fuel_surcharge)}</span></>}
          {parseFloat(inv.accessorials) > 0 && <><span>Accessorials</span><span style={{ textAlign: 'right' }}>{formatCurrency(inv.accessorials)}</span></>}
          {extraTotal > 0 && <><span>Extra Charges</span><span style={{ textAlign: 'right' }}>{formatCurrency(extraTotal)}</span></>}
          <span>Tax</span><span style={{ textAlign: 'right' }}>{formatCurrency(inv.tax_amount)}</span>
          <strong>Total</strong><strong style={{ textAlign: 'right' }}>{formatCurrency(grandTotal)}</strong>
          <span>Amount Paid</span><span style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(inv.amount_paid)}</span>
          <strong style={{ color: parseFloat(inv.balance_due) > 0 ? 'var(--danger)' : 'var(--success)' }}>Balance Due</strong>
          <strong style={{ textAlign: 'right', color: parseFloat(inv.balance_due) > 0 ? 'var(--danger)' : 'var(--success)' }}>{formatCurrency(inv.balance_due)}</strong>
        </div>
      </FormSection>

      {payments.length > 0 && (
        <FormSection title="Payment History">
          <table className="tms-table" style={{ fontSize: 12 }}>
            <thead><tr><th>Date</th><th>Method</th><th>Ref</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>{payments.map((p, i) => (
              <tr key={i}><td>{formatDate(p.payment_date)}</td><td>{p.payment_method}</td><td>{p.reference_number || '—'}</td><td style={{ textAlign: 'right' }}>{formatCurrency(p.amount)}</td></tr>
            ))}</tbody>
          </table>
        </FormSection>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        {canSend && <Button icon={Send} onClick={() => { onSend(inv.id); onClose(); }}>Send Invoice</Button>}
        {canPay && <Button icon={CreditCard} variant="success" onClick={() => { setPay(p => ({ ...p, amount: String(inv.balance_due || '') })); setPayOpen(true); }}>Record Payment</Button>}
        {canVoid && <Button icon={XCircle} variant="danger" onClick={() => setVoidConfirm(true)}>Void</Button>}
      </div>

      {payOpen && (
        <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment" size="sm">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label className="form-label">Amount</label><input className="form-input" type="number" step="0.01" value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label className="form-label">Method</label><select className="form-input" value={pay.method} onChange={e => setPay(p => ({ ...p, method: e.target.value }))}>{PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="form-label">Reference #</label><input className="form-input" value={pay.reference} onChange={e => setPay(p => ({ ...p, reference: e.target.value }))} /></div>
            <div><label className="form-label">Date</label><input className="form-input" type="date" value={pay.date} onChange={e => setPay(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
          <div style={{ marginTop: 8 }}><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={pay.notes} onChange={e => setPay(p => ({ ...p, notes: e.target.value }))} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={handlePaySubmit}>Save Payment</Button>
          </div>
        </Modal>
      )}
      <Confirm open={voidConfirm} onClose={() => setVoidConfirm(false)} onConfirm={() => { onVoid(inv.id); setVoidConfirm(false); onClose(); }}
        title="Void Invoice" message={`Void invoice ${inv.invoice_number}? This cannot be undone.`} confirmText="Void" variant="danger" />
    </Modal>
  );
}
