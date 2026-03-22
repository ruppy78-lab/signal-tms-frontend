import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ContextMenu, useContextMenu, Pagination, Spinner, Confirm, Field, Modal } from '../../components/common';
import { Plus, Search, RefreshCw, Mail, ArrowRight, Copy, Trash2, Edit, FileText, X, CheckCircle } from 'lucide-react';

// ─── Signal Rate Engine (from signal_v3.html) ─────────────────────────────────
const BC_ZONE1 = ['Surrey','Delta','Richmond','Vancouver','Burnaby','New Westminster','Coquitlam','Port Coquitlam','Port Moody','Langley'];
const BC_ZONE2 = ['Abbotsford','Mission','Maple Ridge','Pitt Meadows'];
const BC_ZONE3 = ['Chilliwack','Agassiz','Hope'];
const WA_ZONE1 = ['Seattle','Tukwila','Renton','Kent','Bellevue','Auburn','Federal Way','Fife','Sumner','Tacoma','Mukilteo','Puyallup','Steilacoom'];
const WA_ZONE2 = ['Redmond','Lakewood','Bothell','Marysville','Monroe','Shoreline','Mountlake Terrace','Woodinville','Kenmore','Arlington','Mt Vernon','Kirkland','Burlington','Snohomish','Lynnwood'];
const WA_ZONE3 = ['Blaine','Custer','Ferndale','Bellingham','Lynden'];
const WA_ZONE4 = ['Olympia','Lacey','Tumwater'];
const PDX_CITIES = ['Portland','Vancouver WA','Beaverton','Tigard','Gresham','Hillsboro','Ridgefield','Woodland','Kalama','Longview','Napavine','Chehalis','Centralia','Troutdale','Canby','Sherwood','Tualatin'];

const CITY_GROUPS = [
  { label:'BC — Zone 1 (Lower Mainland)', cities:BC_ZONE1 },
  { label:'BC — Zone 2 (Fraser Valley)',  cities:BC_ZONE2 },
  { label:'BC — Zone 3 (Chilliwack/Hope)',cities:BC_ZONE3 },
  { label:'WA — Zone 1 (Seattle/Tacoma)', cities:WA_ZONE1 },
  { label:'WA — Zone 2 (Eastside/North)', cities:WA_ZONE2 },
  { label:'WA — Zone 3 (Bellingham)',     cities:WA_ZONE3 },
  { label:'WA — Zone 4 (Olympia)',        cities:WA_ZONE4 },
  { label:'PDX — Portland Metro',         cities:PDX_CITIES },
];

const FEES = {
  MAX_SPOTS:10, SPOT_IN:48, BLOCK_IN:6, PER_SPOT_LB:1750, PER_PALLET_MAX:3500, HEIGHT_MAX:96,
  baseByZone:{
    WA1:{first:160,secondTotal:220,extraEach:50},
    WA2:{first:170,secondTotal:220,extraEach:50},
    WA3:{first:150,secondTotal:220,extraEach:50},
    WA4:{table:{1:190,2:250,3:315,4:380,5:445,6:510,7:575,8:640,9:705,10:775}},
    PDX:{first:250,secondTotal:350,extraEach:100},
  },
  blockFeeByZone:{DEFAULT:7.50,PDX:12.50},
  services:{liftgatePickup:30,liftgateDelivery:30,appointmentPickup:20,appointmentDelivery:20,notifyPickup:20,notifyDelivery:20,jobSitePickup:50,jobSiteDelivery:50,limitedAccessPickup:50,limitedAccessDelivery:50},
};

function regionOf(city) {
  if (BC_ZONE1.includes(city)) return 'BC1';
  if (BC_ZONE2.includes(city)) return 'BC2';
  if (BC_ZONE3.includes(city)) return 'BC3';
  if (WA_ZONE1.includes(city)) return 'WA1';
  if (WA_ZONE2.includes(city)) return 'WA2';
  if (WA_ZONE3.includes(city)) return 'WA3';
  if (WA_ZONE4.includes(city)) return 'WA4';
  if (PDX_CITIES.includes(city)) return 'PDX';
  return null;
}

function isBC(r) { return r && r.startsWith('BC'); }
function isWA(r) { return r && (r.startsWith('WA') || r === 'PDX'); }

function calcSpots(len, wid) {
  if (!len || !wid) return 0;
  const longSide = Math.max(Number(len), Number(wid));
  return Math.max(1, Math.floor(longSide / FEES.SPOT_IN));
}

