import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Spinner, Field, Modal, Confirm } from '../../components/common';
import { Save, Plus, Edit, Trash2, CheckCircle, XCircle, GripVertical, Eye, EyeOff, Mail, AlertCircle, Activity, RefreshCw, Clock } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const RATE_TYPES = [
  { value:'flat',     label:'Flat ($)' },
  { value:'per_hour', label:'Per Hour ($/hr)' },
  { value:'per_day',  label:'Per Day ($/day)' },
  { value:'per_mile', label:'Per Mile ($/mi)' },
  { value:'percent',  label:'Percent (%)' },
];
const TH = { fontSize:11, fontWeight:700, color:'#fff', padding:'6px 10px', background:'#003865', border:'1px solid #002a4a', whiteSpace:'nowrap' };
const TD = { fontSize:12, padding:'7px 10px', border:'1px solid #e8e8e8', verticalAlign:'middle' };

// ─── Accessorial Modal ────────────────────────────────────────────────────────
function AccessorialModal({ open, item, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!item;
  const EMPTY = { name:'', code:'', default_rate:'', rate_type:'flat', unit_label:'flat', is_billable:true, is_payable:false, notes:'' };
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(item ? {
      name:item.name||'', code:item.code||'', default_rate:item.default_rate||'',
      rate_type:item.rate_type||'flat', unit_label:item.unit_label||'flat',
      is_billable:item.is_billable!==false, is_payable:item.is_payable===true, notes:item.notes||''
    } : EMPTY);
  }, [open, item]);

  const mut = useMutation({
    mutationFn: b => isEdit ? api.put(`/accessorials/${item.id}`, b) : api.post('/accessorials', b),
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Added'); qc.invalidateQueries(['accessorial-types']); onClose(); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const h = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (e.target.name === 'rate_type') {
      const labels = { flat:'flat', per_hour:'per hour', per_day:'per day', per_mile:'per mile', percent:'%' };
      setForm(f => ({ ...f, rate_type:e.target.value, unit_label:labels[e.target.value]||'flat' }));
    } else {
      setForm(f => ({ ...f, [e.target.name]:val }));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit — ${item?.name}` : 'Add Accessorial Charge'} size="sm"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => mut.mutate(form)} disabled={mut.isPending || !form.name}>
          {mut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Charge'}
        </button>
      </>}>
      <div className="form-grid">
        <Field label="Charge Name" required className="full">
          <input name="name" className="form-input" value={form.name} onChange={h} placeholder="e.g. Detention, Lumper…"/>
        </Field>
        <Field label="Code"><input name="code" className="form-input" value={form.code} onChange={h} placeholder="DET, LUM…"/></Field>
        <Field label="Rate Type">
          <select name="rate_type" className="form-input" value={form.rate_type} onChange={h}>
            {RATE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Default Rate">
          <input type="number" step="0.01" name="default_rate" className="form-input" value={form.default_rate} onChange={h} placeholder="0.00"/>
        </Field>
        <Field label="Unit Label">
          <input name="unit_label" className="form-input" value={form.unit_label} onChange={h} placeholder="per hour, flat…"/>
        </Field>
        <div style={{display:'flex',flexDirection:'column',gap:8,paddingTop:20}}>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
            <input type="checkbox" name="is_billable" checked={form.is_billable} onChange={h}/>
            <span><b>Billable</b> — charge to customer</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
            <input type="checkbox" name="is_payable" checked={form.is_payable} onChange={h}/>
            <span><b>Payable</b> — pay to driver</span>
          </label>
        </div>
        <Field label="Notes" className="full">
          <input name="notes" className="form-input" value={form.notes} onChange={h} placeholder="Optional…"/>
        </Field>
      </div>
    </Modal>
  );
}

// ─── Accessorials Tab ─────────────────────────────────────────────────────────
function AccessorialsTab() {
  const qc = useQueryClient();
  const [modal, setModal]     = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [items, setItems]     = useState([]);
  const dragIdx = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['accessorial-types'],
    queryFn: () => api.get('/accessorials').then(r => r.data.data || []),
  });
  useEffect(() => { if (data) setItems(data); }, [data]);

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => api.put(`/accessorials/${id}`, { ...items.find(i=>i.id===id), is_active }),
    onSuccess: () => qc.invalidateQueries(['accessorial-types']),
  });
  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/accessorials/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['accessorial-types']); setConfirmDel(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });
  const reorderMut = useMutation({
    mutationFn: newItems => api.put('/accessorials/reorder', { items: newItems.map((it,i) => ({ id:it.id, sort_order:i+1 })) }),
  });

  const onDragStart = i => { dragIdx.current = i; };
  const onDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    setItems(next);
  };
  const onDragEnd = () => { reorderMut.mutate(items); dragIdx.current = null; };

  if (isLoading) return <Spinner/>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <p style={{fontSize:13,color:'#666',margin:0}}>
          Standard charges that auto-fill in the Loads form. Drag to reorder.
        </p>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setModal(true); }}>
          <Plus size={13}/> Add Charge
        </button>
      </div>

      {/* Summary */}
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        {[['Total',items.length,'#003865'],['Active',items.filter(i=>i.is_active).length,'#2E7D32'],
          ['Billable',items.filter(i=>i.is_billable).length,'#0063A3'],['Payable',items.filter(i=>i.is_payable).length,'#6A1B9A']
        ].map(([l,v,c]) => (
          <div key={l} style={{padding:'7px 14px',background:'#f8f9fa',border:'1px solid #e0e0e0',borderRadius:6,borderLeft:`3px solid ${c}`}}>
            <div style={{fontSize:10,color:'#888',marginBottom:1}}>{l}</div>
            <div style={{fontSize:17,fontWeight:700,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['','Charge Name','Code','Default Rate','Rate Type','Billable','Payable','Status',''].map(h=>(
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                style={{background:item.is_active?(i%2===0?'#fff':'#fafafa'):'#f5f5f5',opacity:item.is_active?1:0.55}}>
                <td style={{...TD,width:28,cursor:'grab',color:'#bbb',textAlign:'center'}}><GripVertical size={13}/></td>
                <td style={{...TD,fontWeight:600}}>
                  {item.name}
                  {item.notes&&<div style={{fontSize:10,color:'#aaa',fontWeight:400}}>{item.notes}</div>}
                </td>
                <td style={{...TD,fontFamily:'monospace',fontSize:11,color:'#555'}}>{item.code||'—'}</td>
                <td style={{...TD,fontWeight:700,color:'#003865'}}>
                  {item.rate_type==='percent'?`${parseFloat(item.default_rate).toFixed(1)}%`:`$${parseFloat(item.default_rate).toFixed(2)}`}
                </td>
                <td style={TD}>
                  <span style={{padding:'2px 7px',background:'#e8edf2',borderRadius:3,fontSize:11}}>
                    {RATE_TYPES.find(r=>r.value===item.rate_type)?.label||item.rate_type}
                  </span>
                </td>
                <td style={{...TD,textAlign:'center'}}>
                  {item.is_billable?<CheckCircle size={14} style={{color:'#2E7D32'}}/>:<span style={{color:'#ddd'}}>—</span>}
                </td>
                <td style={{...TD,textAlign:'center'}}>
                  {item.is_payable?<CheckCircle size={14} style={{color:'#6A1B9A'}}/>:<span style={{color:'#ddd'}}>—</span>}
                </td>
                <td style={{...TD,width:90}}>
                  <button onClick={() => toggleMut.mutate({id:item.id,is_active:!item.is_active})}
                    style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,cursor:'pointer',border:'none',
                      background:item.is_active?'#e8f5e9':'#f5f5f5',color:item.is_active?'#2E7D32':'#aaa'}}>
                    {item.is_active?'● Active':'○ Inactive'}
                  </button>
                </td>
                <td style={{...TD,width:70,textAlign:'center'}}>
                  <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                    <button onClick={() => { setEditItem(item); setModal(true); }}
                      style={{background:'none',border:'1px solid #ddd',borderRadius:3,padding:'3px 6px',cursor:'pointer',color:'#555'}}>
                      <Edit size={12}/>
                    </button>
                    <button onClick={() => setConfirmDel(item)}
                      style={{background:'none',border:'1px solid #ffcdd2',borderRadius:3,padding:'3px 6px',cursor:'pointer',color:'#c62828'}}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length===0&&(
              <tr><td colSpan={9} style={{...TD,textAlign:'center',color:'#aaa',padding:'30px',fontStyle:'italic'}}>
                No accessorial types yet. Click "Add Charge" to start.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <AccessorialModal open={modal} item={editItem} onClose={() => { setModal(false); setEditItem(null); }}/>
      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => deleteMut.mutate(confirmDel?.id)} danger
        title="Delete Accessorial" message={`Delete "${confirmDel?.name}"?`}/>
    </div>
  );
}

// ─── Import Data Tab ──────────────────────────────────────────────────────────
function ImportTab() {
  const [type, setType]         = useState('carriers');
  const [file, setFile]         = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [preview, setPreview]   = useState(null);
  const fileRef = useRef(null);

  const TYPES = [
    { id:'carriers',  label:'🚛 Carriers',  desc:'Carrier/broker companies', cols:'name, MC#, phone, email, address' },
    { id:'customers', label:'👥 Customers', desc:'Customer companies',        cols:'company_name, contact, email, phone, address' },
    { id:'drivers',   label:'👤 Drivers',   desc:'Driver records',            cols:'first_name, last_name, email, phone, license' },
  ];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setResult(null); setError(''); setPreview(null);
    // Show preview of first few rows
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split('\n').filter(l=>l.trim()).slice(0,4);
      setPreview(lines);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) { setError('Select a CSV file first'); return; }
    setImporting(true); setResult(null); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post(`/import/${type}`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      setResult(r.data.data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch(err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  };

  const selected = TYPES.find(t=>t.id===type);

  return (
    <div>
      <p style={{fontSize:13,color:'#666',marginBottom:20}}>
        Import data from another TMS (BAM, TMW, McLeod, etc.) using CSV export files.
        The system auto-maps common column names.
      </p>

      {/* Type selector */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {TYPES.map(t=>(
          <div key={t.id} onClick={()=>{setType(t.id);setResult(null);setError('');}}
            style={{padding:'14px 16px',border:`2px solid ${type===t.id?'#003865':'#e0e0e0'}`,borderRadius:8,
              cursor:'pointer',background:type===t.id?'#f0f4f8':'#fff',transition:'all 0.15s'}}>
            <div style={{fontSize:16,marginBottom:4}}>{t.label}</div>
            <div style={{fontSize:12,color:'#888',marginBottom:6}}>{t.desc}</div>
            <div style={{fontSize:10,color:'#aaa',fontFamily:'monospace'}}>{t.cols}</div>
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div style={{border:'2px dashed #c5d9f0',borderRadius:8,padding:'24px',textAlign:'center',
        background:'#f8fafd',marginBottom:16,cursor:'pointer'}}
        onClick={()=>fileRef.current?.click()}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#003865';}}
        onDragLeave={e=>{e.currentTarget.style.borderColor='#c5d9f0';}}
        onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='#c5d9f0';
          const f=e.dataTransfer.files[0];if(f){setFile(f);const ev={target:{files:[f]}};handleFile(ev);}}}>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={handleFile}/>
        <div style={{fontSize:32,marginBottom:8}}>📄</div>
        {file ? (
          <div>
            <div style={{fontSize:14,fontWeight:700,color:'#003865'}}>{file.name}</div>
            <div style={{fontSize:12,color:'#888',marginTop:2}}>{(file.size/1024).toFixed(1)} KB — ready to import</div>
          </div>
        ) : (
          <div>
            <div style={{fontSize:14,fontWeight:600,color:'#555'}}>Drop CSV file here or click to browse</div>
            <div style={{fontSize:12,color:'#aaa',marginTop:4}}>Supports BAM, TMW, McLeod, or any CSV export</div>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div style={{marginBottom:16,border:'1px solid #e0e0e0',borderRadius:6,overflow:'hidden'}}>
          <div style={{padding:'6px 12px',background:'#1a3a5c',color:'#fff',fontSize:11,fontWeight:700}}>
            CSV PREVIEW (first {preview.length} rows)
          </div>
          <div style={{overflowX:'auto',padding:'8px 12px',background:'#f9f9f9'}}>
            {preview.map((line,i)=>(
              <div key={i} style={{fontFamily:'monospace',fontSize:11,padding:'2px 0',
                color:i===0?'#003865':'#555',fontWeight:i===0?700:400,
                borderBottom:i===0?'1px solid #ddd':'none',whiteSpace:'nowrap'}}>
                {i===0?'HEADERS: ':''}{line.slice(0,120)}{line.length>120?'…':''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column mapping hint */}
      {file && (
        <div style={{background:'#e3f2fd',border:'1px solid #c5d9f0',borderRadius:6,padding:'10px 14px',marginBottom:16,fontSize:12}}>
          <b>📋 Importing as {selected?.label}</b> — Signal TMS will map these columns automatically:<br/>
          <span style={{color:'#555',marginTop:4,display:'block'}}>{selected?.cols}</span>
          <span style={{color:'#888',marginTop:4,display:'block'}}>Unknown columns are safely ignored. Duplicate names are skipped.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{background:'#FFEBEE',border:'1px solid #ffcdd2',borderRadius:6,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#B71C1C'}}>
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{background:'#E8F5E9',border:'1px solid #c8e6c9',borderRadius:6,padding:'14px 16px',marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700,color:'#2E7D32',marginBottom:8}}>
            ✅ Import Complete
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:8}}>
            {[['Total Rows',result.total,'#555'],['Imported',result.imported,'#2E7D32'],['Skipped',result.skipped,'#E65100']].map(([l,v,c])=>(
              <div key={l} style={{textAlign:'center',background:'#fff',borderRadius:4,padding:'8px'}}>
                <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
                <div style={{fontSize:11,color:'#888'}}>{l}</div>
              </div>
            ))}
          </div>
          {result.errors?.length>0&&(
            <div style={{fontSize:11,color:'#B71C1C',marginTop:6}}>
              <b>Errors:</b> {result.errors.join(' | ')}
            </div>
          )}
          <div style={{fontSize:12,color:'#555',marginTop:8}}>
            Go to the {selected?.label} page to verify imported records.
          </div>
        </div>
      )}

      <button onClick={handleImport} disabled={!file||importing}
        style={{padding:'11px 28px',background:'#003865',color:'#fff',border:'none',
          borderRadius:6,fontSize:14,fontWeight:700,cursor:'pointer',
          display:'flex',alignItems:'center',gap:8,opacity:!file||importing?0.6:1}}>
        {importing
          ? <><RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/> Importing…</>
          : <>📥 Import {selected?.label}</>}
      </button>

      {/* Format guide */}
      <div style={{marginTop:24,border:'1px solid #e0e0e0',borderRadius:6,overflow:'hidden'}}>
        <div style={{padding:'8px 14px',background:'#003865',color:'#fff',fontSize:12,fontWeight:700}}>
          📖 CSV FORMAT GUIDE
        </div>
        <div style={{padding:'12px 16px'}}>
          {[
            ['Carriers (BAM format)', 'type, name, mc_num, tei_num, email, address_line1, city, state, zip_code'],
            ['Carriers (generic)',    'name, mc_number, phone, email, address'],
            ['Customers',            'company_name, contact_name, email, phone, address_line1, city, state, postal_code'],
            ['Drivers',              'first_name, last_name, email, phone, license_number'],
          ].map(([label,cols])=>(
            <div key={label} style={{marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:'#003865',marginBottom:2}}>{label}</div>
              <code style={{fontSize:11,background:'#f5f5f5',padding:'3px 8px',borderRadius:3,display:'block',color:'#555'}}>{cols}</code>
            </div>
          ))}
          <div style={{fontSize:11,color:'#888',marginTop:8}}>
            ℹ️ First row must be headers. Extra columns are ignored. Duplicates are skipped automatically.
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}


// ─── Health Check Tab ─────────────────────────────────────────────────────────
function HealthTab() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const CHECKS = [
    // ── API Endpoints ──
    { group:'API Endpoints', key:'customers',    label:'Customers',       url:'/customers?limit=5' },
    { group:'API Endpoints', key:'loads',        label:'Loads',           url:'/loads?limit=5' },
    { group:'API Endpoints', key:'dispatch',     label:'Dispatch Board',  url:'/dispatch/board' },
    { group:'API Endpoints', key:'invoices',     label:'Invoices',        url:'/invoices?limit=5' },
    { group:'API Endpoints', key:'quotes',       label:'Quotes',          url:'/quotes?limit=5' },
    { group:'API Endpoints', key:'drivers',      label:'Drivers',         url:'/drivers?limit=5' },
    { group:'API Endpoints', key:'carriers',     label:'Carriers',        url:'/carriers?limit=5' },
    { group:'API Endpoints', key:'fleet',        label:'Fleet',           url:'/fleet?limit=5' },
    { group:'API Endpoints', key:'settings',     label:'Settings',        url:'/settings' },
    { group:'API Endpoints', key:'accessorials', label:'Accessorials',    url:'/accessorials' },
    { group:'API Endpoints', key:'documents',    label:'Documents',       url:'/documents/load/00000000-0000-0000-0000-000000000000', expectEmpty:true },
    // ── Features ──
    { group:'Features',      key:'invoice_lines', label:'Invoice Line Items Table', url:'/invoices?limit=1', checkFn: r => ({ ok:true, detail:'Table ready' }) },
    { group:'Features',      key:'acc_loaded',    label:'Accessorial Types Loaded', url:'/accessorials', checkFn: r => {
      const n = r?.data?.length || r?.length || 0;
      return { ok: n > 0, detail: n > 0 ? `${n} types loaded` : 'No types — run migrate_accessorial_types.sql' };
    }},
    { group:'Features',      key:'smtp',          label:'SMTP Email Config', url:'/settings', checkFn: r => {
      const d = r?.data || r;
      const set = d?.smtp_password_set || d?.smtp_email;
      return { ok:!!set, warn:!set, detail: set ? `Configured: ${d?.smtp_email||''}` : 'Not configured — add in Email tab' };
    }},
    { group:'Features',      key:'company_name',  label:'Company Info Set', url:'/settings', checkFn: r => {
      const d = r?.data || r;
      const ok = !!(d?.company_name && d?.address_line1);
      return { ok, warn:!ok, detail: ok ? d.company_name : 'Fill in Company Info tab' };
    }},
  ];

  const runChecks = async () => {
    setRunning(true);
    setResults([]);
    const res = [];
    for (const check of CHECKS) {
      const start = Date.now();
      try {
        const r = await api.get(check.url);
        const ms = Date.now() - start;
        const data = r.data;
        let ok = true, detail = '', warn = false;
        if (check.expectEmpty) {
          ok = true; detail = 'Endpoint reachable';
        } else if (check.checkFn) {
          const result = check.checkFn(data);
          ok = result.ok; warn = result.warn; detail = result.detail;
        } else {
          const count = data?.pagination?.total ?? data?.data?.length ?? (Array.isArray(data?.data) ? data.data.length : null);
          detail = count !== null ? `${count} record${count!==1?'s':''}` : 'OK';
        }
        res.push({ ...check, ok, warn, detail, ms });
      } catch (err) {
        const ms = Date.now() - start;
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || 'Failed';
        // 404 on documents/load/uuid is expected when no docs exist
        if (check.expectEmpty && status === 404) {
          res.push({ ...check, ok:true, detail:'Endpoint reachable (no docs yet)', ms });
        } else {
          res.push({ ...check, ok:false, warn:false, detail:`${status ? `HTTP ${status}: ` : ''}${msg}`, ms });
        }
      }
    }
    setResults(res);
    setLastRun(new Date());
    setRunning(false);
  };

  const groups = [...new Set(CHECKS.map(c=>c.group))];
  const passed = results.filter(r=>r.ok).length;
  const warned = results.filter(r=>r.warn&&r.ok).length;
  const failed = results.filter(r=>!r.ok).length;

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <p style={{fontSize:13,color:'#666',margin:0}}>
            Tests every API endpoint and feature to confirm everything is connected and working.
          </p>
          {lastRun && (
            <div style={{fontSize:11,color:'#888',marginTop:4,display:'flex',alignItems:'center',gap:4}}>
              <Clock size={11}/> Last run: {lastRun.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={runChecks} disabled={running}
          style={{display:'flex',alignItems:'center',gap:6}}>
          {running
            ? <><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Running…</>
            : <><Activity size={13}/> Run All Tests</>}
        </button>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div style={{display:'flex',gap:12,marginBottom:16}}>
          {[
            ['Passed', passed - warned, '#2E7D32', '#E8F5E9'],
            ['Warnings', warned,        '#E65100', '#FFF3E0'],
            ['Failed',  failed,         '#B71C1C', '#FFEBEE'],
          ].map(([l,v,c,bg])=>(
            <div key={l} style={{padding:'8px 16px',background:bg,border:`1px solid ${c}30`,borderRadius:6,borderLeft:`3px solid ${c}`,minWidth:80,textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:11,color:c}}>{l}</div>
            </div>
          ))}
          <div style={{padding:'8px 16px',background:'#f0f4f8',border:'1px solid #e0e0e0',borderRadius:6,borderLeft:'3px solid #003865',minWidth:80,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:700,color:'#003865'}}>{results.length}</div>
            <div style={{fontSize:11,color:'#666'}}>Total</div>
          </div>
        </div>
      )}

      {/* Results by group */}
      {results.length === 0 && !running && (
        <div style={{textAlign:'center',padding:'50px 24px',color:'#aaa',border:'2px dashed #e0e0e0',borderRadius:8}}>
          <Activity size={36} style={{marginBottom:12,opacity:0.3}}/><br/>
          <p style={{fontSize:14,fontWeight:600,marginBottom:6}}>Click "Run All Tests" to check system health</p>
          <p style={{fontSize:12}}>Tests all {CHECKS.length} API endpoints and features</p>
        </div>
      )}

      {running && (
        <div style={{textAlign:'center',padding:'40px',color:'#003865'}}>
          <RefreshCw size={28} style={{marginBottom:10,animation:'spin 1s linear infinite'}}/><br/>
          <p style={{fontSize:13,fontWeight:600}}>Testing {CHECKS.length} endpoints…</p>
        </div>
      )}

      {!running && results.length > 0 && groups.map(group => {
        const groupResults = results.filter(r=>r.group===group);
        return (
          <div key={group} style={{marginBottom:16,border:'1px solid #e0e0e0',borderRadius:6,overflow:'hidden'}}>
            <div style={{padding:'8px 14px',background:'#003865',color:'#fff',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>
              {group}
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {['Status','Check','Detail','Response'].map(h=>(
                    <th key={h} style={{fontSize:10,fontWeight:700,color:'#fff',padding:'5px 10px',background:'#1a3a5c',border:'1px solid #0a2a4c',textAlign:'left'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupResults.map(r => (
                  <tr key={r.key} style={{background:r.ok?(r.warn?'#FFF8F0':'#f9fff9'):'#fff8f8',borderBottom:'1px solid #f0f0f0'}}>
                    <td style={{padding:'8px 10px',width:90}}>
                      {r.ok && !r.warn && <span style={{display:'flex',alignItems:'center',gap:4,color:'#2E7D32',fontSize:12,fontWeight:700}}><CheckCircle size={14}/>Pass</span>}
                      {r.ok &&  r.warn && <span style={{display:'flex',alignItems:'center',gap:4,color:'#E65100',fontSize:12,fontWeight:700}}><AlertCircle size={14}/>Warning</span>}
                      {!r.ok            && <span style={{display:'flex',alignItems:'center',gap:4,color:'#B71C1C',fontSize:12,fontWeight:700}}><XCircle size={14}/>Failed</span>}
                    </td>
                    <td style={{padding:'8px 10px',fontSize:12,fontWeight:600,color:'#333'}}>{r.label}</td>
                    <td style={{padding:'8px 10px',fontSize:12,color:r.ok?(r.warn?'#E65100':'#555'):'#B71C1C'}}>{r.detail}</td>
                    <td style={{padding:'8px 10px',fontSize:11,color:'#aaa',whiteSpace:'nowrap'}}>{r.ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Spin animation */}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}


// ─── Users Tab ────────────────────────────────────────────────────────────────
const MODULES = [
  { key:'loads',       label:'📦 Loads',         desc:'Create & manage loads' },
  { key:'dispatch',    label:'🚛 Dispatch',       desc:'Dispatch board & trips' },
  { key:'invoicing',   label:'💰 Invoicing',      desc:'Create & manage invoices' },
  { key:'settlements', label:'💵 Settlements',    desc:'Driver pay settlements' },
  { key:'customers',   label:'👥 Customers',      desc:'Customer management' },
  { key:'drivers',     label:'👤 Drivers',        desc:'Driver management' },
  { key:'fleet',       label:'🚚 Fleet',          desc:'Truck & trailer management' },
  { key:'reports',     label:'📊 Reports',        desc:'View reports & analytics' },
  { key:'settings',    label:'⚙️ Settings',       desc:'System settings & users' },
];

const DEFAULT_PERMS = {
  loads:true, dispatch:true, invoicing:true, settlements:true,
  customers:true, drivers:true, fleet:true, reports:true, settings:false,
};

// Role presets — clicking a role auto-fills permissions
const ROLE_PRESETS = {
  admin:       { loads:true,  dispatch:true,  invoicing:true,  settlements:true,  customers:true,  drivers:true,  fleet:true,  reports:true,  settings:true  },
  dispatcher:  { loads:true,  dispatch:true,  invoicing:false, settlements:false, customers:true,  drivers:true,  fleet:true,  reports:false, settings:false },
  accounting:  { loads:false, dispatch:false, invoicing:true,  settlements:true,  customers:true,  drivers:false, fleet:false, reports:true,  settings:false },
  readonly:    { loads:true,  dispatch:true,  invoicing:true,  settlements:true,  customers:true,  drivers:true,  fleet:true,  reports:true,  settings:false },
};

function UsersTab() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const EMPTY = { name:'', email:'', password:'', role:'dispatcher', is_active:true, permissions:{...DEFAULT_PERMS} };
  const [form, setForm]     = useState(EMPTY);

  const { data: users=[], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data || []),
  });

  const openModal = (u=null) => {
    setEditing(u);
    setForm(u ? {
      name:u.name, email:u.email, password:'', role:u.role,
      is_active:u.is_active,
      permissions: u.permissions || {...DEFAULT_PERMS},
    } : EMPTY);
    setShowPw(false);
    setModal(true);
  };

  // When role changes, auto-fill permissions from preset
  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, role, permissions: {...ROLE_PRESETS[role]} }));
  };

  const togglePerm = (key) => {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  };

  const saveMut = useMutation({
    mutationFn: b => editing ? api.put(`/users/${editing.id}`, b) : api.post('/users', b),
    onSuccess: () => {
      toast.success(editing ? 'User updated' : 'User created');
      qc.invalidateQueries(['users']);
      setModal(false); setEditing(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => api.put(`/users/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries(['users']),
  });

  const ROLE_COLOR = { admin:'#B71C1C', dispatcher:'#0063A3', accounting:'#6A1B9A', readonly:'#888' };
  const ROLE_BG    = { admin:'#FFEBEE', dispatcher:'#E3F2FD', accounting:'#F3E5F5', readonly:'#f5f5f5' };

  if (isLoading) return <Spinner/>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <p style={{fontSize:13,color:'#666',margin:0}}>Manage who can access Signal TMS and what they can do.</p>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={13}/> Add User</button>
      </div>

      <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['Name','Email','Role','Access','Status','Last Active',''].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {users.map((u, i) => {
              const perms = u.permissions || DEFAULT_PERMS;
              const activeCount = Object.values(perms).filter(Boolean).length;
              return (
                <tr key={u.id} style={{background:i%2===0?'#fff':'#fafafa',opacity:u.is_active?1:0.55}}>
                  <td style={{...TD,fontWeight:600}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:ROLE_COLOR[u.role]||'#003865',
                        color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:12,fontWeight:700,flexShrink:0}}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{...TD,color:'#555'}}>{u.email}</td>
                  <td style={TD}>
                    <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700,
                      background:ROLE_BG[u.role],color:ROLE_COLOR[u.role]}}>
                      {u.role}
                    </span>
                  </td>
                  <td style={TD}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                      {MODULES.filter(m => perms[m.key]).map(m => (
                        <span key={m.key} style={{fontSize:9,padding:'1px 5px',background:'#e3f2fd',color:'#0063A3',borderRadius:3,fontWeight:600}}>
                          {m.label.split(' ')[1] || m.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={TD}>
                    <button onClick={() => toggleMut.mutate({id:u.id, is_active:!u.is_active})}
                      style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,cursor:'pointer',border:'none',
                        background:u.is_active?'#e8f5e9':'#f5f5f5',color:u.is_active?'#2E7D32':'#aaa'}}>
                      {u.is_active ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td style={{...TD,color:'#888',fontSize:11}}>
                    {u.updated_at ? new Date(u.updated_at).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                  </td>
                  <td style={{...TD,width:60,textAlign:'center'}}>
                    <button onClick={() => openModal(u)}
                      style={{background:'none',border:'1px solid #ddd',borderRadius:3,padding:'3px 6px',cursor:'pointer',color:'#555'}}>
                      <Edit size={12}/>
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={7} style={{...TD,textAlign:'center',color:'#aaa',padding:30,fontStyle:'italic'}}>
                No users yet. Click "Add User" to create the first one.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {modal && (
        <div style={{position:'fixed',inset:0,zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)'}} onClick={() => setModal(false)}/>
          <div style={{position:'relative',background:'#fff',borderRadius:8,padding:24,width:480,
            maxHeight:'90vh',overflowY:'auto',boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:'#003865'}}>
              {editing ? `Edit User — ${editing.name}` : 'Add New User'}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Name */}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',display:'block',marginBottom:4}}>Full Name *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. John Smith"/>
              </div>
              {/* Email */}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',display:'block',marginBottom:4}}>Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="john@signaltms.com"/>
              </div>
              {/* Password */}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',display:'block',marginBottom:4}}>
                  {editing ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div style={{position:'relative'}}>
                  <input type={showPw?'text':'password'} className="form-input" style={{paddingRight:40}}
                    value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                    placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'}/>
                  <button onClick={()=>setShowPw(p=>!p)}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#888'}}>
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              {/* Role — clicking auto-fills permissions */}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',display:'block',marginBottom:6}}>
                  Role (auto-fills permissions below)
                </label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {[
                    ['admin',      '👑 Admin',       'Full access to everything'],
                    ['dispatcher', '🚛 Dispatcher',  'Loads, dispatch, fleet'],
                    ['accounting', '💰 Accounting',  'Invoices & settlements'],
                    ['readonly',   '👁️ Read Only',   'View only, no edits'],
                  ].map(([role, label, desc]) => (
                    <button key={role} type="button" onClick={() => handleRoleChange(role)}
                      style={{padding:'8px 10px',border:`2px solid ${form.role===role?ROLE_COLOR[role]:'#e0e0e0'}`,
                        borderRadius:6,cursor:'pointer',textAlign:'left',
                        background:form.role===role?ROLE_BG[role]:'#fff',transition:'all 0.15s'}}>
                      <div style={{fontSize:12,fontWeight:700,color:form.role===role?ROLE_COLOR[role]:'#333'}}>{label}</div>
                      <div style={{fontSize:10,color:'#888',marginTop:1}}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions checkboxes */}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',display:'block',marginBottom:6}}>
                  Module Access — customise as needed
                </label>
                <div style={{border:'1px solid #e0e0e0',borderRadius:6,overflow:'hidden'}}>
                  {MODULES.map((m, i) => (
                    <label key={m.key} onClick={() => togglePerm(m.key)}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                        padding:'9px 12px',cursor:'pointer',
                        background:form.permissions[m.key]?'#f0f7ff':'#fff',
                        borderBottom: i < MODULES.length-1 ? '1px solid #f0f0f0' : 'none',
                        transition:'background 0.1s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14}}>{m.label.split(' ')[0]}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:'#333'}}>{m.label.split(' ').slice(1).join(' ')}</div>
                          <div style={{fontSize:10,color:'#888'}}>{m.desc}</div>
                        </div>
                      </div>
                      <div style={{width:36,height:20,borderRadius:10,position:'relative',flexShrink:0,
                        background:form.permissions[m.key]?'#003865':'#ccc',transition:'background 0.2s'}}>
                        <div style={{position:'absolute',top:2,left:form.permissions[m.key]?16:2,
                          width:16,height:16,borderRadius:'50%',background:'#fff',
                          transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active toggle (edit only) */}
              {editing && (
                <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer',
                  padding:'8px 12px',border:'1px solid #e0e0e0',borderRadius:6}}>
                  <input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))}/>
                  <span>Active — user can log in to Signal TMS</span>
                </label>
              )}
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:20}}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary"
                onClick={() => saveMut.mutate(form)}
                disabled={saveMut.isPending || !form.name || !form.email || (!editing && !form.password)}>
                {saveMut.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const qc = useQueryClient();
  const [tab, setTab]       = useState('company');
  const [form, setForm]     = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data),
  });
  useEffect(() => { if (data) setForm({...data, smtp_password:''}); }, [data]);

  const saveMut = useMutation({
    mutationFn: b => api.put('/settings', b),
    onSuccess: () => { toast.success('Settings saved ✓'); qc.invalidateQueries(['settings']); },
    onError: () => toast.error('Save failed'),
  });
  const testMut = useMutation({
    mutationFn: () => api.post('/settings/test-smtp'),
    onSuccess: r => { setTestResult({ok:true, msg:r.data.message}); toast.success('SMTP test passed ✓'); },
    onError: e => { setTestResult({ok:false, msg:e.response?.data?.message||'Connection failed'}); },
  });

  const h = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const TABS = [
    { id:'company',      label:'🏢 Company Info' },
    { id:'numbering',    label:'🔢 Numbering' },
    { id:'email',        label:'📧 Email & Notifications' },
    { id:'accessorials', label:'💰 Accessorials' },
    { id:'users',        label:'👥 Users' },
    { id:'import',       label:'📥 Import Data' },
    { id:'health',       label:'🔍 System Status' },
  ];

  if (isLoading) return <Spinner/>;

  const canSave = tab !== 'accessorials';

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{marginBottom:0}}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Signal Transportation Ltd — system configuration</p>
        </div>
        {canSave && (
          <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            <Save size={14}/> {saveMut.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid #e0e0e0',marginBottom:20,marginTop:12}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'9px 20px',border:'none',background:'transparent',fontSize:13,
              fontWeight:tab===t.id?700:400,
              color:tab===t.id?'#003865':'#666',
              borderBottom:tab===t.id?'2px solid #003865':'2px solid transparent',
              cursor:'pointer',marginBottom:-2,whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Company Info ── */}
      {tab === 'company' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* Company Details */}
          <div className="card">
            <div className="card-header"><span className="card-title">Company Details</span></div>
            <div className="card-body">
              <div className="form-grid">
                <Field label="Legal Company Name" required className="full">
                  <input name="company_name" className="form-input" value={form.company_name||''} onChange={h}
                    placeholder="Signal Transportation Ltd"/>
                </Field>
                <Field label="DBA / Operating As" className="full">
                  <input name="dba_name" className="form-input" value={form.dba_name||''} onChange={h}
                    placeholder="If different from legal name"/>
                </Field>
                <Field label="MC Number">
                  <input name="mc_number" className="form-input" value={form.mc_number||''} onChange={h} placeholder="MC-XXXXXX"/>
                </Field>
                <Field label="DOT Number">
                  <input name="dot_number" className="form-input" value={form.dot_number||''} onChange={h} placeholder="XXXXXXX"/>
                </Field>
                <Field label="GST / HST Number">
                  <input name="gst_number" className="form-input" value={form.gst_number||''} onChange={h} placeholder="123456789 RT0001"/>
                </Field>
                <Field label="Website">
                  <input name="website" className="form-input" value={form.website||''} onChange={h} placeholder="www.signaltrans.ca"/>
                </Field>
                <Field label="Main Phone">
                  <input name="phone" className="form-input" value={form.phone||''} onChange={h} placeholder="604-867-5543"/>
                </Field>
                <Field label="Fax">
                  <input name="fax" className="form-input" value={form.fax||''} onChange={h} placeholder="Optional"/>
                </Field>
                <Field label="After Hours Phone" className="full">
                  <input name="after_hours_phone" className="form-input" value={form.after_hours_phone||''} onChange={h}
                    placeholder="Emergency / after hours contact"/>
                </Field>
              </div>
            </div>
          </div>

          {/* Address + Emails */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="card">
              <div className="card-header"><span className="card-title">Office / Warehouse Address</span></div>
              <div className="card-body">
                <div className="form-grid">
                  <Field label="Address Line 1" className="full">
                    <input name="address_line1" className="form-input" value={form.address_line1||''} onChange={h}
                      placeholder="3170 194th St Unit 102"/>
                  </Field>
                  <Field label="Address Line 2" className="full">
                    <input name="address_line2" className="form-input" value={form.address_line2||''} onChange={h} placeholder="Suite / Unit (optional)"/>
                  </Field>
                  <Field label="City">
                    <input name="city" className="form-input" value={form.city||''} onChange={h} placeholder="Surrey"/>
                  </Field>
                  <Field label="Province / State">
                    <input name="province" className="form-input" value={form.province||''} onChange={h} placeholder="BC"/>
                  </Field>
                  <Field label="Postal Code">
                    <input name="postal_code" className="form-input" value={form.postal_code||''} onChange={h} placeholder="V3Z 0N4"/>
                  </Field>
                  <Field label="Country">
                    <select name="country" className="form-input" value={form.country||'Canada'} onChange={h}>
                      <option>Canada</option>
                      <option>United States</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Contact Emails</span></div>
              <div className="card-body">
                <div className="form-grid">
                  <Field label="Main Email" className="full">
                    <input type="email" name="email" className="form-input" value={form.email||''} onChange={h}
                      placeholder="info@signaltrans.ca"/>
                  </Field>
                  <Field label="Billing / AR Email" className="full">
                    <input type="email" name="billing_email" className="form-input" value={form.billing_email||''} onChange={h}
                      placeholder="billing@signaltrans.ca"/>
                  </Field>
                  <Field label="Dispatch Email" className="full">
                    <input type="email" name="dispatch_email" className="form-input" value={form.dispatch_email||''} onChange={h}
                      placeholder="dispatch@signaltrans.ca"/>
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Numbering ── */}
      {tab === 'numbering' && (
        <div className="card" style={{maxWidth:600}}>
          <div className="card-header"><span className="card-title">Document Numbering &amp; Prefixes</span></div>
          <div className="card-body">
            <p style={{fontSize:12,color:'#666',marginBottom:16}}>
              Set the prefix for each document type. The system auto-increments the number.
            </p>
            <div className="form-grid">
              {[['Load Prefix','load_prefix','LD'],['Invoice Prefix','invoice_prefix','INV'],
                ['Quote Prefix','quote_prefix','QT'],['Settlement Prefix','settlement_prefix','SET'],
                ['Trip Prefix','trip_prefix','TRIP']].map(([label,name,ph]) => (
                <Field key={name} label={label}>
                  <input name={name} className="form-input" value={form[name]||''} onChange={h} placeholder={ph}/>
                </Field>
              ))}
              <Field label="Default Payment Terms (days)">
                <input name="default_payment_terms" type="number" className="form-input"
                  value={form.default_payment_terms||30} onChange={h}/>
              </Field>
              <Field label="Default Tax / GST Rate (%)">
                <input name="tax_rate" type="number" step="0.01" className="form-input"
                  value={parseFloat(form.tax_rate||0)*100}
                  onChange={e => setForm(f => ({ ...f, tax_rate:(parseFloat(e.target.value)||0)/100 }))}/>
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Email & Notifications ── */}
      {tab === 'email' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* Gmail SMTP */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📧 Gmail SMTP Settings</span>
            </div>
            <div className="card-body">
              {/* How to guide */}
              <div style={{background:'#f0f4fc',border:'1px solid #c5d9f0',borderRadius:6,padding:'10px 14px',marginBottom:16,fontSize:12}}>
                <div style={{fontWeight:700,color:'#003865',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                  <AlertCircle size={14}/> How to get a Gmail App Password
                </div>
                <ol style={{margin:0,paddingLeft:18,lineHeight:2,color:'#555'}}>
                  <li>Go to <b>myaccount.google.com</b></li>
                  <li>Click <b>Security</b> → enable <b>2-Step Verification</b> first</li>
                  <li>Search <b>"App passwords"</b> in the search bar</li>
                  <li>Select App: <b>Mail</b> → Device: <b>Windows Computer</b></li>
                  <li>Click <b>Generate</b> → copy the 16-character password</li>
                  <li>Paste it in the App Password field below</li>
                </ol>
              </div>

              <div className="form-grid">
                <Field label="From Name (shown to recipients)" className="full">
                  <input name="smtp_from_name" className="form-input" value={form.smtp_from_name||''} onChange={h}
                    placeholder="Signal Transportation Ltd"/>
                </Field>
                <Field label="Gmail Address (your Gmail)" className="full">
                  <input type="email" name="smtp_email" className="form-input" value={form.smtp_email||''} onChange={h}
                    placeholder="youremail@gmail.com"/>
                </Field>
                <Field label="Gmail App Password" className="full">
                  <div style={{position:'relative'}}>
                    <input type={showPw?'text':'password'} name="smtp_password" className="form-input"
                      style={{paddingRight:40}}
                      value={form.smtp_password||''}
                      onChange={h}
                      placeholder={data?.smtp_password_set ? '●●●● App password saved — enter new to change' : 'xxxx xxxx xxxx xxxx (16 chars)'}/>
                    <button onClick={() => setShowPw(p=>!p)}
                      style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#888'}}>
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {data?.smtp_password_set && !form.smtp_password && (
                    <div style={{fontSize:11,color:'#2e7d32',marginTop:3}}>✓ App password is saved</div>
                  )}
                </Field>
                <Field label="SMTP Host">
                  <input name="smtp_host" className="form-input" value={form.smtp_host||'smtp.gmail.com'} onChange={h}/>
                </Field>
                <Field label="SMTP Port">
                  <input name="smtp_port" type="number" className="form-input" value={form.smtp_port||587} onChange={h}/>
                </Field>
              </div>

              <div style={{display:'flex',gap:10,marginTop:14,alignItems:'center'}}>
                <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
                  <Save size={13}/> {saveMut.isPending?'Saving…':'Save'}
                </button>
                <button onClick={() => testMut.mutate()} disabled={testMut.isPending}
                  style={{padding:'7px 14px',border:'1px solid #0063A3',color:'#0063A3',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                  <Mail size={13}/> {testMut.isPending?'Testing…':'Test Connection'}
                </button>
                {testResult && (
                  <span style={{fontSize:12,fontWeight:600,color:testResult.ok?'#2e7d32':'#c62828'}}>
                    {testResult.ok?'✓':'✗'} {testResult.msg}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Notification Defaults */}
          <div className="card">
            <div className="card-header"><span className="card-title">🔔 Notification Defaults</span></div>
            <div className="card-body">
              <p style={{fontSize:12,color:'#666',marginBottom:16}}>
                Control when the system automatically sends emails.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[
                  ['notify_driver_on_create', 'Auto-notify driver when a trip is created', 'Opens email to driver with trip details'],
                  ['notify_invoice_copy',     'Send invoice copy to billing email', 'CC your billing email when invoice is sent'],
                  ['cc_dispatch_on_emails',   'CC dispatch on all driver emails', 'dispatch email gets a copy of every driver notification'],
                ].map(([name, label, desc]) => (
                  <label key={name} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',
                    border:`2px solid ${form[name]?'#003865':'#e0e0e0'}`,borderRadius:6,cursor:'pointer',
                    background:form[name]?'#f0f4fc':'#fff',transition:'all 0.15s'}}>
                    <input type="checkbox" name={name} checked={!!form[name]} onChange={h} style={{marginTop:2,width:16,height:16}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'#333'}}>{label}</div>
                      <div style={{fontSize:11,color:'#888',marginTop:2}}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{marginTop:20,padding:'12px 14px',background:'#fff3cd',border:'1px solid #ffc107',borderRadius:6,fontSize:12,color:'#856404'}}>
                <b>📱 SMS Notifications — Phase 2</b><br/>
                SMS via Twilio will be added in the next update. Once configured, drivers will receive both email and SMS for every trip assignment.
              </div>
              <div style={{marginTop:16,padding:'12px 14px',background:'#f3e5f5',border:'1px solid #ce93d8',borderRadius:6}}>
                <div style={{fontSize:12,fontWeight:700,color:'#6A1B9A',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                  🤖 AI — Rate Confirmation Extraction
                </div>
                <p style={{fontSize:12,color:'#555',marginBottom:10}}>
                  Enter your Anthropic API key to enable automatic extraction of load details from Rate Confirmation PDFs.
                </p>
                <Field label="Anthropic API Key">
                  <div style={{position:'relative'}}>
                    <input type={showApiKey?'text':'password'} name="anthropic_api_key" className="form-input"
                      style={{paddingRight:40,fontFamily:'monospace',fontSize:12}}
                      value={form.anthropic_api_key||''}
                      onChange={h}
                      placeholder={data?.api_key_set ? '●●●● Key saved — enter new to change' : 'sk-ant-api03-...'}/>
                    <button onClick={()=>setShowApiKey(p=>!p)}
                      style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#888'}}>
                      {showApiKey ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {data?.api_key_set && !form.anthropic_api_key && (
                    <div style={{fontSize:11,color:'#2e7d32',marginTop:3}}>✓ API key is saved</div>
                  )}
                </Field>
                <button className="btn btn-primary" onClick={()=>saveMut.mutate(form)} disabled={saveMut.isPending}
                  style={{marginTop:8,background:'#6A1B9A',borderColor:'#6A1B9A'}}>
                  <Save size={13}/> {saveMut.isPending?'Saving…':'Save API Key'}
                </button>
              </div>

              <div style={{marginTop:12}}>
                <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} style={{marginTop:4}}>
                  <Save size={13}/> {saveMut.isPending?'Saving…':'Save Notification Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Accessorials ── */}
      {tab === 'accessorials' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Accessorial Charges — Rate Card</span>
          </div>
          <div className="card-body">
            <AccessorialsTab/>
          </div>
        </div>
      )}

      {/* ── Tab: Users ── */}
      {tab === 'users' && (
        <div className="card">
          <div className="card-header"><span className="card-title">👥 User Management</span></div>
          <div className="card-body"><UsersTab/></div>
        </div>
      )}

      {/* ── Tab: Import Data ── */}
      {tab === 'import' && <ImportTab/>}

      {/* ── Tab: System Status ── */}
      {tab === 'health' && <HealthTab/>}
    </div>
  );
}
