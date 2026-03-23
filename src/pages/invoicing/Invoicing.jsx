import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ContextMenu, useContextMenu, Pagination, Spinner, Confirm, Field, Modal, DocUploadModal, DocList } from '../../components/common';
import { Plus, Search, RefreshCw, Printer, Mail, DollarSign, X, Edit, Copy, Eye, Upload, Trash2, ChevronDown, ChevronRight, FileText } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CARRIER = 'Signal Transportation Ltd';
const CARRIER_ADDR = '3170 194th St Unit 102, Surrey, BC V3Z 0N4';
const CARRIER_PHONE = '604-867-5543';

const STATUS_COLOR = { draft:'#888', sent:'#0063A3', unpaid:'#E65100', partial:'#6A1B9A', paid:'#2E7D32', overdue:'#B71C1C', void:'#aaa' };
const STATUS_BG    = { draft:'#f5f5f5', sent:'#E3F2FD', unpaid:'#FFF3E0', partial:'#F3E5F5', paid:'#E8F5E9', overdue:'#FFEBEE', void:'#f5f5f5' };

const fmt  = d => d ? new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : '—';
const fmtD = d => d ? new Date(d).toLocaleDateString('en-CA',{month:'numeric',day:'numeric',year:'numeric'}) : '—';
const TH = {fontSize:11,fontWeight:700,color:'#fff',padding:'5px 8px',background:'#003865',border:'1px solid #002a4a',whiteSpace:'nowrap'};
const TD = {fontSize:12,padding:'4px 8px',border:'1px solid #e8e8e8',verticalAlign:'middle'};
const PAYMENT_METHODS = ['EFT','Cheque','Credit Card','Cash','Wire Transfer','Other'];
const TERMS = ['Net 7','Net 15','Net 30','Net 45','Net 60','Due on Receipt'];
const GST_OPTS = [0, 5, 12, 13, 15];

