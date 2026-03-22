import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Modal, Confirm, ContextMenu, useContextMenu, Field, Pagination, Spinner } from '../../components/common';
import { Plus, RefreshCw, Truck, Phone, Map, Bell, Edit, CheckCircle, XCircle,
  AlertCircle, Package, User, ArrowRight, Home, ChevronDown, ChevronRight,
  MoreVertical, Search, Clock, History, Printer, DollarSign, MapPin,
  TrendingUp, Calendar, Filter, Eye } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const WH = { name:'Signal Warehouse', address:'3170 194th St Unit 102', city:'Surrey', state:'BC', zip:'V3Z 0N4' };
const TS = { planned:'#6B7280', active:'#0063A3', in_progress:'#D97706', completed:'#059669', cancelled:'#DC2626' };
const TB = { planned:'#F9FAFB', active:'#EFF6FF', in_progress:'#FFFBEB', completed:'#ECFDF5', cancelled:'#FEF2F2' };
const TBorder = { planned:'#D1D5DB', active:'#BFDBFE', in_progress:'#FDE68A', completed:'#A7F3D0', cancelled:'#FECACA' };
const LC = { pickup:'#0063A3', delivery:'#059669', drop_warehouse:'#D97706', pickup_warehouse:'#7C3AED' };
const LL = { pickup:'PICKUP', delivery:'DELIVERY', drop_warehouse:'DROP WH', pickup_warehouse:'PU WH' };
const LEG_ACTIONS = {
  pickup:           [{label:'Mark Arrived',status:'arrived',c:'#0063A3',bg:'#EFF6FF'},{label:'Picked Up ✓',status:'completed',c:'#059669',bg:'#ECFDF5',bold:true}],
  delivery:         [{label:'Mark Arrived',status:'arrived',c:'#0063A3',bg:'#EFF6FF'},{label:'Delivered ✓',status:'completed',c:'#059669',bg:'#ECFDF5',bold:true}],
  drop_warehouse:   [{label:'Dropped on Dock ✓',status:'completed',c:'#D97706',bg:'#FFFBEB',bold:true}],
  pickup_warehouse: [{label:'Picked Up from Dock ✓',status:'completed',c:'#7C3AED',bg:'#F5F3FF',bold:true}],
};
const fmt = d => d ? new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric'}) : '—';
const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit',hour12:true}) : '—';
const fmtCurrency = v => '$' + (parseFloat(v)||0).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});

// ─── Table styles ─────────────────────────────────────────────────────────────
const TH = {fontSize:10,fontWeight:700,color:'#fff',padding:'6px 8px',background:'#1E3A5F',border:'1px solid #162d4a',whiteSpace:'nowrap',letterSpacing:'0.04em',textTransform:'uppercase'};
const TD = {fontSize:11,padding:'5px 8px',border:'1px solid #E5E7EB',verticalAlign:'middle',whiteSpace:'nowrap'};

