import React, { useState, useEffect, useRef, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

async function api(path, opts = {}) {
  const token = localStorage.getItem('driver_token');
  const isForm = opts.body instanceof FormData;
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? (isForm ? opts.body : JSON.stringify(opts.body)) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── GPS Tracking ────────────────────────────────────────────────────────────
function startGPSTracking(driver, loads) {
  if (!navigator.geolocation) return null;
  const activeLoad = loads.find(l => !['delivered','cancelled'].includes(l.status));
  const watchId = navigator.geolocation.watchPosition(
    pos => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      api('/tracking/location', {
        method: 'POST',
        body: {
          latitude, longitude, accuracy, speed, heading,
          load_id: activeLoad?.id || null,
        }
      }).catch(() => {}); // silent fail — don't interrupt driver
    },
    err => console.warn('[GPS]', err.message),
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
  );
  return watchId;
}

const fmt = d => d ? new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—';
const fmtFull = d => d ? new Date(d).toLocaleDateString('en-CA', { weekday:'short', month: 'short', day: 'numeric', year:'numeric' }) : '—';

const STATUS_STEPS = ['dispatched','en_route_pickup','at_pickup','in_transit','at_delivery','delivered'];
const STATUS_LABEL = { dispatched:'Dispatched', en_route_pickup:'En Route', at_pickup:'At Pickup', in_transit:'In Transit', at_delivery:'At Delivery', delivered:'Delivered' };
const STATUS_NEXT  = { dispatched:'en_route_pickup', en_route_pickup:'at_pickup', at_pickup:'in_transit', in_transit:'at_delivery' };
const STATUS_BTN   = { dispatched:'▶ Start Trip', en_route_pickup:'📍 Arrived at Pickup', at_pickup:'✅ Loaded — Depart', in_transit:'📍 Arrived at Delivery' };

// ─── PWA Install prompt ───────────────────────────────────────────────────────
// Add to manifest: handled via index.html

// ─── Signature Pad ────────────────────────────────────────────────────────────
// ─── Signature Pad ───────────────────────────────────────────────────────────
function SigPad({ loadNum, eventType, load, onSave, onCancel }) {
  const ref = useRef(); const drawing = useRef(false); const [drawn, setDrawn] = useState(false);
  const [signerName, setSignerName] = useState('');
  const isPickup = eventType === 'pickup';

  useEffect(() => {
    const c = ref.current;
    // Set explicit pixel dimensions for canvas
    const rect = c.parentElement.getBoundingClientRect();
    c.width = rect.width || 340;
    c.height = rect.height || 200;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#003865'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, []);

  const pos = e => { const r=ref.current.getBoundingClientRect(), t=e.touches?e.touches[0]:e; return {x:t.clientX-r.left,y:t.clientY-r.top}; };
  const start = e => { e.preventDefault(); drawing.current=true; const {x,y}=pos(e); const ctx=ref.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(x,y); };
  const move  = e => { e.preventDefault(); if(!drawing.current)return; const {x,y}=pos(e); const ctx=ref.current.getContext('2d'); ctx.lineTo(x,y); ctx.stroke(); setDrawn(true); };
  const end   = () => { drawing.current=false; };
  const clear = () => { const c=ref.current,ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); setDrawn(false); };

  const save = () => {
    // Generate POD PDF as a new window before saving signature
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-CA', {hour:'2-digit',minute:'2-digit'});
    const dateStr = now.toLocaleDateString('en-CA', {month:'numeric',day:'numeric',year:'numeric'});
    const sigData = ref.current.toDataURL('image/png');

    // Open POD window
    const w = window.open('','_blank','width=400,height=600');
    if(w) {
      w.document.write(`<!DOCTYPE html><html><head><title>POD ${loadNum}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;max-width:380px;margin:0 auto}
      .row{display:flex;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px}
      .label{color:#555}.val{font-weight:bold}
      .sig-box{border:1px solid #000;margin-top:16px;padding:8px}
      h2{font-size:14px;text-align:center;margin-bottom:16px;border-bottom:2px solid #000;padding-bottom:8px}
      @media print{button{display:none}}
      </style></head><body>
      <h2>Signal Transportation Ltd — ${isPickup ? 'PICKUP' : 'DELIVERY'} RECEIPT</h2>
      <div class="row"><span class="label">Date:</span><span class="val">${dateStr}</span></div>
      <div class="row"><span class="label">Time:</span><span class="val">${timeStr}</span></div>
      <div class="row"><span class="label">Load #:</span><span class="val">${loadNum}</span></div>
      <div class="row"><span class="label">Company:</span><span class="val">${isPickup?(load.origin_name||''):(load.dest_name||load.customer_name||'')}</span></div>
      <div class="row"><span class="label">Address:</span><span class="val">${isPickup?(load.origin_address||load.origin_city+', '+load.origin_state):(load.dest_address||load.dest_city+', '+load.dest_state)}</span></div>
      <div class="row"><span class="label">PO Number:</span><span class="val">${load.po_number||'—'}</span></div>
      <div class="row"><span class="label">Reference:</span><span class="val">${load.ref_number||load.bol_number||'—'}</span></div>
      <div class="row"><span class="label">Weight:</span><span class="val">${load.weight?parseFloat(load.weight).toLocaleString()+' lb':'—'}</span></div>
      <div class="row"><span class="label">Pieces:</span><span class="val">${load.pieces||'—'}</span></div>
      <div class="row"><span class="label">Commodity:</span><span class="val">${load.commodity||'—'}</span></div>
      <div style="margin-top:16px"><p style="margin-bottom:4px">Received in good order by:</p>
      <div class="sig-box"><img src="${sigData}" style="width:100%;max-height:120px;object-fit:contain"/></div>
      <p style="margin-top:6px;font-size:11px">Signor's Last Name: ${signerName||'_________________'}</p></div>
      <button onclick="window.print()" style="margin-top:16px;padding:10px 24px;background:#003865;color:#fff;border:none;border-radius:4px;cursor:pointer;width:100%">Print / Save PDF</button>
      </body></html>`);
      w.document.close();
    }

    // Save signature blob
    ref.current.toBlob(b => onSave(b, signerName), 'image/png');
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'#001a33',display:'flex',flexDirection:'column',padding:16,fontFamily:'system-ui,sans-serif'}}>
      <div style={{textAlign:'center',marginBottom:8}}>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>
          {isPickup ? 'Pickup Confirmation' : 'Delivery Confirmation'}
        </div>
        <div style={{fontSize:20,fontWeight:700,color:'#fff'}}>{loadNum}</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:2}}>
          {isPickup ? (load.origin_name||load.origin_city) : (load.dest_name||load.dest_city)}
        </div>
        {/* Load details summary */}
        <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:8,fontSize:11,color:'rgba(255,255,255,0.5)'}}>
          {load.weight&&<span>⚖️ {parseFloat(load.weight).toLocaleString()} lb</span>}
          {load.pieces&&<span>📦 {load.pieces} pcs</span>}
          {load.po_number&&<span>PO: {load.po_number}</span>}
        </div>
      </div>

      {/* Signer name */}
      <div style={{marginBottom:8}}>
        <input value={signerName} onChange={e=>setSignerName(e.target.value)}
          placeholder="Signer's last name (optional)"
          style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:8,fontSize:13,color:'#fff',boxSizing:'border-box',outline:'none'}}/>
      </div>

      <div style={{height:220,background:'#fff',borderRadius:12,overflow:'hidden',position:'relative',border:'2px solid rgba(255,255,255,0.2)',flexShrink:0}}>
        <canvas ref={ref} style={{width:'100%',height:'100%',touchAction:'none',display:'block',cursor:'crosshair'}}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!drawn&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
          <div style={{textAlign:'center',color:'#ccc'}}><div style={{fontSize:32,marginBottom:4}}>✍️</div><div style={{fontSize:14}}>Sign here</div></div>
        </div>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 2fr',gap:8,marginTop:12}}>
        <button onClick={clear} style={{padding:'14px',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Clear</button>
        <button onClick={onCancel} style={{padding:'14px',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,fontSize:13,cursor:'pointer'}}>Cancel</button>
        <button onClick={save} disabled={!drawn}
          style={{padding:'14px',background:drawn?'#22c55e':'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:drawn?'pointer':'default',transition:'background 0.2s'}}>
          {drawn ? (isPickup?'✅ Confirm Pickup':'✅ Confirm Delivery') : 'Sign above first'}
        </button>
      </div>
    </div>
  );
}

// ─── Trip Progress Bar ────────────────────────────────────────────────────────
function ProgressBar({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div style={{padding:'12px 16px',background:'rgba(255,255,255,0.06)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
        {/* Track */}
        <div style={{position:'absolute',top:'50%',left:0,right:0,height:2,background:'rgba(255,255,255,0.15)',transform:'translateY(-50%)',zIndex:0}}/>
        <div style={{position:'absolute',top:'50%',left:0,width:`${Math.max(0,(idx/(STATUS_STEPS.length-1))*100)}%`,height:2,background:'#22c55e',transform:'translateY(-50%)',zIndex:0,transition:'width 0.5s'}}/>
        {STATUS_STEPS.map((s,i) => {
          const done = i <= idx;
          const active = i === idx;
          return (
            <div key={s} style={{zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{width:active?14:10,height:active?14:10,borderRadius:'50%',
                background:done?'#22c55e':'rgba(255,255,255,0.2)',
                border:active?'2px solid #fff':'none',
                boxShadow:active?'0 0 0 3px rgba(34,197,94,0.3)':'none',
                transition:'all 0.3s'}}/>
              {active&&<div style={{fontSize:8,color:'rgba(255,255,255,0.7)',whiteSpace:'nowrap',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                {STATUS_LABEL[s]}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trip Detail ──────────────────────────────────────────────────────────────
function TripDetail({ load, onBack, onRefresh }) {
  const [busy, setBusy]         = useState(false);
  const [showSig, setShowSig]   = useState(false);
  const [sigType, setSigType]   = useState('delivery'); // 'pickup' or 'delivery'
  const [toast, setToast]       = useState(null);
  const [tab, setTab]           = useState('trip');
  const fileRef = useRef();
  const photoRef = useRef();

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (status, note = '') => {
    setBusy(true);
    try {
      await api(`/driver-app/loads/${load.id}/status`, { method: 'PUT', body: { status, note } });
      showToast(`✅ ${STATUS_LABEL[status] || status}`);
      setTimeout(() => { onRefresh(); }, 800);
    } catch (e) { showToast('❌ ' + e.message, false); }
    finally { setBusy(false); }
  };

  const handleSig = async (blob, signerName) => {
    setShowSig(false); setBusy(true);
    const isPickup = sigType === 'pickup';
    showToast(isPickup ? 'Saving pickup confirmation…' : 'Uploading POD signature…');
    try {
      const fd = new FormData();
      const fname = isPickup ? `PICKUP-${load.load_number}-${Date.now()}.png` : `POD-${load.load_number}-${Date.now()}.png`;
      fd.append('file', blob, fname);
      fd.append('doc_type', isPickup ? 'bol' : 'pod');
      if (signerName) fd.append('notes', `Signed by: ${signerName}`);
      await api(`/driver-app/loads/${load.id}/pod`, { method: 'POST', body: fd });
      const newStatus = isPickup ? 'in_transit' : 'delivered';
      const note = isPickup
        ? `Picked up — signed by ${signerName||'customer'}`
        : `Delivered — signed by ${signerName||'customer'}`;
      await api(`/driver-app/loads/${load.id}/status`, { method: 'PUT', body: { status: newStatus, note } });
      showToast(isPickup ? '✅ Pickup confirmed! En route.' : '✅ Delivered! POD saved.');
      setTimeout(() => { onRefresh(); if(!isPickup) onBack(); }, 1800);
    } catch (e) { showToast('❌ ' + e.message, false); }
    finally { setBusy(false); }
  };

  const openSig = (type) => { setSigType(type); setShowSig(true); };

  const uploadPhoto = async e => {
    const file = e.target.files[0]; if (!file) return;
    setBusy(true); showToast('Uploading photo…');
    try {
      const fd = new FormData(); fd.append('file', file, file.name); fd.append('doc_type', 'pod');
      await api(`/driver-app/loads/${load.id}/pod`, { method: 'POST', body: fd });
      showToast('✅ Photo POD uploaded!');
    } catch (e) { showToast('❌ ' + e.message, false); }
    finally { setBusy(false); e.target.value = ''; }
  };

  const nextStatus = STATUS_NEXT[load.status];
  const nextLabel  = STATUS_BTN[load.status];
  const delivered  = load.status === 'delivered';

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {showSig && <SigPad loadNum={load.load_number} eventType={sigType} load={load} onSave={handleSig} onCancel={() => setShowSig(false)}/>}

      {/* Progress */}
      <ProgressBar status={load.status}/>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.08)',background:'rgba(0,0,0,0.2)',flexShrink:0}}>
        {[['trip','🗺 Trip'],['freight','📦 Freight'],['docs','📋 Details']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{flex:1,padding:'11px 4px',border:'none',background:'transparent',
              color:tab===id?'#fff':'rgba(255,255,255,0.45)',
              fontSize:12,fontWeight:tab===id?700:400,cursor:'pointer',
              borderBottom:tab===id?'2px solid #22c55e':'2px solid transparent'}}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:16}}>

        {/* Toast */}
        {toast && (
          <div style={{position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',zIndex:8888,
            background:toast.ok?'#1a3a1a':'#3a1a1a',color:'#fff',padding:'10px 20px',borderRadius:20,
            fontSize:13,fontWeight:600,boxShadow:'0 4px 16px rgba(0,0,0,0.4)',whiteSpace:'nowrap',
            border:`1px solid ${toast.ok?'rgba(34,197,94,0.3)':'rgba(255,100,100,0.3)'}`}}>
            {toast.msg}
          </div>
        )}

        {/* ── TRIP TAB ── */}
        {tab==='trip'&&(
          <div>
            {/* Pickup stop */}
            <div style={{background:'rgba(255,255,255,0.06)',borderRadius:12,marginBottom:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{padding:'10px 14px',background:'rgba(0,99,163,0.3)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#7dd3fc',textTransform:'uppercase',letterSpacing:'0.08em'}}>📦 Pickup</span>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>{fmtFull(load.pickup_date)}{load.pickup_time?' · '+load.pickup_time.slice(0,5):''}</span>
              </div>
              <div style={{padding:'12px 14px'}}>
                <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:4}}>{load.origin_name||'Shipper'}</div>
                {load.origin_address&&<div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:2}}>{load.origin_address}</div>}
                <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:8}}>{load.origin_city}, {load.origin_state} {load.origin_zip||''}</div>
                {load.origin_city&&(
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(`${load.origin_address||''} ${load.origin_city} ${load.origin_state}`)}`}
                    target="_blank" rel="noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,color:'#7dd3fc',textDecoration:'none',background:'rgba(125,211,252,0.1)',padding:'5px 10px',borderRadius:6,border:'1px solid rgba(125,211,252,0.2)'}}>
                    📍 Open in Maps
                  </a>
                )}
                {load.requires_appointment&&<div style={{marginTop:8,fontSize:12,color:'#fbbf24',fontWeight:600}}>📅 Appointment Required</div>}
              </div>
            </div>

            {/* Delivery stop */}
            <div style={{background:'rgba(255,255,255,0.06)',borderRadius:12,marginBottom:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{padding:'10px 14px',background:'rgba(34,197,94,0.2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#86efac',textTransform:'uppercase',letterSpacing:'0.08em'}}>🎯 Delivery</span>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>{fmtFull(load.delivery_date)}{load.delivery_time?' · '+load.delivery_time.slice(0,5):''}</span>
              </div>
              <div style={{padding:'12px 14px'}}>
                <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:4}}>{load.dest_name||'Consignee'}</div>
                {load.dest_address&&<div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:2}}>{load.dest_address}</div>}
                <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:8}}>{load.dest_city}, {load.dest_state} {load.dest_zip||''}</div>
                {load.dest_city&&(
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(`${load.dest_address||''} ${load.dest_city} ${load.dest_state}`)}`}
                    target="_blank" rel="noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,color:'#86efac',textDecoration:'none',background:'rgba(134,239,172,0.1)',padding:'5px 10px',borderRadius:6,border:'1px solid rgba(134,239,172,0.2)'}}>
                    📍 Open in Maps
                  </a>
                )}
                {load.requires_liftgate&&<div style={{marginTop:8,fontSize:12,color:'#93c5fd',fontWeight:600}}>🔵 Liftgate Required</div>}
              </div>
            </div>

            {/* Special instructions */}
            {load.special_instructions&&(
              <div style={{background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.25)',borderRadius:10,padding:'12px 14px',marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:'#fbbf24',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>⚠️ Special Instructions</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',lineHeight:1.5}}>{load.special_instructions}</div>
              </div>
            )}

            {/* Dispatch notes */}
            {load.dispatch_notes&&(
              <div style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.25)',borderRadius:10,padding:'12px 14px',marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:'#c4b5fd',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>💬 Dispatcher Notes</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',lineHeight:1.5}}>{load.dispatch_notes}</div>
              </div>
            )}

            {/* Action buttons */}
            {!delivered&&(
              <div style={{marginBottom:16}}>
                {nextStatus&&nextLabel&&(
                  <button onClick={()=>updateStatus(nextStatus)} disabled={busy}
                    style={{width:'100%',padding:'18px',background:busy?'rgba(255,255,255,0.1)':'#22c55e',color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:700,cursor:busy?'default':'pointer',marginBottom:10,transition:'all 0.2s',boxShadow:busy?'none':'0 4px 16px rgba(34,197,94,0.3)'}}>
                    {busy ? 'Updating…' : nextLabel}
                  </button>
                )}
                {load.status==='at_delivery'&&(
                  <>
                    <button onClick={()=>setShowSig(true)} disabled={busy}
                      style={{width:'100%',padding:'18px',background:'#22c55e',color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:700,cursor:'pointer',marginBottom:10,boxShadow:'0 4px 16px rgba(34,197,94,0.35)'}}>
                      ✍️ Get Signature → Complete
                    </button>
                    <button onClick={()=>updateStatus('delivered','No signature')} disabled={busy}
                      style={{width:'100%',padding:'14px',background:'transparent',color:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:10,fontSize:14,cursor:'pointer',marginBottom:10}}>
                      Mark Delivered (No Signature)
                    </button>
                  </>
                )}
              </div>
            )}

            {delivered&&(
              <div style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:12,padding:20,marginBottom:16,textAlign:'center'}}>
                <div style={{fontSize:36,marginBottom:8}}>✅</div>
                <div style={{fontSize:18,fontWeight:700,color:'#22c55e',marginBottom:4}}>Delivery Complete!</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Invoice will be auto-generated</div>
              </div>
            )}

            {/* POD Photo */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={uploadPhoto}/>
            <button onClick={()=>fileRef.current?.click()} disabled={busy}
              style={{width:'100%',padding:'14px',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.8)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',marginBottom:10}}>
              📷 Upload Photo POD
            </button>

            {/* Call dispatch */}
            <a href="tel:7786635001"
              style={{display:'block',textAlign:'center',padding:'14px',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.8)',borderRadius:10,fontSize:13,fontWeight:600,textDecoration:'none',border:'1px solid rgba(255,255,255,0.12)'}}>
              📞 Call Dispatch — 778-663-5001
            </a>
          </div>
        )}

        {/* ── FREIGHT TAB ── */}
        {tab==='freight'&&(
          <div>
            {[
              ['Customer', load.customer_name],
              ['Commodity', load.commodity||'—'],
              ['Weight', load.weight ? `${parseFloat(load.weight).toLocaleString()} lb` : '—'],
              ['Pieces', load.pieces||'—'],
              ['Equipment', load.equipment_type||'Dry Van'],
              ['PO Number', load.po_number||'—'],
              ['BOL Number', load.bol_number||'—'],
              ['Reference', load.ref_number||'—'],
              ['Miles', load.miles ? `${load.miles} mi` : '—'],
            ].map(([label,val])=>(
              <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                <span style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>{label}</span>
                <span style={{fontSize:13,fontWeight:600,color:'#fff',textAlign:'right',maxWidth:200}}>{val||'—'}</span>
              </div>
            ))}
            {load.requires_liftgate&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(59,130,246,0.15)',borderRadius:8,fontSize:13,color:'#93c5fd',fontWeight:600}}>🔵 Liftgate Required</div>}
            {load.requires_appointment&&<div style={{marginTop:8,padding:'10px 14px',background:'rgba(251,191,36,0.15)',borderRadius:8,fontSize:13,color:'#fbbf24',fontWeight:600}}>📅 Appointment Required</div>}
          </div>
        )}

        {/* ── DETAILS TAB ── */}
        {tab==='docs'&&(
          <div>
            <div style={{background:'rgba(255,255,255,0.06)',borderRadius:12,padding:'14px',marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Load Summary</div>
              {[
                ['Load #', load.load_number],
                ['Status', STATUS_LABEL[load.status]||load.status],
                ['Pickup', `${fmtFull(load.pickup_date)} ${load.pickup_time?.slice(0,5)||''}`],
                ['Delivery', `${fmtFull(load.delivery_date)} ${load.delivery_time?.slice(0,5)||''}`],
                ['Revenue', load.total_revenue ? `$${parseFloat(load.total_revenue).toFixed(2)}` : '—'],
              ].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>{l}</span>
                  <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>{v}</span>
                </div>
              ))}
            </div>
            <a href="tel:7786635001"
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'16px',background:'rgba(255,255,255,0.07)',color:'#fff',borderRadius:12,fontSize:14,fontWeight:700,textDecoration:'none',border:'1px solid rgba(255,255,255,0.12)',marginBottom:10}}>
              📞 Call Dispatch: 778-663-5001
            </a>
            {load.customer_phone&&(
              <a href={`tel:${load.customer_phone}`}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.7)',borderRadius:10,fontSize:13,textDecoration:'none',border:'1px solid rgba(255,255,255,0.08)'}}>
                📞 Call Customer: {load.customer_phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState('');
  const [busy,setBusy]=useState(false); const [err,setErr]=useState('');
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await api('/driver-app/auth/login', { method:'POST', body:{email,password:pass} });
      localStorage.setItem('driver_token', r.data.token);
      onLogin(r.data.driver);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#001a33 0%,#003865 60%,#004d8a 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'system-ui,sans-serif'}}>
      <div style={{marginBottom:32,textAlign:'center'}}>
        <div style={{fontSize:56,marginBottom:8}}>🚛</div>
        <div style={{fontSize:24,fontWeight:800,color:'#fff',letterSpacing:'-0.5px'}}>Signal Driver</div>
        <div style={{fontSize:14,color:'rgba(255,255,255,0.5)',marginTop:4}}>Signal Transportation Ltd</div>
      </div>
      <form onSubmit={submit} style={{width:'100%',maxWidth:340}}>
        {err&&<div style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',padding:'10px 14px',borderRadius:8,marginBottom:14,fontSize:13,textAlign:'center'}}>{err}</div>}
        <div style={{marginBottom:14}}>
          <label style={{display:'block',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
            style={{width:'100%',padding:'14px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,fontSize:15,color:'#fff',boxSizing:'border-box',outline:'none'}}/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={{display:'block',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Password / License #</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required autoComplete="current-password"
            style={{width:'100%',padding:'14px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,fontSize:15,color:'#fff',boxSizing:'border-box',outline:'none'}}/>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:6}}>Default password: your license number</div>
        </div>
        <button type="submit" disabled={busy}
          style={{width:'100%',padding:'16px',background:busy?'rgba(34,197,94,0.4)':'#22c55e',color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:700,cursor:busy?'default':'pointer',boxShadow:busy?'none':'0 4px 20px rgba(34,197,94,0.4)',transition:'all 0.2s'}}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

// ─── Load Card ────────────────────────────────────────────────────────────────
function LoadCard({ load, active, onTap }) {
  const idx = STATUS_STEPS.indexOf(load.status);
  const pct = idx >= 0 ? Math.round((idx / (STATUS_STEPS.length - 1)) * 100) : 0;
  const done = load.status === 'delivered';
  return (
    <div onClick={onTap} style={{background:'rgba(255,255,255,0.05)',borderRadius:12,marginBottom:10,overflow:'hidden',cursor:'pointer',border:`1px solid ${active?'rgba(34,197,94,0.4)':'rgba(255,255,255,0.08)'}`,transition:'border-color 0.2s'}}>
      {/* Progress strip */}
      <div style={{height:3,background:'rgba(255,255,255,0.08)'}}>
        <div style={{height:'100%',width:`${pct}%`,background:done?'#22c55e':'#0063A3',transition:'width 0.5s'}}/>
      </div>
      <div style={{padding:'12px 14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <span style={{fontFamily:'monospace',fontWeight:700,fontSize:15,color:'#fff'}}>{load.load_number}</span>
          <span style={{fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:20,
            background:done?'rgba(34,197,94,0.15)':'rgba(0,99,163,0.2)',
            color:done?'#86efac':'#93c5fd',border:`1px solid ${done?'rgba(34,197,94,0.2)':'rgba(0,99,163,0.3)'}`}}>
            {STATUS_LABEL[load.status]||load.status}
          </span>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.8)',marginBottom:4}}>{load.customer_name}</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6}}>
          {load.origin_city}, {load.origin_state} → {load.dest_city}, {load.dest_state}
        </div>
        <div style={{display:'flex',gap:12,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
          <span>📅 {fmt(load.pickup_date)}</span>
          <span>🎯 {fmt(load.delivery_date)}</span>
          {load.commodity&&<span>📦 {load.commodity.slice(0,20)}</span>}
        </div>
        {active&&<div style={{marginTop:8,fontSize:11,color:'#22c55e',fontWeight:600}}>▶ Tap to continue →</div>}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function DriverApp() {
  const [driver, setDriver] = useState(() => {
    try {
      const t = localStorage.getItem('driver_token');
      if (!t) return null;
      const p = JSON.parse(atob(t.split('.')[1]));
      if (p.exp < Date.now() / 1000) { localStorage.removeItem('driver_token'); return null; }
      return JSON.parse(localStorage.getItem('driver_user') || 'null');
    } catch { return null; }
  });
  const [loads, setLoads]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchLoads = useCallback(async () => {
    if (!driver) return;
    setLoading(true);
    try {
      const r = await api('/driver-app/loads');
      setLoads(r.data || []);
      setLastRefresh(new Date());
    } catch (e) {
      if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
        localStorage.removeItem('driver_token'); localStorage.removeItem('driver_user'); setDriver(null);
      }
    } finally { setLoading(false); }
  }, [driver]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!driver) return;
    const t = setInterval(fetchLoads, 60000);
    return () => clearInterval(t);
  }, [driver, fetchLoads]);

  // GPS tracking — starts when driver has active loads
  useEffect(() => {
    if (!driver || !loads.length) return;
    const watchId = startGPSTracking(driver, loads);
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [driver, loads]);

  const handleLogin = d => { localStorage.setItem('driver_user', JSON.stringify(d)); setDriver(d); };
  const handleLogout = () => { localStorage.removeItem('driver_token'); localStorage.removeItem('driver_user'); setDriver(null); setLoads([]); setSelected(null); };

  if (!driver) return <Login onLogin={handleLogin}/>;

  const activeLoads   = loads.filter(l => !['delivered','cancelled'].includes(l.status));
  const doneLoads     = loads.filter(l => l.status === 'delivered');
  const selectedLoad  = loads.find(l => l.id === selected);

  return (
    <div style={{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'#0a1628',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',color:'#fff'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)',backdropFilter:'blur(10px)',padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.06)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {selected&&(
            <button onClick={()=>setSelected(null)}
              style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',color:'#fff',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
              ←
            </button>
          )}
          <div>
            <div style={{fontSize:14,fontWeight:700}}>
              {selected&&selectedLoad ? selectedLoad.load_number : `🚛 ${driver.first_name} ${driver.last_name}`}
            </div>
            {!selected&&lastRefresh&&<div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>Updated {lastRefresh.toLocaleTimeString()}</div>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {!selected&&(
            <button onClick={fetchLoads} disabled={loading}
              style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',padding:'6px 10px',borderRadius:6,fontSize:11,cursor:'pointer'}}>
              {loading ? '…' : '↻'}
            </button>
          )}
          <button onClick={handleLogout}
            style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.5)',padding:'6px 10px',borderRadius:6,fontSize:11,cursor:'pointer'}}>
            Logout
          </button>
        </div>
      </div>

      {/* Trip detail */}
      {selected && selectedLoad ? (
        <TripDetail load={selectedLoad} onBack={()=>setSelected(null)} onRefresh={()=>{fetchLoads();}}/>
      ) : (
        <div style={{flex:1,overflowY:'auto',padding:16}}>
          {/* Active loads */}
          {activeLoads.length > 0 && (
            <>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>
                Active ({activeLoads.length})
              </div>
              {activeLoads.map(l=>(
                <LoadCard key={l.id} load={l} active={true} onTap={()=>setSelected(l.id)}/>
              ))}
            </>
          )}

          {/* Empty state */}
          {!loading && loads.length === 0 && (
            <div style={{textAlign:'center',padding:'60px 24px'}}>
              <div style={{fontSize:48,marginBottom:12,opacity:0.3}}>🚛</div>
              <div style={{fontSize:16,fontWeight:600,color:'rgba(255,255,255,0.4)',marginBottom:8}}>No loads assigned</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.25)',marginBottom:20}}>Contact dispatch for your next trip</div>
              <a href="tel:7786635001"
                style={{display:'inline-block',padding:'12px 24px',background:'rgba(0,99,163,0.3)',color:'#93c5fd',borderRadius:10,textDecoration:'none',fontSize:13,fontWeight:600,border:'1px solid rgba(0,99,163,0.4)'}}>
                📞 Call Dispatch
              </a>
            </div>
          )}

          {loading && loads.length === 0 && (
            <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.3)'}}>Loading…</div>
          )}

          {/* Completed loads */}
          {doneLoads.length > 0 && (
            <>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10,marginTop:8}}>
                Completed ({doneLoads.length})
              </div>
              {doneLoads.map(l=>(
                <LoadCard key={l.id} load={l} active={false} onTap={()=>setSelected(l.id)}/>
              ))}
            </>
          )}

          {/* Bottom spacer */}
          <div style={{height:20}}/>
        </div>
      )}
    </div>
  );
}