// ─── Print Invoice (with embedded image previews) ────────────────────────────
async function fetchDocAsBase64(docId, token) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
  try {
    const res = await fetch(`${API}/documents/${docId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ data: reader.result, type: blob.type });
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function printInvoice(inv, loadDocs=[], invoiceDocs=[]) {
  const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace('/api','');

  // Only POD docs from the load + all invoice docs
  const allDocs = [
    ...(loadDocs||[]).filter(d=>d.doc_type==='pod').map(d=>({...d,_source:'load'})),
    ...(invoiceDocs||[]).map(d=>({...d,_source:'invoice'})),
  ];

  const lines  = inv.line_items || [];
  const sub    = parseFloat(inv.subtotal)||0;
  const tax    = parseFloat(inv.tax_amount)||0;
  const total  = parseFloat(inv.total_amount)||0;
  const paid   = parseFloat(inv.amount_paid)||0;
  const bal    = total - paid;

  const docsHTML = allDocs.length > 0 ? `
    <div class="docs-section">
      <div class="docs-title">ATTACHED DOCUMENTS</div>
      <div class="docs-grid">
        ${allDocs.map(doc => {
          const mime    = doc.mime_type || '';
          const name    = doc.original_name || doc.file_name || 'Document';
          const label   = doc.doc_type?.replace(/_/g,' ').toUpperCase() || 'DOCUMENT';
          const date    = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '';
          const source  = doc._source === 'load' ? 'Load Document' : 'Invoice Document';
          const isImage = mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
          const isPDF   = mime.includes('pdf') || /\.pdf$/i.test(name);
          // Use the static uploads URL directly — no auth needed, no route conflicts
          const fileUrl = `${API_BASE}/${doc.file_path}`;
          if (isImage) {
            return `<div class="doc-card">
              <img src="${fileUrl}" class="doc-img" alt="${name}" crossorigin="anonymous"/>
              <div class="doc-label">${label}</div>
              <div class="doc-name">${name}</div>
              <div class="doc-meta">${source} · ${date}</div>
            </div>`;
          }
          return `<div class="doc-card doc-card-file">
            <div class="doc-icon">${isPDF ? '📄' : '📎'}</div>
            <div class="doc-label">${label}</div>
            <div class="doc-name">${name}</div>
            <div class="doc-meta">${source} · ${date}</div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // Separate charge lines from commodity lines.
  // Commodity rows may have line_type = null (legacy), so also detect by:
  // zero unit_price AND zero total_price AND description mentions 'lb' or 'pcs'.
  const isCommodityLine = l =>
    l.line_type === 'commodity' ||
    (
      parseFloat(l.unit_price  || 0) === 0 &&
      parseFloat(l.total_price || 0) === 0 &&
      /lb|pcs/i.test(l.description || '')
    );
  const commLines   = lines.filter(l =>  isCommodityLine(l));
  const chargeLines = lines.filter(l => !isCommodityLine(l));
  const freightLines = chargeLines.filter(l=>l.description?.toLowerCase().includes('freight'));
  const accLines = chargeLines.filter(l=>!l.description?.toLowerCase().includes('freight') && !l.description?.toLowerCase().includes('fuel'));
  const fuelLines = chargeLines.filter(l=>l.description?.toLowerCase().includes('fuel'));
  const freight = freightLines.reduce((s,l)=>s+(parseFloat(l.total_price||l.amount||0)),0) || sub;
  const accTotal = accLines.reduce((s,l)=>s+(parseFloat(l.total_price||l.amount||0)),0);
  const fuelTotal = fuelLines.reduce((s,l)=>s+(parseFloat(l.total_price||l.amount||0)),0);

  const w = window.open('', '_blank', 'width=900,height=750');
  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    * { box-sizing: border-box; margin:0; padding:0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; max-width: 750px; margin: 0 auto; padding: 16px; }
    .header { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:14px; border-bottom:2px solid #003865; padding-bottom:10px; }
    .company-name { font-size:18px; font-weight:bold; color:#003865; }
    .inv-title { font-size:22px; font-weight:bold; color:#003865; text-align:right; }
    .inv-meta { text-align:right; font-size:11px; margin-top:4px; line-height:1.8; }
    .inv-meta b { display:inline-block; min-width:80px; text-align:right; margin-right:6px; color:#555; }
    .top-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; }
    .bill-box { border:1px solid #ddd; padding:8px 10px; }
    .bill-label { font-size:9px; font-weight:bold; text-transform:uppercase; color:#888; display:block; margin-bottom:3px; }
    .section-title { font-size:10px; font-weight:bold; color:#555; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:6px; margin-top:10px; }
    table { width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11px; }
    th { background:#003865; color:#fff; padding:5px 8px; text-align:left; font-size:10px; }
    th.r { text-align:right; }
    td { border-bottom:1px solid #eee; padding:5px 8px; }
    td.r { text-align:right; }
    .stop-type { font-weight:bold; font-size:10px; }
    .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; border-top:1px solid #ccc; padding-top:10px; }
    .sum-row { display:flex; justify-content:space-between; padding:2px 0; font-size:11px; }
    .sum-row.total { font-weight:bold; font-size:13px; color:#003865; border-top:1px solid #003865; padding-top:4px; margin-top:2px; }
    .sum-row.balance { font-weight:bold; font-size:13px; color:${bal>0?'#B71C1C':'#2E7D32'}; }
    .remit { border:1px solid #003865; padding:8px 12px; margin-top:12px; font-size:10px; background:#f0f4fc; }
    .sig-row { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:22px; }
    .sig-line { border-top:1px solid #000; padding-top:4px; font-size:10px; color:#666; margin-top:28px; }
    .docs-section { margin-top:20px; border-top:2px solid #003865; padding-top:12px; }
    .docs-title { font-size:11px; font-weight:bold; color:#003865; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px; }
    .docs-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
    .doc-card { border:1px solid #ddd; border-radius:4px; overflow:hidden; text-align:center; }
    .doc-img { width:100%; max-height:180px; object-fit:contain; background:#f5f5f5; display:block; }
    .doc-card-file { padding:20px 10px; background:#f8f8f8; }
    .doc-icon { font-size:32px; margin-bottom:6px; }
    .doc-label { font-size:9px; font-weight:bold; text-transform:uppercase; color:#0063A3; background:#e3f2fd; padding:2px 6px; margin:4px 6px 2px; border-radius:2px; display:inline-block; }
    .doc-name { font-size:10px; color:#333; padding:2px 6px 2px; word-break:break-all; font-weight:600; }
    .doc-meta { font-size:9px; color:#888; padding:2px 6px 6px; }
    @media print { body { padding:0; } }
  </style></head><body>

  <div class="header">
    <div>
      <div class="company-name">Signal Transportation Ltd</div>
      <div style="font-size:10px;color:#555;margin-top:4px;line-height:1.7">3170 194th St Unit 102, Surrey, BC V3Z 0N4<br/>604-867-5543</div>
    </div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="inv-meta">
        <div><b>Invoice #:</b> ${inv.invoice_number}</div>
        ${inv.ref_number?`<div><b>Customer Ref:</b> ${inv.ref_number}</div>`:''}
        <div><b>Date:</b> ${inv.created_at?new Date(inv.created_at).toLocaleDateString():''}</div>
        <div><b>Due Date:</b> ${inv.due_date?new Date(inv.due_date).toLocaleDateString():'—'}</div>
        <div><b>Terms:</b> ${inv.payment_terms||'Net 30'}</div>
      </div>
    </div>
  </div>

  <div class="top-grid">
    <div class="bill-box">
      <span class="bill-label">Bill To</span>
      <div style="font-weight:bold;font-size:13px">${inv.customer_name||''}</div>
      ${inv.address_line1?`<div style="margin-top:2px">${inv.address_line1}</div>`:''}
      ${inv.cust_city?`<div>${[inv.cust_city,inv.cust_state,inv.cust_postal].filter(Boolean).join(', ')}</div>`:''}
      ${inv.cust_phone?`<div style="margin-top:2px">${inv.cust_phone}</div>`:''}
      ${inv.customer_email?`<div style="color:#0063A3">${inv.customer_email}</div>`:''}
    </div>
    ${inv.miles?`<div style="font-size:11px;line-height:2;padding:8px 0"><div><b>Miles:</b> ${inv.miles}</div></div>`:''}
  </div>

  <div class="section-title">Shipment Stops</div>
  <table>
    <thead><tr>
      <th style="width:40px"></th><th>Company</th><th>Address</th><th>City / State</th>
    </tr></thead>
    <tbody>
      <tr>
        <td><span class="stop-type" style="color:#003865">PU</span></td>
        <td>${inv.origin_name||'—'}</td>
        <td>${inv.origin_address||''}</td>
        <td>${[inv.origin_city,inv.origin_state,inv.origin_zip].filter(Boolean).join(', ')||'—'}</td>
      </tr>
      <tr>
        <td><span class="stop-type" style="color:#059669">DEL</span></td>
        <td>${inv.dest_name||'—'}</td>
        <td>${inv.dest_address||''}</td>
        <td>${[inv.dest_city,inv.dest_state,inv.dest_zip].filter(Boolean).join(', ')||'—'}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Commodity</div>
  <table>
    <thead><tr>
      <th>Commodity</th><th class="r">Pcs</th><th class="r">Bill Wgt</th>
    </tr></thead>
    <tbody>
      ${commLines.length>0 ? commLines.map(l=>{
        const parts = l.description.split(' — ').map(s=>s.trim());
        const commodity = parts[0]||'—';
        const pcs = (parts.find(p=>p.includes('pcs'))||'').replace(' pcs','');
        const wgt = (parts.find(p=>p.includes('lb'))||'').replace(' lb','');
        return `<tr><td>${commodity}</td><td class="r">${pcs||'—'}</td><td class="r">${wgt||'—'}</td></tr>`;
      }).join('') : '<tr><td colspan="3" style="color:#aaa;text-align:center;padding:8px">No commodity info</td></tr>'}
    </tbody>
  </table>

  ${accLines.length>0?`
  <div class="section-title">Accessorial Charges</div>
  <table>
    <thead><tr>
      <th>Accessorial</th><th class="r">Rate Ea</th><th class="r">Units</th><th class="r">Amount</th>
    </tr></thead>
    <tbody>
      ${accLines.map(l=>`<tr>
        <td>${l.description}</td>
        <td class="r">$${parseFloat(l.unit_price||l.total_price||0).toFixed(2)}</td>
        <td class="r">${l.quantity||1}</td>
        <td class="r">$${parseFloat(l.total_price||l.amount||0).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>`:''}

  <div class="summary-grid">
    <div style="font-size:11px;line-height:2">
      <div><b>Pickup Date:</b> ${inv.pickup_date?new Date(inv.pickup_date).toLocaleDateString():'—'} &nbsp;&nbsp; <b>Delivery Date:</b> ${inv.delivery_date?new Date(inv.delivery_date).toLocaleDateString():'—'}</div>
      <div><b>Total Pieces:</b> ${commLines.map(l=>l.description).join(' ').match(/\d+(?= pcs)/)?.[0]||'—'} &nbsp;&nbsp; <b>Miles:</b> ${inv.miles||0}</div>
      ${inv.notes?`<div style="margin-top:4px;color:#555"><b>Notes:</b> ${inv.notes}</div>`:''}
    </div>
    <div>
      <div class="sum-row"><span>Freight:</span><span>$${freight.toFixed(2)}</span></div>
      ${fuelTotal>0?`<div class="sum-row"><span>+ Fuel Surcharge:</span><span>$${fuelTotal.toFixed(2)}</span></div>`:''}
      ${accTotal>0?`<div class="sum-row"><span>+ Accessorials:</span><span>$${accTotal.toFixed(2)}</span></div>`:''}
      ${tax>0?`<div class="sum-row"><span>+ GST:</span><span>$${tax.toFixed(2)}</span></div>`:''}
      <div class="sum-row total"><span>Invoice Total:</span><span>$${total.toFixed(2)}</span></div>
      ${paid>0?`<div class="sum-row"><span>Amount Paid:</span><span style="color:#2e7d32">($${paid.toFixed(2)})</span></div>`:''}
      <div class="sum-row balance"><span>Balance Due:</span><span>$${bal.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="remit">
    <b>REMIT PAYMENT TO:</b><br/>
    Signal Transportation Ltd &nbsp;·&nbsp; 3170 194th St Unit 102, Surrey, BC V3Z 0N4<br/>
    Please reference invoice # ${inv.invoice_number} on your payment.
  </div>

  ${docsHTML}

  <div class="sig-row">
    <div><div class="sig-line">Authorized Signature / Date</div></div>
    <div><div class="sig-line">Customer Signature / Date</div></div>
  </div>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 800);
}
// ─── Send Email Modal ────────────────────────────────────────────────────────
function SendEmailModal({ open, inv, loadDocs, invoiceDocs, onClose, onSent }) {
  const qc = useQueryClient();
  const [to, setTo]       = useState('');
  const [cc, setCc]       = useState('');
  const [subject, setSubj] = useState('');
  const [body, setBody]   = useState('');

  useEffect(() => {
    if (open && inv) {
      setTo(inv.customer_email || '');
      setCc('');
      setSubj(`Invoice ${inv.invoice_number} from Signal Transportation Ltd`);
      setBody(`Dear ${inv.customer_name},

Please find attached Invoice ${inv.invoice_number} for freight services rendered.

Invoice #:  ${inv.invoice_number}
Load #:     ${inv.load_number || '—'}
Amount Due: $${parseFloat(inv.total_amount || 0).toFixed(2)}
Due Date:   ${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
Terms:      ${inv.payment_terms || 'Net 30'}

Please remit payment to:
Signal Transportation Ltd
3170 194th St Unit 102, Surrey, BC V3Z 0N4

Thank you for your business.

Signal Transportation Ltd
604-867-5543`);
    }
  }, [open, inv]);

  const sendMut = useMutation({
    mutationFn: () => api.post(`/invoices/${inv.id}/send`),
    onSuccess: () => { toast.success('Invoice marked as sent'); qc.invalidateQueries(['invoices','invoice-detail']); onSent(); onClose(); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openMailto = () => {
    const allDocs = [...(loadDocs||[]), ...(invoiceDocs||[])];
    const attachList = allDocs.map(d => d.original_name || d.file_name || 'document').join(', ');
    const fullBody = body + (attachList ? `

Attachments: ${attachList}` : '');
    window.open(`mailto:${to}?cc=${cc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`);
  };

  const allDocs = [...(loadDocs||[]).map(d=>({...d,_source:'load'})), ...(invoiceDocs||[]).map(d=>({...d,_source:'invoice'}))];

  return (
    <Modal open={open} onClose={onClose} title={`Send Invoice — ${inv?.invoice_number}`} size="lg"
      footer={
        <div style={{display:'flex',gap:8,justifyContent:'space-between',width:'100%'}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <div style={{display:'flex',gap:8}}>
            <button onClick={openMailto} style={{padding:'7px 16px',border:'1px solid #0063A3',color:'#0063A3',background:'#fff',borderRadius:4,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
              <Mail size={13}/> Open in Email App
            </button>
            <button onClick={()=>sendMut.mutate()} disabled={sendMut.isPending}
              style={{padding:'7px 16px',border:'none',background:'#003865',color:'#fff',borderRadius:4,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {sendMut.isPending?'Marking…':'Mark as Sent'}
            </button>
          </div>
        </div>
      }>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Field label="To (Customer Email)" required>
            <input className="form-input" value={to} onChange={e=>setTo(e.target.value)} placeholder="billing@customer.com"/>
          </Field>
          <Field label="CC">
            <input className="form-input" value={cc} onChange={e=>setCc(e.target.value)} placeholder="Optional"/>
          </Field>
        </div>
        <Field label="Subject">
          <input className="form-input" value={subject} onChange={e=>setSubj(e.target.value)}/>
        </Field>
        <Field label="Email Body">
          <textarea className="form-input" rows={12} value={body} onChange={e=>setBody(e.target.value)}
            style={{fontFamily:'monospace',fontSize:12,lineHeight:1.6}}/>
        </Field>
        <div style={{border:'1px solid #e0e0e0',borderRadius:6,padding:'10px 14px',background:'#f8f9fa'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>
            Attachments ({allDocs.length})
          </div>
          {allDocs.length===0 ? (
            <div style={{fontSize:12,color:'#aaa',fontStyle:'italic'}}>
              No documents attached. Upload POD/BOL via "Attach Docs" to include them.<br/>
              {inv?.load_number&&<span>Documents on load {inv.load_number} are automatically included.</span>}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {allDocs.map((doc,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 10px',background:'#fff',border:'1px solid #e0e0e0',borderRadius:4}}>
                  <span style={{fontSize:16}}>📄</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600}}>{doc.original_name||doc.file_name||'Document'}</div>
                    <div style={{fontSize:10,color:'#888'}}>
                      {(doc.doc_type||'other').replace(/_/g,' ').toUpperCase()}
                      <span style={{marginLeft:8,padding:'1px 5px',borderRadius:3,fontSize:9,fontWeight:700,
                        background:doc._source==='load'?'#e3f2fd':'#e8f5e9',
                        color:doc._source==='load'?'#0063A3':'#2e7d32'}}>
                        {doc._source==='load'?'FROM LOAD':'INVOICE DOC'}
                      </span>
                    </div>
                  </div>
                  <span style={{fontSize:10,color:'#2e7d32',fontWeight:700}}>✓ Included</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,background:'#f0f4f8',padding:'10px',borderRadius:4}}>
          {[['Invoice #',inv?.invoice_number],['Amount Due',`$${parseFloat(inv?.total_amount||0).toFixed(2)}`],['Due Date',inv?.due_date?new Date(inv.due_date).toLocaleDateString():'—'],['Terms',inv?.payment_terms||'Net 30']].map(([l,v])=>(
            <div key={l} style={{textAlign:'center'}}>
              <div style={{fontSize:9,color:'#888',textTransform:'uppercase',marginBottom:2}}>{l}</div>
              <div style={{fontSize:12,fontWeight:700,color:'#003865'}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}


// ─── Edit Invoice Modal ───────────────────────────────────────────────────────
function EditInvoiceModal({ inv, onClose, onSaved }) {
  const qc = useQueryClient();
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Net 30');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (inv) {
      setNotes(inv.notes||'');
      setTerms(inv.payment_terms||'Net 30');
      setDueDate(inv.due_date?.slice(0,10)||'');
      // Load line items
      api.get(`/invoices/${inv.id}`).then(r => {
        const items = r.data.data?.line_items || [];
        setLines(items.length ? items.map(l=>({...l, amount:parseFloat(l.total_price||l.amount||0)}))
          : [{ description:'Freight Charges', quantity:1, unit_price:parseFloat(inv.subtotal||inv.total_amount||0), amount:parseFloat(inv.subtotal||inv.total_amount||0) }]);
      }).catch(()=>{
        setLines([{ description:'Freight Charges', quantity:1, unit_price:parseFloat(inv.total_amount||0), amount:parseFloat(inv.total_amount||0) }]);
      });
    }
  }, [inv]);

  const saveMut = useMutation({
    mutationFn: () => api.put(`/invoices/${inv.id}`, {
      line_items: lines.map(l=>({ description:l.description, quantity:l.quantity||1, unit_price:l.unit_price||l.amount, amount:l.amount })),
      payment_terms: terms, due_date: dueDate, notes,
    }),
    onSuccess: () => { toast.success('Invoice updated'); qc.invalidateQueries(['invoices','invoice']); onSaved(); },
    onError: e => toast.error(e.response?.data?.message||'Failed to save'),
  });

  const setLine = (i, f, v) => setLines(p => {
    const n = [...p]; n[i] = {...n[i],[f]:v};
    if (f==='quantity'||f==='unit_price') {
      n[i].amount = ((parseFloat(f==='quantity'?v:n[i].quantity)||1) * (parseFloat(f==='unit_price'?v:n[i].unit_price)||0));
    }
    return n;
  });

  const total = lines.reduce((s,l)=>s+(parseFloat(l.amount)||0),0);
  const TH = {fontSize:10,fontWeight:700,padding:'5px 8px',background:'#003865',color:'#fff',textAlign:'left'};
  const TD = {padding:'3px 4px',border:'1px solid #eee'};

  return (
    <Modal open={true} onClose={onClose} title={`Edit Invoice — ${inv?.invoice_number}`} size="lg"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending?'Saving…':'Save Invoice'}
        </button>
      </>}>
      <div>
        {/* Line items */}
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase'}}>Charges</span>
            <button type="button" onClick={()=>setLines(p=>[...p,{description:'',quantity:1,unit_price:0,amount:0}])}
              style={{fontSize:11,padding:'2px 8px',border:'1px solid #003865',color:'#003865',background:'none',borderRadius:3,cursor:'pointer'}}>
              + Add Line
            </button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Description','Qty','Rate ($)','Amount ($)',''].map(h=>(
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lines.map((l,i)=>(
                <tr key={i} style={{background:i%2===0?'#fff':'#fafafa'}}>
                  <td style={{...TD,minWidth:200}}>
                    <input className="form-input" style={{padding:'4px 6px'}} value={l.description||''}
                      onChange={e=>setLine(i,'description',e.target.value)} placeholder="Description"/>
                  </td>
                  <td style={{...TD,width:60}}>
                    <input type="number" className="form-input" style={{padding:'4px 6px'}} value={l.quantity||1}
                      onChange={e=>setLine(i,'quantity',e.target.value)} min="0" step="0.5"/>
                  </td>
                  <td style={{...TD,width:100}}>
                    <input type="number" className="form-input" style={{padding:'4px 6px'}} value={l.unit_price||l.amount||0}
                      onChange={e=>setLine(i,'unit_price',e.target.value)} step="0.01"/>
                  </td>
                  <td style={{...TD,width:100,fontWeight:700,textAlign:'right',padding:'4px 8px'}}>
                    ${(parseFloat(l.amount)||0).toFixed(2)}
                  </td>
                  <td style={{...TD,width:28,textAlign:'center'}}>
                    {lines.length>1&&(
                      <button type="button" onClick={()=>setLines(p=>p.filter((_,idx)=>idx!==i))}
                        style={{background:'none',border:'none',cursor:'pointer',color:'#c00',padding:2}}>
                        <X size={12}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{textAlign:'right',fontWeight:700,fontSize:15,color:'#003865',padding:'8px 4px',borderTop:'2px solid #003865',marginTop:4}}>
            Total: ${total.toFixed(2)}
          </div>
        </div>
        {/* Terms + Due + Notes */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <Field label="Payment Terms">
            <select className="form-input" value={terms} onChange={e=>setTerms(e.target.value)}>
              {['Net 7','Net 15','Net 30','Net 45','Net 60','Due on Receipt'].map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" className="form-input" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
          </Field>
        </div>
        <Field label="Notes">
          <textarea className="form-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Internal notes…"/>
        </Field>
      </div>
    </Modal>
  );
}

// ─── Invoice Detail Panel ─────────────────────────────────────────────────────
function InvoiceDetail({ invoiceId, onClose, onRefresh }) {
  const qc = useQueryClient();
  const [payModal, setPayModal]     = useState(false);
  const [editModal, setEditModal]   = useState(false);
  const [sendModal, setSendModal]   = useState(false);
  const [docUpload, setDocUpload]   = useState(false);
  const [confirmVoid, setConfirmVoid]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [payForm, setPayForm] = useState({ amount:'', payment_method:'EFT', reference:'', notes:'' });

  const { data: invData, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => api.get(`/invoices/${invoiceId}`).then(r => r.data.data),
    enabled: !!invoiceId,
  });

  // Load documents (POD, BOL etc from the linked load)
  const { data: loadDocs } = useQuery({
    queryKey: ['load-docs', invData?.load_id],
    queryFn: () => api.get(`/documents/load/${invData?.load_id}`).then(r => r.data.data || []),
    enabled: !!invData?.load_id,
  });

  // Invoice documents
  const { data: invoiceDocs, refetch: refetchDocs } = useQuery({
    queryKey: ['invoice-docs', invoiceId],
    queryFn: () => api.get(`/documents/invoice/${invoiceId}`).then(r => r.data.data || []),
    enabled: !!invoiceId,
  });

  const sendMut = useMutation({
    mutationFn: () => api.post(`/invoices/${invoiceId}/send`),
    onSuccess: () => { toast.success('Invoice marked as sent'); qc.invalidateQueries(['invoices','invoice-detail']); },
    onError: e => toast.error(e.response?.data?.message||'Failed'),
  });
  const payMut = useMutation({
    mutationFn: b => api.post(`/invoices/${invoiceId}/payment`, b),
    onSuccess: () => { toast.success('Payment recorded'); qc.invalidateQueries(['invoices','invoice-detail']); setPayModal(false); setPayForm({amount:'',payment_method:'EFT',reference:'',notes:''}); },
    onError: e => toast.error(e.response?.data?.message||'Failed'),
  });
  const voidMut = useMutation({
    mutationFn: () => api.put(`/invoices/${invoiceId}/void`),
    onSuccess: () => { toast.success('Invoice voided'); qc.invalidateQueries(['invoices','invoice-detail']); setConfirmVoid(false); },
    onError: e => toast.error(e.response?.data?.message||'Failed'),
  });
  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/invoices/${invoiceId}`),
    onSuccess: () => {
      toast.success('Invoice deleted — load returned to ready for invoicing');
      qc.invalidateQueries(['invoices']);
      onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to delete'),
  });
  const deleteDocMut = useMutation({
    mutationFn: docId => api.delete(`/documents/${docId}`),
    onSuccess: () => { toast.success('Document removed'); refetchDocs(); },
    onError: () => toast.error('Failed to remove'),
  });

  if (isLoading) return <div style={{padding:20,textAlign:'center'}}><Spinner/></div>;
  if (!invData)  return null;

  const inv    = invData;
  const lines  = inv.line_items || [];
  const pmts   = inv.payments || [];
  const sub    = parseFloat(inv.subtotal)||0;
  const tax    = parseFloat(inv.tax_amount)||0;
  const total  = parseFloat(inv.total_amount)||0;
  const paid   = parseFloat(inv.amount_paid)||0;
  const bal    = total - paid;
  const allLoadDocs    = (loadDocs || []).filter(d => d.doc_type === 'pod');
  const allInvoiceDocs = invoiceDocs || [];
  const totalDocCount  = allLoadDocs.length + allInvoiceDocs.length;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#fff'}}>
      {/* Header */}
      <div style={{padding:'10px 14px',background:'#003865',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div>
          <span style={{fontWeight:700,fontSize:14}}>{inv.invoice_number}</span>
          <span style={{margin:'0 10px',opacity:0.6}}>|</span>
          <span style={{fontSize:12}}>{inv.customer_name}</span>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:STATUS_BG[inv.status],color:STATUS_COLOR[inv.status]}}>
            {inv.status?.toUpperCase()}
          </span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:4}}><X size={16}/></button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{display:'flex',gap:6,padding:'8px 14px',borderBottom:'1px solid #eee',flexShrink:0,flexWrap:'wrap',background:'#f8f9fa'}}>
        <button onClick={()=>printInvoice(inv, allLoadDocs, allInvoiceDocs)}
          style={{padding:'5px 12px',border:'1px solid #003865',color:'#003865',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
          <Printer size={13}/> Print
        </button>
        {inv.status!=='paid'&&inv.status!=='void'&&(
          <button onClick={()=>setSendModal(true)}
            style={{padding:'5px 12px',border:'1px solid #0063A3',color:'#0063A3',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <Mail size={13}/> Send {inv.status==='sent'&&<span style={{fontSize:10,color:'#2e7d32',marginLeft:2}}>✓</span>}
          </button>
        )}
        {inv.status!=='paid'&&inv.status!=='void'&&(
          <button onClick={()=>setPayModal(true)}
            style={{padding:'5px 12px',border:'none',background:'#2E7D32',color:'#fff',borderRadius:4,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <DollarSign size={13}/> Record Payment
          </button>
        )}
        <button onClick={()=>setDocUpload(true)}
          style={{padding:'5px 12px',border:'1px solid #ccc',color:'#555',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4,position:'relative'}}>
          <Upload size={13}/> Attach Docs
          {totalDocCount>0&&<span style={{position:'absolute',top:-6,right:-6,background:'#0063A3',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{totalDocCount}</span>}
        </button>
        {inv.status!=='paid'&&inv.status!=='void'&&(
          <button onClick={()=>setEditModal(true)}
            style={{padding:'5px 12px',border:'1px solid #ccc',color:'#555',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <Edit size={13}/> Edit
          </button>
        )}
        {inv.status!=='paid'&&(
          <button onClick={()=>setConfirmVoid(true)}
            style={{padding:'5px 12px',border:'1px solid #ffcdd2',color:'#c62828',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer'}}>
            Void
          </button>
        )}
        {inv.status!=='paid'&&(
          <button onClick={()=>setConfirmDelete(true)}
            style={{padding:'5px 12px',border:'1px solid #ffcdd2',color:'#c62828',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <Trash2 size={13}/> Delete
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
        {/* Bill To + Invoice Meta */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div style={{border:'1px solid #e0e0e0',padding:'10px',borderRadius:4}}>
            <div style={{fontSize:9,fontWeight:700,color:'#888',textTransform:'uppercase',marginBottom:5}}>Bill To</div>
            <div style={{fontWeight:700,fontSize:13}}>{inv.customer_name}</div>
            {inv.address_line1&&<div style={{fontSize:12,color:'#555'}}>{inv.address_line1}</div>}
            {inv.cust_city&&<div style={{fontSize:12,color:'#555'}}>{[inv.cust_city,inv.cust_state,inv.cust_postal].filter(Boolean).join(', ')}</div>}
            {inv.cust_phone&&<div style={{fontSize:12,color:'#555'}}>{inv.cust_phone}</div>}
            {inv.customer_email&&<div style={{fontSize:11,color:'#0063A3'}}>{inv.customer_email}</div>}
          </div>
          <div style={{border:'1px solid #e0e0e0',padding:'10px',borderRadius:4}}>
            {[['Invoice #',inv.invoice_number],['Load #',inv.load_number||'—'],['Date',fmtD(inv.created_at)],['Due Date',fmtD(inv.due_date)],['Terms',inv.payment_terms||'Net 30'],['Sent',inv.sent_at?fmtD(inv.sent_at):'Not yet sent']].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                <span style={{color:'#888'}}>{l}:</span>
                <span style={{fontWeight:l==='Due Date'&&bal>0?700:600,color:l==='Due Date'&&bal>0?'#B71C1C':'inherit'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment details */}
        {(inv.origin_city||inv.dest_city)&&(
          <div style={{background:'#f0f4f8',border:'1px solid #dde3ea',borderRadius:4,padding:'8px 12px',marginBottom:12,fontSize:11}}>
            <div style={{fontWeight:700,color:'#003865',marginBottom:4}}>Shipment Details</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
              <span><b>From:</b> {inv.origin_name} — {inv.origin_city}, {inv.origin_state}</span>
              <span><b>To:</b> {inv.dest_name} — {inv.dest_city}, {inv.dest_state}</span>
              <span><b>Pickup:</b> {fmtD(inv.pickup_date)}</span>
              <span><b>Delivery:</b> {fmtD(inv.delivery_date)}</span>
              {inv.miles&&<span><b>Miles:</b> {inv.miles}</span>}
              {inv.driver_name&&<span><b>Driver:</b> {inv.driver_name}</span>}
            </div>
          </div>
        )}

        {/* Line items */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}>
          <thead><tr>
            <th style={TH}>Description</th>
            <th style={{...TH,width:60,textAlign:'right'}}>Qty</th>
            <th style={{...TH,width:55}}>Unit</th>
            <th style={{...TH,width:85,textAlign:'right'}}>Rate</th>
            <th style={{...TH,width:95,textAlign:'right'}}>Amount</th>
          </tr></thead>
          <tbody>
            {lines.map((l,i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#fafafa'}}>
                <td style={TD}>{l.description}</td>
                <td style={{...TD,textAlign:'right'}}>{l.quantity||''}</td>
                <td style={TD}>{l.unit||''}</td>
                <td style={{...TD,textAlign:'right',color:'#9CA3AF'}}>{l.line_type==='commodity'?'':((l.unit_price||l.rate)?'$'+parseFloat(l.unit_price||l.rate||0).toFixed(2):'')}</td>
                <td style={{...TD,textAlign:'right',fontWeight:600,color:l.line_type==='commodity'?'#9CA3AF':'inherit'}}>{l.line_type==='commodity'?'—':'$'+parseFloat(l.total_price||l.amount||0).toFixed(2)}</td>
              </tr>
            ))}
            {lines.length===0&&(
              <tr><td colSpan={5} style={{...TD,textAlign:'center',color:'#aaa',fontStyle:'italic',padding:'16px'}}>No line items — edit invoice to add charges</td></tr>
            )}
          </tbody>
        </table>
        {total===0&&(
          <div style={{background:'#fff3cd',border:'1px solid #ffc107',padding:'8px 12px',borderRadius:4,fontSize:12,color:'#856404',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16}}>⚠️</span>
            <span><b>Invoice has no charges.</b> Click <b>Edit</b> to add freight rate before sending to customer.</span>
          </div>
        )}

        {/* Totals */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,marginBottom:14}}>
          {[['Subtotal',`$${sub.toFixed(2)}`],
            ...(tax>0?[[`GST (${inv.gst_rate}%)`,`$${tax.toFixed(2)}`]]:[]),
            ['TOTAL',`$${total.toFixed(2)}`],
            ...(paid>0?[['Amount Paid',`($${paid.toFixed(2)})`]]:  []),
          ].map(([l,v])=>(
            <div key={l} style={{display:'flex',gap:20,fontSize:12}}>
              <span style={{minWidth:120,textAlign:'right',color:'#666'}}>{l}:</span>
              <span style={{minWidth:80,textAlign:'right',fontWeight:l==='TOTAL'?700:400,fontSize:l==='TOTAL'?14:12}}>{v}</span>
            </div>
          ))}
          <div style={{display:'flex',gap:20,fontSize:14,fontWeight:700,color:bal>0?'#B71C1C':'#2E7D32',borderTop:'2px solid #003865',paddingTop:6,marginTop:2}}>
            <span style={{minWidth:120,textAlign:'right'}}>BALANCE DUE:</span>
            <span style={{minWidth:80,textAlign:'right'}}>${bal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment history */}
        {pmts.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Payment History</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Date','Method','Reference','Amount','Notes'].map(h=><th key={h} style={{...TH,background:'#1B5E20',fontSize:10}}>{h}</th>)}</tr></thead>
              <tbody>
                {pmts.map((p,i)=>(
                  <tr key={i} style={{background:'#f0fff4'}}>
                    <td style={TD}>{fmtD(p.paid_at)}</td>
                    <td style={TD}>{p.payment_method||'—'}</td>
                    <td style={TD}>{p.reference||'—'}</td>
                    <td style={{...TD,fontWeight:700,color:'#2e7d32',textAlign:'right'}}>${parseFloat(p.amount).toFixed(2)}</td>
                    <td style={TD}>{p.notes||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Documents — shows BOTH load docs + invoice docs */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Documents ({totalDocCount})</span>
            <button onClick={()=>setDocUpload(true)}
              style={{fontSize:11,padding:'2px 8px',border:'1px solid #003865',color:'#003865',background:'none',borderRadius:3,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
              <Upload size={10}/> Attach
            </button>
          </div>

          {/* Load documents */}
          {allLoadDocs.length>0&&(
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:'#0063A3',textTransform:'uppercase',marginBottom:5,display:'flex',alignItems:'center',gap:4}}>
                <span style={{padding:'1px 6px',background:'#e3f2fd',borderRadius:3}}>📦 From Load {inv.load_number}</span>
              </div>
              {allLoadDocs.map((doc,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#f0f7ff',border:'1px solid #bbdefb',borderRadius:4,marginBottom:4}}>
                  <span style={{fontSize:14}}>📄</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{doc.original_name||doc.file_name||'Document'}</div>
                    <div style={{fontSize:10,color:'#888'}}>{doc.doc_type?.replace(/_/g,' ').toUpperCase()||'OTHER'} · {doc.created_at?new Date(doc.created_at).toLocaleDateString():''}</div>
                  </div>
                  <a href={`${process.env.REACT_APP_API_URL}/documents/${doc.id}/download`} target="_blank" rel="noreferrer"
                    style={{color:'#0063A3',fontSize:11,textDecoration:'none',fontWeight:600}}>Download</a>
                </div>
              ))}
            </div>
          )}

          {/* Invoice documents */}
          {allInvoiceDocs.length>0&&(
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:'#2e7d32',textTransform:'uppercase',marginBottom:5}}>
                <span style={{padding:'1px 6px',background:'#e8f5e9',borderRadius:3}}>📋 Invoice Documents</span>
              </div>
              {allInvoiceDocs.map((doc,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#f0fff4',border:'1px solid #c8e6c9',borderRadius:4,marginBottom:4}}>
                  <span style={{fontSize:14}}>📄</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{doc.original_name||doc.file_name||'Document'}</div>
                    <div style={{fontSize:10,color:'#888'}}>{doc.doc_type?.replace(/_/g,' ').toUpperCase()||'OTHER'} · {doc.created_at?new Date(doc.created_at).toLocaleDateString():''}</div>
                  </div>
                  <a href={`${process.env.REACT_APP_API_URL}/documents/${doc.id}/download`} target="_blank" rel="noreferrer"
                    style={{color:'#0063A3',fontSize:11,textDecoration:'none',fontWeight:600,marginRight:6}}>Download</a>
                  <button onClick={()=>{if(window.confirm('Remove this document?'))deleteDocMut.mutate(doc.id);}}
                    style={{background:'none',border:'none',cursor:'pointer',color:'#c00',padding:2}}><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          )}

          {totalDocCount===0&&(
            <div style={{textAlign:'center',padding:'20px',color:'#aaa',border:'1px dashed #ddd',borderRadius:4,fontSize:12}}>
              <Upload size={20} style={{marginBottom:6,opacity:0.4,display:'block',margin:'0 auto 6px'}}/> 
              No documents yet.<br/>
              <span style={{fontSize:11}}>POD from the load will appear here automatically. Use "Attach" to upload additional POD documents.</span>
            </div>
          )}
        </div>

        {inv.notes&&(
          <div style={{border:'1px solid #eee',padding:'8px 10px',borderRadius:4,fontSize:12,color:'#555'}}>
            <b>Notes:</b> {inv.notes}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={()=>setPayModal(false)} title={`Record Payment — ${inv.invoice_number}`} size="sm"
        footer={<><button className="btn btn-secondary" onClick={()=>setPayModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>payMut.mutate(payForm)} disabled={payMut.isPending||!payForm.amount}>
            {payMut.isPending?'Recording…':'Record Payment'}
          </button></>}>
        <div className="form-grid">
          <Field label="Amount ($)" required>
            <input type="number" step="0.01" className="form-input" value={payForm.amount}
              onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))} placeholder={`Balance: $${bal.toFixed(2)}`}/>
          </Field>
          <Field label="Payment Method">
            <select className="form-input" value={payForm.payment_method} onChange={e=>setPayForm(p=>({...p,payment_method:e.target.value}))}>
              {PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Reference #">
            <input className="form-input" value={payForm.reference} onChange={e=>setPayForm(p=>({...p,reference:e.target.value}))} placeholder="Cheque #, EFT ref…"/>
          </Field>
          <Field label="Date">
            <input type="date" className="form-input" value={payForm.paid_at||''} onChange={e=>setPayForm(p=>({...p,paid_at:e.target.value}))}/>
          </Field>
          <Field label="Notes" className="full">
            <input className="form-input" value={payForm.notes} onChange={e=>setPayForm(p=>({...p,notes:e.target.value}))}/>
          </Field>
          <div className="full" style={{background:'#f0f4f8',padding:'8px 10px',borderRadius:4,fontSize:12}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>Invoice Total:</span><span style={{fontWeight:700}}>${total.toFixed(2)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>Already Paid:</span><span style={{color:'#2e7d32'}}>-${paid.toFixed(2)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:'#B71C1C',marginTop:4,borderTop:'1px solid #dde',paddingTop:4}}>
              <span>Balance Due:</span><span>${bal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>

      <DocUploadModal open={docUpload} onClose={()=>{setDocUpload(false);refetchDocs();}}
        entityType="invoice" entityId={invoiceId} entityLabel={inv.invoice_number}
        defaultDocType="pod"/>

      <Confirm open={confirmVoid} onClose={()=>setConfirmVoid(false)} onConfirm={()=>voidMut.mutate()} danger
        title="Void Invoice" message={`Void invoice ${inv.invoice_number}? This cannot be undone.`}/>

      <Confirm open={confirmDelete} onClose={()=>setConfirmDelete(false)} onConfirm={()=>deleteMut.mutate()} danger
        title="Delete Invoice"
        message={`Delete invoice ${inv.invoice_number}? Load ${inv.load_number||''} will return to ready for invoicing.`}/>

      {/* Send Email Modal */}
      <SendEmailModal
        open={sendModal}
        inv={inv}
        loadDocs={allLoadDocs}
        invoiceDocs={allInvoiceDocs}
        onClose={()=>setSendModal(false)}
        onSent={()=>qc.invalidateQueries(['invoices'])}
      />

      {/* Edit Invoice Modal */}
      {editModal && inv && (
        <EditInvoiceModal
          inv={inv}
          onClose={()=>setEditModal(false)}
          onSaved={()=>{ setEditModal(false); qc.invalidateQueries(['invoice',invoiceId]); }}
        />
      )}
    </div>
  );
}
// ─── Main Invoicing Page ──────────────────────────────────────────────────────

// ─── Ready to Bill Tab ────────────────────────────────────────────────────────
function ReadyToBillTab({ customers }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const {menu:rtbMenu, openMenu:openRtbMenu, closeMenu:closeRtbMenu} = useContextMenu();
  const [sel, setSel]         = useState({});
  const [creating, setCreating] = useState(null); // load id being created
  const [custFilter, setCustFilter] = useState('');
  const [bulkCreating, setBulkCreating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ready-to-bill'],
    queryFn: async () => {
      // Get all delivered loads
      const loadsRes = await api.get('/loads', { params: { status: 'delivered', limit: 200 } });
      const loads = loadsRes.data.data || [];
      // Get all invoices to find which load_ids already have one
      const invsRes = await api.get('/invoices', { params: { limit: 500 } });
      const invoicedLoadIds = new Set((invsRes.data.data || []).map(i => i.load_id).filter(Boolean));
      // Return only loads WITHOUT an invoice
      return loads.filter(l => !invoicedLoadIds.has(l.id));
    },
  });

  const loads = (data || []).filter(l => !custFilter || l.customer_id === custFilter);
  const totalRevenue = loads.reduce((s, l) => s + (parseFloat(l.total_revenue) || 0), 0);
  const selectedIds  = Object.keys(sel).filter(id => sel[id]);

  const createOne = async (load) => {
    setCreating(load.id);
    try {
      await api.post('/invoices', { load_id: load.id });
      toast.success(`Invoice created for ${load.load_number}`);
      qc.invalidateQueries(['invoices']);
      qc.invalidateQueries(['ready-to-bill']);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create invoice');
    } finally { setCreating(null); }
  };

  const createBulk = async () => {
    if (!selectedIds.length) return;
    setBulkCreating(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      const load = loads.find(l => String(l.id) === id);
      if (!load) continue;
      try {
        await api.post('/invoices', { load_id: load.id });
        ok++;
      } catch { fail++; }
    }
    setBulkCreating(false);
    setSel({});
    toast.success(`Created ${ok} invoice${ok !== 1 ? 's' : ''}${fail > 0 ? ` (${fail} failed)` : ''}`);
    qc.invalidateQueries(['invoices']);
    qc.invalidateQueries(['ready-to-bill']);
  };

  const toggleAll = () => {
    if (selectedIds.length === loads.length) {
      setSel({});
    } else {
      const all = {};
      loads.forEach(l => { all[l.id] = true; });
      setSel(all);
    }
  };

  if (isLoading) return <div style={{padding:60,textAlign:'center'}}><Spinner/></div>;

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Summary bar */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14,flexShrink:0}}>
        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:6,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:6,background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <FileText size={18} style={{color:'#D97706'}}/>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#92400E'}}>Ready to Invoice</div>
            <div style={{fontSize:22,fontWeight:700,color:'#D97706',lineHeight:1.2}}>{loads.length}</div>
          </div>
        </div>
        <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:6,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:6,background:'#D1FAE5',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <DollarSign size={18} style={{color:'#059669'}}/>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#065F46'}}>Uninvoiced Revenue</div>
            <div style={{fontSize:18,fontWeight:700,color:'#059669',lineHeight:1.2}}>${totalRevenue.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
        </div>
        <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:6,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:6,background:'#DBEAFE',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Plus size={18} style={{color:'#0063A3'}}/>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#1E40AF'}}>Selected</div>
            <div style={{fontSize:22,fontWeight:700,color:'#0063A3',lineHeight:1.2}}>{selectedIds.length}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexShrink:0,alignItems:'center',flexWrap:'wrap'}}>
        <select className="filter-select" value={custFilter} onChange={e=>setCustFilter(e.target.value)}>
          <option value="">All Customers</option>
          {(customers||[]).map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {selectedIds.length > 0 && (
            <button onClick={createBulk} disabled={bulkCreating}
              style={{padding:'6px 16px',background:'#003865',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              {bulkCreating ? 'Creating…' : <><Plus size={13}/> Create {selectedIds.length} Invoice{selectedIds.length!==1?'s':''}</>}
            </button>
          )}
          <button onClick={()=>refetch()} style={{padding:'6px 10px',border:'1px solid #E5E7EB',background:'#fff',color:'#6B7280',borderRadius:5,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11}}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {!loads.length ? (
        <div style={{textAlign:'center',padding:'60px 24px',color:'#9CA3AF',border:'1px solid #E5E7EB',borderRadius:8}}>
          <DollarSign size={40} style={{marginBottom:12,opacity:0.2}}/>
          <div style={{fontSize:15,fontWeight:600,marginBottom:6,color:'#374151'}}>All caught up! ✓</div>
          <div style={{fontSize:13}}>No delivered loads are waiting to be invoiced.</div>
        </div>
      ) : (
        <div style={{flex:1,overflow:'auto',border:'1px solid #E5E7EB',borderRadius:8}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,zIndex:1}}>
              <tr>
                <th style={{...TH,width:36,textAlign:'center',padding:'6px 8px'}}>
                  <input type="checkbox"
                    checked={selectedIds.length === loads.length && loads.length > 0}
                    onChange={toggleAll}
                    style={{cursor:'pointer'}}/>
                </th>
                {['Load #','Customer','Origin → Dest','Delivery Date','Driver','Equipment','Pieces','Weight','Revenue','Action'].map(h=>(
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loads.map(load => {
                const isSelected = !!sel[load.id];
                const isCreating = creating === load.id;
                return (
                  <tr key={load.id}
                    style={{
                      background: isSelected ? '#EFF6FF' : '#fff',
                      borderLeft: isSelected ? '3px solid #0063A3' : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSel(p => ({...p, [load.id]: !p[load.id]}))}
                    onContextMenu={e=>{e.preventDefault();openRtbMenu(e,[
                      {label:'Open Load Details', icon:FileText, action:()=>navigate('/loads?load='+load.load_number)},
                      {label:'Create Invoice',    icon:Plus,     action:()=>createOne(load)},
                      {divider:true},
                      {label:'Copy Load #',       icon:Copy,     action:()=>{navigator.clipboard.writeText(load.load_number);toast.success('Copied!');}},
                    ]);}}
                    onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background='#F8FAFC';}}
                    onMouseLeave={e=>{e.currentTarget.style.background=isSelected?'#EFF6FF':'#fff';}}>
                    <td style={{...TD,textAlign:'center',width:36}} onClick={e=>e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected}
                        onChange={e=>setSel(p=>({...p,[load.id]:e.target.checked}))}
                        style={{cursor:'pointer'}}/>
                    </td>
                    <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>{load.load_number}</td>
                    <td style={{...TD,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{load.customer_name}</td>
                    <td style={{...TD,color:'#6B7280',whiteSpace:'nowrap'}}>
                      {load.origin_city&&<span>{load.origin_city}, {load.origin_state}</span>}
                      {load.origin_city&&load.dest_city&&<span style={{color:'#D1D5DB',margin:'0 4px'}}>→</span>}
                      {load.dest_city&&<span>{load.dest_city}, {load.dest_state}</span>}
                    </td>
                    <td style={{...TD,color:'#6B7280',whiteSpace:'nowrap'}}>{load.delivery_date?new Date(load.delivery_date).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}):'—'}</td>
                    <td style={{...TD,color:'#6B7280'}}>{load.driver_name||'—'}</td>
                    <td style={TD}><span style={{fontSize:10,padding:'1px 5px',background:'#E5E7EB',borderRadius:3,color:'#374151'}}>{load.equipment_type||'—'}</span></td>
                    <td style={{...TD,textAlign:'right',color:'#6B7280'}}>{load.pieces||'—'}</td>
                    <td style={{...TD,textAlign:'right',color:'#6B7280'}}>{load.weight?parseFloat(load.weight).toLocaleString()+' lb':'—'}</td>
                    <td style={{...TD,textAlign:'right',fontWeight:700,color:'#059669',fontSize:13}}>${(parseFloat(load.total_revenue)||0).toFixed(2)}</td>
                    <td style={{...TD,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>createOne(load)} disabled={isCreating}
                        style={{padding:'4px 12px',background:isCreating?'#9CA3AF':'#003865',color:'#fff',border:'none',
                          borderRadius:4,fontSize:11,fontWeight:700,cursor:isCreating?'not-allowed':'pointer',
                          display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
                        {isCreating ? 'Creating…' : <><Plus size={11}/>Invoice</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals footer */}
            {loads.length > 1 && (
              <tfoot>
                <tr style={{background:'#F8FAFC',borderTop:'2px solid #E5E7EB'}}>
                  <td colSpan={9} style={{...TD,fontWeight:700,fontSize:11,color:'#374151',textAlign:'right',textTransform:'uppercase',letterSpacing:'0.04em'}}>
                    Total Uninvoiced ({loads.length} loads)
                  </td>
                  <td style={{...TD,fontWeight:700,color:'#059669',fontSize:14,textAlign:'right'}}>
                    ${totalRevenue.toFixed(2)}
                  </td>
                  <td style={TD}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
      <ContextMenu {...rtbMenu} onClose={closeRtbMenu}/>
    </div>
  );
}

export default function Invoicing() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page,setPage]     = useState(1);
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('active'); // 'active' = hide void by default
  const [from,setFrom]     = useState('');
  const [to,setTo]         = useState('');
  const [selected,setSelected] = useState(null);
  const [createModal,setCreateModal] = useState(false);
  const [tab, setTab] = useState('invoices');
  const { menu,openMenu,closeMenu } = useContextMenu();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices',page,search,status,from,to],
    queryFn: () => api.get('/invoices',{params:{page,limit:30,search,status,from,to}}).then(r=>r.data),
    keepPreviousData: true,
  });
  const { data: customers } = useQuery({
    queryKey:['customers-dropdown'],
    queryFn:()=>api.get('/customers',{params:{limit:200}}).then(r=>r.data.data),
  });

  const rows   = data?.data||[];

  const syncDelivered = async () => {
    try {
      // Find delivered loads without invoices and create them
      const loads = await api.get('/loads', { params:{ status:'delivered', limit:100 } });
      const invs  = await api.get('/invoices', { params:{ limit:200 } });
      const loadIds = (invs.data.data||[]).map(i=>i.load_id).filter(Boolean);
      const missing = (loads.data.data||[]).filter(l => !loadIds.includes(l.id));
      if (!missing.length) { toast.success('All delivered loads have invoices ✓'); return; }
      let created = 0;
      for (const load of missing) {
        try {
          await api.post('/invoices', { load_id: load.id });
          created++;
        } catch {}
      }
      toast.success(`Created ${created} invoice${created!==1?'s':''} for delivered loads`);
      qc.invalidateQueries(['invoices']);
    } catch(e) { toast.error('Sync failed'); }
  };
  const paging = data?.pagination;

  const rowCtx = useCallback((e,inv)=>{
    openMenu(e,[
      {label:'View / Edit',         icon:Eye,       action:()=>setSelected(inv.id)},
      {label:'Print Invoice',       icon:Printer,   action:()=>{setSelected(inv.id);}},
      {label:'Send to Customer',    icon:Mail,       action:()=>api.post(`/invoices/${inv.id}/send`).then(()=>{toast.success('Marked as sent');qc.invalidateQueries(['invoices']);})},
      {divider:true},
      {label:'Record Payment',      icon:DollarSign, action:()=>setSelected(inv.id)},
      {divider:true},
      {label:'Copy Invoice #',      icon:Copy,       action:()=>{navigator.clipboard.writeText(inv.invoice_number);toast.success('Copied!');}},
      {label:'Open Load Details',   icon:FileText,   action:()=>{ if(inv.load_number){ navigate('/loads?load='+inv.load_number); } else { navigate('/loads'); } }},
      {divider:true},
      {label:'Void Invoice',        icon:X,          danger:true, action:()=>{if(window.confirm(`Void ${inv.invoice_number}?`))api.put(`/invoices/${inv.id}/void`).then(()=>{toast.success('Voided');qc.invalidateQueries(['invoices']);});}},
    ]);
  },[openMenu]);

  const statusSummary = {
    total: rows.length,
    draft: rows.filter(r=>r.status==='draft').length,
    sent:  rows.filter(r=>r.status==='sent').length,
    overdue: rows.filter(r=>r.status==='overdue').length,
    paid:  rows.filter(r=>r.status==='paid').length,
    totalBal: rows.reduce((s,r)=>s+(parseFloat(r.total_amount)||0)-(parseFloat(r.amount_paid)||0),0),
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 90px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:10,flexShrink:0,flexWrap:'wrap'}}>
        <h1 className="page-title">Invoices</h1>
        {/* Summary badges */}
        <div style={{display:'flex',gap:8,marginRight:'auto',flexWrap:'wrap'}}>
          {[['Draft',statusSummary.draft,'#888'],['Sent',statusSummary.sent,'#0063A3'],['Overdue',statusSummary.overdue,'#B71C1C'],['Paid',statusSummary.paid,'#2E7D32']].map(([l,c,col])=>(
            c>0&&<span key={l} style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:col+'18',color:col,cursor:'pointer'}}
              onClick={()=>setStatus(l.toLowerCase())}>{l}: {c}</span>
          ))}
          {statusSummary.totalBal>0&&<span style={{fontSize:11,fontWeight:700,color:'#B71C1C'}}>Outstanding: ${statusSummary.totalBal.toFixed(2)}</span>}
        </div>
        <div style={{display:'flex',gap:6}}>
          <button className="btn btn-secondary btn-sm" onClick={syncDelivered}
            style={{display:'flex',alignItems:'center',gap:4,fontSize:12}} title="Create invoices for delivered loads missing one">
            <RefreshCw size={12}/> Sync Delivered
          </button>
          <button className="btn btn-primary" onClick={()=>setCreateModal(true)}><Plus size={14}/> New Invoice</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid #E5E7EB',marginBottom:12,flexShrink:0}}>
        {[
          ['invoices','📄  Invoices'],
          ['ready','🟡  Ready to Bill'],
        ].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:'7px 18px',border:'none',background:'transparent',fontSize:13,fontWeight:tab===id?700:400,
              color:tab===id?'#003865':'#9CA3AF',
              borderBottom:tab===id?'2px solid #003865':'2px solid transparent',
              marginBottom:-2,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            {label}
          </button>
        ))}
      </div>

      {tab==='ready' && (
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <ReadyToBillTab customers={customers}/>
        </div>
      )}

      {tab==='invoices' && (<>
      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexShrink:0,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:1,maxWidth:280}}>
          <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#aaa'}}/>
          <input className="form-input" style={{paddingLeft:28}} placeholder="Search invoice #, customer, load #…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        <select className="filter-select" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>
          <option value="active">All (excl. Void)</option>
          <option value="">All Including Void</option>
          <option value="unpaid">Unpaid / Sent (Outstanding)</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="void">Void Only</option>
        </select>
        <input type="date" className="form-input" style={{width:140}} value={from} onChange={e=>setFrom(e.target.value)} placeholder="From date"/>
        <input type="date" className="form-input" style={{width:140}} value={to} onChange={e=>setTo(e.target.value)} placeholder="To date"/>
        <button className="btn btn-secondary btn-sm" onClick={()=>{setSearch('');setStatus('');setFrom('');setTo('');}}><X size={12}/></button>
        <button className="btn btn-secondary btn-sm" onClick={()=>qc.invalidateQueries(['invoices'])}><RefreshCw size={13}/></button>
      </div>

      {/* Split panel */}
      <div style={{display:'grid',gridTemplateColumns:selected?'1fr 420px':'1fr',gap:10,flex:1,overflow:'hidden',minHeight:0,transition:'grid-template-columns 0.2s'}}>
        {/* Invoice list */}
        <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{overflowY:'auto',flex:1}}>
            {isLoading ? <div style={{padding:40,textAlign:'center'}}><Spinner/></div>
            : !rows.length ? (
              <div style={{padding:'60px 24px',textAlign:'center',color:'#aaa'}}>
                <FileText size={36} style={{marginBottom:12,opacity:0.25}}/><br/>
                <p style={{fontSize:14,fontWeight:600,marginBottom:6}}>No invoices found</p>
                <p style={{fontSize:12,marginBottom:16}}>Invoices are auto-created when loads are marked delivered</p>
                <button className="btn btn-primary btn-sm" onClick={()=>setCreateModal(true)}><Plus size={12}/> Create Invoice</button>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{position:'sticky',top:0,zIndex:1}}>
                  <tr>{['Invoice #','Load #','Customer','Date','Due','Driver','Freight','Total','Paid','Balance','Status'].map(h=>(
                    <th key={h} style={TH}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rows.map(inv=>{
                    const bal  = parseFloat(inv.balance_due ?? ((parseFloat(inv.total_amount)||0)-(parseFloat(inv.amount_paid)||0)));
                    const over = inv.status==='overdue';
                    const isSelected = selected===inv.id;
                    return (
                      <tr key={inv.id}
                        onClick={()=>setSelected(isSelected?null:inv.id)}
                        onContextMenu={e=>rowCtx(e,inv)}
                        style={{cursor:'pointer',
                          background: isSelected?'#e8f0fe': inv.status==='void'?'#fafafa': over?'#FFEBEE': inv.status==='paid'?'#F0FFF4': inv.status==='draft'?'#fafafa':'#fff',
                          borderLeft: isSelected?'3px solid #0063A3': over?'3px solid #B71C1C': inv.status==='paid'?'3px solid #2E7D32':'3px solid transparent',
                          opacity: inv.status==='void'?0.5:1,
                          textDecoration: inv.status==='void'?'line-through':'none'}}
                        onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background='#f0f4f8';}}
                        onMouseLeave={e=>{e.currentTarget.style.background=isSelected?'#e8f0fe':over?'#FFEBEE':inv.status==='paid'?'#F0FFF4':inv.status==='draft'?'#fafafa':'#fff';}}>
                        <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>{inv.invoice_number}</td>
                        <td style={{...TD,fontFamily:'monospace',fontSize:11,color:'#555'}}>{inv.load_number||'—'}</td>
                        <td style={{...TD,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.customer_name}</td>
                        <td style={{...TD,whiteSpace:'nowrap',color:'#666'}}>{fmtD(inv.created_at)}</td>
                        <td style={{...TD,whiteSpace:'nowrap',color:over?'#B71C1C':'#666',fontWeight:over?700:400}}>{fmtD(inv.due_date)}</td>
                        <td style={{...TD,fontSize:11,color:'#555'}}>{inv.driver_name||'—'}</td>
                        <td style={{...TD,textAlign:'right'}}>${parseFloat(inv.subtotal||0).toFixed(2)}</td>
                        <td style={{...TD,textAlign:'right',fontWeight:700}}>${parseFloat(inv.total_amount||0).toFixed(2)}</td>
                        <td style={{...TD,textAlign:'right',color:'#2e7d32',fontWeight:parseFloat(inv.amount_paid)>0?600:400}}>{parseFloat(inv.amount_paid)>0?`$${parseFloat(inv.amount_paid).toFixed(2)}`:'—'}</td>
                        <td style={{...TD,textAlign:'right',fontWeight:700,color:bal>0?'#B71C1C':'#2e7d32'}}>${bal.toFixed(2)}</td>
                        <td style={TD}>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10,
                            background:STATUS_BG[inv.status]||'#f5f5f5',color:STATUS_COLOR[inv.status]||'#888'}}>
                            {inv.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <Pagination pagination={paging} onPage={setPage}/>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <InvoiceDetail invoiceId={selected} onClose={()=>setSelected(null)} onRefresh={()=>qc.invalidateQueries(['invoices'])}/>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal open={createModal} onClose={()=>setCreateModal(false)} customers={customers}/>

      <ContextMenu {...menu} onClose={closeMenu}/>
      </>)}
    </div>
  );
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
function CreateInvoiceModal({ open, onClose, customers }) {
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [loadId, setLoadId]         = useState('');
  const [terms, setTerms]           = useState('Net 30');
  const [gstRate, setGstRate]       = useState(0);
  const [notes, setNotes]           = useState('');
  const [lines, setLines]           = useState([{description:'Freight Charges',quantity:1,unit:'flat',rate:'',amount:''}]);

  const { data: loads } = useQuery({
    queryKey: ['loads-invoiceable'],
    queryFn: () => api.get('/loads',{params:{status:'delivered',limit:100}}).then(r=>r.data.data),
    enabled: open,
  });

  useEffect(()=>{
    if(!open){setCustomerId('');setLoadId('');setTerms('Net 30');setGstRate(0);setNotes('');setLines([{description:'Freight Charges',quantity:1,unit:'flat',rate:'',amount:''}]);}
  },[open]);

  const mut = useMutation({
    mutationFn: ()=>api.post('/invoices',{customer_id:customerId,load_id:loadId||undefined,line_items:lines,payment_terms:terms,gst_rate:gstRate,notes}),
    onSuccess: ()=>{toast.success('Invoice created');qc.invalidateQueries(['invoices']);onClose();},
    onError: e=>toast.error(e.response?.data?.message||'Failed'),
  });

  const setLine=(i,f,v)=>{const l=[...lines];l[i]={...l[i],[f]:v};
    if(f==='rate'||f==='quantity'){const rate=parseFloat(f==='rate'?v:l[i].rate)||0;const qty=parseFloat(f==='quantity'?v:l[i].quantity)||1;l[i].amount=(rate*qty).toFixed(2);}
    setLines(l);};
  const addLine=()=>setLines(p=>[...p,{description:'',quantity:1,unit:'flat',rate:'',amount:''}]);
  const remLine=i=>setLines(p=>p.filter((_,idx)=>idx!==i));

  const sub   = lines.reduce((s,l)=>s+(parseFloat(l.amount)||0),0);
  const tax   = gstRate>0?sub*gstRate/100:0;
  const total = sub+tax;

  return (
    <Modal open={open} onClose={onClose} title="Create Invoice" size="lg"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>mut.mutate()} disabled={mut.isPending||!customerId}>
          {mut.isPending?'Creating…':'Create Invoice'}
        </button></>}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px 12px',marginBottom:12}}>
        <Field label="Customer" required className="full" style={{gridColumn:'1/3'}}>
          <select className="form-input" value={customerId} onChange={e=>setCustomerId(e.target.value)}>
            <option value="">Select customer…</option>
            {(customers||[]).map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </Field>
        <Field label="Payment Terms">
          <select className="form-input" value={terms} onChange={e=>setTerms(e.target.value)}>
            {TERMS.map(t=><option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Link to Load (optional)">
          <select className="form-input" value={loadId} onChange={e=>setLoadId(e.target.value)}>
            <option value="">No load</option>
            {(loads||[]).map(l=><option key={l.id} value={l.id}>{l.load_number} — {l.customer_name}</option>)}
          </select>
        </Field>
        <Field label="GST Rate">
          <select className="form-input" value={gstRate} onChange={e=>setGstRate(parseFloat(e.target.value))}>
            {GST_OPTS.map(g=><option key={g} value={g}>{g===0?'No GST':`${g}% GST`}</option>)}
          </select>
        </Field>
      </div>

      {/* Line items */}
      <div style={{marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <span style={{fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase'}}>Line Items</span>
          <button onClick={addLine} style={{border:'1px solid #003865',color:'#003865',background:'none',padding:'2px 8px',borderRadius:3,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Plus size={10}/> Add Line</button>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr>{['Description','Qty','Unit','Rate','Amount',''].map(h=><th key={h} style={{...TH,background:'#1a3a5c',fontSize:10}}>{h}</th>)}</tr></thead>
          <tbody>
            {lines.map((l,i)=>(
              <tr key={i}>
                <td style={{border:'1px solid #ddd',padding:2}}><input style={{width:'100%',padding:'4px 6px',border:'none',fontSize:12}} value={l.description} onChange={e=>setLine(i,'description',e.target.value)}/></td>
                <td style={{border:'1px solid #ddd',padding:2,width:60}}><input type="number" style={{width:'100%',padding:'4px 6px',border:'none',fontSize:12}} value={l.quantity} onChange={e=>setLine(i,'quantity',e.target.value)}/></td>
                <td style={{border:'1px solid #ddd',padding:2,width:65}}><input style={{width:'100%',padding:'4px 6px',border:'none',fontSize:12}} value={l.unit} onChange={e=>setLine(i,'unit',e.target.value)}/></td>
                <td style={{border:'1px solid #ddd',padding:2,width:90}}><input type="number" step="0.01" style={{width:'100%',padding:'4px 6px',border:'none',fontSize:12}} value={l.rate} onChange={e=>setLine(i,'rate',e.target.value)}/></td>
                <td style={{border:'1px solid #ddd',padding:2,width:90}}><input type="number" step="0.01" style={{width:'100%',padding:'4px 6px',border:'none',fontSize:12}} value={l.amount} onChange={e=>setLine(i,'amount',e.target.value)}/></td>
                <td style={{border:'1px solid #ddd',padding:2,width:28,textAlign:'center'}}><button onClick={()=>remLine(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#c00'}}><Trash2 size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{display:'flex',gap:20,justifyContent:'flex-end',fontSize:12,marginBottom:8}}>
        <span>Subtotal: <b>${sub.toFixed(2)}</b></span>
        {tax>0&&<span>GST: <b>${tax.toFixed(2)}</b></span>}
        <span style={{fontWeight:700,fontSize:14,color:'#003865'}}>Total: ${total.toFixed(2)}</span>
      </div>

      <Field label="Notes">
        <textarea className="form-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/>
      </Field>
    </Modal>
  );
}
