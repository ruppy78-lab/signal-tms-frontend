import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Rate Engine (same as Quotes) ─────────────────────────────────────────────
const BC1=['Surrey','Delta','Richmond','Vancouver','Burnaby','New Westminster','Coquitlam','Port Coquitlam','Port Moody','Langley'];
const BC2=['Abbotsford','Mission','Maple Ridge','Pitt Meadows'];
const BC3=['Chilliwack','Agassiz','Hope'];
const WA1=['Seattle','Tukwila','Renton','Kent','Bellevue','Auburn','Federal Way','Fife','Sumner','Tacoma','Mukilteo','Puyallup'];
const WA2=['Redmond','Lakewood','Bothell','Marysville','Monroe','Shoreline','Mountlake Terrace','Woodinville','Kenmore','Arlington','Mt Vernon','Kirkland','Burlington','Snohomish','Lynnwood'];
const WA3=['Blaine','Custer','Ferndale','Bellingham','Lynden'];
const WA4=['Olympia','Lacey','Tumwater'];
const PDX=['Portland','Vancouver WA','Beaverton','Tigard','Gresham','Hillsboro','Ridgefield','Woodland','Kalama','Longview','Napavine','Chehalis','Centralia','Troutdale','Canby','Sherwood','Tualatin'];
const CITY_GROUPS=[{label:'BC — Zone 1',cities:BC1},{label:'BC — Zone 2',cities:BC2},{label:'BC — Zone 3',cities:BC3},{label:'WA — Zone 1',cities:WA1},{label:'WA — Zone 2',cities:WA2},{label:'WA — Zone 3',cities:WA3},{label:'WA — Zone 4',cities:WA4},{label:'PDX — Portland Metro',cities:PDX}];
const FEES={SPOT_IN:48,BLOCK_IN:6,PER_SPOT_LB:1750,baseByZone:{WA1:{first:160,secondTotal:220,extraEach:50},WA2:{first:170,secondTotal:220,extraEach:50},WA3:{first:150,secondTotal:220,extraEach:50},WA4:{table:{1:190,2:250,3:315,4:380,5:445,6:510,7:575,8:640,9:705,10:775}},PDX:{first:250,secondTotal:350,extraEach:100}},blockFeeByZone:{DEFAULT:7.5,PDX:12.5},services:{liftgate:30,appointment:20,notify:20,jobSite:50,limitedAccess:50}};
function regionOf(city){if(BC1.includes(city))return'BC1';if(BC2.includes(city))return'BC2';if(BC3.includes(city))return'BC3';if(WA1.includes(city))return'WA1';if(WA2.includes(city))return'WA2';if(WA3.includes(city))return'WA3';if(WA4.includes(city))return'WA4';if(PDX.includes(city))return'PDX';return null;}
function calcRate(pu,del,pallets,svc){
  const pR=regionOf(pu),dR=regionOf(del);
  if(!pR||!dR)return{error:'Select valid cities',total:0,lines:[]};
  const isBC=r=>r&&r.startsWith('BC'),isWA=r=>r&&(r.startsWith('WA')||r==='PDX');
  if(!((isBC(pR)&&isWA(dR))||(isWA(pR)&&isBC(dR))))return{error:'Route must cross BC ↔ WA border',total:0,lines:[]};
  const billZone=isWA(dR)?dR:pR;
  const blockFee=FEES.blockFeeByZone[billZone]||FEES.blockFeeByZone.DEFAULT;
  let spaceSpots=0,sizeBlocks=0,totalWeight=0;
  for(const p of pallets){const cnt=Number(p.count)||0;if(cnt<=0)continue;const len=Number(p.length)||48,wid=Number(p.width)||48;const longSide=Math.max(len,wid);const spots=Math.max(1,Math.floor(longSide/FEES.SPOT_IN));const leftover=Math.max(0,longSide-spots*FEES.SPOT_IN);spaceSpots+=spots*cnt;sizeBlocks+=leftover>0?Math.ceil(leftover/FEES.BLOCK_IN)*cnt:0;totalWeight+=Number(p.weight)||0;}
  if(spaceSpots<=0)return{error:'Enter pallet details',total:0,lines:[]};
  if(spaceSpots>10)return{error:`${spaceSpots} spots > 10 max`,total:0,lines:[]};
  const sizeExtra=Math.floor(sizeBlocks/8),sizeChargable=sizeBlocks%8,totalSpots=spaceSpots+sizeExtra;
  const overLbs=Math.max(0,totalWeight-totalSpots*FEES.PER_SPOT_LB);
  const wBlocks=overLbs>0?Math.ceil(overLbs/(FEES.PER_SPOT_LB/8)):0;
  const z=FEES.baseByZone[billZone]||FEES.baseByZone.WA1;
  let base=billZone==='WA4'&&z.table?(z.table[Math.min(totalSpots,10)]||0):totalSpots===1?z.first:totalSpots===2?z.secondTotal:z.secondTotal+z.extraEach*(totalSpots-2);
  const bcSur=[pR,dR].includes('BC3')?50:[pR,dR].includes('BC2')?20:0;
  base+=bcSur;
  const lines=[{label:`Base — ${billZone} (${totalSpots} spot${totalSpots>1?'s':''})`,amount:base}];
  if(sizeChargable>0)lines.push({label:`Size blocks (${sizeChargable}×$${blockFee})`,amount:sizeChargable*blockFee});
  if(wBlocks>0)lines.push({label:`Weight blocks (${wBlocks}×$${blockFee})`,amount:wBlocks*blockFee});
  const S=FEES.services;
  const addS=(k,l,a)=>{if(svc[k]){lines.push({label:l,amount:a});}};
  addS('liftgatePU','Pickup: Liftgate',S.liftgate);addS('liftgateDL','Delivery: Liftgate',S.liftgate);
  addS('appointmentPU','Pickup: Appointment',S.appointment);addS('appointmentDL','Delivery: Appointment',S.appointment);
  addS('notify','Notify Before',S.notify);addS('jobSite','Job Site',S.jobSite);addS('limitedAccess','Limited Access',S.limitedAccess);
  return{lines,total:lines.reduce((s,l)=>s+l.amount,0),totalSpots,totalWeight,billZone,error:null};
}