function calcSizeBlocks(len, wid) {
  if (!len || !wid) return 0;
  const longSide = Math.max(Number(len), Number(wid));
  const s = Math.max(1, Math.floor(longSide / FEES.SPOT_IN));
  const leftover = Math.max(0, longSide - s * FEES.SPOT_IN);
  return leftover > 0 ? Math.ceil(leftover / FEES.BLOCK_IN) : 0;
}

function bcSurcharge(pRegion, dRegion) {
  const ends = [pRegion, dRegion];
  if (ends.includes('BC3')) return 50;
  if (ends.includes('BC2')) return 20;
  return 0;
}

function baseForSpots(spots, zone) {
  if (spots <= 0) return 0;
  const z = FEES.baseByZone[zone] || FEES.baseByZone.WA1;
  if (zone === 'WA4' && z.table) return z.table[Math.min(spots, 10)] || 0;
  if (spots === 1) return z.first;
  if (spots === 2) return z.secondTotal;
  return z.secondTotal + z.extraEach * (spots - 2);
}

function calcRate(pickupCity, deliveryCity, pallets, pickupSvc, deliverySvc) {
  const pR = regionOf(pickupCity), dR = regionOf(deliveryCity);
  if (!pR || !dR) return { error:'Select valid pickup and delivery cities', total:0, lines:[] };
  if (!((isBC(pR) && isWA(dR)) || (isWA(pR) && isBC(dR)))) return { error:'Route must cross BC ↔ WA border', total:0, lines:[] };
  if (pR === dR) return { error:'Pickup and delivery must be in different zones', total:0, lines:[] };

  const billZone = isWA(dR) ? dR : pR;
  const blockFee = FEES.blockFeeByZone[billZone] || FEES.blockFeeByZone.DEFAULT;

  let spaceSpots = 0, sizeBlocksTotal = 0, totalWeight = 0;
  for (const p of pallets) {
    const cnt = Number(p.count)||0;
    if (cnt <= 0) continue;
    const len = Number(p.length)||48, wid = Number(p.width)||48;
    const ht  = Number(p.height)||96, wt = Number(p.weight)||0;
    if (ht > FEES.HEIGHT_MAX) return { error:`Height ${ht}" > max ${FEES.HEIGHT_MAX}"`, total:0, lines:[] };
    spaceSpots     += calcSpots(len, wid) * cnt;
    sizeBlocksTotal += calcSizeBlocks(len, wid) * cnt;
    totalWeight     += wt;
  }
  if (spaceSpots <= 0) return { error:'Enter pallet details', total:0, lines:[] };
  if (spaceSpots > 10) return { error:`${spaceSpots} spots > 10 max. Split the load.`, total:0, lines:[] };

  const sizeExtraSpots  = Math.floor(sizeBlocksTotal / 8);
  const sizeBlocksBilled = sizeBlocksTotal % 8;
  const totalSpots = spaceSpots + sizeExtraSpots;
  const overWeightLbs = Math.max(0, totalWeight - totalSpots * FEES.PER_SPOT_LB);
  const wBlocks = overWeightLbs > 0 ? Math.ceil(overWeightLbs / (FEES.PER_SPOT_LB / 8)) : 0;

  let base = baseForSpots(totalSpots, billZone);
  base += bcSurcharge(pR, dR);

  const sizeCharge   = sizeBlocksBilled * blockFee;
  const weightCharge = wBlocks * blockFee;

  const lines = [];
  lines.push({ label:`Base — ${billZone} zone (${totalSpots} spot${totalSpots>1?'s':''})`, amount:base });
  if (sizeCharge > 0) lines.push({ label:`Size blocks (${sizeBlocksBilled} × $${blockFee})`, amount:sizeCharge });
  if (weightCharge > 0) lines.push({ label:`Weight blocks (${wBlocks} × $${blockFee}, ${overWeightLbs.toFixed(0)} lb over)`, amount:weightCharge });
  if (pR !== 'BC1' && pR !== 'WA1') lines.push({ label:`BC zone surcharge`, amount:bcSurcharge(pR,dR) });

  const S = FEES.services;
  let svcTotal = 0;
  const addSvc = (checked, label, amt) => { if(checked){svcTotal+=amt;lines.push({label,amount:amt});} };
  addSvc(pickupSvc?.liftgate,    'Pickup: Liftgate', S.liftgatePickup);
  addSvc(pickupSvc?.appointment, 'Pickup: Appointment', S.appointmentPickup);
  addSvc(pickupSvc?.notify,      'Pickup: Notify Before', S.notifyPickup);
  addSvc(pickupSvc?.jobSite,     'Pickup: Job Site', S.jobSitePickup);
  addSvc(pickupSvc?.limitedAccess,'Pickup: Limited Access', S.limitedAccessPickup);
  addSvc(deliverySvc?.liftgate,  'Delivery: Liftgate', S.liftgateDelivery);
  addSvc(deliverySvc?.appointment,'Delivery: Appointment', S.appointmentDelivery);
  addSvc(deliverySvc?.notify,    'Delivery: Notify Before', S.notifyDelivery);
  addSvc(deliverySvc?.jobSite,   'Delivery: Job Site', S.jobSiteDelivery);
  addSvc(deliverySvc?.limitedAccess,'Delivery: Limited Access', S.limitedAccessDelivery);

  const total = base + sizeCharge + weightCharge + svcTotal;
  return { lines, total, totalSpots, totalWeight, spaceSpots, billZone, error:null };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STATUS_COLOR = { draft:'#888', sent:'#0063A3', accepted:'#2E7D32', declined:'#B71C1C', expired:'#E65100', converted:'#6A1B9A' };
const STATUS_BG    = { draft:'#f5f5f5', sent:'#E3F2FD', accepted:'#E8F5E9', declined:'#FFEBEE', expired:'#FFF3E0', converted:'#F3E5F5' };
const TH = {fontSize:11,fontWeight:700,color:'#fff',padding:'5px 8px',background:'#003865',border:'1px solid #002a4a',whiteSpace:'nowrap'};
const TD = {fontSize:12,padding:'5px 8px',border:'1px solid #e8e8e8',verticalAlign:'middle'};
const fmt = d => d ? new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : '—';

function CitySelect({ value, onChange, placeholder }) {
  return (
    <select className="form-input" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder || 'Select city…'}</option>
      {CITY_GROUPS.map(g => (
        <optgroup key={g.label} label={g.label}>
          {g.cities.sort().map(c => <option key={c} value={c}>{c}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

// ─── Quote Detail / Calculator ────────────────────────────────────────────────
function QuoteDetail({ quoteId, customers, onClose, onSaved, onConverted, initialPos }) {
  const qc = useQueryClient();
  const isNew = !quoteId;
  // Drag state
  const [pos, setPos] = useState(initialPos || { x: window.innerWidth - 560, y: 80 });
  const [size, setSize] = useState({ w: 540, h: Math.min(window.innerHeight - 120, 780) });
  const dragging = useRef(false);
  const dragOffset = useRef({ x:0, y:0 });
  const resizing = useRef(false);
  const resizeStart = useRef({});

  const onMouseDownHeader = e => {
    if (e.target.closest('button')) return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = e => {
    if (dragging.current) {
      setPos({ x: Math.max(0, e.clientX - dragOffset.current.x), y: Math.max(0, e.clientY - dragOffset.current.y) });
    }
    if (resizing.current) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      setSize({ w: Math.max(480, resizeStart.current.w + dx), h: Math.max(400, resizeStart.current.h + dy) });
    }
  };
  const onMouseUp = () => {
    dragging.current = false; resizing.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  const onResizeMouseDown = e => {
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const [pickupCity,   setPickupCity]   = useState('Surrey');
  const [deliveryCity, setDeliveryCity] = useState('Seattle');
  const [customerId,   setCustomerId]   = useState('');
  const [commodity,    setCommodity]    = useState('');
  const [validUntil,   setValidUntil]   = useState('');
  const [notes,        setNotes]        = useState('');
  const [pallets, setPallets] = useState([{ id:1, count:'1', length:'', width:'', height:'', weight:'' }]);
  const [pickupSvc, setPickupSvc]   = useState({});
  const [deliverySvc, setDeliverySvc] = useState({});
  const [calcResult, setCalcResult] = useState(null);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const nextId = useRef(2);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => api.get(`/quotes/${quoteId}`).then(r => r.data.data),
    enabled: !!quoteId,
  });

  useEffect(() => {
    if (quote) {
      setPickupCity(quote.pickup_city || quote.origin_city || 'Surrey');
      setDeliveryCity(quote.delivery_city || quote.dest_city || 'Seattle');
      setCustomerId(quote.customer_id || '');
      setCommodity(quote.commodity || '');
      setValidUntil(quote.valid_until?.slice(0,10) || '');
      setNotes(quote.notes || '');
      if (quote.pallet_rows?.length) { setPallets(quote.pallet_rows); nextId.current = quote.pallet_rows.length + 1; }
      if (quote.pickup_services)   setPickupSvc(quote.pickup_services);
      if (quote.delivery_services) setDeliverySvc(quote.delivery_services);
    }
  }, [quote]);

  // Live rate calculation
  useEffect(() => {
    if (pickupCity && deliveryCity) {
      const result = calcRate(pickupCity, deliveryCity, pallets, pickupSvc, deliverySvc);
      setCalcResult(result);
    }
  }, [pickupCity, deliveryCity, pallets, pickupSvc, deliverySvc]);

  const addPallet = () => {
    setPallets(p => [...p, { id:nextId.current++, count:'1', length:'', width:'', height:'', weight:'' }]);
  };
  const removePallet = id => setPallets(p => p.filter(r => r.id !== id));
  const setPalletField = (id, field, val) => setPallets(p => p.map(r => r.id===id ? {...r,[field]:val} : r));

  const saveMut = useMutation({
    mutationFn: b => quoteId ? api.put(`/quotes/${quoteId}`, b) : api.post('/quotes', b),
    onSuccess: r => {
      toast.success(quoteId ? 'Quote updated' : `Quote ${r.data.data?.quote_number||''} created`);
      qc.invalidateQueries(['quotes']);
      onSaved && onSaved(r.data.data?.id);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const sendMut = useMutation({
    mutationFn: () => api.post(`/quotes/${quoteId}/send`),
    onSuccess: () => { toast.success('Marked as sent'); qc.invalidateQueries(['quotes','quote']); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const convertMut = useMutation({
    mutationFn: () => api.post(`/quotes/${quoteId}/convert`),
    onSuccess: r => {
      toast.success('Quote converted to load ✓');
      qc.invalidateQueries(['quotes']);
      setConfirmConvert(false);
      onConverted && onConverted(r.data.data);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleSave = () => {
    if (!customerId) { toast.error('Select a customer'); return; }
    saveMut.mutate({
      customer_id: customerId,
      pickup_city: pickupCity, delivery_city: deliveryCity,
      origin_city: pickupCity, origin_state: regionOf(pickupCity)||'',
      dest_city: deliveryCity, dest_state: regionOf(deliveryCity)||'',
      commodity, valid_until: validUntil||null, notes,
      total_amount: calcResult?.total || 0,
      pallet_rows: pallets,
      pickup_services: pickupSvc,
      delivery_services: deliverySvc,
      calc_breakdown: calcResult?.lines || [],
      rate_type: 'flat',
      base_rate: calcResult?.total || 0,
    });
  };

  const openEmailQuote = () => {
    if (!quote && !quoteId) { toast.error('Save quote first'); return; }
    const cust = customers?.find(c => c.id === customerId);
    const lines = calcResult?.lines || [];
    const stopList = `${pickupCity}, BC → ${deliveryCity}`;
    const subject = encodeURIComponent(`Rate Quote ${quote?.quote_number||'Draft'} — Signal Transportation Ltd`);
    const body = encodeURIComponent(
      'Dear ' + (cust?.company_name||'Customer') + ',\n\n' +
      'Please find your rate quote from Signal Transportation Ltd.\n\n' +
      'QUOTE: ' + (quote?.quote_number||'Draft') + '\n' +
      'ROUTE: ' + stopList + '\n' +
      'DATE: ' + new Date().toLocaleDateString() + '\n' +
      (validUntil ? 'VALID UNTIL: ' + new Date(validUntil).toLocaleDateString() + '\n' : '') +
      '\nRATE BREAKDOWN:\n' +
      lines.map(l => '  ' + l.label + ': $' + l.amount.toFixed(2)).join('\n') +
      '\n\nTOTAL: $' + (calcResult?.total||0).toFixed(2) +
      '\n\nTo accept this quote, please reply to this email or call 604-867-5543.' +
      '\n\nSignal Transportation Ltd\n3170 194th St Unit 102, Surrey, BC V3Z 0N4\n604-867-5543'
    );
    const email = cust?.main_email || '';
    window.open('mailto:' + email + '?subject=' + subject + '&body=' + body);
    if (quoteId) sendMut.mutate();
  };

  if (isLoading) return <div style={{padding:20,textAlign:'center'}}><Spinner/></div>;

  const isReadonly = quote?.status === 'accepted' || quote?.status === 'converted';

  return (
    <div style={{
      position:'fixed', left:pos.x, top:pos.y, width:size.w, height:size.h,
      display:'flex', flexDirection:'column', background:'#fff',
      boxShadow:'0 8px 32px rgba(0,0,0,0.22)', borderRadius:8,
      border:'1px solid #c5d9f0', zIndex:1000, overflow:'hidden',
      userSelect: dragging.current||resizing.current ? 'none':'auto',
    }}>
      {/* Header — drag handle */}
      <div onMouseDown={onMouseDownHeader} style={{padding:'10px 14px',background:'#003865',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,cursor:'grab'}}>
        <div>
          <span style={{fontWeight:700,fontSize:14}}>{quote?.quote_number || 'New Quote'}</span>
          {quote?.status && <span style={{marginLeft:10,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:STATUS_BG[quote.status],color:STATUS_COLOR[quote.status]}}>{quote.status?.toUpperCase()}</span>}
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',cursor:'pointer'}}><X size={16}/></button>
      </div>

      {/* Actions */}
      <div style={{display:'flex',gap:6,padding:'8px 14px',borderBottom:'1px solid #eee',flexShrink:0,background:'#f8f9fa',flexWrap:'wrap'}}>
        {!isReadonly && (
          <button onClick={handleSave} disabled={saveMut.isPending}
            style={{padding:'5px 14px',border:'none',background:'#003865',color:'#fff',borderRadius:4,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            {saveMut.isPending ? 'Saving…' : quoteId ? '💾 Save' : '💾 Create Quote'}
          </button>
        )}
        {quoteId && (
          <button onClick={openEmailQuote}
            style={{padding:'5px 12px',border:'1px solid #0063A3',color:'#0063A3',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <Mail size={13}/> Email to Customer
          </button>
        )}
        {quoteId && !isReadonly && (
          <button onClick={() => setConfirmConvert(true)}
            style={{padding:'5px 12px',border:'none',background:'#2E7D32',color:'#fff',borderRadius:4,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <ArrowRight size={13}/> Convert to Load
          </button>
        )}
        {isReadonly && (
          <span style={{fontSize:12,color:'#6A1B9A',fontWeight:600,padding:'5px 10px',background:'#F3E5F5',borderRadius:4}}>
            ✓ Converted to Load
          </span>
        )}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
        {/* Customer + Route */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:8,marginBottom:10}}>
          <Field label="Customer" required>
            <select className="form-input" style={{fontSize:12}} value={customerId} onChange={e=>setCustomerId(e.target.value)} disabled={isReadonly}>
              <option value="">Select customer…</option>
              {(customers||[]).map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </Field>
          <Field label="Valid Until">
            <input type="date" className="form-input" style={{fontSize:12}} value={validUntil} onChange={e=>setValidUntil(e.target.value)} disabled={isReadonly}/>
          </Field>
          <Field label="Commodity">
            <input className="form-input" style={{fontSize:12}} value={commodity} onChange={e=>setCommodity(e.target.value)} placeholder="Freight type…" disabled={isReadonly}/>
          </Field>
        </div>

        {/* Route */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 28px 1fr',gap:6,alignItems:'center',marginBottom:10,background:'#f0f4f8',padding:'10px',borderRadius:6,border:'1px solid #dde3ea'}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#003865',marginBottom:3,textTransform:'uppercase'}}>Pickup City</div>
            <CitySelect value={pickupCity} onChange={setPickupCity}/>
            {pickupCity&&<div style={{fontSize:10,color:'#888',marginTop:2}}>Zone: {regionOf(pickupCity)||'Unknown'}</div>}
          </div>
          <div style={{textAlign:'center',color:'#003865',fontWeight:700,fontSize:16,paddingTop:14}}>→</div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#003865',marginBottom:3,textTransform:'uppercase'}}>Delivery City</div>
            <CitySelect value={deliveryCity} onChange={setDeliveryCity}/>
            {deliveryCity&&<div style={{fontSize:10,color:'#888',marginTop:2}}>Zone: {regionOf(deliveryCity)||'Unknown'}</div>}
          </div>
        </div>

        {/* Route validation */}
        {calcResult?.error && (
          <div style={{background:'#FFEBEE',border:'1px solid #ffcdd2',borderRadius:4,padding:'8px 12px',marginBottom:12,fontSize:12,color:'#B71C1C',fontWeight:600}}>
            ⚠️ {calcResult.error}
          </div>
        )}

        {/* Pallet Table */}
        <div style={{marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'#003865',textTransform:'uppercase',letterSpacing:'0.05em'}}>Pallets / Freight</span>
            {!isReadonly && (
              <button onClick={addPallet}
                style={{fontSize:10,padding:'2px 8px',border:'1px solid #003865',color:'#003865',background:'none',borderRadius:3,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}>
                <Plus size={9}/> Add Row
              </button>
            )}
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['#','Count','Length (in)','Width (in)','Height (in)','Weight (lb)','Spots',''].map(h=>(
                <th key={h} style={{...TH,background:'#1a3a5c',fontSize:10}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pallets.map((p, i) => {
                const cnt = Number(p.count)||0;
                const len = Number(p.length)||0, wid = Number(p.width)||0;
                const spots = cnt>0&&len>0&&wid>0 ? calcSpots(len,wid)*cnt : null;
                return (
                  <tr key={p.id} style={{background:i%2===0?'#fff':'#fafafa'}}>
                    <td style={{...TD,textAlign:'center',width:28,color:'#aaa',fontWeight:700}}>{i+1}</td>
                    <td style={{...TD,width:65}}>
                      <input type="number" min="1" className="form-input" style={{padding:'3px 6px'}} value={p.count}
                        onChange={e=>setPalletField(p.id,'count',e.target.value)} disabled={isReadonly}/>
                    </td>
                    <td style={{...TD,width:90}}>
                      <input type="number" min="0" className="form-input" style={{padding:'3px 6px'}} value={p.length}
                        onChange={e=>setPalletField(p.id,'length',e.target.value)} placeholder="48" disabled={isReadonly}/>
                    </td>
                    <td style={{...TD,width:90}}>
                      <input type="number" min="0" className="form-input" style={{padding:'3px 6px'}} value={p.width}
                        onChange={e=>setPalletField(p.id,'width',e.target.value)} placeholder="48" disabled={isReadonly}/>
                    </td>
                    <td style={{...TD,width:90}}>
                      <input type="number" min="0" className="form-input" style={{padding:'3px 6px'}} value={p.height}
                        onChange={e=>setPalletField(p.id,'height',e.target.value)} placeholder="96" disabled={isReadonly}/>
                    </td>
                    <td style={{...TD,width:100}}>
                      <input type="number" min="0" className="form-input" style={{padding:'3px 6px'}} value={p.weight}
                        onChange={e=>setPalletField(p.id,'weight',e.target.value)} placeholder="lb" disabled={isReadonly}/>
                    </td>
                    <td style={{...TD,width:70,textAlign:'center'}}>
                      {spots !== null
                        ? <span style={{fontSize:11,fontWeight:700,color:'#003865',background:'#e3f2fd',padding:'2px 6px',borderRadius:3}}>{spots} spot{spots!==1?'s':''}</span>
                        : <span style={{color:'#bbb',fontSize:11}}>—</span>}
                    </td>
                    <td style={{...TD,width:36,textAlign:'center'}}>
                      {!isReadonly && pallets.length>1 && (
                        <button onClick={()=>removePallet(p.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#c00',padding:2}}>
                          <X size={13}/>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Services */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
          {[['Pickup Services', pickupSvc, setPickupSvc], ['Delivery Services', deliverySvc, setDeliverySvc]].map(([title, svc, setSvc]) => (
            <div key={title} style={{border:'1px solid #e0e0e0',borderRadius:4,padding:'7px 10px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#003865',textTransform:'uppercase',marginBottom:6}}>{title}</div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {[['liftgate','Liftgate ($30)'],['appointment','Appt ($20)'],['notify','Notify ($20)'],['jobSite','Job Site ($50)'],['limitedAccess','Ltd Access ($50)']].map(([key,label])=>(
                  <label key={key} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,cursor:'pointer'}}>
                    <input type="checkbox" style={{width:12,height:12}} checked={!!svc[key]} disabled={isReadonly}
                      onChange={e=>setSvc(s=>({...s,[key]:e.target.checked}))}/>
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rate Result */}
        {calcResult && !calcResult.error && (
          <div style={{background:'#f0f4f8',border:'2px solid #003865',borderRadius:6,padding:'12px 16px',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase',marginBottom:8,letterSpacing:'0.05em'}}>
              Rate Calculation — {calcResult.billZone} Zone
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}>
              <tbody>
                {calcResult.lines.map((l,i) => (
                  <tr key={i} style={{borderBottom:'1px dashed #cdd'}}>
                    <td style={{fontSize:12,padding:'4px 0',color:'#555'}}>{l.label}</td>
                    <td style={{fontSize:12,padding:'4px 0',textAlign:'right',fontWeight:600}}>${l.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,color:'#003865',borderTop:'2px solid #003865',paddingTop:6}}>
              <span>TOTAL</span>
              <span>${calcResult.total.toFixed(2)}</span>
            </div>
            <div style={{fontSize:11,color:'#888',marginTop:4}}>
              {calcResult.totalSpots} spot{calcResult.totalSpots!==1?'s':''} · {calcResult.totalWeight||0} lb total weight
            </div>
          </div>
        )}

        <Field label="Notes">
          <textarea className="form-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} disabled={isReadonly} placeholder="Special instructions, conditions…"/>
        </Field>
      </div>

      <Confirm open={confirmConvert} onClose={()=>setConfirmConvert(false)}
        onConfirm={()=>convertMut.mutate()} title="Convert to Load"
        message={`Convert ${quote?.quote_number} to a load? This will create a new load with the quote details. The quote will be marked as accepted.`}
        confirmLabel="Convert to Load" confirmClass="btn btn-primary"/>
      {/* Resize handle */}
      <div onMouseDown={onResizeMouseDown}
        style={{position:'absolute',bottom:0,right:0,width:16,height:16,cursor:'se-resize',
          background:'linear-gradient(135deg, transparent 50%, #003865 50%)',
          borderBottomRightRadius:8, opacity:0.4}}/>
    </div>
  );
}

// ─── Main Quotes Page ──────────────────────────────────────────────────────────
export default function Quotes() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const { menu, openMenu, closeMenu } = useContextMenu();

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', page, search, status],
    queryFn: () => api.get('/quotes', { params:{ page, limit:30, search, status } }).then(r => r.data),
    keepPreviousData: true,
  });
  const { data: customers } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => api.get('/customers', { params:{ limit:200 } }).then(r => r.data.data),
  });

  const rows   = data?.data || [];
  const paging = data?.pagination;

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/quotes/${id}`),
    onSuccess: () => { toast.success('Quote deleted'); qc.invalidateQueries(['quotes']); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rowCtx = useCallback((e, q) => {
    openMenu(e, [
      { label:'Open / Edit',         icon:Edit,        action:()=>{ setShowNew(false); setSelected(q.id); }},
      { label:'Email to Customer',   icon:Mail,        action:()=>{ setSelected(q.id); }},
      { divider:true },
      { label:'Convert to Load',     icon:ArrowRight,  action:()=>{ setSelected(q.id); },
        disabled: q.status==='accepted' },
      { divider:true },
      { label:'Copy Quote #',        icon:Copy,        action:()=>{ navigator.clipboard.writeText(q.quote_number); toast.success('Copied!'); }},
      { divider:true },
      { label:'Delete Quote',        icon:Trash2,      danger:true,
        action:()=>{ if(window.confirm(`Delete ${q.quote_number}?`)) deleteMut.mutate(q.id); }},
    ]);
  }, [openMenu]);

  const summary = {
    total: rows.length,
    sent: rows.filter(r=>r.status==='sent').length,
    accepted: rows.filter(r=>r.status==='accepted').length,
    totalValue: rows.reduce((s,r)=>s+(parseFloat(r.total_amount)||0),0),
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 90px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:10,flexShrink:0,flexWrap:'wrap'}}>
        <h1 className="page-title">Quotes</h1>
        <div style={{display:'flex',gap:10,marginRight:'auto',flexWrap:'wrap'}}>
          {summary.sent>0&&<span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:'#E3F2FD',color:'#0063A3'}}>Sent: {summary.sent}</span>}
          {summary.accepted>0&&<span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:'#E8F5E9',color:'#2E7D32'}}>Accepted: {summary.accepted}</span>}
          {summary.totalValue>0&&<span style={{fontSize:11,fontWeight:700,color:'#003865'}}>Total: ${summary.totalValue.toFixed(2)}</span>}
        </div>
        <button className="btn btn-primary" onClick={()=>{ setSelected(null); setShowNew(true); }}>
          <Plus size={14}/> New Quote
        </button>
      </div>

      {/* Filters — tab style matching load board */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexShrink:0,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:1,maxWidth:280}}>
          <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#aaa'}}/>
          <input className="form-input" style={{paddingLeft:28}} placeholder="Search quote #, customer…"
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        {/* Status tabs */}
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {[
            { val:'',          label:'All' },
            { val:'draft',     label:'Draft' },
            { val:'sent',      label:'Sent' },
            { val:'accepted',  label:'Accepted' },
            { val:'declined',  label:'Declined' },
            { val:'expired',   label:'Expired' },
          ].map(t => {
            const count = t.val === '' ? rows.length : rows.filter(r=>r.status===t.val).length;
            const active = status === t.val;
            return (
              <button key={t.val} onClick={()=>{setStatus(t.val);setPage(1);}}
                style={{padding:'4px 12px',border:'none',borderRadius:16,fontSize:12,fontWeight:active?700:400,
                  cursor:'pointer',transition:'all 0.15s',
                  background: active ? '#003865' : '#f0f0f0',
                  color: active ? '#fff' : '#555',
                }}>
                {t.label}{count > 0 && t.val !== '' ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={()=>qc.invalidateQueries(['quotes'])}><RefreshCw size={13}/></button>
      </div>

      {/* Quote list — full width, detail floats above */}
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10,flex:1,overflow:'hidden',minHeight:0}}>
        {/* Quote list */}
        <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{overflowY:'auto',flex:1}}>
            {isLoading ? <div style={{padding:40,textAlign:'center'}}><Spinner/></div>
            : !rows.length ? (
              <div style={{padding:'60px 24px',textAlign:'center',color:'#aaa'}}>
                <FileText size={36} style={{marginBottom:12,opacity:0.25}}/><br/>
                <p style={{fontSize:14,fontWeight:600,marginBottom:6}}>No quotes yet</p>
                <p style={{fontSize:12,marginBottom:16}}>Create a quote with the Signal rate calculator</p>
                <button className="btn btn-primary btn-sm" onClick={()=>{ setSelected(null); setShowNew(true); }}>
                  <Plus size={12}/> New Quote
                </button>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{position:'sticky',top:0,zIndex:1}}>
                  <tr>{['Quote #','Customer','Route','Pallets','Total','Valid Until','Status'].map(h=>(
                    <th key={h} style={TH}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rows.map(q => {
                    const isSelected = selected===q.id;
                    const pCount = q.pallet_rows?.reduce((s,p)=>s+(parseInt(p.count)||0),0) || '—';
                    return (
                      <tr key={q.id}
                        onClick={()=>{ setShowNew(false); setSelected(isSelected?null:q.id); }}
                        onContextMenu={e=>rowCtx(e,q)}
                        style={{cursor:'pointer',
                          background:isSelected?'#e8f0fe':q.status==='accepted'?'#F0FFF4':'#fff',
                          borderLeft:isSelected?'3px solid #0063A3':q.status==='accepted'?'3px solid #2E7D32':'3px solid transparent'}}
                        onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background='#f0f4f8';}}
                        onMouseLeave={e=>{e.currentTarget.style.background=isSelected?'#e8f0fe':q.status==='accepted'?'#F0FFF4':'#fff';}}>
                        <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>{q.quote_number}</td>
                        <td style={{...TD,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.customer_name}</td>
                        <td style={{...TD,fontSize:11,color:'#555'}}>
                          {q.pickup_city||q.origin_city||'—'} → {q.delivery_city||q.dest_city||'—'}
                        </td>
                        <td style={{...TD,textAlign:'center'}}>{pCount}</td>
                        <td style={{...TD,textAlign:'right',fontWeight:700,color:'#003865'}}>${parseFloat(q.total_amount||0).toFixed(2)}</td>
                        <td style={{...TD,color:'#666',fontSize:11}}>{fmt(q.valid_until)}</td>
                        <td style={TD}>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10,
                            background:STATUS_BG[q.status]||'#f5f5f5',color:STATUS_COLOR[q.status]||'#888'}}>
                            {q.status?.toUpperCase()}
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


      </div>

      {/* Floating Quote Detail Window */}
      {(selected || showNew) && (
        <QuoteDetail
          quoteId={selected}
          customers={customers}
          onClose={()=>{ setSelected(null); setShowNew(false); }}
          onSaved={id=>{ setShowNew(false); setSelected(id); qc.invalidateQueries(['quotes']); }}
          onConverted={()=>{ setSelected(null); setShowNew(false); }}
        />
      )}
      <ContextMenu {...menu} onClose={closeMenu}/>
    </div>
  );
}