// ─── Trip Sheet Print ─────────────────────────────────────────────────────────
function PrintOptionsModal({ trip, onClose }) {
  const [showRevenue,   setShowRevenue]   = React.useState(false);
  const [showNotes,     setShowNotes]     = React.useState(true);
  const [showOdometer,  setShowOdometer]  = React.useState(true);
  const [showSignature, setShowSignature] = React.useState(true);

  const opts = [
    { label:'Show Revenue / Rates', offLabel:'Hide Revenue (Driver Copy)', val:showRevenue, set:setShowRevenue, hint:'Turn OFF for driver copies — revenue is for internal use only' },
    { label:'Show Special Instructions', offLabel:'Hide Special Instructions', val:showNotes, set:setShowNotes, hint:'' },
    { label:'Show Odometer Fields', offLabel:'Hide Odometer Fields', val:showOdometer, set:setShowOdometer, hint:'' },
    { label:'Show Signature Lines', offLabel:'Hide Signature Lines', val:showSignature, set:setShowSignature, hint:'' },
  ];

  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.55)'}}>
      <div style={{background:'#fff',borderRadius:8,boxShadow:'0 16px 60px rgba(0,0,0,0.3)',width:430,overflow:'hidden'}}>
        <div style={{background:'#003865',color:'#fff',padding:'12px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:7}}><Printer size={15}/> Print Trip Sheet</div>
            <div style={{fontSize:11,opacity:0.75,marginTop:2}}>{trip.trip_number} · {trip.driver_name||'No driver'}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:'16px 18px'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Print Options</div>
          {opts.map((o,i)=>(
            <div key={i} style={{marginBottom:10,padding:'10px 12px',background:o.val?'#EFF6FF':'#F9FAFB',border:`1px solid ${o.val?'#BFDBFE':'#E5E7EB'}`,borderRadius:6}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#111'}}>{o.val ? o.label : o.offLabel}</div>
                  {o.hint&&<div style={{fontSize:10,color:'#9CA3AF',marginTop:1}}>{o.hint}</div>}
                </div>
                <button onClick={()=>o.set(!o.val)}
                  style={{flexShrink:0,width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',position:'relative',
                    background:o.val?'#003865':'#D1D5DB',transition:'background 0.2s'}}>
                  <span style={{position:'absolute',top:2,width:18,height:18,borderRadius:'50%',background:'#fff',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)',transition:'left 0.2s',
                    left:o.val?'calc(100% - 20px)':'2px'}}/>
                </button>
              </div>
            </div>
          ))}
          {showRevenue&&(
            <div style={{padding:'8px 12px',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:6,fontSize:11,color:'#92400E',marginTop:4}}>
              ⚠️ <strong>Revenue visible.</strong> Use for internal/accounting copies only.
            </div>
          )}
        </div>
        <div style={{padding:'12px 18px',borderTop:'1px solid #E5E7EB',display:'flex',justifyContent:'flex-end',gap:8,background:'#F9FAFB'}}>
          <button onClick={onClose} style={{padding:'7px 16px',border:'1px solid #D1D5DB',borderRadius:5,background:'#fff',fontSize:12,cursor:'pointer',color:'#374151'}}>Cancel</button>
          <button onClick={()=>{doPrintTripSheet(trip,{showRevenue,showNotes,showOdometer,showSignature});onClose();}}
            style={{padding:'7px 18px',border:'none',borderRadius:5,background:'#003865',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            <Printer size={13}/> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function doPrintTripSheet(trip, opts={}) {
  const { showRevenue=false, showNotes=true, showOdometer=true, showSignature=true } = opts;
  const legs = trip.legs || [];
  const totalRev = legs.reduce((s,l)=>s+(parseFloat(l.total_revenue)||0),0);
  const totalPcs = legs.reduce((s,l)=>s+(parseInt(l.pieces)||0),0);
  const totalWgt = legs.reduce((s,l)=>s+(parseFloat(l.weight)||0),0);
  const today = new Date().toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'});

  const legRows = legs.map((leg,i) => {
    const isPU = leg.stop_type==='pickup'||leg.stop_type==='pickup_warehouse';
    const isDW = leg.stop_type==='drop_warehouse';
    const loc  = isPU ? `${leg.origin_name||leg.customer_name||''}<br/>${leg.origin_address||''}<br/>${[leg.origin_city,leg.origin_state,leg.origin_zip].filter(Boolean).join(', ')}`
               : isDW ? `Signal Warehouse<br/>${WH.address}<br/>${WH.city}, ${WH.state} ${WH.zip}`
               : `${leg.dest_name||leg.customer_name||''}<br/>${leg.dest_address||''}<br/>${[leg.dest_city,leg.dest_state,leg.dest_zip].filter(Boolean).join(', ')}`;
    const typeLabel = {pickup:'PICKUP',delivery:'DELIVERY',drop_warehouse:'DROP WH',pickup_warehouse:'PU WH'}[leg.stop_type]||leg.stop_type;
    const typeColor = {pickup:'#1D4ED8',delivery:'#065F46',drop_warehouse:'#92400E',pickup_warehouse:'#4C1D95'}[leg.stop_type]||'#374151';
    return `
    <tr>
      <td style="text-align:center;font-weight:700;font-size:16px;color:#374151;border:1px solid #D1D5DB;padding:8px">${i+1}</td>
      <td style="border:1px solid #D1D5DB;padding:8px">
        <span style="background:${typeColor};color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700">${typeLabel}</span>
      </td>
      <td style="border:1px solid #D1D5DB;padding:8px;font-family:monospace;font-weight:700;color:#1D4ED8">${leg.load_number||''}</td>
      <td style="border:1px solid #D1D5DB;padding:8px;font-weight:600">${leg.customer_name||''}</td>
      <td style="border:1px solid #D1D5DB;padding:8px;font-size:11px;line-height:1.5">${loc}</td>
      <td style="border:1px solid #D1D5DB;padding:8px;text-align:center">${leg.planned_date?new Date(leg.planned_date).toLocaleDateString('en-CA',{month:'short',day:'numeric'}):'—'}</td>
      <td style="border:1px solid #D1D5DB;padding:8px;text-align:center">${leg.planned_time?.slice(0,5)||'—'}</td>
      <td style="border:1px solid #D1D5DB;padding:8px;text-align:center">${leg.pieces||''}</td>
      <td style="border:1px solid #D1D5DB;padding:8px;text-align:right">${leg.weight?parseFloat(leg.weight).toLocaleString()+' lb':''}</td>
      <td style="border:1px solid #D1D5DB;padding:8px">${leg.appt_ref||leg.reference||''}</td>
      <td style="border:1px solid #D1D5DB;padding:60px 8px 8px;min-width:80px"></td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><title>Trip Sheet — ${trip.trip_number}</title>
  <style>
    @page { size:letter; margin:0.5in; }
    *{box-sizing:border-box;}
    body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:0;padding:0;}
    .header{display:grid;grid-template-columns:1fr auto;align-items:start;border-bottom:3px solid #003865;padding-bottom:10px;margin-bottom:14px;}
    .company{font-size:18px;font-weight:900;color:#003865;letter-spacing:-0.5px;}
    .doc-title{font-size:12px;color:#6B7280;margin-top:2px;}
    .trip-info{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #D1D5DB;margin-bottom:14px;}
    .info-cell{padding:8px 12px;border-right:1px solid #D1D5DB;}
    .info-cell:last-child{border-right:none;}
    .info-label{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6B7280;display:block;margin-bottom:2px;}
    .info-val{font-size:13px;font-weight:700;color:#111;}
    table{width:100%;border-collapse:collapse;margin-bottom:14px;}
    th{background:#1E3A5F;color:#fff;padding:7px 8px;font-size:9px;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #162d4a;}
    .summary{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
    .box{border:1px solid #D1D5DB;padding:10px 14px;}
    .box-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6B7280;margin-bottom:6px;}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:20px;}
    .sig-box{border-top:2px solid #111;padding-top:6px;}
    .sig-label{font-size:9px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;}
    .broadcast{background:#FFF9C4;border:1px solid #F59E0B;padding:8px 12px;margin-bottom:14px;}
    @media print{body{padding:0;}}
  </style></head><body>

  <div class="header">
    <div>
      <div class="company">Signal Transportation Ltd</div>
      <div class="doc-title">DRIVER TRIP SHEET / MANIFEST${showRevenue?' — INTERNAL COPY':''}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#6B7280">
      <div>Printed: ${today}</div>
      <div style="font-size:20px;font-weight:900;color:#003865;margin-top:4px">${trip.trip_number}</div>
    </div>
  </div>

  <div class="trip-info">
    <div class="info-cell"><span class="info-label">Driver</span><span class="info-val">${trip.driver_name||'— Unassigned —'}</span></div>
    <div class="info-cell"><span class="info-label">Truck Unit</span><span class="info-val">${trip.truck_unit||'—'}</span></div>
    <div class="info-cell"><span class="info-label">Trailer Unit</span><span class="info-val">${trip.trailer_unit||'—'}</span></div>
    <div class="info-cell"><span class="info-label">Trip Date</span><span class="info-val">${trip.planned_date?new Date(trip.planned_date).toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'}):'—'}</span></div>
    <div class="info-cell"><span class="info-label">Trip Type</span><span class="info-val">${trip.trip_type||'—'}</span></div>
    <div class="info-cell"><span class="info-label">Total Stops</span><span class="info-val">${legs.length}</span></div>
    <div class="info-cell"><span class="info-label">Total Pieces</span><span class="info-val">${totalPcs||'—'}</span></div>
    <div class="info-cell"><span class="info-label">Total Weight</span><span class="info-val">${totalWgt?parseFloat(totalWgt).toLocaleString()+' lb':'—'}</span></div>
  </div>

  ${trip.broadcast_notes?`<div class="broadcast"><b>📢 BROADCAST NOTES:</b> ${trip.broadcast_notes}</div>`:''}

  <table>
    <thead><tr>
      <th style="width:32px">#</th><th style="width:80px">Type</th><th style="width:80px">Load #</th>
      <th>Customer</th><th>Stop Address</th><th style="width:68px">Date</th>
      <th style="width:52px">Time</th><th style="width:44px">Pcs</th>
      <th style="width:80px">Weight</th><th style="width:80px">Ref / Appt</th>
      <th style="width:90px">Signature</th>
    </tr></thead>
    <tbody>${legRows}</tbody>
  </table>

  ${showNotes?`
  <div class="summary">
    <div class="box">
      <div class="box-title">Special Instructions / Notes</div>
      <div style="min-height:60px;font-size:11px;line-height:1.6">${trip.notes||'None'}</div>
    </div>
    <div class="box">
      <div class="box-title">Trip Summary</div>
      <table style="margin:0;font-size:11px">
        <tr><td style="padding:2px 0;border:none">Total Stops:</td><td style="padding:2px 0;border:none;text-align:right;font-weight:700">${legs.length}</td></tr>
        <tr><td style="padding:2px 0;border:none">Total Pieces:</td><td style="padding:2px 0;border:none;text-align:right;font-weight:700">${totalPcs||0}</td></tr>
        <tr><td style="padding:2px 0;border:none">Total Weight:</td><td style="padding:2px 0;border:none;text-align:right;font-weight:700">${totalWgt?parseFloat(totalWgt).toLocaleString()+' lb':'—'}</td></tr>
        ${showRevenue?`<tr style="border-top:2px solid #D1D5DB"><td style="padding:4px 0 2px;border:none;font-weight:700">Total Revenue:</td><td style="padding:4px 0 2px;border:none;text-align:right;font-weight:700;font-size:14px;color:#059669">${fmtCurrency(totalRev)}</td></tr>`:''}
      </table>
    </div>
  </div>
  `:`
  <div class="box" style="margin-bottom:14px">
    <div class="box-title">Trip Summary</div>
    <table style="margin:0;font-size:11px;width:200px">
      <tr><td style="padding:2px 0;border:none">Total Stops:</td><td style="padding:2px 0;border:none;text-align:right;font-weight:700">${legs.length}</td></tr>
      <tr><td style="padding:2px 0;border:none">Total Pieces:</td><td style="padding:2px 0;border:none;text-align:right;font-weight:700">${totalPcs||0}</td></tr>
      <tr><td style="padding:2px 0;border:none">Total Weight:</td><td style="padding:2px 0;border:none;text-align:right;font-weight:700">${totalWgt?parseFloat(totalWgt).toLocaleString()+' lb':'—'}</td></tr>
      ${showRevenue?`<tr style="border-top:2px solid #D1D5DB"><td style="padding:4px 0 2px;border:none;font-weight:700">Total Revenue:</td><td style="padding:4px 0 2px;border:none;text-align:right;font-weight:700;font-size:14px;color:#059669">${fmtCurrency(totalRev)}</td></tr>`:''}
    </table>
  </div>
  `}

  ${showSignature?`
  <div class="sig-grid">
    <div class="sig-box"><div class="sig-label">Driver Signature / Date</div><div style="margin-top:40px;font-size:10px;color:#9CA3AF">Sign above to confirm trip acceptance</div></div>
    <div class="sig-box"><div class="sig-label">Dispatch Authorized By</div></div>
    ${showOdometer?`<div class="sig-box"><div class="sig-label">Odometer Start / End</div><div style="margin-top:10px;font-size:10px">Start: _________________ &nbsp;&nbsp; End: _________________</div></div>`:''}
  </div>`:''}

  <div style="margin-top:18px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:9px;color:#9CA3AF;text-align:center">
    Signal Transportation Ltd · 3170 194th St Unit 102, Surrey, BC V3Z 0N4 · Tel: 604-867-5543 · ${showRevenue?'INTERNAL COPY — CONFIDENTIAL':'This document is intended for the assigned driver only.'}
  </div>
  </body></html>`;

  const w = window.open('','_blank','width=900,height=700');
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(),500);
}

// ─── Trip Modal ────────────────────────────────────────────────────────────────
function TripModal({ open, trip, onClose, drivers, carriers, trucks, trailers }) {
  const qc = useQueryClient();
  const isEdit = !!trip;
  const [dispatchMethod, setDispatchMethod] = useState('company');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyApp,   setNotifyApp]   = useState(true);
  const [form, setForm] = useState({trip_type:'LTL',driver_id:'',carrier_id:'',truck_id:'',trailer_id:'',
    carrier_driver:'',carrier_truck:'',carrier_rate:'',planned_date:'',notes:'',broadcast_notes:''});

  useEffect(()=>{
    if(open){
      setDispatchMethod(trip?.carrier_id&&!trip?.driver_id?'carrier':'company');
      setNotifyEmail(true); setNotifyApp(true);
      setForm(trip?{trip_type:trip.trip_type||'LTL',driver_id:trip.driver_id||'',carrier_id:trip.carrier_id||'',
        truck_id:trip.truck_id||'',trailer_id:trip.trailer_id||'',carrier_driver:'',carrier_truck:'',carrier_rate:'',
        planned_date:trip.planned_date?.slice(0,10)||'',notes:trip.notes||'',broadcast_notes:trip.broadcast_notes||''}
        :{trip_type:'LTL',driver_id:'',carrier_id:'',truck_id:'',trailer_id:'',carrier_driver:'',carrier_truck:'',carrier_rate:'',planned_date:'',notes:'',broadcast_notes:''});
    }
  },[open,trip]);

  const mut = useMutation({
    mutationFn: b=>isEdit?api.put(`/dispatch/trips/${trip.id}`,b):api.post('/dispatch/trips',b),
    onSuccess: async(r)=>{
      const tripData=r.data.data;
      const tripNum=tripData?.trip_number||trip?.trip_number||'';
      toast.success(isEdit?'Trip updated':`Trip ${tripNum} created`);
      qc.invalidateQueries(['dispatch-board']);
      if(!isEdit&&(notifyEmail||notifyApp)&&dispatchMethod==='company'&&form.driver_id){
        const driver=(drivers||[]).find(d=>d.id===form.driver_id);
        if(driver&&notifyEmail&&driver.email){openDriverEmail(driver,tripNum,form);}
        if(tripData?.id){try{await api.post(`/dispatch/trips/${tripData.id}/notify`);}catch{}}
      }
      onClose();
    },
    onError: e=>toast.error(e.response?.data?.message||'Failed'),
  });

  const openDriverEmail=(driver,tripNum,f)=>{
    const subject=encodeURIComponent('Trip '+tripNum+' - Signal Transportation Ltd');
    const driverName=driver.first_name+' '+driver.last_name;
    const msgBody='Hi '+driverName+',\n\nYou have been assigned a new trip.\n\nTRIP: '+tripNum+'\nTYPE: '+f.trip_type+'\nDATE: '+(f.planned_date||'TBD')+'\n\nBROADCAST NOTES:\n'+(f.broadcast_notes||'None')+'\n\nSignal Transportation Ltd\n3170 194th St Unit 102, Surrey, BC\n604-867-5543';
    const body=encodeURIComponent(msgBody);
    window.open('mailto:'+(driver.email||'')+'?subject='+subject+'&body='+body);
  };

  const h=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const selectedDriver=(drivers||[]).find(d=>d.id===form.driver_id);

  return (
    <Modal open={open} onClose={onClose} title={isEdit?`Edit Trip — ${trip?.trip_number}`:'Create New Trip'} size="md"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>mut.mutate(form)} disabled={mut.isPending}>
          {mut.isPending?'Saving…':isEdit?'Save Changes':(notifyEmail||notifyApp)&&dispatchMethod==='company'&&form.driver_id?'Create & Notify':'Create Trip'}
        </button></>}>
      <div style={{display:'flex',gap:0,marginBottom:16,border:'1px solid #E5E7EB',borderRadius:6,overflow:'hidden'}}>
        {[['company','🚛  Company Driver'],['carrier','🤝  Outside Carrier']].map(([val,label])=>(
          <button key={val} onClick={()=>setDispatchMethod(val)}
            style={{flex:1,padding:'9px 12px',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
              background:dispatchMethod===val?'#003865':'#F9FAFB',color:dispatchMethod===val?'#fff':'#6B7280',
              borderRight:val==='company'?'1px solid #E5E7EB':'none'}}>
            {label}
          </button>
        ))}
      </div>
      <div className="form-grid">
        <Field label="Trip Type" required>
          <select name="trip_type" className="form-input" value={form.trip_type} onChange={h}>
            <option value="LTL">LTL — Multiple Loads</option>
            <option value="FTL">FTL — Single Load</option>
          </select>
        </Field>
        <Field label="Planned Date">
          <input type="date" name="planned_date" className="form-input" value={form.planned_date} onChange={h}/>
        </Field>
        {dispatchMethod==='company'&&(<>
          <Field label="Driver">
            <select name="driver_id" className="form-input" value={form.driver_id} onChange={h}>
              <option value="">Assign later…</option>
              {(drivers||[]).map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name}{d.status==='available'?' ✓':''}</option>)}
            </select>
          </Field>
          <Field label="Truck">
            <select name="truck_id" className="form-input" value={form.truck_id} onChange={h}>
              <option value="">No truck</option>
              {(trucks||[]).map(t=><option key={t.id} value={t.id}>{t.unit_number}</option>)}
            </select>
          </Field>
          <Field label="Trailer">
            <select name="trailer_id" className="form-input" value={form.trailer_id} onChange={h}>
              <option value="">No trailer</option>
              {(trailers||[]).map(t=><option key={t.id} value={t.id}>{t.unit_number}</option>)}
            </select>
          </Field>
          <div/>
        </>)}
        {dispatchMethod==='carrier'&&(<>
          <Field label="Carrier Company" required>
            <select name="carrier_id" className="form-input" value={form.carrier_id} onChange={h}>
              <option value="">Select carrier…</option>
              {(carriers||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Carrier Rate ($)">
            <input type="number" step="0.01" name="carrier_rate" className="form-input" value={form.carrier_rate} onChange={h} placeholder="0.00"/>
          </Field>
          <Field label="Their Driver Name">
            <input name="carrier_driver" className="form-input" value={form.carrier_driver} onChange={h} placeholder="Driver name"/>
          </Field>
          <Field label="Their Truck #">
            <input name="carrier_truck" className="form-input" value={form.carrier_truck} onChange={h} placeholder="Truck / unit #"/>
          </Field>
        </>)}
        <Field label="Notes" className="full">
          <textarea name="notes" className="form-input" rows={2} value={form.notes} onChange={h}/>
        </Field>
        <Field label="Broadcast Notes (visible to driver)" className="full">
          <input name="broadcast_notes" className="form-input" value={form.broadcast_notes} onChange={h} placeholder="e.g. Call shipper before arriving…"/>
        </Field>
      </div>
      {!isEdit&&dispatchMethod==='company'&&form.driver_id&&(
        <div style={{marginTop:12,padding:'12px 14px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:6}}>
          <div style={{fontSize:12,fontWeight:700,color:'#003865',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
            <Bell size={14}/> Notify Driver When Creating Trip
          </div>
          <div style={{display:'flex',gap:20,marginBottom:10}}>
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,cursor:'pointer'}}>
              <input type="checkbox" checked={notifyEmail} onChange={e=>setNotifyEmail(e.target.checked)}/>📧 Send Email
            </label>
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,cursor:'pointer'}}>
              <input type="checkbox" checked={notifyApp} onChange={e=>setNotifyApp(e.target.checked)}/>📱 Mark as Notified
            </label>
          </div>
          {selectedDriver&&(
            <div style={{fontSize:11,color:'#374151',background:'#fff',border:'1px solid #BFDBFE',borderRadius:4,padding:'8px 10px'}}>
              <div style={{fontWeight:700,marginBottom:3}}>To: {selectedDriver.first_name} {selectedDriver.last_name}</div>
              <div style={{color:'#6B7280',lineHeight:1.6}}>"Hi {selectedDriver.first_name}, you have been assigned Trip for {form.planned_date||'TBD'}.{form.broadcast_notes?` Notes: ${form.broadcast_notes}`:''}"</div>
              {!selectedDriver.email&&<div style={{marginTop:6,color:'#D97706',fontSize:11}}>⚠️ No email on file for this driver.</div>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Add Load Modal ───────────────────────────────────────────────────────────
function AddLoadModal({ open, tripId, tripNumber, availLoads, dockLoads, onClose }) {
  const qc = useQueryClient();
  const [sel,setSel]=useState(''); const [type,setType]=useState('pickup');
  const [date,setDate]=useState(''); const [time,setTime]=useState('');
  useEffect(()=>{if(open){setSel('');setType('pickup');setDate('');setTime('');}}, [open]);
  const mut = useMutation({
    mutationFn:()=>api.post(`/dispatch/trips/${tripId}/loads`,{load_id:sel,stop_type:type,planned_date:date||undefined,planned_time:time||undefined}),
    onSuccess:()=>{toast.success('Load added');qc.invalidateQueries(['dispatch-board']);onClose();},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });
  return (
    <Modal open={open} onClose={onClose} title={`Add Load to ${tripNumber}`} size="sm"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={()=>mut.mutate()} disabled={mut.isPending||!sel}>{mut.isPending?'Adding…':'Add to Trip'}</button></>}>
      <div className="form-grid">
        <Field label="Load" required className="full">
          <select className="form-input" value={sel} onChange={e=>setSel(e.target.value)}>
            <option value="">Select load…</option>
            <optgroup label="Available Loads">{(availLoads||[]).map(l=><option key={l.id} value={l.id}>{l.load_number} — {l.customer_name} ({l.origin_city} → {l.dest_city})</option>)}</optgroup>
            {dockLoads?.length>0&&<optgroup label="On Dock">{dockLoads.map(l=><option key={l.id} value={l.id}>🏭 {l.load_number} — {l.customer_name}</option>)}</optgroup>}
          </select>
        </Field>
        <Field label="Stop Type"><select className="form-input" value={type} onChange={e=>setType(e.target.value)}><option value="pickup">Pickup</option><option value="delivery">Delivery</option><option value="drop_warehouse">Drop @ Warehouse</option><option value="pickup_warehouse">Pickup @ Warehouse</option></select></Field>
        <Field label="Planned Date"><input type="date" className="form-input" value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label="Planned Time"><input type="time" className="form-input" value={time} onChange={e=>setTime(e.target.value)}/></Field>
      </div>
    </Modal>
  );
}

// ─── Notify Driver Modal ──────────────────────────────────────────────────────
function NotifyModal({ open, trip, drivers, onClose }) {
  const qc = useQueryClient();
  const [notifyEmail,setNotifyEmail]=useState(true);
  const [customMsg,setCustomMsg]=useState('');
  const driver=(drivers||[]).find(d=>d.id===trip?.driver_id);
  const notifyMut=useMutation({
    mutationFn:()=>api.post(`/dispatch/trips/${trip.id}/notify`),
    onSuccess:()=>{toast.success('Trip marked as notified');qc.invalidateQueries(['dispatch-board']);},
    onError:()=>toast.error('Failed'),
  });
  const handleSend=()=>{
    if(notifyEmail&&driver?.email){
      const legs=trip.legs||[];
      const stops=legs.map((l,i)=>'  '+(i+1)+'. '+(l.stop_type==='pickup'?'PICKUP':'DELIVERY')+': '+l.customer_name+' - '+(l.stop_type==='pickup'?l.origin_city+', '+l.origin_state:l.dest_city+', '+l.dest_state)+(l.planned_date?' ('+new Date(l.planned_date).toLocaleDateString()+')':'')).join('\n');
      const subject=encodeURIComponent('Trip '+trip.trip_number+' Dispatch - Signal Transportation Ltd');
      const msgBody='Hi '+driver.first_name+',\n\nYou have been assigned Trip '+trip.trip_number+'.\n\nTRIP DETAILS:\nType: '+trip.trip_type+'\nDate: '+(trip.planned_date?new Date(trip.planned_date).toLocaleDateString():'TBD')+'\nTruck: '+(trip.truck_unit||'TBD')+'\nTrailer: '+(trip.trailer_unit||'TBD')+'\n\nSTOPS ('+legs.length+'):\n'+(stops||'No stops assigned yet')+'\n\nBROADCAST NOTES:\n'+(trip.broadcast_notes||'None')+(customMsg?'\n\nADDITIONAL MESSAGE:\n'+customMsg:'')+'\n\nSignal Transportation Ltd\n604-867-5543';
      const body=encodeURIComponent(msgBody);
      window.open('mailto:'+(driver.email||'')+'?subject='+subject+'&body='+body);
    }
    notifyMut.mutate();
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={`Notify Driver — ${trip?.trip_number}`} size="sm"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSend}>Send Notification</button></>}>
      <div style={{marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Driver: {driver?`${driver.first_name} ${driver.last_name}`:'No driver assigned'}</div>
        {driver?.phone&&<div style={{fontSize:12,color:'#6B7280'}}>📞 {driver.phone}</div>}
        {driver?.email&&<div style={{fontSize:12,color:'#6B7280'}}>📧 {driver.email}</div>}
        {!driver?.email&&<div style={{fontSize:12,color:'#D97706'}}>⚠️ No email on file</div>}
      </div>
      <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,marginBottom:12,cursor:'pointer'}}>
        <input type="checkbox" checked={notifyEmail} onChange={e=>setNotifyEmail(e.target.checked)} style={{width:15,height:15}}/>
        Send email to driver
      </label>
      <Field label="Additional Message (optional)">
        <textarea className="form-input" rows={3} value={customMsg} onChange={e=>setCustomMsg(e.target.value)} placeholder="Extra instructions for this trip…"/>
      </Field>
    </Modal>
  );
}

// ─── Reorder Modal ────────────────────────────────────────────────────────────
function ReorderModal({ open, trip, onClose }) {
  const qc=useQueryClient();
  const [legs,setLegs]=useState([]);
  const dragIdx=useRef(null);
  useEffect(()=>{if(open&&trip)setLegs([...(trip.legs||[])]);},[open,trip]);
  const onDragOver=(e,i)=>{e.preventDefault();if(dragIdx.current===null||dragIdx.current===i)return;const l=[...legs];const[item]=l.splice(dragIdx.current,1);l.splice(i,0,item);dragIdx.current=i;setLegs(l);};
  const mut=useMutation({
    mutationFn:()=>api.put(`/dispatch/trips/${trip.id}/reorder`,{order:legs.map((l,i)=>({load_id:l.load_id,stop_order:i+1,stop_type:l.stop_type}))}),
    onSuccess:()=>{toast.success('Stops reordered');qc.invalidateQueries(['dispatch-board']);onClose();},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });
  const chType=(i,t)=>{const l=[...legs];l[i]={...l[i],stop_type:t};setLegs(l);};
  return (
    <Modal open={open} onClose={onClose} title={`Reorder Stops — ${trip?.trip_number}`}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={()=>mut.mutate()} disabled={mut.isPending}>{mut.isPending?'Saving…':'Save Order'}</button></>}>
      <p style={{fontSize:12,color:'#6B7280',marginBottom:10}}>Drag to reorder stops.</p>
      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {legs.map((leg,i)=>(
          <div key={leg.load_id} draggable onDragStart={()=>{dragIdx.current=i;}} onDragOver={e=>onDragOver(e,i)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:4,cursor:'grab'}}>
            <span style={{fontSize:16,color:'#9CA3AF'}}>⠿</span>
            <span style={{fontSize:12,fontWeight:700,color:'#9CA3AF',minWidth:20}}>{i+1}</span>
            <span style={{fontSize:12,fontFamily:'monospace',fontWeight:700,color:'#003865',minWidth:80}}>{leg.load_number}</span>
            <span style={{fontSize:12,flex:1,color:'#6B7280'}}>{leg.customer_name}</span>
            <select value={leg.stop_type} onChange={e=>chType(i,e.target.value)} style={{fontSize:11,padding:'3px 6px',border:'1px solid #D1D5DB',borderRadius:3}}>
              <option value="pickup">Pickup</option><option value="delivery">Delivery</option>
              <option value="drop_warehouse">Drop @ WH</option><option value="pickup_warehouse">Pickup @ WH</option>
            </select>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── Leg Action Panel ─────────────────────────────────────────────────────────
function LegActionPanel({ leg, tripId, onClose, onRemove }) {
  const qc=useQueryClient();
  const actions=LEG_ACTIONS[leg.stop_type]||LEG_ACTIONS.delivery;
  const mut=useMutation({
    mutationFn:status=>api.put(`/dispatch/trips/${tripId}/legs/${leg.load_id}/status`,{status}),
    onSuccess:(_,status)=>{const msgs={arrived:'Marked arrived',completed:'Stop completed ✓',skipped:'Marked skipped'};toast.success(msgs[status]||'Updated');qc.invalidateQueries(['dispatch-board']);onClose();},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });
  const loc=leg.stop_type==='pickup'||leg.stop_type==='pickup_warehouse'?`${leg.origin_city||''}, ${leg.origin_state||''}`:leg.stop_type==='drop_warehouse'?`${WH.city}, ${WH.state} — Signal Warehouse`:`${leg.dest_city||''}, ${leg.dest_state||''}`;
  return (
    <div style={{background:'#EFF6FF',borderTop:'2px solid #3B82F6',borderBottom:'1px solid #BFDBFE',padding:'10px 14px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
      <div style={{fontSize:11,color:'#374151'}}>
        <span style={{fontWeight:700,color:LC[leg.stop_type]||'#374151',marginRight:6,textTransform:'uppercase',fontSize:10}}>{LL[leg.stop_type]}</span>
        <span style={{fontWeight:700}}>{leg.customer_name}</span>
        <span style={{color:'#9CA3AF',margin:'0 5px'}}>@</span>
        <span style={{fontWeight:600}}>{loc}</span>
        {leg.pieces&&<span style={{color:'#9CA3AF',marginLeft:8,fontSize:10}}>{leg.pieces} pcs</span>}
        {leg.weight&&<span style={{color:'#9CA3AF',marginLeft:6,fontSize:10}}>{parseFloat(leg.weight).toLocaleString()} lb</span>}
      </div>
      <div style={{flex:1}}/>
      {leg.status!=='completed'&&actions.map(a=>(
        <button key={a.status} onClick={()=>mut.mutate(a.status)} disabled={mut.isPending||leg.status===a.status}
          style={{padding:'5px 14px',border:`1px solid ${a.c}`,background:leg.status===a.status?a.c:a.bg,color:leg.status===a.status?'#fff':a.c,borderRadius:4,fontSize:12,fontWeight:a.bold?700:600,cursor:'pointer'}}>
          {mut.isPending?'…':a.label}
        </button>
      ))}
      {leg.status==='completed'&&<span style={{color:'#059669',fontWeight:700,fontSize:12,padding:'5px 10px',background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:4}}>✓ Completed</span>}
      {leg.status!=='completed'&&leg.status!=='skipped'&&(
        <button onClick={()=>{if(window.confirm('Skip this stop?'))mut.mutate('skipped');}} style={{padding:'5px 10px',border:'1px solid #E5E7EB',background:'#fff',color:'#9CA3AF',borderRadius:4,fontSize:11,cursor:'pointer'}}>Skip</button>
      )}
      <button onClick={onRemove} style={{padding:'5px 10px',border:'1px solid #FECACA',background:'#fff',color:'#DC2626',borderRadius:4,fontSize:11,cursor:'pointer'}}>Remove</button>
      <button onClick={onClose}  style={{padding:'5px 8px',border:'1px solid #E5E7EB',background:'#fff',color:'#9CA3AF',borderRadius:4,fontSize:11,cursor:'pointer'}}>✕</button>
    </div>
  );
}


// ─── Activity Log Popup ────────────────────────────────────────────────────────
function ActivityLogPopup({ trip, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['trip-activity', trip.id],
    queryFn: () => api.get(`/dispatch/trips/${trip.id}/activity`).then(r => r.data.data || []),
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const evtColors = {
    created:{bg:'#ECFDF5',color:'#059669'}, load_added:{bg:'#EFF6FF',color:'#0063A3'},
    load_removed:{bg:'#FEF2F2',color:'#DC2626'}, status_changed:{bg:'#F5F3FF',color:'#7C3AED'},
    leg_updated:{bg:'#FFFBEB',color:'#D97706'}, notified:{bg:'#EFF6FF',color:'#0063A3'},
    completed:{bg:'#ECFDF5',color:'#059669'}, cancelled:{bg:'#FEF2F2',color:'#DC2626'},
  };
  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.55)'}}>
      <div style={{background:'#fff',borderRadius:8,boxShadow:'0 16px 60px rgba(0,0,0,0.25)',width:'min(720px,95vw)',maxHeight:'80vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#003865',color:'#fff',padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontWeight:700,fontSize:14}}>📋 Activity Log — {trip.trip_number}</div>
            <div style={{fontSize:11,opacity:0.75,marginTop:2}}>{trip.driver_name||'No driver'} · {trip.trip_type} · {trip.status?.toUpperCase()}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {isLoading?(
            <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>Loading activity…</div>
          ):!data?.length?(
            <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>
              <div style={{fontSize:32,marginBottom:8}}>📋</div>
              <div style={{fontSize:14,fontWeight:600,color:'#374151',marginBottom:4}}>No activity recorded yet</div>
              <div style={{fontSize:12}}>Actions will appear here as the trip progresses.</div>
            </div>
          ):(
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead style={{position:'sticky',top:0,zIndex:1}}>
                <tr style={{background:'#F1F5F9',borderBottom:'2px solid #E5E7EB'}}>
                  {['Date','Time','User','Event','Details','Load #'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((evt,i)=>{
                  const dt=new Date(evt.created_at);
                  const ec=evtColors[evt.event_type]||{bg:'#F9FAFB',color:'#6B7280'};
                  return (
                    <tr key={evt.id||i} style={{borderBottom:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFCFF'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#F0F4FF'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFCFF'}>
                      <td style={{padding:'8px 12px',color:'#6B7280',whiteSpace:'nowrap',fontSize:11}}>{dt.toLocaleDateString('en-CA',{month:'short',day:'numeric'})}</td>
                      <td style={{padding:'8px 12px',color:'#6B7280',whiteSpace:'nowrap',fontSize:11}}>{dt.toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit',hour12:true})}</td>
                      <td style={{padding:'8px 12px',fontWeight:700,color:'#111',whiteSpace:'nowrap'}}>{evt.created_by_name||'System'}</td>
                      <td style={{padding:'8px 12px'}}>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:ec.bg,color:ec.color,whiteSpace:'nowrap',textTransform:'uppercase'}}>{evt.event_type?.replace(/_/g,' ')||'—'}</span>
                      </td>
                      <td style={{padding:'8px 12px',color:'#374151',maxWidth:260}}>{evt.description}</td>
                      <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:11,color:'#0063A3',fontWeight:700}}>{evt.load_number||'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div style={{padding:'10px 18px',borderTop:'1px solid #E5E7EB',background:'#F8FAFC',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <span style={{fontSize:11,color:'#9CA3AF'}}>{data?.length||0} event{data?.length!==1?'s':''} recorded</span>
          <button onClick={onClose} style={{padding:'6px 18px',border:'1px solid #D1D5DB',borderRadius:5,background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Trip Card ─────────────────────────────────────────────────────────────────
function TripCard({ trip, onEdit, onAddLoad, onReorder, onNotify, onComplete, onCancel, onPrint }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [activeLeg, setActiveLeg] = useState(null);
  const [activityPopup, setActivityPopup] = useState(false);
  const {menu,openMenu,closeMenu} = useContextMenu();

  const legs = trip.legs || [];
  const done = legs.filter(l=>l.status==='completed').length;
  const visibleLegs = legs.filter(l=>!(l.stop_type==='drop_warehouse' && l.status==='completed'));
  const totalRev = legs.reduce((s,l)=>s+(parseFloat(l.total_revenue)||0),0);
  const totalPcs = legs.reduce((s,l)=>s+(parseInt(l.pieces)||0),0);
  const totalWgt = legs.reduce((s,l)=>s+(parseFloat(l.weight)||0),0);
  const progress = visibleLegs.length>0 ? (done/visibleLegs.length)*100 : 0;
  const firstCity = legs[0]?.stop_type==='pickup' ? legs[0]?.origin_city : legs[0]?.dest_city;
  const lastLeg   = visibleLegs[visibleLegs.length-1]||legs[legs.length-1];
  const lastCity  = lastLeg?.stop_type==='delivery' ? lastLeg?.dest_city : lastLeg?.origin_city;

  const statusColor = TS[trip.status]||'#6B7280';
  const statusBg    = TB[trip.status]||'#F9FAFB';
  const statusBorder= TBorder[trip.status]||'#E5E7EB';

  const removeMut = useMutation({
    mutationFn:({tripId,loadId})=>api.delete(`/dispatch/trips/${tripId}/loads/${loadId}`),
    onSuccess:()=>{toast.success('Load removed');qc.invalidateQueries(['dispatch-board']);setActiveLeg(null);},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });

  const ctxItems = [
    {label:'Edit Trip', icon:Edit, action:()=>onEdit(trip)},
    {label:'Add Load', icon:Plus, action:()=>onAddLoad(trip)},
    {label:'Reorder Stops', icon:ArrowRight, action:()=>onReorder(trip)},
    {divider:true},
    {label:'Send Notification', icon:Bell, action:()=>onNotify(trip)},
    {label:'Print Trip Sheet', icon:Printer, action:()=>onPrint(trip)},
    {divider:true},
    {label:'Mark Completed', icon:CheckCircle, action:()=>onComplete(trip)},
    {divider:true},
    {label:'Cancel Trip', icon:XCircle, danger:true, action:()=>onCancel(trip)},
  ];

  const LSC={pending:'#9CA3AF',arrived:'#0063A3',completed:'#059669',skipped:'#D97706'};
  const LSL={pending:'Pending',arrived:'Arrived',completed:'Done',skipped:'Skipped'};

  return (
    <div style={{border:`1px solid ${statusBorder}`,borderRadius:8,background:'#fff',
      boxShadow:'0 1px 3px rgba(0,0,0,0.07)',marginBottom:8,overflow:'hidden'}}>

      {/* ── Trip Header ── */}
      <div style={{background:statusBg,borderBottom:`1px solid ${statusBorder}`,
        padding:'0',display:'flex',alignItems:'stretch'}}>

        {/* Color accent bar */}
        <div style={{width:4,background:statusColor,flexShrink:0,borderRadius:'0 0 0 0'}}/>

        {/* Main header content */}
        <div style={{flex:1,padding:'9px 12px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',minWidth:0}}
          onClick={()=>setExpanded(p=>!p)}>
          <div style={{color:'#9CA3AF',flexShrink:0}}>
            {expanded?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
          </div>

          {/* Trip # */}
          <div style={{fontFamily:'monospace',fontWeight:700,fontSize:13,color:'#003865',whiteSpace:'nowrap'}}>{trip.trip_number}</div>

          {/* Type badge */}
          <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,background:'#E5E7EB',color:'#374151',whiteSpace:'nowrap'}}>{trip.trip_type}</span>

          {/* Status badge */}
          <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:10,background:statusColor,color:'#fff',whiteSpace:'nowrap',textTransform:'uppercase'}}>
            {trip.status?.replace(/_/g,' ')}
          </span>

          {/* Driver + Truck */}
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#374151',minWidth:0,overflow:'hidden'}}>
            <User size={11} style={{color:'#9CA3AF',flexShrink:0}}/>
            <span style={{fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {trip.driver_name||<span style={{color:'#DC2626'}}>No driver</span>}
            </span>
            {trip.truck_unit&&(
              <span style={{color:'#9CA3AF',fontSize:10,display:'flex',alignItems:'center',gap:2,flexShrink:0}}>
                <Truck size={9}/>{trip.truck_unit}
              </span>
            )}
          </div>

          {/* Route */}
          {visibleLegs.length>0&&(
            <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#6B7280',whiteSpace:'nowrap',flexShrink:0}}>
              <MapPin size={10} style={{color:'#9CA3AF'}}/>
              {firstCity||'—'}
              <ArrowRight size={10} style={{color:'#D1D5DB'}}/>
              {lastCity||'—'}
            </div>
          )}

          {/* Date */}
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,color:'#6B7280',whiteSpace:'nowrap',flexShrink:0}}>
            <Calendar size={10} style={{color:'#9CA3AF'}}/>
            {fmt(trip.planned_date)}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{display:'flex',alignItems:'stretch',borderLeft:`1px solid ${statusBorder}`,flexShrink:0}}>
          {/* Stops progress */}
          <div style={{padding:'9px 12px',borderRight:`1px solid ${statusBorder}`,display:'flex',flexDirection:'column',justifyContent:'center',minWidth:80,alignItems:'center'}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',color:'#9CA3AF',letterSpacing:'0.05em',marginBottom:3}}>Stops</div>
            <div style={{fontSize:13,fontWeight:700,color:done===visibleLegs.length&&visibleLegs.length>0?'#059669':'#374151'}}>{done}/{visibleLegs.length}</div>
            <div style={{width:56,height:3,background:'#E5E7EB',borderRadius:2,marginTop:3}}>
              <div style={{width:`${progress}%`,height:'100%',background:done===visibleLegs.length&&visibleLegs.length>0?'#059669':'#0063A3',borderRadius:2,transition:'width 0.3s'}}/>
            </div>
          </div>

          {/* Revenue */}
          <div style={{padding:'9px 14px',borderRight:`1px solid ${statusBorder}`,display:'flex',flexDirection:'column',justifyContent:'center',minWidth:90,alignItems:'center'}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',color:'#9CA3AF',letterSpacing:'0.05em',marginBottom:3}}>Revenue</div>
            <div style={{fontSize:13,fontWeight:700,color:'#059669'}}>{fmtCurrency(totalRev)}</div>
          </div>

          {/* Pieces / Weight */}
          {(totalPcs>0||totalWgt>0)&&(
            <div style={{padding:'9px 12px',borderRight:`1px solid ${statusBorder}`,display:'flex',flexDirection:'column',justifyContent:'center',minWidth:80,alignItems:'center'}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',color:'#9CA3AF',letterSpacing:'0.05em',marginBottom:3}}>Pcs / Wgt</div>
              <div style={{fontSize:11,fontWeight:600,color:'#374151'}}>{totalPcs||'—'} / {totalWgt?parseFloat(totalWgt).toLocaleString():'—'}</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{display:'flex',alignItems:'center',gap:4,padding:'0 10px',borderLeft:`1px solid ${statusBorder}`,flexShrink:0}}>
          <button onClick={e=>{e.stopPropagation();onNotify(trip);}} title="Notify Driver"
            style={{padding:'4px 8px',border:'1px solid #BFDBFE',background:'#EFF6FF',color:'#0063A3',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',gap:3}}>
            <Bell size={10}/> Notify
          </button>
          <button onClick={e=>{e.stopPropagation();onPrint(trip);}} title="Print Trip Sheet"
            style={{padding:'4px 8px',border:'1px solid #D1D5DB',background:'#F9FAFB',color:'#374151',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',gap:3}}>
            <Printer size={10}/> Print
          </button>
          {trip.status!=='completed'&&(
            <button onClick={e=>{e.stopPropagation();onComplete(trip);}} title="Mark Completed"
              style={{padding:'4px 8px',border:'1px solid #A7F3D0',background:'#ECFDF5',color:'#059669',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',gap:3}}>
              <CheckCircle size={10}/> Done
            </button>
          )}
          <button onClick={e=>{e.stopPropagation();openMenu(e,ctxItems);}} title="More actions"
            style={{padding:'4px 6px',border:'1px solid #E5E7EB',background:'#fff',color:'#9CA3AF',borderRadius:4,cursor:'pointer'}}>
            <MoreVertical size={13}/>
          </button>
        </div>
      </div>

      {/* ── Expanded Content ── */}
      {expanded&&(
        <div>
          {/* Stops header with Activity Log button */}
          <div style={{display:'flex',alignItems:'center',background:'#F8FAFC',borderBottom:'1px solid #E5E7EB',padding:'4px 12px'}}>
            <span style={{fontSize:11,fontWeight:700,color:'#374151'}}>Stops {visibleLegs.length>0&&<span style={{background:'#E5E7EB',borderRadius:8,padding:'0 5px',fontSize:10,marginLeft:4}}>{visibleLegs.length}</span>}</span>
            <button onClick={e=>{e.stopPropagation();setActivityPopup(true);}}
              style={{marginLeft:'auto',padding:'4px 12px',border:'1px solid #D1D5DB',background:'#fff',color:'#374151',
                borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
              📋 Activity Log
            </button>
          </div>
          {(<>
          {!visibleLegs.length?(
            <div style={{padding:'12px 20px',fontSize:12,color:'#9CA3AF',fontStyle:'italic',display:'flex',alignItems:'center',gap:8}}>
              <Package size={14} style={{opacity:0.4}}/> No loads assigned — right-click or use "+" to add
              <button onClick={()=>onAddLoad(trip)} style={{marginLeft:'auto',padding:'4px 12px',border:'1px solid #0063A3',background:'#EFF6FF',color:'#0063A3',borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                <Plus size={11}/> Add Load
              </button>
            </div>
          ):(
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {['#','Type','Load #','Customer','Stop Location','Date','Time','Pcs','Weight','Revenue','Status',''].map(h=>(
                    <th key={h} style={{...TH,background:'#F1F5F9',color:'#475569',fontSize:9,padding:'5px 8px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {legs.filter(leg=>!(leg.stop_type==='drop_warehouse' && leg.status==='completed')).map(leg=>{
                  const key=`${trip.id}-${leg.load_id}`;
                  const isAct=activeLeg===key;
                  const isDone=leg.status==='completed';
                  const isSkip=leg.status==='skipped';
                  const loc=leg.stop_type==='pickup'||leg.stop_type==='pickup_warehouse'
                    ?`${leg.origin_city||''}, ${leg.origin_state||''}`
                    :leg.stop_type==='drop_warehouse'?`${WH.city}, ${WH.state}`
                    :`${leg.dest_city||''}, ${leg.dest_state||''}`;
                  return (
                    <React.Fragment key={leg.id||leg.load_id}>
                      <tr onClick={()=>setActiveLeg(p=>p===key?null:key)}
                        onContextMenu={e=>{e.preventDefault();e.stopPropagation();openMenu(e,[
                          {label:'View load details',icon:Eye,action:()=>{window.location.href='/loads';}},
                          {divider:true},
                          {label:'Remove from trip',icon:XCircle,danger:true,action:()=>{if(window.confirm(`Remove ${leg.load_number}?`))removeMut.mutate({tripId:trip.id,loadId:leg.load_id});}},
                        ]);}}
                        style={{cursor:'pointer',
                          background:isAct?'#EFF6FF':isDone?'#F0FDF4':isSkip?'#FFFBEB':'#fff',
                          borderLeft:isDone?'3px solid #059669':isAct?'3px solid #3B82F6':'3px solid transparent'}}
                        onMouseEnter={e=>{if(!isAct&&!isDone)e.currentTarget.style.background='#F8FAFC';}}
                        onMouseLeave={e=>{e.currentTarget.style.background=isAct?'#EFF6FF':isDone?'#F0FDF4':isSkip?'#FFFBEB':'#fff';}}>
                        <td style={{...TD,textAlign:'center',width:28,color:'#9CA3AF',fontWeight:700}}>{leg.stop_order}</td>
                        <td style={{...TD,width:78}}>
                          <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,
                            background:(LC[leg.stop_type]||'#888')+'18',color:LC[leg.stop_type]||'#888',whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'0.04em'}}>
                            {LL[leg.stop_type]||leg.stop_type}
                          </span>
                        </td>
                        <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865',width:82}}>{leg.load_number}</td>
                        <td style={{...TD,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',color:'#374151',fontWeight:500}}>{leg.customer_name}</td>
                        <td style={{...TD,color:'#6B7280'}}>
                          {leg.stop_type==='drop_warehouse'&&<span style={{fontSize:10,marginRight:3}}>🏭</span>}{loc}
                        </td>
                        <td style={{...TD,width:62,color:'#6B7280'}}>{fmt(leg.planned_date)}</td>
                        <td style={{...TD,width:52,color:'#6B7280'}}>{leg.planned_time?.slice(0,5)||'—'}</td>
                        <td style={{...TD,width:44,color:'#6B7280',textAlign:'right'}}>{leg.pieces||'—'}</td>
                        <td style={{...TD,width:80,color:'#6B7280',textAlign:'right'}}>{leg.weight?parseFloat(leg.weight).toLocaleString()+' lb':'—'}</td>
                        <td style={{...TD,width:80,color:'#059669',fontWeight:600,textAlign:'right'}}>{fmtCurrency(leg.total_revenue)}</td>
                        <td style={{...TD,width:90}}>
                          <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,
                            background:isDone?'#ECFDF5':leg.status==='arrived'?'#EFF6FF':isSkip?'#FFFBEB':'#F3F4F6',
                            color:isDone?'#059669':leg.status==='arrived'?'#0063A3':isSkip?'#D97706':'#9CA3AF'}}>
                            {(LSL[leg.status]||leg.status||'Pending').toUpperCase()}
                          </span>
                        </td>
                        <td style={{...TD,width:30,textAlign:'center'}}>
                          {isDone?<CheckCircle size={13} style={{color:'#059669'}}/>
                            :<ChevronDown size={12} style={{color:isAct?'#3B82F6':'#D1D5DB',transform:isAct?'rotate(0)':'rotate(-90deg)',transition:'transform 0.2s'}}/>}
                        </td>
                      </tr>
                      {isAct&&(
                        <tr style={{borderBottom:'2px solid #3B82F6'}}>
                          <td colSpan={12} style={{padding:0}}>
                            <LegActionPanel leg={leg} tripId={trip.id}
                              onClose={()=>setActiveLeg(null)}
                              onRemove={()=>{if(window.confirm(`Remove ${leg.load_number}?`))removeMut.mutate({tripId:trip.id,loadId:leg.load_id});}}/>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              {/* Totals row */}
              {visibleLegs.length>1&&(
                <tfoot>
                  <tr style={{background:'#F8FAFC',borderTop:'2px solid #E5E7EB'}}>
                    <td colSpan={7} style={{...TD,fontWeight:700,color:'#374151',textAlign:'right',fontSize:10,textTransform:'uppercase',letterSpacing:'0.04em'}}>Totals</td>
                    <td style={{...TD,fontWeight:700,color:'#374151',textAlign:'right'}}>{totalPcs||'—'}</td>
                    <td style={{...TD,fontWeight:700,color:'#374151',textAlign:'right'}}>{totalWgt?parseFloat(totalWgt).toLocaleString()+' lb':'—'}</td>
                    <td style={{...TD,fontWeight:700,color:'#059669',textAlign:'right',fontSize:12}}>{fmtCurrency(totalRev)}</td>
                    <td colSpan={2} style={TD}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
          {/* Add load bar */}
          <div onClick={()=>onAddLoad(trip)}
            style={{padding:'5px 16px',fontSize:11,color:'#0063A3',cursor:'pointer',display:'flex',alignItems:'center',gap:4,
              borderTop:'1px solid #F1F5F9',background:'#FAFCFF'}}
            onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'}
            onMouseLeave={e=>e.currentTarget.style.background='#FAFCFF'}>
            <Plus size={11}/> Add load to this trip
          </div>
          </>)}

          {/* Activity tab */}
          {activityPopup && <ActivityLogPopup trip={trip} onClose={()=>setActivityPopup(false)}/>}
        </div>
      )}
      <ContextMenu {...menu} onClose={closeMenu}/>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const [from,setFrom]=useState('');
  const [to,setTo]=useState('');
  const [search,setSearch]=useState('');
  const [showAll,setShowAll]=useState(false);
  const [expanded,setExpanded]=useState({});
  const [page,setPage]=useState(1);

  const {data,isLoading}=useQuery({
    queryKey:['dispatch-history',from,to,search,showAll,page],
    queryFn:()=>api.get('/dispatch/history',{params:{from,to,search,status:showAll?'all':'completed',page,limit:50}}).then(r=>r.data),
  });

  const trips=data?.data||[];
  const paging=data?.pagination;
  const toggleExp=id=>setExpanded(p=>({...p,[id]:!p[id]}));

  return (
    <div style={{padding:'12px 0'}}>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <label style={{fontSize:12,fontWeight:600,color:'#374151'}}>From</label>
          <input type="date" className="form-input" style={{width:140}} value={from} onChange={e=>setFrom(e.target.value)}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <label style={{fontSize:12,fontWeight:600,color:'#374151'}}>To</label>
          <input type="date" className="form-input" style={{width:140}} value={to} onChange={e=>setTo(e.target.value)}/>
        </div>
        <div style={{position:'relative',flex:1,maxWidth:280}}>
          <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF'}}/>
          <input className="form-input" style={{paddingLeft:28}} placeholder="Search trip #, driver…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:5,fontSize:12,cursor:'pointer',color:'#374151'}}>
          <input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Include Cancelled
        </label>
        <button className="btn btn-secondary btn-sm" onClick={()=>{setFrom('');setTo('');setSearch('');}}>Clear</button>
      </div>
      {isLoading?<Spinner/>:!trips.length?(
        <div style={{textAlign:'center',padding:'50px 24px',color:'#9CA3AF'}}>
          <History size={36} style={{marginBottom:10,opacity:0.25}}/><br/>No trip history found
        </div>
      ):(
        <div style={{border:'1px solid #E5E7EB',borderRadius:8,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['','Trip #','Type','Status','Driver','Truck','Date','Stops','Pcs','Weight','Revenue'].map(h=>(
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {trips.map(trip=>{
                const legs=trip.legs||[];
                const totalRev=legs.reduce((s,l)=>s+(parseFloat(l.total_revenue)||0),0);
                const totalPcs=legs.reduce((s,l)=>s+(parseInt(l.pieces)||0),0);
                const totalWgt=legs.reduce((s,l)=>s+(parseFloat(l.weight)||0),0);
                const isExp=expanded[trip.id];
                return (
                  <React.Fragment key={trip.id}>
                    <tr onClick={()=>toggleExp(trip.id)} style={{cursor:'pointer',background:isExp?'#EFF6FF':'#fff'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                      onMouseLeave={e=>e.currentTarget.style.background=isExp?'#EFF6FF':'#fff'}>
                      <td style={{...TD,width:26,textAlign:'center',color:'#9CA3AF'}}>{isExp?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</td>
                      <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>{trip.trip_number}</td>
                      <td style={{...TD,color:'#6B7280'}}>{trip.trip_type}</td>
                      <td style={TD}><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10,background:TB[trip.status],color:TS[trip.status]}}>{trip.status?.toUpperCase()}</span></td>
                      <td style={{...TD,fontWeight:600}}>{trip.driver_name||'—'}</td>
                      <td style={{...TD,color:'#6B7280'}}>{trip.truck_unit||'—'}</td>
                      <td style={{...TD,color:'#6B7280'}}>{fmt(trip.planned_date||trip.created_at)}</td>
                      <td style={{...TD,textAlign:'center'}}>{legs.length}</td>
                      <td style={{...TD,textAlign:'right'}}>{totalPcs||'—'}</td>
                      <td style={{...TD,textAlign:'right'}}>{totalWgt?parseFloat(totalWgt).toLocaleString()+' lb':'—'}</td>
                      <td style={{...TD,textAlign:'right',fontWeight:700,color:'#059669'}}>{fmtCurrency(totalRev)}</td>
                    </tr>
                    {isExp&&legs.map((leg,i)=>(
                      <tr key={leg.id||i} style={{background:'#FAFCFF',borderLeft:'3px solid #3B82F6'}}>
                        <td style={TD}></td>
                        <td style={{...TD,fontFamily:'monospace',fontSize:11,color:'#0063A3'}}>{leg.load_number}</td>
                        <td style={TD}><span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,background:(LC[leg.stop_type]||'#888')+'18',color:LC[leg.stop_type]||'#888',textTransform:'uppercase'}}>{LL[leg.stop_type]}</span></td>
                        <td style={{...TD,fontSize:10,color:leg.status==='completed'?'#059669':'#9CA3AF',fontWeight:600}}>{leg.status}</td>
                        <td colSpan={2} style={{...TD,fontSize:11,color:'#374151'}}>{leg.customer_name}</td>
                        <td style={{...TD,fontSize:11,color:'#6B7280'}}>{fmt(leg.planned_date)}</td>
                        <td style={TD}></td>
                        <td style={{...TD,fontSize:11,textAlign:'right'}}>{leg.pieces||''}</td>
                        <td style={{...TD,fontSize:11,textAlign:'right'}}>{leg.weight?parseFloat(leg.weight).toLocaleString()+' lb':''}</td>
                        <td style={{...TD,fontSize:11,textAlign:'right',color:'#059669'}}>{fmtCurrency(leg.total_revenue)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {paging&&<Pagination pagination={paging} onPage={setPage}/>}
    </div>
  );
}

// ─── Board Tab ────────────────────────────────────────────────────────────────
function BoardTab({ data, isLoading, drivers, carriers, trucks, trailers }) {
  const qc = useQueryClient();
  const [tripModal,setTripModal]       = useState(false);
  const [editTrip,setEditTrip]         = useState(null);
  const [addLoadTrip,setAddLoadTrip]   = useState(null);
  const [reorderTrip,setReorderTrip]   = useState(null);
  const [filterStatus,setFilterStatus] = useState('');
  const [confirmCancel,setConfirmCancel] = useState(null);
  const [notifyTrip,setNotifyTrip]     = useState(null);
  const [printTrip,setPrintTrip]       = useState(null);
  const [dropTarget,setDropTarget]     = useState(null);
  const {menu:aMenu,openMenu:openAMenu,closeMenu:closeAMenu} = useContextMenu();
  const {menu:dMenu,openMenu:openDMenu,closeMenu:closeDMenu} = useContextMenu();

  const availLoads = data?.available_loads||[];
  const dockLoads  = data?.on_dock_loads||[];
  const allDrivers = data?.drivers||[];
  const trips      = (data?.trips||[]).filter(t=>!filterStatus||t.status===filterStatus);

  const totalRevToday = trips.reduce((s,t)=>{
    const legs=t.legs||[];
    return s+legs.reduce((ss,l)=>ss+(parseFloat(l.total_revenue)||0),0);
  },0);

  const statusMut = useMutation({
    mutationFn:({id,status})=>api.put(`/dispatch/trips/${id}/status`,{status}),
    onSuccess:(_,{status})=>{toast.success(`Trip ${status}`);qc.invalidateQueries(['dispatch-board']);},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });
  const cancelMut = useMutation({
    mutationFn:id=>api.delete(`/dispatch/trips/${id}`),
    onSuccess:()=>{toast.success('Trip cancelled');qc.invalidateQueries(['dispatch-board']);setConfirmCancel(null);},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });
  const addToTripMut = useMutation({
    mutationFn:({tripId,loadId,stopType='pickup'})=>api.post(`/dispatch/trips/${tripId}/loads`,{load_id:loadId,stop_type:stopType}),
    onSuccess:()=>{toast.success('Load added');qc.invalidateQueries(['dispatch-board']);setDropTarget(null);},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });
  const drvMut = useMutation({
    mutationFn:({id,status})=>api.put(`/drivers/${id}`,{status}),
    onSuccess:()=>{toast.success('Driver updated');qc.invalidateQueries(['dispatch-board','drivers-all']);},
    onError:()=>toast.error('Failed'),
  });

  const openCreate=()=>{setEditTrip(null);setTripModal(true);};

  const availCtx=useCallback((e,load)=>{
    e.preventDefault();
    openAMenu(e,[
      {label:'Create new trip',icon:Plus,action:()=>openCreate()},
      {label:'Add to existing trip',icon:Truck,action:()=>{const t=trips[0];if(t)setAddLoadTrip(t);else toast('No active trips');}},
      {divider:true},
      {label:'Copy load #',icon:Package,action:()=>{navigator.clipboard.writeText(load.load_number);toast.success('Copied!');}},
    ]);
  },[openAMenu,trips]);

  const drvCtx=useCallback((e,drv)=>{
    e.preventDefault();
    openDMenu(e,[
      {label:'Assign to trip',icon:Truck,action:()=>openCreate()},
      {divider:true},
      {label:'Call driver',icon:Phone,action:()=>drv.phone&&window.open(`tel:${drv.phone}`)},
      {divider:true},
      {label:'Set Available',icon:CheckCircle,action:()=>drvMut.mutate({id:drv.id,status:'available'})},
      {label:'Set Off Duty',icon:XCircle,action:()=>drvMut.mutate({id:drv.id,status:'off_duty'})},
    ]);
  },[openDMenu]);

  const onDrop=(e,tripId)=>{
    e.preventDefault();
    const lid=e.dataTransfer.getData('load_id');
    const isDock=e.dataTransfer.getData('is_dock')==='true';
    if(lid&&tripId)addToTripMut.mutate({tripId,loadId:lid,stopType:isDock?'pickup_warehouse':'pickup'});
    setDropTarget(null);
  };

  const STATUS_FILTERS=[
    {val:'',label:'All Trips'},
    {val:'planned',label:'Planned'},
    {val:'active',label:'Active'},
    {val:'in_progress',label:'In Progress'},
    {val:'completed',label:'Completed'},
  ];

  if(isLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}><Spinner/></div>;

  return (
    <div style={{display:'flex',gap:12,flex:1,overflow:'hidden',minHeight:0}}>

      {/* ── Main Board (left) ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

        {/* Summary stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:10,flexShrink:0}}>
          {[
            {icon:Truck,label:'Active Trips',val:trips.filter(t=>t.status==='active'||t.status==='in_progress').length,color:'#0063A3',bg:'#EFF6FF'},
            {icon:Package,label:'Available Loads',val:availLoads.length,color:'#059669',bg:'#ECFDF5'},
            {icon:User,label:'Free Drivers',val:allDrivers.filter(d=>d.status==='available').length,color:'#7C3AED',bg:'#F5F3FF'},
            {icon:DollarSign,label:'Active Revenue',val:fmtCurrency(totalRevToday),color:'#059669',bg:'#ECFDF5',wide:true},
          ].map(({icon:Icon,label,val,color,bg,wide})=>(
            <div key={label} style={{background:bg,border:`1px solid ${color}22`,borderRadius:6,padding:'8px 12px',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:6,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon size={16} style={{color}}/>
              </div>
              <div>
                <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:color+'cc'}}>{label}</div>
                <div style={{fontSize:wide?13:18,fontWeight:700,color,lineHeight:1.2}}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{display:'flex',gap:8,marginBottom:10,flexShrink:0,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={openCreate}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'#003865',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            <Plus size={14}/> New Trip
          </button>
          <div style={{display:'flex',background:'#F1F5F9',borderRadius:6,padding:2,gap:1}}>
            {STATUS_FILTERS.map(f=>(
              <button key={f.val} onClick={()=>setFilterStatus(f.val)}
                style={{padding:'4px 10px',border:'none',borderRadius:4,fontSize:11,fontWeight:filterStatus===f.val?700:400,
                  background:filterStatus===f.val?'#fff':'transparent',
                  color:filterStatus===f.val?'#003865':'#6B7280',
                  boxShadow:filterStatus===f.val?'0 1px 3px rgba(0,0,0,0.1)':'none',cursor:'pointer'}}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{marginLeft:'auto',fontSize:11,color:'#9CA3AF'}}>{trips.length} trip{trips.length!==1?'s':''}</div>
          <button onClick={()=>qc.invalidateQueries(['dispatch-board'])}
            style={{padding:'6px 8px',border:'1px solid #E5E7EB',background:'#fff',color:'#6B7280',borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11}}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>

        {/* Trip Cards */}
        <div style={{flex:1,overflowY:'auto',paddingRight:4}}>
          {!trips.length?(
            <div style={{textAlign:'center',padding:'60px 24px',color:'#9CA3AF'}}>
              <Truck size={40} style={{marginBottom:12,opacity:0.2}}/>
              <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No active trips</div>
              <div style={{fontSize:12,marginBottom:16}}>Create a trip and assign loads to get started</div>
              <button onClick={openCreate}
                style={{padding:'8px 20px',background:'#003865',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                <Plus size={14}/> Create First Trip
              </button>
            </div>
          ):(
            trips.map(trip=>(
              <div key={trip.id}
                onDragOver={e=>{e.preventDefault();setDropTarget(trip.id);}}
                onDragLeave={()=>setDropTarget(null)}
                onDrop={e=>onDrop(e,trip.id)}
                style={{outline:dropTarget===trip.id?'2px dashed #0063A3':'none',borderRadius:8,outlineOffset:2}}>
                <TripCard
                  trip={trip}
                  onEdit={t=>{setEditTrip(t);setTripModal(true);}}
                  onAddLoad={t=>setAddLoadTrip(t)}
                  onReorder={t=>setReorderTrip(t)}
                  onNotify={t=>setNotifyTrip(t)}
                  onComplete={t=>{if(window.confirm('Mark trip completed?'))statusMut.mutate({id:t.id,status:'completed'});}}
                  onCancel={t=>setConfirmCancel(t)}
                  onPrint={t=>setPrintTrip(t)}
                />
              </div>
            ))
          )}

          {/* ── Available Loads (ready to dispatch) ── */}
          {availLoads.length>0&&(
            <div style={{marginTop:16,border:'1px solid #A7F3D0',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'#ECFDF5',padding:'8px 14px',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid #A7F3D0'}}>
                <Package size={13} style={{color:'#059669'}}/>
                <span style={{fontSize:12,fontWeight:700,color:'#065F46',textTransform:'uppercase',letterSpacing:'0.05em'}}>Available Loads</span>
                <span style={{fontSize:11,color:'#6B7280',marginLeft:2}}>({availLoads.length}) — drag onto a trip to assign</span>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Load #','Customer','Origin','Destination','Date','Equip','Pcs','Weight','Revenue'].map(h=>(
                  <th key={h} style={{...TH,background:'#F0FDF4',color:'#374151',fontSize:9}}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {availLoads.map(load=>(
                    <tr key={load.id} draggable
                      onDragStart={e=>{e.dataTransfer.setData('load_id',load.id);e.dataTransfer.setData('is_dock','false');}}
                      onContextMenu={e=>availCtx(e,load)}
                      style={{cursor:'grab',background:'#F0FDF4',borderLeft:'3px solid #059669'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#DCFCE7'}
                      onMouseLeave={e=>e.currentTarget.style.background='#F0FDF4'}>
                      <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>{load.load_number}</td>
                      <td style={{...TD,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',fontWeight:500}}>{load.customer_name}</td>
                      <td style={{...TD,color:'#6B7280'}}>{load.origin_city}, {load.origin_state}</td>
                      <td style={{...TD,color:'#6B7280'}}>{load.dest_city}, {load.dest_state}</td>
                      <td style={{...TD,color:'#6B7280',whiteSpace:'nowrap'}}>{fmt(load.pickup_date)}</td>
                      <td style={TD}><span style={{fontSize:9,padding:'1px 5px',background:'#E5E7EB',borderRadius:3,color:'#374151'}}>{load.equipment_type||'—'}</span></td>
                      <td style={{...TD,textAlign:'right',color:'#6B7280'}}>{load.pieces||'—'}</td>
                      <td style={{...TD,textAlign:'right',color:'#6B7280'}}>{load.weight?parseFloat(load.weight).toLocaleString()+' lb':'—'}</td>
                      <td style={{...TD,textAlign:'right',fontWeight:600,color:'#059669'}}>{fmtCurrency(load.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── On Dock at Warehouse ── */}
          {dockLoads.length>0&&(
            <div style={{marginTop:10,border:'1px solid #FDE68A',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'#FFFBEB',padding:'8px 14px',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid #FDE68A'}}>
                <span style={{fontSize:14}}>🏭</span>
                <span style={{fontSize:12,fontWeight:700,color:'#92400E',textTransform:'uppercase',letterSpacing:'0.05em'}}>On Dock at Warehouse</span>
                <span style={{fontSize:11,color:'#B45309',marginLeft:2}}>({dockLoads.length}) — dropped, waiting for pickup trip</span>
                <span style={{marginLeft:'auto',fontSize:10,padding:'2px 8px',background:'#FEF3C7',border:'1px solid #FDE68A',borderRadius:10,color:'#92400E',fontWeight:700}}>AWAITING PICKUP</span>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Load #','Customer','Origin','Destination','Dropped Date','Equip','Pcs','Weight','Revenue'].map(h=>(
                  <th key={h} style={{...TH,background:'#FFFBEB',color:'#92400E',fontSize:9}}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {dockLoads.map(load=>(
                    <tr key={load.id} draggable
                      onDragStart={e=>{e.dataTransfer.setData('load_id',load.id);e.dataTransfer.setData('is_dock','true');}}
                      onContextMenu={e=>availCtx(e,load)}
                      style={{cursor:'grab',background:'#FFFBEB',borderLeft:'3px solid #D97706'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#FEF3C7'}
                      onMouseLeave={e=>e.currentTarget.style.background='#FFFBEB'}>
                      <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#003865'}}>
                        <span style={{fontSize:10,marginRight:4}}>🏭</span>{load.load_number}
                      </td>
                      <td style={{...TD,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',fontWeight:500}}>{load.customer_name}</td>
                      <td style={{...TD,color:'#6B7280'}}>{load.origin_city}, {load.origin_state}</td>
                      <td style={{...TD,color:'#6B7280'}}>{load.dest_city}, {load.dest_state}</td>
                      <td style={{...TD,color:'#6B7280',whiteSpace:'nowrap'}}>{fmt(load.pickup_date||load.updated_at)}</td>
                      <td style={TD}><span style={{fontSize:9,padding:'1px 5px',background:'#FEF3C7',borderRadius:3,color:'#92400E',fontWeight:600}}>{load.equipment_type||'—'}</span></td>
                      <td style={{...TD,textAlign:'right',color:'#6B7280'}}>{load.pieces||'—'}</td>
                      <td style={{...TD,textAlign:'right',color:'#6B7280'}}>{load.weight?parseFloat(load.weight).toLocaleString()+' lb':'—'}</td>
                      <td style={{...TD,textAlign:'right',fontWeight:600,color:'#059669'}}>{fmtCurrency(load.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{width:200,display:'flex',flexDirection:'column',gap:8,overflow:'hidden',flexShrink:0}}>

        {/* Drivers */}
        <div style={{border:'1px solid #E5E7EB',borderRadius:8,overflow:'hidden',flex:1,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'8px 12px',background:'#1E3A5F',color:'#fff',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
            <User size={12}/>
            <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Drivers ({allDrivers.length})</span>
          </div>
          <div style={{overflowY:'auto',flex:1}}>
            {allDrivers.map(d=>{
              const isAvail=d.status==='available';
              const isOn=d.status==='on_load'||d.status==='on_trip';
              return (
                <div key={d.id} onContextMenu={e=>drvCtx(e,d)}
                  style={{padding:'7px 10px',borderBottom:'1px solid #F1F5F9',cursor:'context-menu',
                    background:isAvail?'#F0FDF4':'#fff'}}
                  onMouseEnter={e=>e.currentTarget.style.background=isAvail?'#DCFCE7':'#F8FAFC'}
                  onMouseLeave={e=>e.currentTarget.style.background=isAvail?'#F0FDF4':'#fff'}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,fontWeight:700,
                      background:isAvail?'#DCFCE7':isOn?'#DBEAFE':'#F3F4F6',
                      color:isAvail?'#15803D':isOn?'#0063A3':'#9CA3AF'}}>
                      {(d.first_name?.[0]||'')+(d.last_name?.[0]||'')}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {d.first_name} {d.last_name}
                      </div>
                      <div style={{fontSize:9,fontWeight:600,color:isAvail?'#15803D':isOn?'#0063A3':'#9CA3AF',display:'flex',alignItems:'center',gap:3}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:isAvail?'#22C55E':isOn?'#0063A3':'#D1D5DB',display:'inline-block'}}/>
                        {isAvail?'Available':isOn?'On Trip':d.status?.replace(/_/g,' ')||'—'}
                      </div>
                      {d.phone&&<div style={{fontSize:9,color:'#9CA3AF'}}>{d.phone}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse */}
        <div style={{border:'1px solid #BFDBFE',borderRadius:8,padding:'10px 12px',background:'#EFF6FF',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
            <Home size={12} style={{color:'#0063A3'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#0063A3'}}>Signal Warehouse</span>
          </div>
          <div style={{fontSize:10,color:'#374151',lineHeight:1.6}}>
            {WH.address}<br/>{WH.city}, {WH.state} {WH.zip}
          </div>
          {dockLoads.length>0&&(
            <div style={{marginTop:6,padding:'4px 8px',background:'#FEF3C7',border:'1px solid #FDE68A',borderRadius:4,fontSize:10,fontWeight:700,color:'#92400E'}}>
              🏭 {dockLoads.length} load{dockLoads.length!==1?'s':''} on dock
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TripModal open={tripModal} trip={editTrip} onClose={()=>{setTripModal(false);setEditTrip(null);}} drivers={drivers} carriers={carriers} trucks={trucks} trailers={trailers}/>
      {addLoadTrip&&<AddLoadModal open={!!addLoadTrip} tripId={addLoadTrip.id} tripNumber={addLoadTrip.trip_number} availLoads={availLoads} dockLoads={dockLoads} onClose={()=>setAddLoadTrip(null)}/>}
      {reorderTrip&&<ReorderModal open={!!reorderTrip} trip={reorderTrip} onClose={()=>setReorderTrip(null)}/>}
      <Confirm open={!!confirmCancel} onClose={()=>setConfirmCancel(null)} onConfirm={()=>cancelMut.mutate(confirmCancel?.id)} danger
        title="Cancel Trip" message={`Cancel ${confirmCancel?.trip_number}? All loads return to available.`}/>
      {notifyTrip&&<NotifyModal open={!!notifyTrip} trip={notifyTrip} drivers={allDrivers||[]} onClose={()=>setNotifyTrip(null)}/>}
      {printTrip&&<PrintOptionsModal trip={printTrip} onClose={()=>setPrintTrip(null)}/>}
      <ContextMenu {...aMenu} onClose={closeAMenu}/>
      <ContextMenu {...dMenu} onClose={closeDMenu}/>
    </div>
  );
}

// ─── Main Dispatch Page ───────────────────────────────────────────────────────
export default function Dispatch() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('board');

  const {data,isLoading}=useQuery({
    queryKey:['dispatch-board'],
    queryFn:()=>api.get('/dispatch/board').then(r=>r.data.data),
    refetchInterval:30000,
  });
  const {data:driversRaw}=useQuery({queryKey:['drivers-all'],queryFn:()=>api.get('/drivers',{params:{limit:200}}).then(r=>r.data.data)});
  const {data:carriers}  =useQuery({queryKey:['carriers-list'],queryFn:()=>api.get('/carriers',{params:{limit:200}}).then(r=>r.data.data)});
  const {data:trucks}    =useQuery({queryKey:['trucks-avail'],queryFn:()=>api.get('/fleet/available',{params:{type:'truck'}}).then(r=>r.data.data)});
  const {data:trailers}  =useQuery({queryKey:['trailers-avail'],queryFn:()=>api.get('/fleet/available',{params:{type:'trailer'}}).then(r=>r.data.data)});

  const drivers=driversRaw||[];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 90px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,paddingBottom:10,flexShrink:0}}>
        <h1 className="page-title" style={{margin:0}}>Dispatch Board</h1>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={()=>qc.invalidateQueries(['dispatch-board'])}
            style={{display:'flex',alignItems:'center',gap:4}}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid #E5E7EB',marginBottom:10,flexShrink:0}}>
        {[['board','🚛  Dispatch Board'],['history','📋  Trip History']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:'7px 18px',border:'none',background:'transparent',fontSize:13,fontWeight:tab===id?700:400,
              color:tab===id?'#003865':'#9CA3AF',
              borderBottom:tab===id?'2px solid #003865':'2px solid transparent',
              marginBottom:-2,cursor:'pointer'}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflow:'hidden',minHeight:0,display:'flex',flexDirection:'column'}}>
        {tab==='board'&&<BoardTab data={data} isLoading={isLoading} drivers={drivers} carriers={carriers} trucks={trucks} trailers={trailers}/>}
        {tab==='history'&&<div style={{flex:1,overflowY:'auto'}}><HistoryTab/></div>}
      </div>
    </div>
  );
}