// ─── API helper ───────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
async function apiFetch(path, opts={}) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}), ...(opts.headers||{}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const fmt = d => d ? new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : '—';
const STATUS_COLOR = {pending:'#888',dispatched:'#0063A3',en_route_pickup:'#E65100',at_pickup:'#6A1B9A',in_transit:'#E65100',at_delivery:'#0063A3',delivered:'#2E7D32',cancelled:'#B71C1C'};
const STATUS_LABEL = {pending:'Pending',dispatched:'Dispatched',en_route_pickup:'En Route to Pickup',at_pickup:'At Pickup',in_transit:'In Transit',at_delivery:'At Delivery',delivered:'Delivered',cancelled:'Cancelled'};

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await apiFetch('/portal/auth/login', { method:'POST', body:{email,password} });
      localStorage.setItem('portal_token', r.data.token);
      onLogin(r.data.user);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:'#f0f4f8',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,Arial,sans-serif'}}>
      <div style={{width:400,background:'#fff',borderRadius:10,boxShadow:'0 4px 24px rgba(0,0,0,0.12)',overflow:'hidden'}}>
        <div style={{background:'#003865',padding:'28px 32px',textAlign:'center',color:'#fff'}}>
          <div style={{fontSize:22,fontWeight:700}}>Signal Transportation Ltd</div>
          <div style={{fontSize:13,opacity:0.8,marginTop:4}}>Customer Portal</div>
        </div>
        <form onSubmit={submit} style={{padding:'28px 32px'}}>
          {error&&<div style={{background:'#FFEBEE',color:'#B71C1C',padding:'8px 12px',borderRadius:4,marginBottom:14,fontSize:13}}>{error}</div>}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4,color:'#555'}}>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:4,fontSize:13,boxSizing:'border-box'}}
              placeholder="your@email.com"/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4,color:'#555'}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:4,fontSize:13,boxSizing:'border-box'}}
              placeholder="Enter password"/>
          </div>
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'11px',background:'#003865',color:'#fff',border:'none',borderRadius:4,fontSize:14,fontWeight:700,cursor:'pointer'}}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <p style={{textAlign:'center',fontSize:12,color:'#888',marginTop:16}}>
            Need access? Contact your dispatcher at 604-867-5543
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Loads Tab ────────────────────────────────────────────────────────────────
const PTH = { fontSize:11, fontWeight:700, color:'#fff', padding:'8px 10px', background:'#003865', textAlign:'left', whiteSpace:'nowrap' };
const PTD = { fontSize:12, padding:'8px 10px', borderBottom:'1px solid #f0f0f0', verticalAlign:'middle' };

function LoadsTab() {
  const [loads,setLoads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [detail,setDetail]=useState(null);
  const [filter,setFilter]=useState('');

  useEffect(()=>{
    apiFetch('/portal/loads').then(r=>setLoads(r.data||[])).finally(()=>setLoading(false));
  },[]);

  const openLoad = async id => {
    if(selected===id){setSelected(null);setDetail(null);return;}
    setSelected(id);
    const r = await apiFetch(`/portal/loads/${id}`);
    setDetail(r.data);
  };

  const filtered = filter ? loads.filter(l=>l.status===filter) : loads;

  if(loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading shipments…</div>;

  return (
    <div>
      {/* Status filter tabs */}
      {loads.length > 0 && (
        <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
          {[
            { val:'', label:'All' },
            { val:'pending',     label:'Pending' },
            { val:'dispatched',  label:'Dispatched' },
            { val:'in_transit',  label:'In Transit' },
            { val:'delivered',   label:'Delivered' },
          ].map(t => {
            const cnt = t.val==='' ? loads.length : loads.filter(l=>l.status===t.val).length;
            if(cnt===0 && t.val!=='') return null;
            return (
              <button key={t.val} onClick={()=>setFilter(t.val)}
                style={{padding:'4px 12px',border:'none',borderRadius:16,fontSize:12,
                  fontWeight:filter===t.val?700:400,cursor:'pointer',
                  background:filter===t.val?'#003865':'#f0f0f0',
                  color:filter===t.val?'#fff':'#555'}}>
                {t.label}{cnt>0?` (${cnt})`:''}
              </button>
            );
          })}
        </div>
      )}

      {!filtered.length ? (
        <div style={{textAlign:'center',padding:'60px 24px',color:'#aaa'}}>
          <div style={{fontSize:32,marginBottom:12}}>📦</div>
          <p style={{fontSize:14,fontWeight:600}}>No shipments found</p>
        </div>
      ) : (
        <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden',marginBottom:16}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Load #','Route','Pickup','Delivery','Driver','Status'].map(h=>(
                  <th key={h} style={PTH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l,i)=>(
                <React.Fragment key={l.id}>
                  <tr onClick={()=>openLoad(l.id)}
                    style={{cursor:'pointer',background:selected===l.id?'#e8f0fe':i%2===0?'#fff':'#fafafa',
                      borderLeft:selected===l.id?'3px solid #003865':'3px solid transparent'}}
                    onMouseEnter={e=>{if(selected!==l.id)e.currentTarget.style.background='#f0f4f8';}}
                    onMouseLeave={e=>{e.currentTarget.style.background=selected===l.id?'#e8f0fe':i%2===0?'#fff':'#fafafa';}}>
                    <td style={{...PTD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>{l.load_number}</td>
                    <td style={{...PTD,fontSize:11,color:'#555'}}>
                      {l.origin_city}, {l.origin_state} → {l.dest_city}, {l.dest_state}
                    </td>
                    <td style={{...PTD,color:'#666'}}>{fmt(l.pickup_date)||'—'}</td>
                    <td style={{...PTD,color:'#666'}}>{fmt(l.delivery_date)||'—'}</td>
                    <td style={{...PTD,color:'#555'}}>{l.driver_name||'—'}</td>
                    <td style={PTD}>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,
                        background:(STATUS_COLOR[l.status]||'#888')+'18',color:STATUS_COLOR[l.status]||'#888'}}>
                        {STATUS_LABEL[l.status]||l.status}
                      </span>
                    </td>
                  </tr>
                  {/* Expandable detail row */}
                  {selected===l.id && detail && (
                    <tr>
                      <td colSpan={6} style={{padding:0,background:'#f8f9fa',borderBottom:'2px solid #003865'}}>
                        <div style={{padding:'14px 16px'}}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                            <div style={{background:'#fff',borderRadius:6,padding:'10px 12px',border:'1px solid #e0e0e0'}}>
                              <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',marginBottom:4}}>Pickup</div>
                              <div style={{fontSize:13,fontWeight:600}}>{detail.origin_name||detail.origin_city}</div>
                              <div style={{fontSize:12,color:'#555'}}>{detail.origin_city}, {detail.origin_state}</div>
                              <div style={{fontSize:12,color:'#888',marginTop:2}}>{fmt(detail.pickup_date)}</div>
                            </div>
                            <div style={{background:'#fff',borderRadius:6,padding:'10px 12px',border:'1px solid #e0e0e0'}}>
                              <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',marginBottom:4}}>Delivery</div>
                              <div style={{fontSize:13,fontWeight:600}}>{detail.dest_name||detail.dest_city}</div>
                              <div style={{fontSize:12,color:'#555'}}>{detail.dest_city}, {detail.dest_state}</div>
                              <div style={{fontSize:12,color:'#888',marginTop:2}}>{fmt(detail.delivery_date)}</div>
                            </div>
                          </div>
                          {detail.driver_name&&(
                            <div style={{background:'#e8f5e9',borderRadius:6,padding:'8px 12px',marginBottom:10,
                              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <div>
                                <div style={{fontSize:10,fontWeight:700,color:'#2e7d32',textTransform:'uppercase'}}>Driver</div>
                                <div style={{fontSize:13,fontWeight:600}}>{detail.driver_name}</div>
                              </div>
                              {detail.driver_phone&&(
                                <a href={`tel:${detail.driver_phone}`} style={{padding:'5px 12px',background:'#2e7d32',color:'#fff',borderRadius:4,fontSize:12,fontWeight:700,textDecoration:'none'}}>
                                  📞 Call
                                </a>
                              )}
                            </div>
                          )}
                          {detail.status_events?.length>0&&(
                            <div>
                              <div style={{fontSize:10,fontWeight:700,color:'#003865',textTransform:'uppercase',marginBottom:6}}>Tracking History</div>
                              {detail.status_events.map((e,i)=>(
                                <div key={i} style={{display:'flex',gap:10,marginBottom:5}}>
                                  <div style={{width:7,height:7,borderRadius:'50%',background:'#003865',marginTop:4,flexShrink:0}}/>
                                  <div>
                                    <div style={{fontSize:12,fontWeight:600}}>{STATUS_LABEL[e.status]||e.status}</div>
                                    {e.note&&<div style={{fontSize:11,color:'#888'}}>{e.note}</div>}
                                    <div style={{fontSize:10,color:'#aaa'}}>{new Date(e.created_at).toLocaleString()}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {detail.commodity&&<div style={{fontSize:12,color:'#555',marginTop:6}}><b>Commodity:</b> {detail.commodity}</div>}
                          {detail.po_number&&<div style={{fontSize:12,color:'#555'}}><b>PO#:</b> {detail.po_number}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────
function InvoicesTab() {
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ apiFetch('/portal/invoices').then(r=>setInvoices(r.data||[])).finally(()=>setLoading(false)); },[]);
  const INV_COLOR={draft:'#888',sent:'#0063A3',paid:'#2E7D32',overdue:'#B71C1C',partial:'#6A1B9A'};
  if(loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading invoices…</div>;
  return (
    <div>
      {!invoices.length ? (
        <div style={{textAlign:'center',padding:'60px',color:'#aaa'}}><div style={{fontSize:32,marginBottom:12}}>💰</div><p>No invoices yet</p></div>
      ) : (
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['Invoice #','Load #','Date','Due Date','Total','Paid','Balance','Status'].map(h=>(
              <th key={h} style={{fontSize:11,fontWeight:700,padding:'8px 10px',background:'#003865',color:'#fff',textAlign:'left'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {invoices.map((inv,i)=>{
              const bal=(parseFloat(inv.total_amount)||0)-(parseFloat(inv.amount_paid)||0);
              return(
                <tr key={inv.id} style={{background:i%2===0?'#fff':'#fafafa',borderBottom:'1px solid #f0f0f0'}}>
                  <td style={{padding:'8px 10px',fontFamily:'monospace',fontWeight:700,color:'#003865',fontSize:12}}>{inv.invoice_number}</td>
                  <td style={{padding:'8px 10px',fontSize:12,color:'#555'}}>{inv.load_number||'—'}</td>
                  <td style={{padding:'8px 10px',fontSize:12,color:'#666'}}>{fmt(inv.created_at)}</td>
                  <td style={{padding:'8px 10px',fontSize:12,color:inv.status==='overdue'?'#B71C1C':'#666'}}>{fmt(inv.due_date)}</td>
                  <td style={{padding:'8px 10px',fontSize:12,fontWeight:600,textAlign:'right'}}>${parseFloat(inv.total_amount||0).toFixed(2)}</td>
                  <td style={{padding:'8px 10px',fontSize:12,color:'#2e7d32',textAlign:'right'}}>{parseFloat(inv.amount_paid)>0?`$${parseFloat(inv.amount_paid).toFixed(2)}`:'—'}</td>
                  <td style={{padding:'8px 10px',fontSize:12,fontWeight:700,color:bal>0?'#B71C1C':'#2e7d32',textAlign:'right'}}>${bal.toFixed(2)}</td>
                  <td style={{padding:'8px 10px'}}>
                    <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10,background:(INV_COLOR[inv.status]||'#888')+'18',color:INV_COLOR[inv.status]||'#888'}}>
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
  );
}


// ─── Print Quote as PDF ────────────────────────────────────────────────────────
function printQuotePDF(quote, user, calcResult) {
  const today = new Date().toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'});
  const lines = calcResult?.lines || [];
  const total = calcResult?.total || parseFloat(quote?.total_amount||0);
  const quoteNum = quote?.quote_number || ('QT-' + Date.now().toString(36).toUpperCase());

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Rate Quote ${quoteNum}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
  body{padding:32px;color:#111;font-size:13px}
  .header{background:#003865;color:#fff;padding:20px 24px;border-radius:6px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center}
  .header h1{font-size:22px;font-weight:800}
  .header .sub{font-size:12px;opacity:0.8;margin-top:3px}
  .header .quote-num{font-size:18px;font-weight:700;text-align:right}
  .header .quote-date{font-size:11px;opacity:0.7;text-align:right}
  .section{margin-bottom:20px;border:1px solid #ddd;border-radius:6px;overflow:hidden}
  .section-title{background:#f0f4f8;padding:8px 14px;font-weight:700;font-size:12px;color:#003865;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #ddd}
  .section-body{padding:12px 14px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .field label{font-size:11px;color:#888;font-weight:600;text-transform:uppercase;display:block;margin-bottom:2px}
  .field span{font-size:13px;font-weight:600;color:#333}
  table{width:100%;border-collapse:collapse}
  th{background:#003865;color:#fff;padding:7px 10px;text-align:left;font-size:11px;font-weight:700}
  td{padding:7px 10px;border-bottom:1px solid #eee;font-size:12px}
  .total-row{background:#f0f4f8;font-weight:700}
  .total-amt{font-size:16px;font-weight:800;color:#003865;text-align:right}
  .footer{margin-top:24px;padding:12px 14px;background:#f8f9fa;border-radius:6px;font-size:11px;color:#666;text-align:center}
  .route-arrow{text-align:center;font-size:20px;font-weight:700;color:#003865;padding:0 8px}
  .route-box{background:#f0f4f8;border-radius:6px;padding:12px;text-align:center}
  .route-box .city{font-size:16px;font-weight:800;color:#003865}
  .route-box .zone{font-size:11px;color:#888;margin-top:2px}
  .estimate-note{font-size:11px;color:#888;font-style:italic;margin-top:4px}
  @media print{body{padding:16px}}
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="sub">RATE QUOTE</div>
      <h1>Signal Transportation Ltd</h1>
      <div class="sub">3170 194th St Unit 102, Surrey, BC V3Z 0N4 | 604-867-5543</div>
    </div>
    <div>
      <div class="quote-num">${quoteNum}</div>
      <div class="quote-date">Date: ${today}</div>
      ${quote?.valid_until ? `<div class="quote-date">Valid Until: ${new Date(quote.valid_until).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bill To</div>
    <div class="section-body">
      <div style="font-size:16px;font-weight:800;color:#003865;margin-bottom:4px">${user.company||user.name||''}</div>
      <div style="font-size:13px;color:#555">${user.name||''}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Route</div>
    <div class="section-body">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px">
        <div class="route-box" style="flex:1">
          <div class="city">${quote?.pickup_city||quote?.origin_city||'—'}</div>
          <div class="zone">Pickup Location</div>
        </div>
        <div class="route-arrow">→</div>
        <div class="route-box" style="flex:1">
          <div class="city">${quote?.delivery_city||quote?.dest_city||'—'}</div>
          <div class="zone">Delivery Location</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Rate Breakdown</div>
    <div class="section-body">
      <table>
        <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          ${lines.map(l=>`<tr><td>${l.label}</td><td style="text-align:right;font-weight:600">$${l.amount.toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row">
            <td style="font-size:14px">TOTAL ESTIMATE</td>
            <td class="total-amt">$${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div class="estimate-note">* This is an estimate based on provided freight details. Final rate confirmed by Signal Transportation dispatch.</div>
    </div>
  </div>

  <div class="footer">
    To accept this quote, please contact us at 604-867-5543 or dispatch@signaltms.com<br/>
    Quote Reference: ${quoteNum} | Generated: ${today}
  </div>
</body>
</html>`;

  const w = window.open('','_blank','width=900,height=700');
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(), 500);
}

// ─── Quotes Tab ───────────────────────────────────────────────────────────────
const STATUS_COLOR_Q = { draft:'#888', sent:'#0063A3', accepted:'#2E7D32', declined:'#B71C1C', expired:'#E65100' };
const STATUS_BG_Q    = { draft:'#f5f5f5', sent:'#E3F2FD', accepted:'#E8F5E9', declined:'#FFEBEE', expired:'#FFF3E0' };

function QuotesTab({ user }) {
  const [quotes,setQuotes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [saveMsg,setSaveMsg]=useState('');
  const [showCalc,setShowCalc]=useState(false); // ← default: show table
  const [expandedQuote,setExpandedQuote]=useState(null);
  const [pickupCity,setPickupCity]=useState('Surrey');
  const [deliveryCity,setDeliveryCity]=useState('Seattle');
  const [pallets,setPallets]=useState([{id:1,count:'1',length:'',width:'',height:'',weight:''}]);
  const [svc,setSvc]=useState({});
  const [notes,setNotes]=useState('');
  const [calcResult,setCalcResult]=useState(null);
  const nextId=useRef(2);

  const loadQuotes=useCallback(()=>{
    setLoading(true);
    apiFetch('/portal/quotes').then(r=>setQuotes(r.data||[])).catch(()=>setQuotes([])).finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{ loadQuotes(); },[loadQuotes]);

  useEffect(()=>{
    if(pickupCity&&deliveryCity){ setCalcResult(calcRate(pickupCity,deliveryCity,pallets,svc)); setSaved(false); }
  },[pickupCity,deliveryCity,pallets,svc]);

  const addPallet=()=>setPallets(p=>[...p,{id:nextId.current++,count:'1',length:'',width:'',height:'',weight:''}]);
  const remPallet=id=>setPallets(p=>p.filter(r=>r.id!==id));
  const setPF=(id,f,v)=>setPallets(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));

  const resetForm=()=>{
    setPickupCity('Surrey');setDeliveryCity('Seattle');
    setPallets([{id:nextId.current++,count:'1',length:'',width:'',height:'',weight:''}]);
    setSvc({});setNotes('');setCalcResult(null);setSaved(false);setSaveMsg('');
    setShowCalc(true);
  };

  const saveQuote=async()=>{
    if(!calcResult||calcResult.error){setSaveMsg('Fix route/pallet errors first');return;}
    setSaving(true);setSaveMsg('');
    try{
      await apiFetch('/portal/quote-request',{method:'POST',body:{
        pickup_city:pickupCity,delivery_city:deliveryCity,
        origin_city:pickupCity,origin_state:regionOf(pickupCity)||'',
        dest_city:deliveryCity,dest_state:regionOf(deliveryCity)||'',
        pallet_rows:pallets,services:svc,total_amount:calcResult.total,
        notes:'PORTAL QUOTE'+(notes?': '+notes:''),
      }});
      setSaved(true);setSaveMsg('Quote submitted! We will confirm within 24 hours.');
      loadQuotes();
      setTimeout(()=>{setSaved(false);setSaveMsg('');setShowCalc(false);},3000);
    }catch(err){setSaveMsg(err.message||'Failed to submit');}
    finally{setSaving(false);}
  };

  const TH={fontSize:11,fontWeight:700,padding:'8px 10px',background:'#003865',color:'#fff',textAlign:'left'};
  const TD={fontSize:12,padding:'8px 10px',borderBottom:'1px solid #f0f0f0',verticalAlign:'middle'};
  const CTH={fontSize:10,fontWeight:700,padding:'6px 8px',background:'#003865',color:'#fff',textAlign:'left'};
  const CTD={padding:'7px 8px',fontSize:12,border:'1px solid #f0f0f0'};

  return(
    <div>
      {/* Header — matches TMS style */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#003865'}}>Quotes</h2>
          {quotes.filter(q=>q.status==='accepted').length>0&&(
            <span style={{fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:10,background:'#E8F5E9',color:'#2E7D32'}}>
              Accepted: {quotes.filter(q=>q.status==='accepted').length}
            </span>
          )}
          {quotes.length>0&&(
            <span style={{fontSize:12,fontWeight:700,color:'#003865'}}>
              Total: ${quotes.reduce((s,q)=>s+(parseFloat(q.total_amount)||0),0).toFixed(2)}
            </span>
          )}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={loadQuotes}
            style={{padding:'7px 12px',border:'1px solid #ddd',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            ↻
          </button>
          <button onClick={resetForm}
            style={{padding:'7px 16px',border:'none',background:'#003865',color:'#fff',borderRadius:4,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            + New Quote
          </button>
        </div>
      </div>

      {/* Calculator — shown only when New Quote clicked */}
      {showCalc&&(
        <div style={{background:'#fff',borderRadius:8,border:'2px solid #003865',marginBottom:16,overflow:'hidden'}}>
          <div style={{padding:'10px 16px',background:'#003865',color:'#fff',fontWeight:700,fontSize:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>📋 Get a Rate Quote</span>
            <button onClick={()=>setShowCalc(false)} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:18,padding:0}}>×</button>
          </div>
          <div style={{padding:16}}>
            {/* Route */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 28px 1fr',gap:8,alignItems:'center',background:'#f0f4f8',padding:'10px',borderRadius:6,marginBottom:14,border:'1px solid #dde3ea'}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#003865',marginBottom:3,textTransform:'uppercase'}}>Pickup City</div>
                <select value={pickupCity} onChange={e=>setPickupCity(e.target.value)}
                  style={{width:'100%',padding:'7px 8px',border:'1px solid #ddd',borderRadius:4,fontSize:12}}>
                  {CITY_GROUPS.map(g=><optgroup key={g.label} label={g.label}>{g.cities.sort().map(c=><option key={c}>{c}</option>)}</optgroup>)}
                </select>
                <div style={{fontSize:10,color:'#888',marginTop:2}}>Zone: {regionOf(pickupCity)||'—'}</div>
              </div>
              <div style={{textAlign:'center',fontSize:18,fontWeight:700,color:'#003865',paddingTop:14}}>→</div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#003865',marginBottom:3,textTransform:'uppercase'}}>Delivery City</div>
                <select value={deliveryCity} onChange={e=>setDeliveryCity(e.target.value)}
                  style={{width:'100%',padding:'7px 8px',border:'1px solid #ddd',borderRadius:4,fontSize:12}}>
                  {CITY_GROUPS.map(g=><optgroup key={g.label} label={g.label}>{g.cities.sort().map(c=><option key={c}>{c}</option>)}</optgroup>)}
                </select>
                <div style={{fontSize:10,color:'#888',marginTop:2}}>Zone: {regionOf(deliveryCity)||'—'}</div>
              </div>
            </div>
            {calcResult?.error&&(
              <div style={{background:'#FFEBEE',border:'1px solid #ffcdd2',borderRadius:4,padding:'7px 12px',marginBottom:12,fontSize:12,color:'#B71C1C'}}>
                ⚠️ {calcResult.error}
              </div>
            )}
            {/* Pallets */}
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <span style={{fontSize:10,fontWeight:700,color:'#003865',textTransform:'uppercase'}}>Pallets / Freight</span>
                <button onClick={addPallet} style={{fontSize:11,padding:'2px 8px',border:'1px solid #003865',color:'#003865',background:'none',borderRadius:3,cursor:'pointer'}}>+ Add Row</button>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['#','Count','L(in)','W(in)','H(in)','Wt(lb)','Spots',''].map(h=><th key={h} style={CTH}>{h}</th>)}</tr></thead>
                <tbody>
                  {pallets.map((p,i)=>{
                    const cnt=Number(p.count)||0,len=Number(p.length)||0,wid=Number(p.width)||0;
                    const spots=cnt>0&&len>0&&wid>0?Math.max(1,Math.floor(Math.max(len,wid)/48))*cnt:null;
                    return(
                      <tr key={p.id} style={{background:i%2===0?'#fff':'#fafafa'}}>
                        <td style={{...CTD,width:22,textAlign:'center',color:'#aaa',fontWeight:700}}>{i+1}</td>
                        {['count','length','width','height','weight'].map(f=>(
                          <td key={f} style={{...CTD,padding:1,width:60}}>
                            <input type="number" min="0" value={p[f]} onChange={e=>setPF(p.id,f,e.target.value)}
                              style={{width:'100%',padding:'4px 5px',border:'none',fontSize:11,background:'transparent'}}
                              placeholder={f==='count'?'1':f==='length'||f==='width'?'48':f==='height'?'96':'lb'}/>
                          </td>
                        ))}
                        <td style={{...CTD,textAlign:'center',width:50}}>
                          {spots!==null?<span style={{fontSize:10,fontWeight:700,color:'#003865',background:'#e3f2fd',padding:'1px 5px',borderRadius:3}}>{spots}s</span>:'—'}
                        </td>
                        <td style={{...CTD,textAlign:'center',width:28}}>
                          {pallets.length>1&&<button onClick={()=>remPallet(p.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#c00',fontSize:14,padding:0}}>×</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Services */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:14}}>
              {[['liftgatePU','🔵 Liftgate PU ($30)'],['liftgateDL','🔵 Liftgate DEL ($30)'],['appointmentPU','📅 Appointment ($20)'],['notify','🔔 Notify Before ($20)'],['jobSite','🏗️ Job Site ($50)'],['limitedAccess','⚠️ Limited Access ($50)']].map(([k,l])=>(
                <label key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,cursor:'pointer'}}>
                  <input type="checkbox" checked={!!svc[k]} onChange={e=>setSvc(s=>({...s,[k]:e.target.checked}))}/>{l}
                </label>
              ))}
            </div>
            {/* Rate result */}
            {calcResult&&!calcResult.error&&(
              <div style={{background:'#f0f4f8',border:'2px solid #003865',borderRadius:6,padding:'12px 14px',marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:'#003865',textTransform:'uppercase',marginBottom:8}}>
                  Rate Estimate — {calcResult.billZone} Zone
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',marginBottom:6}}>
                  <tbody>
                    {calcResult.lines.map((l,i)=>(
                      <tr key={i} style={{borderBottom:'1px dashed #cdd'}}>
                        <td style={{fontSize:12,padding:'3px 0',color:'#555'}}>{l.label}</td>
                        <td style={{fontSize:12,padding:'3px 0',textAlign:'right',fontWeight:600}}>${l.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,color:'#003865',borderTop:'2px solid #003865',paddingTop:6}}>
                  <span>ESTIMATED TOTAL</span><span>${calcResult.total.toFixed(2)}</span>
                </div>
                <div style={{fontSize:10,color:'#888',marginTop:3}}>{calcResult.totalSpots} spot{calcResult.totalSpots!==1?'s':''} · {calcResult.totalWeight||0} lb · Final rate confirmed by our team.</div>
              </div>
            )}
            {/* Notes */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,fontWeight:700,color:'#555',display:'block',marginBottom:4}}>Additional Notes</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                style={{width:'100%',padding:'7px 10px',border:'1px solid #ddd',borderRadius:4,fontSize:12,resize:'vertical',boxSizing:'border-box'}}
                placeholder="Pickup instructions, special handling, delivery requirements…"/>
            </div>
            {saveMsg&&(
              <div style={{padding:'8px 12px',borderRadius:4,marginBottom:10,fontSize:12,
                background:saved?'#e8f5e9':'#FFEBEE',color:saved?'#2e7d32':'#B71C1C'}}>
                {saveMsg}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={saveQuote} disabled={saving||!calcResult||!!calcResult?.error}
                style={{flex:2,padding:'11px',background:saved?'#2E7D32':'#003865',color:'#fff',border:'none',
                  borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                {saving?'Submitting…':saved?'✓ Quote Submitted!':'💾 Submit Quote Request'}
              </button>
              <button onClick={()=>printQuotePDF(null,user,calcResult)} disabled={!calcResult||!!calcResult?.error}
                style={{flex:1,padding:'11px',background:'#fff',color:'#003865',border:'2px solid #003865',
                  borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                🖨️ Print PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Table — matches TMS Quotes page */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading…</div>
      : !quotes.length ? (
        <div style={{textAlign:'center',padding:'60px 24px',color:'#aaa',border:'1px solid #e0e0e0',borderRadius:8,background:'#fff'}}>
          <div style={{fontSize:36,marginBottom:12}}>📋</div>
          <p style={{fontSize:14,fontWeight:600,marginBottom:6}}>No quotes yet</p>
          <p style={{fontSize:12,marginBottom:16}}>Click "+ New Quote" to get a rate estimate</p>
          <button onClick={resetForm}
            style={{padding:'8px 20px',background:'#003865',color:'#fff',border:'none',borderRadius:4,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            + New Quote
          </button>
        </div>
      ) : (
        <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden',background:'#fff'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Quote #','Route','Pallets','Total','Date','Status'].map(h=>(
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q,i)=>{
                const isOpen = expandedQuote===q.id;
                const pCount = q.pallet_rows?.reduce((s,p)=>s+(parseInt(p.count)||0),0)||'—';
                return(
                  <React.Fragment key={q.id}>
                    <tr onClick={()=>setExpandedQuote(isOpen?null:q.id)}
                      style={{cursor:'pointer',
                        background:isOpen?'#e8f0fe':q.status==='accepted'?'#F0FFF4':'#fff',
                        borderLeft:isOpen?'3px solid #0063A3':q.status==='accepted'?'3px solid #2E7D32':'3px solid transparent'}}
                      onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background='#f0f4f8';}}
                      onMouseLeave={e=>{e.currentTarget.style.background=isOpen?'#e8f0fe':q.status==='accepted'?'#F0FFF4':'#fff';}}>
                      <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>{q.quote_number}</td>
                      <td style={{...TD,fontSize:11,color:'#555'}}>
                        {q.pickup_city||q.origin_city||'—'} → {q.delivery_city||q.dest_city||'—'}
                      </td>
                      <td style={{...TD,textAlign:'center'}}>{pCount}</td>
                      <td style={{...TD,fontWeight:700,color:'#003865'}}>${parseFloat(q.total_amount||0).toFixed(2)}</td>
                      <td style={{...TD,color:'#666',fontSize:11}}>{fmt(q.created_at)}</td>
                      <td style={TD}>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,
                          background:STATUS_BG_Q[q.status]||'#f5f5f5',color:STATUS_COLOR_Q[q.status]||'#888'}}>
                          {q.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {isOpen&&(
                      <tr>
                        <td colSpan={6} style={{padding:0,background:'#f8f9fa',borderBottom:'2px solid #003865'}}>
                          <div style={{padding:'12px 16px'}}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                              <div style={{background:'#fff',border:'1px solid #e0e0e0',borderRadius:6,padding:'10px 12px'}}>
                                <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',marginBottom:4}}>Pickup</div>
                                <div style={{fontSize:13,fontWeight:600}}>{q.pickup_city||q.origin_city}</div>
                              </div>
                              <div style={{background:'#fff',border:'1px solid #e0e0e0',borderRadius:6,padding:'10px 12px'}}>
                                <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',marginBottom:4}}>Delivery</div>
                                <div style={{fontSize:13,fontWeight:600}}>{q.delivery_city||q.dest_city}</div>
                              </div>
                            </div>
                            {q.status==='accepted'&&q.load_number&&(
                              <div style={{fontSize:12,color:'#2E7D32',fontWeight:600,marginBottom:8}}>✓ Converted → Load {q.load_number}</div>
                            )}
                            {q.notes&&<div style={{fontSize:12,color:'#555',marginBottom:8}}><b>Notes:</b> {q.notes}</div>}
                            <div style={{display:'flex',gap:8}}>
                              <button onClick={e=>{e.stopPropagation();printQuotePDF(q,user||{name:'Customer',company:''},
                                {lines:[],total:parseFloat(q.total_amount||0)});}}
                                style={{padding:'6px 14px',border:'1px solid #003865',color:'#003865',background:'#fff',borderRadius:3,fontSize:11,cursor:'pointer',fontWeight:700}}>
                                🖨️ Print / Download PDF
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Portal App ──────────────────────────────────────────────────────────
export default function Portal() {
  const [user,setUser]=useState(()=>{ try{const t=localStorage.getItem('portal_token');if(!t)return null;const p=JSON.parse(atob(t.split('.')[1]));if(p.exp<Date.now()/1000){localStorage.removeItem('portal_token');return null;}return JSON.parse(localStorage.getItem('portal_user')||'null');}catch{return null;} });
  const [tab,setTab]=useState('loads');

  const handleLogin = u => { localStorage.setItem('portal_user',JSON.stringify(u)); setUser(u); };
  const handleLogout = () => { localStorage.removeItem('portal_token'); localStorage.removeItem('portal_user'); setUser(null); };

  if(!user) return <LoginPage onLogin={handleLogin}/>;

  const TABS=[['loads','📦 Shipments'],['invoices','💰 Invoices'],['quotes','📋 Quotes'],['documents','📄 Documents']];

  return (
    <div style={{minHeight:'100vh',background:'#f5f7fa',fontFamily:'system-ui,Arial,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#003865',color:'#fff',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:56}}>
        <div>
          <span style={{fontWeight:700,fontSize:16}}>Signal Transportation Ltd</span>
          <span style={{opacity:0.4,margin:'0 8px'}}>|</span>
          <span style={{fontSize:14,fontWeight:700,color:'#7dd3fc'}}>{user.company||user.name}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#fff'}}>👤 {user.name}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>{user.company}</div>
          </div>
          <button onClick={handleLogout} style={{padding:'5px 12px',border:'1px solid rgba(255,255,255,0.4)',color:'#fff',background:'none',borderRadius:4,fontSize:12,cursor:'pointer'}}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'#fff',borderBottom:'1px solid #e0e0e0',padding:'0 24px',display:'flex',gap:4}}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:'14px 18px',border:'none',background:'transparent',fontSize:13,fontWeight:tab===id?700:400,
              color:tab===id?'#003865':'#666',borderBottom:tab===id?'2px solid #003865':'2px solid transparent',cursor:'pointer',whiteSpace:'nowrap'}}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:24,maxWidth:1100,margin:'0 auto'}}>
        {tab==='loads'     && <LoadsTab/>}
        {tab==='invoices'  && <InvoicesTab/>}
        {tab==='quotes'    && <QuotesTab user={user}/>}
        {tab==='documents' && <DocumentsTab/>}
      </div>
    </div>
  );
}

function DocumentsTab() {
  const [docs,setDocs]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ apiFetch('/portal/documents').then(r=>setDocs(r.data||[])).finally(()=>setLoading(false)); },[]);
  if(loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading…</div>;
  return(
    <div>
      {!docs.length?<div style={{textAlign:'center',padding:'60px',color:'#aaa'}}><div style={{fontSize:32,marginBottom:12}}>📄</div><p>No documents yet</p></div>
      :(
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Load #','Document Type','File','Uploaded'].map(h=>(
            <th key={h} style={{fontSize:11,fontWeight:700,padding:'8px 10px',background:'#003865',color:'#fff',textAlign:'left'}}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {docs.map((d,i)=>(
              <tr key={d.id} style={{background:i%2===0?'#fff':'#fafafa',borderBottom:'1px solid #f0f0f0'}}>
                <td style={{padding:'8px 10px',fontFamily:'monospace',fontSize:12,fontWeight:700,color:'#003865'}}>{d.load_number}</td>
                <td style={{padding:'8px 10px',fontSize:12}}>{(d.doc_type||'other').replace(/_/g,' ').toUpperCase()}</td>
                <td style={{padding:'8px 10px',fontSize:12}}>{d.file_name}</td>
                <td style={{padding:'8px 10px',fontSize:12,color:'#888'}}>{fmt(d.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
