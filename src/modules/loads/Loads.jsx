import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Confirm, ContextMenu, useContextMenu, Pagination,
  StatusBadge, Spinner, EmptyState, Currency, DocUploadModal, DocList, LOAD_DOC_TYPES,
} from '../../components/common';
import { Plus, Search, Edit, X, RefreshCw, Copy, Upload, FileText, DollarSign, Mail, Truck, Trash2, Printer, ChevronDown, Send } from 'lucide-react';
import TenderModal from './components/TenderModal';
import DocsPopup, { LOAD_DOC_TYPES as LOAD_DOCS } from '../../shared/components/DocsPopup';
import CustomsPopup from '../customs/components/CustomsPopup';

// ─── Constants ────────────────────────────────────────────────────────────────
const CARRIER_NAME = 'Signal Transportation Ltd';
const STATUSES = ['available','on_dock','dispatched','en_route','en_route_pickup','at_pickup','in_transit','at_delivery','delivered','invoiced','cancelled'];
const STATUS_LABELS = { available:'Available', on_dock:'On Dock', dispatched:'Dispatched', en_route:'En Route', en_route_pickup:'En Route to Pickup', at_pickup:'At Pickup', in_transit:'In Transit', at_delivery:'At Delivery', delivered:'Delivered', invoiced:'Invoiced', cancelled:'Cancelled' };
const EQUIPMENT = ['Dry Van','Reefer','Flatbed','Step Deck','Lowboy','Tanker','Intermodal','LTL'];
// ACC_TYPES now loaded from Settings → Accessorials
const EMPTY_STOP = { stop_type:'shipper', company_name:'', address:'', city:'', state:'', zip:'', phone:'', contact:'', date_avail:'', date_thru:'', time_from:'08:00', time_to:'16:00', appt_required:false, appt_ref:'', liftgate_required:false, notify_required:false, job_site:false, limited_access:false, residential:false, inside_delivery:false, reference:'', notes:'', location_notes:'', directions:'', miles:'' };
const EMPTY_COMM = { commodity:'', reference:'', description:'', weight:'', pieces:'', spc:'0', notes:'' };
const EMPTY_ACC  = { charge_type:'', reference:'', rate:'', units:'1', amount:'', pay_driver:false, approved:false, notes:'' };
// Service flags on load
const EMPTY_FLAGS = { requires_liftgate:false, requires_appointment:false };
const EMPTY_LOAD = {
  customer_id:'', stops:[{...EMPTY_STOP,stop_type:'shipper'},{...EMPTY_STOP,stop_type:'consignee'}],
  commodities:[{...EMPTY_COMM}], accessorials:[],
  miles:'', equipment_type:'Dry Van', rate_type:'per_mile', base_rate:'', fuel_surcharge:'',
  po_number:'', bol_number:'', ref_number:'', ref1:'', special_instructions:'', notes:'',
  disp_pay:'', acc_pay:'', broadcast_notes:'', bill_miles:'', load_type:'', temperature:'',
  seal_number:'', pallets:'0', team_load:false, exchange_load:false, salesman:'',
  received_date: new Date().toISOString().slice(0,10), release_date:'',
};

// ─── Table cell styles ────────────────────────────────────────────────────────
const TH = { padding:'4px 6px', background:'#e8edf2', border:'1px solid #ccc', fontSize:11, fontWeight:700, color:'#444', whiteSpace:'nowrap' };
const TD = { padding:'1px', border:'1px solid #ddd', verticalAlign:'middle' };
const CI = { width:'100%', padding:'3px 5px', border:'none', fontSize:12, background:'transparent', outline:'none', fontFamily:'inherit' };

// ─── Helper: sum accessorials ─────────────────────────────────────────────────
const sumAcc = (accessorials) => {
  if (!accessorials) return 0;
  if (typeof accessorials === 'number') return accessorials;
  if (Array.isArray(accessorials)) return accessorials.reduce((s,a)=>s+(parseFloat(a.amt||a.amount||0)),0);
  return parseFloat(accessorials)||0;
};

// ─── Print helpers ────────────────────────────────────────────────────────────
const printHTML = (html, title) => {
  const w = window.open('', '_blank', 'width=960,height=750');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

const bolCSS = `
  @page { size: letter; margin: 0.45in; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 10.5px; color: #000;
         max-width: 720px; margin: 0 auto; padding: 10px; }
  h2 { text-align:center; font-size:12.5px; margin:0 0 5px; font-weight:bold; }
  .grid2 { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; }
  .grid3 { display:grid; grid-template-columns:2fr 1fr 1fr; }
  .cell { padding:3px 6px; border:1px solid #000; }
  .cell + .cell { border-left:none; }
  .lbl { font-size:8.5px; color:#333; text-transform:uppercase; display:block; }
  .val { font-weight:bold; font-size:11px; }
  .legal { font-size:7.5px; line-height:1.35; border:1px solid #000; padding:3px 6px; margin:3px 0; }
  .ft { display:grid; grid-template-columns:1fr 1fr; border:1px solid #000; margin-top:-1px; }
  .ft-cell { padding:5px 8px; }
  .ft-cell + .ft-cell { border-left:1px solid #000; }
  .red { color:#cc0000; font-weight:bold; font-size:9px; }
  .deliv { display:grid; grid-template-columns:2fr 1fr 1fr; border:1px solid #000; border-top:none; }
  .d-cell { padding:3px 6px; font-size:10px; }
  .d-cell + .d-cell { border-left:1px solid #000; }
  table { width:100%; border-collapse:collapse; }
  th,td { border:1px solid #000; padding:3px 5px; font-size:10px; }
  th { background:#f0f0f0; text-align:center; font-size:8.5px; }
  .bottom-section { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:5px; }
  .box { border:1px solid #000; padding:4px 6px; font-size:8.5px; }
  .box-title { font-weight:bold; font-size:9.5px; margin-bottom:2px; }
  .cod-row { display:grid; grid-template-columns:2fr 1fr 1fr; border:1px solid #000; margin-top:-1px; }
  .cod-cell { padding:3px 6px; font-size:9.5px; }
  .cod-cell + .cod-cell { border-left:1px solid #000; }
  html, body { height: 100%; margin:0; padding:0; }
  .page-wrap {
    min-height: calc(100vh - 20px);
    display: flex;
    flex-direction: column;
    max-width: 720px;
    margin: 0 auto;
    padding: 10px;
  }
  .top-section { flex-shrink: 0; }
  .mid-section { flex: 1 1 auto; display: flex; flex-direction: column; }
  .mid-section table { flex: 1; border-collapse: collapse; width: 100%; }
  .mid-section table tbody tr.spacer td { border-left:1px solid #000; border-right:1px solid #000; }
  .bot-section { flex-shrink: 0; margin-top: 0; }
  @media print {
    html, body { height: 100%; }
    body { padding:0; }
    .page-wrap { min-height: calc(100vh - 0.9in); padding:0; }
    @page { size: letter; margin: 0.45in; }
  }
`;

// ─── BOL Print ────────────────────────────────────────────────────────────────
function BOLPrint({ load, stops, commodities, onClose }) {
  const [showFreight, setShowFreight]       = useState(true);
  const [showBilling, setShowBilling]       = useState(true);
  const [showBothCarriers, setShowBothCarriers] = useState(true);
  const [hidePhones, setHidePhones]         = useState(false);

  const shipper   = stops.find(s=>s.stop_type==='shipper')   || stops[0] || {};
  const consignee = stops.find(s=>s.stop_type==='consignee') || stops[stops.length-1] || {};
  const today     = new Date().toLocaleDateString('en-US',{month:'numeric',day:'numeric',year:'numeric'});
  const accTotal  = sumAcc(commodities.__accTotal || load.__accTotal || load.accessorials_arr || 0);
  const fuelAmt   = parseFloat(load.fuel_surcharge)||0;
  const freightAmt= parseFloat(load.total_revenue)||0;

  const doPrint = () => {
    const html = buildBOLHTML({ load, stops, commodities, showFreight, showBilling, showBothCarriers, hidePhones, today, shipper, consignee, fuelAmt, freightAmt, accTotal });
    printHTML(html, `BOL ${load.load_number}`);
  };

  const opts = [
    { label:'Show Freight Charges', offLabel:'Hide Freight Charges', val:showFreight, set:setShowFreight },
    { label:'Show Billing Notice',  offLabel:'Hide Billing Notice',  val:showBilling, set:setShowBilling },
    { label:'Show Both Carrier Names', offLabel:'Show Primary Carrier Only', val:showBothCarriers, set:setShowBothCarriers },
    { label:'Hide Phone Numbers',   offLabel:'Show Phone Numbers',   val:hidePhones,  set:setHidePhones },
  ];

  return (
    <div style={{ position:'fixed',inset:0,zIndex:3000,display:'flex',background:'rgba(0,0,0,0.65)',alignItems:'flex-start',justifyContent:'center',paddingTop:20 }}>
      <div style={{ background:'#fff',borderRadius:6,boxShadow:'0 10px 50px rgba(0,0,0,0.4)',width:'95%',maxWidth:960,maxHeight:'95vh',display:'flex',flexDirection:'column' }}>
        {/* Title */}
        <div style={{ background:'#003865',color:'#fff',padding:'8px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderRadius:'6px 6px 0 0',flexShrink:0 }}>
          <span style={{ fontWeight:700,fontSize:14 }}>Bill of Lading — {load.load_number}</span>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={doPrint} style={{ background:'#00A3E0',border:'none',color:'#fff',padding:'4px 14px',borderRadius:4,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
              <Printer size={13}/> Print / Save PDF
            </button>
            <button onClick={onClose} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer' }}><X size={16}/></button>
          </div>
        </div>

        <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
          {/* Options */}
          <div style={{ width:195,borderRight:'1px solid #ddd',padding:12,background:'#f8f8f8',flexShrink:0,overflowY:'auto' }}>
            {opts.map((o,i)=>(
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:3 }}>Select</div>
                <select style={{ width:'100%',padding:'4px 6px',border:'1px solid #ccc',borderRadius:3,fontSize:12,background:o.val?'#003865':'#fff',color:o.val?'#fff':'#333' }}
                  value={o.val?'on':'off'} onChange={e=>o.set(e.target.value==='on')}>
                  <option value="on">{o.label}</option>
                  <option value="off">{o.offLabel}</option>
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div style={{ flex:1,overflowY:'auto',padding:16,background:'#d0d0d0' }}>
            <BOLPreview load={load} shipper={shipper} consignee={consignee} commodities={commodities}
              showFreight={showFreight} showBilling={showBilling} showBothCarriers={showBothCarriers}
              hidePhones={hidePhones} today={today} fuelAmt={fuelAmt} freightAmt={freightAmt} accTotal={accTotal} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BOLPreview({ load, shipper, consignee, commodities, showFreight, showBilling, showBothCarriers, hidePhones, today, fuelAmt, freightAmt, accTotal }) {
  const s = { background:'#fff',padding:20,maxWidth:720,margin:'0 auto',boxShadow:'0 2px 12px rgba(0,0,0,0.15)',fontFamily:'Arial,sans-serif',fontSize:11,minHeight:900,display:'flex',flexDirection:'column' };

  return (
    <div style={s}>
      <h2 style={{ textAlign:'center',fontSize:13,marginBottom:8,fontWeight:'bold' }}>STRAIGHT BILL OF LADING – SHORT FORM – ORIGINAL - NOT NEGOTIABLE</h2>

      {/* Header row */}
      <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',border:'1px solid #000',marginBottom:-1 }}>
        {[['NAME OF CARRIER',CARRIER_NAME],['CARRIER\'S NO.',load.load_number||'NEW'],['DATE',today],['SHIPPER\'S NO.',shipper.reference||'']].map(([l,v])=>(
          <div key={l} style={{ padding:'3px 7px',borderRight:'1px solid #999' }}>
            <span style={{ fontSize:9,color:'#555',display:'block' }}>{l}</span>
            <span style={{ fontWeight:'bold',fontSize:11 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Legal */}
      <div style={{ fontSize:'7.5px',lineHeight:1.35,border:'1px solid #000',padding:'3px 6px',marginBottom:4,color:'#333' }}>
        RECEIVED, subject to the classifications and lawfully filed tariffs in effect on the date of this Bill of Lading, the property described below in apparent good order, except as noted (contents and condition of contents of packages unknown), marked, consigned, and destined as indicated below which said carrier (the word carrier being understood throughout this contract as meaning any person or corporation in possession of the property under the contract) agrees to carry to its usual place of delivery at said destination, if on its route, otherwise to deliver to another carrier on the route to said destination. It is mutually agreed as to each carrier of all or any of said property over all or any portion of said route to destination, and as to each party at any time interested in all or any said property, that every service to be performed hereunder shall be subject to all the terms and conditions of the Uniform Domestic Straight Bill of Lading set forth (1) in Uniform Freight Classifications in effect on the date hereof, if this is a rail or a rail-water shipment, or (2) in the applicable motor carrier classification or tariff if this is a motor carrier shipment.
        <br/>Shipper hereby certifies that he is familiar with all the terms and conditions of the said bill of lading, set forth in the classification or tariff which governs the transportation of this shipment, and the said terms and conditions are hereby agreed to by the shipper and accepted for himself and his assigns.
      </div>

      {/* From / To */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',border:'1px solid #000',marginBottom:-1 }}>
        <div style={{ padding:'7px 10px',borderRight:'1px solid #000' }}>
          <div style={{ fontSize:9,fontWeight:'bold',color:'#cc0000',marginBottom:3 }}>FROM:</div>
          <div style={{ fontSize:9,fontWeight:'bold',color:'#555',marginBottom:2 }}>SHIPPER</div>
          <div style={{ fontWeight:'bold',fontSize:11,marginBottom:2 }}>{shipper.company_name}</div>
          <div>{shipper.address}</div>
          <div>{[shipper.city,shipper.state,shipper.zip].filter(Boolean).join(', ')}</div>
          {!hidePhones && shipper.phone && <div style={{ marginTop:2 }}>{shipper.phone}</div>}
          {!hidePhones && shipper.contact && <div>{shipper.contact}</div>}
        </div>
        <div style={{ padding:'7px 10px' }}>
          <div style={{ fontSize:9,fontWeight:'bold',color:'#cc0000',marginBottom:3 }}>TO:</div>
          <div style={{ fontSize:9,fontWeight:'bold',color:'#555',marginBottom:2 }}>CONSIGNEE</div>
          <div style={{ fontWeight:'bold',fontSize:11,marginBottom:2 }}>{consignee.company_name}</div>
          <div>{consignee.address}</div>
          <div>{[consignee.city,consignee.state,consignee.zip].filter(Boolean).join(', ')}</div>
          {!hidePhones && consignee.phone && <div style={{ marginTop:2 }}>{consignee.phone}</div>}
        </div>
      </div>

      {/* Delivering carrier */}
      <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',border:'1px solid #000',borderTop:'none',marginBottom:4 }}>
        <div style={{ padding:'3px 7px',borderRight:'1px solid #999' }}>
          <div style={{ fontSize:9,fontWeight:'bold' }}>DELIVERING CARRIER</div>
          <div>{showBothCarriers ? CARRIER_NAME : ''}</div>
        </div>
        <div style={{ padding:'3px 7px',borderRight:'1px solid #999' }}><div style={{ fontSize:9,fontWeight:'bold' }}>ROUTE</div></div>
        <div style={{ padding:'3px 7px' }}><div style={{ fontSize:9,fontWeight:'bold' }}>VEHICLE NUMBER</div><div>{load.truck_unit||load.bol_number||''}</div></div>
      </div>

      {/* Commodity table */}
      <table style={{ width:'100%',borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ border:'1px solid #000',padding:'3px',fontSize:9,width:55,textAlign:'center' }}>PIECES</th>
            <th style={{ border:'1px solid #000',padding:'3px',fontSize:9,width:22,color:'#cc0000',textAlign:'center' }}>HM</th>
            <th style={{ border:'1px solid #000',padding:'3px',fontSize:9,textAlign:'center' }}>KIND OF PACKAGE, DESCRIPTION OF ARTICLES,<br/>SPECIAL MARKS AND EXCEPTIONS</th>
            <th style={{ border:'1px solid #000',padding:'3px',fontSize:9,width:65,textAlign:'center' }}>WEIGHT</th>
            {showFreight && <th style={{ border:'1px solid #000',padding:'3px',fontSize:9,width:110,textAlign:'center' }}>CHARGES<br/>(FOR CARRIER USE ONLY)</th>}
          </tr>
        </thead>
        <tbody>
          {commodities.map((c,i)=>(
            <tr key={i}>
              <td style={{ border:'1px solid #aaa',padding:'5px 3px',textAlign:'center' }}>{c.pieces||''}</td>
              <td style={{ border:'1px solid #aaa',padding:'5px 3px' }}></td>
              <td style={{ border:'1px solid #aaa',padding:'5px 6px' }}>{[c.commodity,c.description].filter(Boolean).join(' — ')}</td>
              <td style={{ border:'1px solid #aaa',padding:'5px 3px',textAlign:'right' }}>{c.weight||''}</td>
              {showFreight && <td style={{ border:'1px solid #aaa',padding:'5px 3px' }}></td>}
            </tr>
          ))}
          <tr style={{ fontWeight:'bold',background:'#f8f8f8' }}>
            <td style={{ border:'1px solid #aaa',padding:'3px',textAlign:'center' }}>{commodities.reduce((s,c)=>s+(parseInt(c.pieces)||0),0)||''}</td>
            <td style={{ border:'1px solid #aaa',padding:'3px' }}></td>
            <td style={{ border:'1px solid #aaa',padding:'3px',textAlign:'right',fontSize:9,color:'#555' }}>TOTALS</td>
            <td style={{ border:'1px solid #aaa',padding:'3px',textAlign:'right' }}>{commodities.reduce((s,c)=>s+(parseFloat(c.weight)||0),0)||''}</td>
            {showFreight && <td style={{ border:'1px solid #aaa',padding:'3px' }}></td>}
          </tr>
          {[0,1,2,3,4].map(i=><tr key={`b${i}`}><td style={{ border:'1px solid #aaa',height:32 }} colSpan={showFreight?5:4}></td></tr>)}
        </tbody>
      </table>

      {/* Hazmat certification */}
      <div style={{ border:'1px solid #000',borderTop:'none',padding:'4px 7px',fontSize:'8px',color:'#333' }}>
        "This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation, according to the applicable regulations of the Department of Transportation."<br/>
        When transporting hazardous materials include the technical or chemical name for n.o.s. (not otherwise specified) or generic description of material with appropriate UN or NA number as defined in US DOT Emergency Response Communication Standard (HM-126C). Provide emergency response phone number in case of incident or accident.
      </div>

      {/* COD row */}
      <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',border:'1px solid #000',borderTop:'none' }}>
        <div style={{ padding:'3px 7px',borderRight:'1px solid #999',fontSize:9 }}>
          <b>REMIT C.O.D. TO:</b> <span style={{ borderBottom:'1px solid #000',display:'inline-block',minWidth:120 }}></span>
        </div>
        <div style={{ padding:'3px 7px',borderRight:'1px solid #999',fontSize:9 }}>
          <b>C.O.D. Amt $</b> <span style={{ borderBottom:'1px solid #000',display:'inline-block',minWidth:60 }}></span>&nbsp;
          <b>C.O.D. FEE</b> ☐ PREPAID ☐ COLLECT
        </div>
        <div style={{ padding:'3px 7px',fontSize:9 }}>
          <div>Freight charges are <b>PREPAID</b> unless marked collect.</div>
          <div>☐ Check box if charges are Collect.</div>
          <div style={{ marginTop:2 }}><b>TOTAL CHARGES $</b> <span style={{ borderBottom:'1px solid #000',display:'inline-block',minWidth:70 }}>{showFreight ? `$${freightAmt.toFixed(2)}` : ''}</span></div>
        </div>
      </div>

      {/* Freight charges */}
      {showFreight && (
        <div style={{ border:'1px solid #000',borderTop:'none',padding:'5px 8px',fontSize:10 }}>
          <div style={{ fontWeight:'bold',marginBottom:3 }}>FREIGHT CHARGES</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:3 }}>
            <span>Freight: ${freightAmt.toFixed(2)}</span>
            <span>Fuel Surcharge: ${fuelAmt.toFixed(2)}</span>
            <span>Accessorials: ${accTotal.toFixed(2)}</span>
            <span style={{ fontWeight:'bold' }}>Total: ${(freightAmt).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Billing notice */}
      {showBilling && (
        <div style={{ border:'1px solid #000',borderTop:'none',padding:'4px 7px',fontSize:'8.5px',fontStyle:'italic',color:'#444' }}>
          BILLING NOTICE: The carrier will deliver the freight against payment of freight charges. No diversion or reconsignment will be made without prior written authorization from the consignor.
        </div>
      )}

      {/* Bottom section — Note on value + Shipper imprint */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:6 }}>
        <div style={{ border:'1px solid #000',padding:'5px 7px',fontSize:'8px' }}>
          <div style={{ fontWeight:'bold',marginBottom:2 }}>NOTE:</div>
          Where the rate is dependent on value, shippers are required to state specifically in writing the agreed or declared value of the property.<br/><br/>
          The agreed or declared value of the property is hereby specifically stated by the shipper to be not exceeding<br/>
          <span style={{ borderBottom:'1px solid #000',display:'inline-block',width:200,marginTop:4 }}></span><br/><br/>
          Subject to Section 7 of conditions, if this shipment is to be delivered to the consignee without recourse on the consignor, the consignor shall sign the following statement:<br/><br/>
          The carrier shall not make delivery of this shipment without payment of freight and all other lawful charges.<br/><br/>
          <span style={{ borderBottom:'1px solid #000',display:'inline-block',width:180,marginTop:2 }}></span>
          <div style={{ fontSize:'7.5px',color:'#555',marginTop:1 }}>(Signature of Consignor)</div>
        </div>
        <div style={{ border:'1px solid #000',padding:'5px 7px',fontSize:'8px' }}>
          <div style={{ fontWeight:'bold',marginBottom:2,fontSize:9 }}>Permanent post office address of shipper:</div>
          <div style={{ marginBottom:4 }}>{CARRIER_NAME}</div>
          <div style={{ borderBottom:'1px solid #000',minHeight:18,marginBottom:4 }}></div>
          <div style={{ fontSize:'7.5px',color:'#555',marginBottom:6 }}>Shipper's imprint in lieu of stamp; not a part of bill of lading approved by the Interstate Commerce Commission.</div>
          <div style={{ borderBottom:'1px solid #000',marginBottom:2 }}></div>
          <div style={{ fontSize:'7.5px',color:'#555' }}>* MARK WITH "X" TO DESIGNATE HAZARDOUS MATERIAL AS DEFINED IN TITLE 49 OF FEDERAL REGULATIONS.</div>
        </div>
      </div>

      {/* Emergency response + Driver sig */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:10 }}>
        <div>
          <div style={{ fontSize:9,fontWeight:'bold',marginBottom:2 }}>DRIVER'S SIGNATURE</div>
          <div style={{ borderTop:'1px solid #000',paddingTop:2,minHeight:28 }}></div>
        </div>
        <div>
          <div style={{ fontSize:9,fontWeight:'bold',marginBottom:2 }}>PLACARDS SUPPLIED</div>
          <div style={{ borderTop:'1px solid #000',paddingTop:2,minHeight:28 }}>☐ YES &nbsp; ☐ NO</div>
        </div>
        <div>
          <div style={{ fontSize:9,fontWeight:'bold',marginBottom:2 }}>EMERGENCY RESPONSE PHONE NO</div>
          <div style={{ borderTop:'1px solid #000',paddingTop:2,minHeight:28 }}></div>
        </div>
      </div>

      {/* Shipper/Carrier sig */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:12 }}>
        <div style={{ borderTop:'1px solid #000',paddingTop:3,fontSize:10 }}>Shipper, Per &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Agent, Per</div>
        <div style={{ borderTop:'1px solid #000',paddingTop:3,fontSize:10 }}>Carrier Signature / Date</div>
      </div>
    </div>
  );
}

function buildBOLHTML({ load, stops, commodities, showFreight, showBilling, showBothCarriers, hidePhones, today, shipper, consignee, fuelAmt, freightAmt, accTotal }) {
  const totalPcs = commodities.reduce((s,c)=>s+(parseInt(c.pieces)||0),0);
  const totalWgt = commodities.reduce((s,c)=>s+(parseFloat(c.weight)||0),0);

  const commRows = commodities.map(c=>`
    <tr>
      <td style="text-align:center;padding:4px 3px;border:1px solid #000">${c.pieces||''}</td>
      <td style="padding:4px 3px;border:1px solid #000"></td>
      <td style="padding:4px 8px;border:1px solid #000">${[c.commodity,c.description].filter(Boolean).join(' — ')}</td>
      <td style="text-align:right;padding:4px 6px;border:1px solid #000">${c.weight||''}</td>
      ${showFreight?`<td style="padding:4px 6px;border:1px solid #000"></td>`:''}
    </tr>`).join('');

  const blankRows = Array(6).fill(0).map((_,i)=>`
    <tr style="height:36px">
      <td style="border:1px solid #000;border-top:none"></td>
      <td style="border:1px solid #000;border-top:none"></td>
      <td style="border:1px solid #000;border-top:none"></td>
      <td style="border:1px solid #000;border-top:none"></td>
      ${showFreight?'<td style="border:1px solid #000;border-top:none"></td>':''}
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>BOL ${load.load_number||'NEW'}</title>
  <style>
    @page { size: letter portrait; margin: 0.45in 0.5in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: Arial, sans-serif; font-size: 10px; color: #000; }
    body { display: flex; flex-direction: column; min-height: 100vh; }
    .page { display: flex; flex-direction: column; flex: 1; }
    .top { flex-shrink: 0; }
    .mid { flex: 1; display: flex; flex-direction: column; }
    .bot { flex-shrink: 0; }
    h1 { text-align:center; font-size:11.5px; font-weight:bold; margin-bottom:4px; }
    /* Header grid */
    .hdr { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; border:1px solid #000; }
    .hdr-cell { padding:3px 6px; border-right:1px solid #000; }
    .hdr-cell:last-child { border-right:none; }
    .lbl { font-size:7.5px; color:#333; text-transform:uppercase; display:block; margin-bottom:1px; }
    .val { font-weight:bold; font-size:11px; }
    /* Legal */
    .legal { font-size:7.5px; line-height:1.35; border:1px solid #000; border-top:none;
             padding:3px 6px; }
    /* From/To */
    .from-to { display:grid; grid-template-columns:1fr 1fr; border:1px solid #000; border-top:none; }
    .from-cell { padding:5px 8px; border-right:1px solid #000; font-size:10px; }
    .to-cell { padding:5px 8px; font-size:10px; }
    .section-lbl { font-size:8px; font-weight:bold; color:#cc0000; display:block; margin-bottom:2px; }
    .field-lbl { font-weight:bold; font-size:9px; }
    /* Delivering carrier */
    .deliv { display:grid; grid-template-columns:2fr 1fr 1fr; border:1px solid #000; border-top:none; }
    .d-cell { padding:3px 7px; border-right:1px solid #000; font-size:9px; }
    .d-cell:last-child { border-right:none; }
    .d-lbl { font-weight:bold; font-size:8px; display:block; margin-bottom:1px; }
    /* Commodity table */
    .comm-table { width:100%; border-collapse:collapse; flex:1; }
    .comm-table th { border:1px solid #000; border-top:none; padding:3px 5px; font-size:8.5px;
                     background:#f5f5f5; text-align:center; font-weight:bold; }
    .comm-table th.left { text-align:left; }
    /* Bottom sections */
    .hazmat { border:1px solid #000; border-top:none; padding:4px 7px; font-size:7.5px; line-height:1.4; }
    .cod-row { display:grid; grid-template-columns:2fr 1fr 1fr; border:1px solid #000; border-top:none; }
    .cod-cell { padding:4px 7px; border-right:1px solid #000; font-size:9.5px; }
    .cod-cell:last-child { border-right:none; }
    .freight-row { border:1px solid #000; border-top:none; padding:4px 8px; font-size:9.5px; }
    .billing { border:1px solid #000; border-top:none; padding:3px 7px; font-size:8px; font-style:italic; }
    .note-row { display:grid; grid-template-columns:1fr 1fr; border:1px solid #000; border-top:none; }
    .note-cell { padding:6px 8px; border-right:1px solid #000; font-size:8px; line-height:1.5; }
    .note-cell:last-child { border-right:none; }
    .note-title { font-weight:bold; font-size:9px; display:block; margin-bottom:3px; }
    .underline { border-bottom:1px solid #000; display:inline-block; min-width:140px; }
    .sig-row { display:grid; grid-template-columns:1fr 1fr 1fr; border:1px solid #000; border-top:none; }
    .sig-cell { padding:5px 8px; border-right:1px solid #000; }
    .sig-cell:last-child { border-right:none; }
    .sig-lbl { font-size:8px; font-weight:bold; text-transform:uppercase; display:block; margin-bottom:3px; }
    .sig-line { border-top:1px solid #000; margin-top:24px; padding-top:2px; font-size:8px; color:#555; }
    .final-row { display:grid; grid-template-columns:1fr 1fr; margin-top:6px; }
    .final-cell { padding:3px 0; }
    .final-line { border-top:1px solid #000; padding-top:3px; font-size:9.5px; display:inline-block; min-width:240px; }
    @media print {
      body { min-height:0; }
      .page { min-height: calc(100vh); }
    }
  </style></head><body>
  <div class="page">
    <div class="top">
      <h1>STRAIGHT BILL OF LADING – SHORT FORM – ORIGINAL - NOT NEGOTIABLE</h1>

      <div class="hdr">
        <div class="hdr-cell"><span class="lbl">Name of Carrier</span><span class="val">${CARRIER_NAME}</span></div>
        <div class="hdr-cell"><span class="lbl">Carrier's No.</span><span class="val">${load.load_number||'NEW'}</span></div>
        <div class="hdr-cell"><span class="lbl">Date</span><span class="val">${today}</span></div>
        <div class="hdr-cell"><span class="lbl">Shipper's No.</span><span class="val">${shipper.reference||''}</span></div>
      </div>

      <div class="legal">
        RECEIVED, subject to the classifications and lawfully filed tariffs in effect on the date of this Bill of Lading, the property described below in apparent good order, except as noted (contents and condition of contents of packages unknown), marked, consigned, and destined as indicated below which said carrier (the word carrier being understood throughout this contract as meaning any person or corporation in possession of the property under the contract) agrees to carry to its usual place of delivery at said destination, if on its route, otherwise to deliver to another carrier on the route to said destination. It is mutually agreed as to each carrier of all or any of said property over all or any portion of said route to destination, and as to each party at any time interested in all or any said property, that every service to be performed hereunder shall be subject to all the terms and conditions of the Uniform Domestic Straight Bill of Lading set forth (1) in Uniform Freight Classifications in effect on the date hereof, if this is a rail or a rail-water shipment, or (2) in the applicable motor carrier classification or tariff if this is a motor carrier shipment.<br/>
        Shipper hereby certifies that he is familiar with all the terms and conditions of the said bill of lading, set forth in the classification or tariff which governs the transportation of this shipment, and the said terms and conditions are hereby agreed to by the shipper and accepted for himself and his assigns.
      </div>

      <div class="from-to">
        <div class="from-cell">
          <span class="section-lbl">FROM:</span>
          <div style="font-size:8px;font-weight:bold;color:#555;margin-bottom:2px">SHIPPER</div>
          <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${shipper.company_name||''}</div>
          <div>${shipper.address||''}</div>
          <div>${[shipper.city,shipper.state,shipper.zip].filter(Boolean).join(', ')}</div>
          ${!hidePhones&&shipper.phone?`<div style="margin-top:2px">${shipper.phone}</div>`:''}
          ${!hidePhones&&shipper.contact?`<div>${shipper.contact}</div>`:''}
        </div>
        <div class="to-cell">
          <span class="section-lbl">TO:</span>
          <div style="font-size:8px;font-weight:bold;color:#555;margin-bottom:2px">CONSIGNEE</div>
          <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${consignee.company_name||''}</div>
          <div>${consignee.address||''}</div>
          <div>${[consignee.city,consignee.state,consignee.zip].filter(Boolean).join(', ')}</div>
          ${!hidePhones&&consignee.phone?`<div style="margin-top:2px">${consignee.phone}</div>`:''}
        </div>
      </div>

      <div class="deliv">
        <div class="d-cell"><span class="d-lbl">DELIVERING CARRIER</span>${showBothCarriers?CARRIER_NAME:''}</div>
        <div class="d-cell"><span class="d-lbl">ROUTE</span></div>
        <div class="d-cell"><span class="d-lbl">VEHICLE NUMBER</span>${load.truck_unit||load.bol_number||''}</div>
      </div>

      <table class="comm-table">
        <thead>
          <tr>
            <th style="width:52px">PIECES</th>
            <th style="width:22px;color:#cc0000">HM</th>
            <th class="left">KIND OF PACKAGE, DESCRIPTION OF ARTICLES, SPECIAL MARKS AND EXCEPTIONS</th>
            <th style="width:62px">WEIGHT</th>
            ${showFreight?'<th style="width:105px">CHARGES<br/>(FOR CARRIER USE ONLY)</th>':''}
          </tr>
        </thead>
        <tbody>
          ${commRows}
          <tr style="font-weight:bold;background:#f8f8f8">
            <td style="text-align:center;border:1px solid #000;border-top:none;padding:3px">${totalPcs||''}</td>
            <td style="border:1px solid #000;border-top:none"></td>
            <td style="text-align:right;border:1px solid #000;border-top:none;padding:3px;font-size:8.5px;color:#666">TOTALS</td>
            <td style="text-align:right;border:1px solid #000;border-top:none;padding:3px">${totalWgt||''}</td>
            ${showFreight?'<td style="border:1px solid #000;border-top:none"></td>':''}
          </tr>
          ${blankRows}
        </tbody>
      </table>
    </div>

    <div class="bot">
      <div class="hazmat">
        "This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation, according to the applicable regulations of the Department of Transportation."<br/>
        When transporting hazardous materials include the technical or chemical name for n.o.s. (not otherwise specified) or generic description of material with appropriate UN or NA number as defined in US DOT Emergency Response Communication Standard (HM-126C). Provide emergency response phone number in case of incident or accident.
      </div>

      <div class="cod-row">
        <div class="cod-cell">
          <b>REMIT C.O.D. TO:</b> <span class="underline">&nbsp;</span>
        </div>
        <div class="cod-cell">
          <b>C.O.D. Amt $</b> <span class="underline" style="min-width:55px">&nbsp;</span>
          &nbsp;<b>C.O.D. FEE</b> ☐ PREPAID &nbsp;☐ COLLECT
        </div>
        <div class="cod-cell" style="font-size:9px">
          Freight charges are <b>PREPAID</b> unless marked collect.<br/>
          ☐ Check box if charges are Collect.<br/>
          <b>TOTAL CHARGES $</b> ${showFreight?freightAmt.toFixed(2):''}
        </div>
      </div>

      ${showFreight?`<div class="freight-row">
        <b>FREIGHT CHARGES</b>&nbsp;&nbsp;
        Freight: $${freightAmt.toFixed(2)} &nbsp;|&nbsp;
        Fuel Surcharge: $${fuelAmt.toFixed(2)} &nbsp;|&nbsp;
        Accessorials: $${accTotal.toFixed(2)} &nbsp;|&nbsp;
        <b>Total: $${freightAmt.toFixed(2)}</b>
      </div>`:''}

      ${showBilling?`<div class="billing">
        <i>BILLING NOTICE: The carrier will deliver the freight against payment of freight charges. No diversion or reconsignment will be made without prior written authorization from the consignor.</i>
      </div>`:''}

      <div class="note-row">
        <div class="note-cell">
          <span class="note-title">NOTE:</span>
          Where the rate is dependent on value, shippers are required to state specifically in writing the agreed or declared value of the property.<br/><br/>
          The agreed or declared value of the property is hereby specifically stated by the shipper to be not exceeding <span class="underline">&nbsp;</span><br/><br/>
          Subject to Section 7 of conditions, if this shipment is to be delivered to the consignee without recourse on the consignor, the consignor shall sign the following statement:<br/><br/>
          The carrier shall not make delivery of this shipment without payment of freight and all other lawful charges.<br/><br/>
          <span class="underline" style="min-width:200px">&nbsp;</span><br/>
          <span style="font-size:7px">(Signature of Consignor)</span>
        </div>
        <div class="note-cell">
          <span class="note-title">Permanent post office address of shipper:</span>
          ${CARRIER_NAME}<br/><br/>
          <span class="underline" style="min-width:100%;display:block">&nbsp;</span><br/>
          <span style="font-size:7.5px">Shipper's imprint in lieu of stamp; not a part of bill of lading approved by the Interstate Commerce Commission.</span>
          <br/><br/>
          <span class="underline" style="min-width:100%;display:block">&nbsp;</span><br/>
          <span style="font-size:7.5px">* MARK WITH "X" TO DESIGNATE HAZARDOUS MATERIAL AS DEFINED IN TITLE 49 OF FEDERAL REGULATIONS.</span>
        </div>
      </div>

      <div class="sig-row">
        <div class="sig-cell">
          <span class="sig-lbl">Driver's Signature</span>
          <div class="sig-line"></div>
        </div>
        <div class="sig-cell">
          <span class="sig-lbl">Placards Supplied</span>
          <div style="margin-top:8px;font-size:10px">☐ YES &nbsp;&nbsp; ☐ NO</div>
        </div>
        <div class="sig-cell">
          <span class="sig-lbl">Emergency Response Phone No</span>
          <div class="sig-line"></div>
        </div>
      </div>

      <div class="final-row">
        <div class="final-cell">
          <span class="final-line">Shipper, Per &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Agent, Per</span>
        </div>
        <div class="final-cell">
          <span class="final-line">Carrier Signature / Date</span>
        </div>
      </div>
    </div>
  </div>
  </body></html>`;
}
// ─── Loadsheet Print ──────────────────────────────────────────────────────────
function buildLoadsheetHTML({ load, stops, commodities, accessorials, customer }) {
  const today = new Date().toLocaleDateString();
  const shipper   = stops.find(s=>s.stop_type==='shipper')   || stops[0] || {};
  const consignee = stops.find(s=>s.stop_type==='consignee') || stops[stops.length-1] || {};
  const accTotal  = sumAcc(accessorials);
  const fuelAmt   = parseFloat(load.fuel_surcharge)||0;
  const freightAmt= parseFloat(load.total_revenue)||0;

  const stopRows = stops.map((s,i)=>`<tr>
    <td>${s.stop_type.charAt(0).toUpperCase()+s.stop_type.slice(1)}</td>
    <td>${i+1}</td>
    <td>${s.date_avail||''}</td>
    <td>${s.date_thru||''}</td>
    <td>${s.time_from||''}</td>
    <td>${s.time_to||''}</td>
    <td>${s.appt_required?'Yes':''}</td>
    <td><b>${s.company_name||''}</b><br/>${s.address||''}<br/>${[s.city,s.state,s.zip].filter(Boolean).join(', ')}</td>
    <td>${s.phone||''}</td>
    <td>${s.reference||''}</td>
  </tr>`).join('');

  const commRows = commodities.map(c=>`<tr>
    <td>${c.commodity||''}</td><td>${c.reference||''}</td><td>${c.description||''}</td>
    <td style="text-align:right">${c.weight||''}</td><td style="text-align:center">${c.pieces||''}</td>
    <td style="text-align:center">${c.spc||''}</td><td>${c.notes||''}</td>
  </tr>`).join('');

  const accRows = accessorials.map(a=>`<tr>
    <td>${a.charge_type||''}</td><td>${a.reference||''}</td>
    <td style="text-align:right">${a.rate?'$'+parseFloat(a.rate).toFixed(2):''}</td>
    <td style="text-align:center">${a.units||''}</td>
    <td style="text-align:right">${a.amount?'$'+parseFloat(a.amount).toFixed(2):''}</td>
    <td>${a.notes||''}</td>
  </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>Loadsheet ${load.load_number||''}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 15px; color: #000; }
    h1 { font-size:16px; margin:0 0 2px; color:#003865; }
    h2 { font-size:11px; font-weight:bold; background:#003865; color:#fff; padding:4px 8px; margin:10px 0 0; }
    .header-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; border:1px solid #ddd; padding:8px; margin-bottom:4px; background:#f8faff; }
    .hf { display:flex; flex-direction:column; }
    .hl { font-size:9px; color:#666; text-transform:uppercase; }
    .hv { font-weight:bold; font-size:12px; color:#003865; }
    table { width:100%; border-collapse:collapse; margin-bottom:8px; font-size:10px; }
    th { background:#e8edf2; border:1px solid #ccc; padding:4px 6px; text-align:left; font-size:9px; }
    td { border:1px solid #ddd; padding:4px 6px; vertical-align:top; }
    .totals { font-weight:bold; background:#f5f5f5; }
    .rev-box { border:2px solid #003865; padding:8px 12px; display:inline-block; margin-top:6px; }
    .rev-label { font-size:9px; color:#666; text-transform:uppercase; }
    .rev-val { font-size:18px; font-weight:bold; color:#003865; }
    @media print { body { margin:8px; } }
  </style></head><body>
  <h1>${CARRIER_NAME} — LOADSHEET</h1>
  <div style="font-size:11px;color:#666;margin-bottom:8px">Printed: ${today} &nbsp;|&nbsp; Load #: <b>${load.load_number||'NEW'}</b> &nbsp;|&nbsp; Status: <b>${STATUS_LABELS[load.status]||load.status||'New'}</b></div>

  <div class="header-grid">
    <div class="hf"><span class="hl">Bill To</span><span class="hv">${customer?.company_name||load.customer_name||''}</span></div>
    <div class="hf"><span class="hl">Equipment</span><span class="hv">${load.equipment_type||''}</span></div>
    <div class="hf"><span class="hl">Miles</span><span class="hv">${load.miles||'0'}</span></div>
    <div class="hf"><span class="hl">Load Type</span><span class="hv">${load.load_type||''}</span></div>
    <div class="hf"><span class="hl">PO Number</span><span class="hv">${load.po_number||''}</span></div>
    <div class="hf"><span class="hl">Reference</span><span class="hv">${load.ref_number||''}</span></div>
    <div class="hf"><span class="hl">Received</span><span class="hv">${load.received_date||''}</span></div>
    <div class="hf"><span class="hl">Seal No</span><span class="hv">${load.seal_number||''}</span></div>
    <div class="hf"><span class="hl">Pallets</span><span class="hv">${load.pallets||'0'}</span></div>
    <div class="hf"><span class="hl">Temperature</span><span class="hv">${load.temperature||''}</span></div>
    <div class="hf"><span class="hl">Team Load</span><span class="hv">${load.team_load?'Yes':'No'}</span></div>
    <div class="hf"><span class="hl">Broadcast Notes</span><span class="hv">${load.broadcast_notes||''}</span></div>
  </div>

  <h2>STOPS</h2>
  <table>
    <thead><tr><th>Type</th><th>No</th><th>Avail</th><th>Thru</th><th>From</th><th>To</th><th>Appt</th><th>Company / Address</th><th>Phone</th><th>Reference</th></tr></thead>
    <tbody>${stopRows}</tbody>
  </table>

  <h2>COMMODITY</h2>
  <table>
    <thead><tr><th>Commodity</th><th>Ref</th><th>Description</th><th>Weight</th><th>Pieces</th><th>Spc</th><th>Notes</th></tr></thead>
    <tbody>
      ${commRows}
      <tr class="totals">
        <td colspan="3" style="text-align:right">TOTALS</td>
        <td style="text-align:right">${commodities.reduce((s,c)=>s+(parseFloat(c.weight)||0),0)||''}</td>
        <td style="text-align:center">${commodities.reduce((s,c)=>s+(parseInt(c.pieces)||0),0)||''}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>

  ${accessorials.length?`<h2>ACCESSORIAL CHARGES</h2>
  <table>
    <thead><tr><th>Charge Type</th><th>Reference</th><th>Rate</th><th>Units</th><th>Amount</th><th>Notes</th></tr></thead>
    <tbody>${accRows}
      <tr class="totals"><td colspan="4" style="text-align:right">Total Accessorials</td><td style="text-align:right"><b>$${accTotal.toFixed(2)}</b></td><td></td></tr>
    </tbody>
  </table>`:''}

  <h2>RATE SUMMARY</h2>
  <table style="width:auto;min-width:350px">
    <tr><td>Rate Type</td><td><b>${load.rate_type==='per_mile'?'Per Mile':'Flat Rate'}</b></td></tr>
    <tr><td>Base Rate</td><td><b>$${parseFloat(load.base_rate||0).toFixed(4)}/mile</b></td></tr>
    <tr><td>Fuel Surcharge</td><td><b>$${fuelAmt.toFixed(2)}</b></td></tr>
    <tr><td>Accessorials</td><td><b>$${accTotal.toFixed(2)}</b></td></tr>
    <tr style="background:#e8f0ff"><td style="font-weight:bold;font-size:13px">TOTAL REVENUE</td><td style="font-weight:bold;font-size:16px;color:#003865">$${freightAmt.toFixed(2)}</td></tr>
  </table>

  ${load.special_instructions?`<h2>SPECIAL INSTRUCTIONS</h2><div style="border:1px solid #ddd;padding:8px;font-size:11px">${load.special_instructions}</div>`:''}

  <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
    <div style="border-top:1px solid #000;padding-top:4px;font-size:10px">Dispatcher Signature / Date</div>
    <div style="border-top:1px solid #000;padding-top:4px;font-size:10px">Driver Signature / Date</div>
  </div>
  </body></html>`;
}

// ─── Delivery Receipt Print ───────────────────────────────────────────────────
function buildDeliveryReceiptHTML({ load, stops, commodities, customer }) {
  const today     = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const consignee = stops.find(s=>s.stop_type==='consignee') || stops[stops.length-1] || {};
  const shipper   = stops.find(s=>s.stop_type==='shipper')   || stops[0] || {};
  const totalWeight = commodities.reduce((s,c)=>s+(parseFloat(c.weight)||0),0);
  const totalPieces = commodities.reduce((s,c)=>s+(parseInt(c.pieces)||0),0);

  const commRows = commodities.map(c=>`
    <tr>
      <td style="text-align:center;font-weight:700">${c.pieces||''}</td>
      <td>${c.commodity||''}${c.description?' — '+c.description:''}</td>
      <td style="text-align:center">${c.spc||''}</td>
      <td style="text-align:right;font-weight:700">${c.weight?parseFloat(c.weight).toLocaleString()+' lbs':''}</td>
      <td></td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>Delivery Receipt ${load.load_number||''}</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000;
           max-width: 720px; margin: 0 auto; padding: 10px; }
    .company-header { text-align:center; border-bottom: 3px solid #003865; padding-bottom:8px; margin-bottom:10px; }
    .company-name { font-size:20px; font-weight:bold; color:#003865; }
    .doc-title { font-size:14px; font-weight:bold; letter-spacing:2px; color:#444; margin-top:2px; }
    .info-bar { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid #000;
                margin-bottom:10px; }
    .info-cell { padding:5px 8px; border-right:1px solid #000; }
    .info-cell:last-child { border-right:none; }
    .info-label { font-size:8px; font-weight:bold; text-transform:uppercase; color:#555; display:block; }
    .info-value { font-size:12px; font-weight:bold; color:#003865; }
    .from-to { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
    .addr-box { border:1px solid #000; padding:8px 10px; }
    .addr-title { font-size:9px; font-weight:bold; text-transform:uppercase; color:#cc0000;
                  border-bottom:1px solid #eee; margin-bottom:5px; padding-bottom:3px; }
    .addr-company { font-size:12px; font-weight:bold; margin-bottom:3px; }
    .addr-line { font-size:11px; color:#333; line-height:1.5; }
    table { width:100%; border-collapse:collapse; margin-bottom:10px; }
    th { background:#003865; color:#fff; border:1px solid #002a4a; padding:6px 8px;
         font-size:10px; text-align:left; }
    th.right { text-align:right; }
    th.center { text-align:center; }
    td { border:1px solid #ccc; padding:6px 8px; font-size:11px; vertical-align:middle; }
    .totals-row { font-weight:bold; background:#f0f4f8; }
    .sig-section { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:16px; }
    .sig-box { border:1px solid #000; padding:8px 10px; }
    .sig-title { font-size:9px; font-weight:bold; text-transform:uppercase; color:#555;
                 margin-bottom:4px; display:block; }
    .sig-line { border-top:1px solid #000; margin-top:44px; padding-top:4px;
                font-size:9px; color:#555; }
    .footer-note { font-size:8.5px; color:#666; text-align:center; margin-top:12px;
                   border-top:1px solid #eee; padding-top:6px; font-style:italic; }
    @media print { body { padding:0; max-width:100%; } }
  </style></head><body>

  <div class="company-header">
    <div class="company-name">${CARRIER_NAME}</div>
    <div class="doc-title">DELIVERY RECEIPT</div>
  </div>

  <div class="info-bar">
    <div class="info-cell">
      <span class="info-label">Load Number</span>
      <span class="info-value">${load.load_number||'NEW'}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Date</span>
      <span class="info-value">${today}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Equipment</span>
      <span class="info-value">${load.equipment_type||'—'}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Bill To</span>
      <span class="info-value" style="font-size:11px">${customer?.company_name||load.customer_name||'—'}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Reference #</span>
      <span class="info-value">${load.ref_number||'—'}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">PO Number</span>
      <span class="info-value">${load.po_number||'—'}</span>
    </div>
  </div>

  <div class="from-to">
    <div class="addr-box">
      <div class="addr-title">Shipped From (Shipper)</div>
      <div class="addr-company">${shipper.company_name||'—'}</div>
      <div class="addr-line">${shipper.address||''}</div>
      <div class="addr-line">${[shipper.city,shipper.state,shipper.zip].filter(Boolean).join(', ')}</div>
      ${shipper.phone?`<div class="addr-line" style="margin-top:3px">📞 ${shipper.phone}</div>`:''}
      ${shipper.contact?`<div class="addr-line">Contact: ${shipper.contact}</div>`:''}
      <div class="addr-line" style="margin-top:4px;color:#555;font-size:10px">
        Date: ${shipper.date_avail||load.pickup_date?.slice(0,10)||'—'}
        &nbsp;|&nbsp; Time: ${shipper.time_from||''}${shipper.time_to?' — '+shipper.time_to:''}
      </div>
    </div>
    <div class="addr-box">
      <div class="addr-title">Delivered To (Consignee)</div>
      <div class="addr-company">${consignee.company_name||'—'}</div>
      <div class="addr-line">${consignee.address||''}</div>
      <div class="addr-line">${[consignee.city,consignee.state,consignee.zip].filter(Boolean).join(', ')}</div>
      ${consignee.phone?`<div class="addr-line" style="margin-top:3px">📞 ${consignee.phone}</div>`:''}
      ${consignee.contact?`<div class="addr-line">Contact: ${consignee.contact}</div>`:''}
      <div class="addr-line" style="margin-top:4px;color:#555;font-size:10px">
        Date: ${consignee.date_avail||load.delivery_date?.slice(0,10)||'—'}
        &nbsp;|&nbsp; Time: ${consignee.time_from||''}${consignee.time_to?' — '+consignee.time_to:''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width:60px">PIECES</th>
        <th>COMMODITY / DESCRIPTION</th>
        <th class="center" style="width:50px">SPC</th>
        <th class="right" style="width:100px">WEIGHT (LBS)</th>
        <th style="width:110px">CONDITION</th>
      </tr>
    </thead>
    <tbody>
      ${commRows}
      <tr class="totals-row">
        <td style="text-align:center;font-size:13px">${totalPieces||''}</td>
        <td style="text-align:right;font-size:10px;color:#555">TOTALS</td>
        <td></td>
        <td style="text-align:right;font-size:13px">${totalWeight?totalWeight.toLocaleString()+' lbs':''}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  ${load.special_instructions?`
  <div style="border:1px solid #ccc;padding:7px 10px;margin-bottom:10px;background:#fffbf0;">
    <span style="font-size:9px;font-weight:bold;text-transform:uppercase;color:#555">Special Instructions:</span>
    <div style="margin-top:3px;font-size:11px">${load.special_instructions}</div>
  </div>`:''}

  <div class="sig-section">
    <div class="sig-box">
      <span class="sig-title">Received By — Print Name</span>
      <div class="sig-line">Signature &amp; Date / Time</div>
    </div>
    <div class="sig-box">
      <span class="sig-title">Condition of Goods on Arrival</span>
      <div style="display:flex;gap:20px;margin-top:8px;font-size:11px">
        <label><input type="radio" name="cond"/> Good Order</label>
        <label><input type="radio" name="cond"/> Damaged — see notes</label>
        <label><input type="radio" name="cond"/> Shortage</label>
      </div>
      <div class="sig-line">Receiver Signature / Date</div>
    </div>
    <div class="sig-box">
      <span class="sig-title">Driver Name (Print)</span>
      <div class="sig-line">Driver Signature / Date</div>
    </div>
    <div class="sig-box">
      <span class="sig-title">Notes / Exceptions</span>
      <div style="min-height:50px;border-bottom:1px solid #eee"></div>
    </div>
  </div>

  <div class="footer-note">
    ${CARRIER_NAME} — This receipt confirms delivery of the goods described above.
    Any claims for shortage or damage must be noted at time of delivery.
    Carrier's liability is subject to the terms of the original Bill of Lading.
  </div>

  </body></html>`;
}
// ─── Transport Agreement Print ────────────────────────────────────────────────
function buildTransportAgreementHTML({ load, stops, customer }) {
  const today     = new Date().toLocaleDateString();
  const shipper   = stops.find(s=>s.stop_type==='shipper')   || stops[0] || {};
  const consignee = stops.find(s=>s.stop_type==='consignee') || stops[stops.length-1] || {};
  return `<!DOCTYPE html><html><head><title>Transport Agreement ${load.load_number||''}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
    h2 { text-align:center; font-size:15px; font-weight:bold; margin-bottom:4px; }
    h3 { text-align:center; font-size:11px; color:#555; margin:0 0 16px; }
    .section { margin-bottom:14px; }
    .section-title { font-weight:bold; font-size:12px; background:#003865; color:#fff; padding:4px 10px; margin-bottom:6px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .field { margin-bottom:5px; font-size:11px; }
    .field b { min-width:130px; display:inline-block; }
    .terms { font-size:9px; line-height:1.5; border:1px solid #ccc; padding:8px; background:#fafafa; }
    .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
    .sig-line { border-top:1px solid #000; padding-top:4px; font-size:10px; margin-top:40px; }
    @media print { body { margin:10px; } }
  </style></head><body>
  <h2>${CARRIER_NAME}</h2>
  <h3>TRANSPORT AGREEMENT</h3>
  <div class="section">
    <div class="section-title">Load Details</div>
    <div class="grid2">
      <div>
        <div class="field"><b>Load Number:</b> ${load.load_number||'NEW'}</div>
        <div class="field"><b>Date:</b> ${today}</div>
        <div class="field"><b>Bill To:</b> ${customer?.company_name||load.customer_name||''}</div>
        <div class="field"><b>Reference:</b> ${load.ref_number||''}</div>
        <div class="field"><b>PO Number:</b> ${load.po_number||''}</div>
      </div>
      <div>
        <div class="field"><b>Equipment:</b> ${load.equipment_type||''}</div>
        <div class="field"><b>Miles:</b> ${load.miles||'0'}</div>
        <div class="field"><b>Load Type:</b> ${load.load_type||''}</div>
        <div class="field"><b>Temperature:</b> ${load.temperature||''}</div>
        <div class="field"><b>Seal Number:</b> ${load.seal_number||''}</div>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Origin & Destination</div>
    <div class="grid2">
      <div>
        <div style="font-weight:bold;margin-bottom:4px">PICKUP (SHIPPER)</div>
        <div>${shipper.company_name||''}</div>
        <div>${shipper.address||''}</div>
        <div>${[shipper.city,shipper.state,shipper.zip].filter(Boolean).join(', ')}</div>
        <div>Date: ${shipper.date_avail||''} &nbsp; Time: ${shipper.time_from||''} – ${shipper.time_to||''}</div>
        ${shipper.phone?`<div>Phone: ${shipper.phone}</div>`:''}
      </div>
      <div>
        <div style="font-weight:bold;margin-bottom:4px">DELIVERY (CONSIGNEE)</div>
        <div>${consignee.company_name||''}</div>
        <div>${consignee.address||''}</div>
        <div>${[consignee.city,consignee.state,consignee.zip].filter(Boolean).join(', ')}</div>
        <div>Date: ${consignee.date_avail||''} &nbsp; Time: ${consignee.time_from||''} – ${consignee.time_to||''}</div>
        ${consignee.phone?`<div>Phone: ${consignee.phone}</div>`:''}
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Rate & Charges</div>
    <div class="field"><b>Rate Type:</b> ${load.rate_type==='per_mile'?'Per Mile':'Flat Rate'}</div>
    <div class="field"><b>Rate:</b> $${parseFloat(load.base_rate||0).toFixed(4)}</div>
    <div class="field"><b>Fuel Surcharge:</b> $${parseFloat(load.fuel_surcharge||0).toFixed(2)}</div>
    <div class="field"><b>Total Revenue:</b> <strong>$${parseFloat(load.total_revenue||0).toFixed(2)}</strong></div>
  </div>
  <div class="section">
    <div class="section-title">Terms & Conditions</div>
    <div class="terms">
      1. The carrier agrees to transport the shipment described above from origin to destination in a timely and professional manner.<br/>
      2. The shipper warrants that the goods are properly packaged, labeled, and described.<br/>
      3. Payment is due within the agreed payment terms from invoice date. Late payments subject to interest charges.<br/>
      4. Carrier liability is limited to the lesser of actual value or $2.00 per pound unless a higher value is declared in writing.<br/>
      5. Claims for loss or damage must be filed within 9 months of delivery.<br/>
      6. This agreement is governed by the laws of the province/state in which ${CARRIER_NAME} is incorporated.<br/>
      7. Any disputes shall be resolved through binding arbitration in the jurisdiction of the carrier.
    </div>
  </div>
  ${load.special_instructions?`<div class="section"><div class="section-title">Special Instructions</div><div style="border:1px solid #ddd;padding:8px">${load.special_instructions}</div></div>`:''}
  <div class="sig-grid">
    <div>
      <div class="sig-line">Shipper / Customer Signature</div>
      <div style="margin-top:4px;font-size:9px;color:#666">Name (Print): _________________________________ &nbsp; Date: ___________</div>
    </div>
    <div>
      <div class="sig-line">Carrier (${CARRIER_NAME})</div>
      <div style="margin-top:4px;font-size:9px;color:#666">Name (Print): _________________________________ &nbsp; Date: ___________</div>
    </div>
  </div>
  </body></html>`;
}

// ─── Accessorial Notification Print ──────────────────────────────────────────
function buildAccessorialNotifHTML({ load, stops, accessorials, customer }) {
  const today     = new Date().toLocaleDateString();
  const consignee = stops.find(s=>s.stop_type==='consignee') || stops[stops.length-1] || {};
  const accTotal  = sumAcc(accessorials);
  const rows = accessorials.map(a=>`<tr>
    <td>${a.charge_type||''}</td>
    <td>${a.reference||''}</td>
    <td style="text-align:center">${a.units||''}</td>
    <td style="text-align:right">$${parseFloat(a.rate||0).toFixed(2)}</td>
    <td style="text-align:right"><b>$${parseFloat(a.amount||0).toFixed(2)}</b></td>
    <td>${a.notes||''}</td>
  </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>Accessorial Notification ${load.load_number||''}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
    h2 { font-size:15px; font-weight:bold; color:#003865; margin:0 0 2px; }
    h3 { font-size:11px; color:#555; margin:0 0 14px; }
    .info-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; background:#f0f4f8; border:1px solid #dde; padding:8px; margin-bottom:12px; }
    .ib { display:flex; flex-direction:column; }
    .il { font-size:9px; color:#666; text-transform:uppercase; }
    .iv { font-weight:bold; }
    table { width:100%; border-collapse:collapse; margin-top:6px; }
    th { background:#003865; color:#fff; border:1px solid #002a4a; padding:6px 8px; font-size:10px; text-align:left; }
    td { border:1px solid #ddd; padding:6px 8px; font-size:11px; }
    .total-row { font-weight:bold; background:#e8f0ff; }
    .notice { border:1px solid #ccc; padding:8px; font-size:10px; margin-top:12px; background:#fffbf0; }
    .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:24px; }
    .sig-line { border-top:1px solid #000; padding-top:4px; font-size:10px; margin-top:40px; }
    @media print { body { margin:10px; } }
  </style></head><body>
  <h2>${CARRIER_NAME}</h2>
  <h3>ACCESSORIAL CHARGE NOTIFICATION</h3>
  <div class="info-bar">
    <div class="ib"><span class="il">Load #</span><span class="iv">${load.load_number||'NEW'}</span></div>
    <div class="ib"><span class="il">Date</span><span class="iv">${today}</span></div>
    <div class="ib"><span class="il">Bill To</span><span class="iv">${customer?.company_name||load.customer_name||''}</span></div>
    <div class="ib"><span class="il">Delivery Location</span><span class="iv">${consignee.company_name||''}</span></div>
  </div>
  <p style="font-size:11px;margin:0 0 8px">Please be advised that the following accessorial charges have been incurred for the above-referenced shipment:</p>
  ${accessorials.length ? `<table>
    <thead><tr><th>Charge Type</th><th>Reference</th><th>Units</th><th>Rate</th><th>Amount</th><th>Notes</th></tr></thead>
    <tbody>
      ${rows}
      <tr class="total-row"><td colspan="4" style="text-align:right">TOTAL ACCESSORIAL CHARGES</td><td style="text-align:right;font-size:13px">$${accTotal.toFixed(2)}</td><td></td></tr>
    </tbody>
  </table>` : `<div style="border:1px solid #ddd;padding:12px;text-align:center;color:#999">No accessorial charges on this load.</div>`}
  <div class="notice">
    <b>Important:</b> These charges are in addition to the base freight rate. If you have any questions regarding these charges, please contact our billing department within 5 business days of receiving this notification. After that period, these charges will be considered accepted and will be invoiced accordingly.
  </div>
  <div style="margin-top:12px;font-size:10px">
    <b>Base Freight:</b> $${parseFloat(load.total_revenue||0).toFixed(2)} &nbsp;&nbsp;
    <b>Fuel Surcharge:</b> $${parseFloat(load.fuel_surcharge||0).toFixed(2)} &nbsp;&nbsp;
    <b>Accessorials:</b> $${accTotal.toFixed(2)} &nbsp;&nbsp;
    <b style="font-size:13px;color:#003865">Invoice Total: $${(parseFloat(load.total_revenue||0)).toFixed(2)}</b>
  </div>
  <div class="sig-grid">
    <div><div class="sig-line">Authorized by (${CARRIER_NAME})</div><div style="margin-top:4px;font-size:9px;color:#666">Name: _________________________________ Date: ___________</div></div>
    <div><div class="sig-line">Acknowledged by Customer</div><div style="margin-top:4px;font-size:9px;color:#666">Name: _________________________________ Date: ___________</div></div>
  </div>
  </body></html>`;
}

// ─── Stop Info Popup ──────────────────────────────────────────────────────────
function StopInfoPopup({ stop, onSave, onDelete, onClose, locations }) {
  const [form, setForm] = useState({ ...EMPTY_STOP, ...stop });
  const [locSearch, setLocSearch] = useState('');
  const [savingLoc, setSavingLoc] = useState(false);
  const h = (f,v) => setForm(p=>({...p,[f]:v}));

  const saveToAddressBook = async () => {
    if (!form.company_name) { return; }
    setSavingLoc(true);
    try {
      await api.post('/locations', {
        name: form.company_name,
        address: form.address||null,
        city: form.city||null,
        state: form.state||null,
        zip: form.zip||null,
        phone: form.phone||null,
        contact_name: form.contact||null,
        location_type: form.stop_type==='shipper'?'shipper':form.stop_type==='consignee'?'consignee':'both',
        notes: form.location_notes||null,
        country: 'Canada',
      });
      alert(`✅ "${form.company_name}" saved to address book!`);
    } catch(e) {
      alert('Failed to save to address book');
    } finally { setSavingLoc(false); }
  };
  const inp = { padding:'7px 10px', border:'1px solid #ddd', borderRadius:4, fontSize:13, width:'100%', boxSizing:'border-box' };
  const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#555', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' };

  // Filter locations by search + stop type
  const filteredLocs = (locations||[]).filter(l => {
    // If location_type is null/undefined, always show it (don't filter out)
    const typeMatch = !l.location_type
      || form.stop_type === 'stop'
      || (form.stop_type === 'shipper'   && ['shipper','both','warehouse'].includes(l.location_type))
      || (form.stop_type === 'consignee' && ['consignee','both','warehouse'].includes(l.location_type));
    const searchMatch = !locSearch
      || l.name.toLowerCase().includes(locSearch.toLowerCase())
      || (l.city||'').toLowerCase().includes(locSearch.toLowerCase())
      || (l.address||'').toLowerCase().includes(locSearch.toLowerCase());
    return typeMatch && searchMatch;
  });

  const fillFromLocation = loc => {
    setForm(p=>({...p,
      company_name: loc.name,
      address: loc.address||'',
      city: loc.city||'',
      state: loc.state||'',
      zip: loc.zip||'',
      phone: loc.phone||'',
      contact: loc.contact_name||'',
      location_notes: loc.notes||'',
    }));
    setLocSearch('');
  };

  // Auto-fill when company name matches a saved location exactly
  const handleCompanyBlur = () => {
    if(!form.company_name) return;
    const match = (locations||[]).find(l=>l.name.toLowerCase()===form.company_name.toLowerCase().trim());
    if(match && !form.address) fillFromLocation(match);
  };

  const typeColor = form.stop_type==='shipper'?'#0063A3':form.stop_type==='consignee'?'#2E7D32':'#888';

  return (
    <div style={{ position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.55)',padding:16 }}>
      <div style={{ background:'#fff',borderRadius:8,boxShadow:'0 8px 40px rgba(0,0,0,0.3)',width:'min(720px,100%)',maxHeight:'92vh',display:'flex',flexDirection:'column' }}>

        {/* Header */}
        <div style={{ background:'#003865',color:'#fff',padding:'12px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',borderRadius:'8px 8px 0 0',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:10,background:typeColor,color:'#fff',textTransform:'uppercase' }}>
              {form.stop_type==='shipper'?'Shipper':form.stop_type==='consignee'?'Consignee':'Stop'}
            </span>
            <span style={{ fontWeight:700,fontSize:14 }}>{form.company_name||'Stop Details'}</span>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer' }}><X size={16}/></button>
        </div>

        <div style={{ overflowY:'auto',padding:18,flex:1 }}>

          {/* Stop type */}
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Stop Type</label>
            <div style={{ display:'flex',gap:8 }}>
              {[['shipper','Shipper','#0063A3'],['consignee','Consignee','#2E7D32'],['stop','Extra Stop','#888']].map(([v,l,c])=>(
                <button key={v} onClick={()=>h('stop_type',v)}
                  style={{ padding:'6px 16px',border:'none',borderRadius:16,fontSize:12,fontWeight:form.stop_type===v?700:400,cursor:'pointer',
                    background:form.stop_type===v?c:'#f0f0f0',color:form.stop_type===v?'#fff':'#555' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Location search */}
          <div style={{ background:'#f0f4f8',borderRadius:6,padding:'10px 12px',marginBottom:14,border:'1px solid #dde3ea' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <label style={{...lbl,color:'#003865',marginBottom:0}}>📍 Search Address Book</label>
              {form.company_name&&(
                <button onClick={saveToAddressBook} disabled={savingLoc}
                  style={{fontSize:10,padding:'2px 8px',border:'1px solid #059669',background:'#ECFDF5',
                    color:'#059669',borderRadius:4,cursor:'pointer',fontWeight:700,whiteSpace:'nowrap'}}>
                  {savingLoc?'Saving…':'💾 Save to Address Book'}
                </button>
              )}
            </div>
            <input value={locSearch} onChange={e=>setLocSearch(e.target.value)}
              style={inp} placeholder="Type to search saved locations…"/>
            {locSearch && filteredLocs.length>0 && (
              <div style={{ marginTop:6,border:'1px solid #ddd',borderRadius:4,maxHeight:160,overflowY:'auto',background:'#fff' }}>
                {filteredLocs.slice(0,8).map(loc=>(
                  <div key={loc.id} onClick={()=>fillFromLocation(loc)}
                    style={{ padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #f5f5f5',fontSize:12 }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f0f4f8'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <div style={{ fontWeight:700,color:'#003865' }}>{loc.name}</div>
                    <div style={{ color:'#888',fontSize:11 }}>{[loc.address,loc.city,loc.state].filter(Boolean).join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
            {locSearch && filteredLocs.length===0 && (
              <div style={{ marginTop:6,fontSize:12,color:'#aaa',padding:'6px 0' }}>No locations found — fill manually below</div>
            )}
          </div>

          {/* Company + Address */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
            <div>
              <label style={lbl}>Company Name *</label>
              <input style={{...inp,fontWeight:700}} value={form.company_name||''} 
                onChange={e=>{h('company_name',e.target.value); setLocSearch(e.target.value);}}
                onBlur={handleCompanyBlur}
                placeholder="Company name — type to search address book"
                list="company-suggestions"/>
              <datalist id="company-suggestions">
                {(locations||[]).map(l=><option key={l.id} value={l.name}/>)}
              </datalist>
            </div>
            <div>
              <label style={lbl}>Address</label>
              <input style={inp} value={form.address||''} onChange={e=>h('address',e.target.value)} placeholder="Street address"/>
            </div>
          </div>

          {/* City/State/Zip */}
          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:10,marginBottom:12 }}>
            <div><label style={lbl}>City</label><input style={inp} value={form.city||''} onChange={e=>h('city',e.target.value)} placeholder="City"/></div>
            <div><label style={lbl}>State/Prov</label><input style={inp} value={form.state||''} onChange={e=>h('state',e.target.value)} placeholder="WA"/></div>
            <div><label style={lbl}>ZIP/Postal</label><input style={inp} value={form.zip||''} onChange={e=>h('zip',e.target.value)} placeholder="98188"/></div>
          </div>

          {/* Phone + Contact */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
            <div><label style={lbl}>Phone</label><input style={inp} value={form.phone||''} onChange={e=>h('phone',e.target.value)} placeholder="Phone"/></div>
            <div><label style={lbl}>Contact Person</label><input style={inp} value={form.contact||''} onChange={e=>h('contact',e.target.value)} placeholder="Contact name"/></div>
          </div>

          {/* Date + Time */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:12 }}>
            <div><label style={lbl}>Date Available</label><input type="date" style={inp} value={form.date_avail||''} onChange={e=>h('date_avail',e.target.value)}/></div>
            <div><label style={lbl}>Date Thru</label><input type="date" style={inp} value={form.date_thru||''} onChange={e=>h('date_thru',e.target.value)}/></div>
            <div><label style={lbl}>Open Time</label><input type="time" style={inp} value={form.time_from||'08:00'} onChange={e=>h('time_from',e.target.value)}/></div>
            <div><label style={lbl}>Close Time</label><input type="time" style={inp} value={form.time_to||'16:00'} onChange={e=>h('time_to',e.target.value)}/></div>
          </div>

          {/* Appt + Reference */}
          <div style={{ display:'grid',gridTemplateColumns:'auto 1fr 1fr',gap:12,alignItems:'center',marginBottom:12 }}>
            <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer' }}>
              <input type="checkbox" checked={form.appt_required} onChange={e=>h('appt_required',e.target.checked)} style={{ width:16,height:16 }}/>
              Appointment Required
            </label>
            <div><label style={lbl}>Appt Reference</label><input style={inp} value={form.appt_ref||''} onChange={e=>h('appt_ref',e.target.value)}/></div>
            <div><label style={lbl}>PO No</label><input style={inp} value={form.reference||''} onChange={e=>h('reference',e.target.value)}/></div>
          </div>

          {/* Stop Services */}
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Stop Services Required</label>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6 }}>
              {[
                { f:'liftgate_required',  label:'🔵 Liftgate'        },
                { f:'appt_required',      label:'📅 Appointment'     },
                { f:'notify_required',    label:'🔔 Notify Before'   },
                { f:'job_site',           label:'🏗️ Job Site'        },
                { f:'limited_access',     label:'⚠️ Limited Access'  },
                { f:'inside_delivery',    label:'📦 Inside Delivery' },
              ].map(svc=>(
                <label key={svc.f}
                  style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                    border:`1px solid ${form[svc.f]?'#003865':'#ddd'}`,borderRadius:6,
                    background:form[svc.f]?'#e8f0fe':'#fff',cursor:'pointer',fontSize:12,
                    fontWeight:form[svc.f]?700:400,transition:'all 0.15s' }}>
                  <input type="checkbox" checked={!!form[svc.f]} onChange={e=>h(svc.f,e.target.checked)} style={{ display:'none' }}/>
                  <span>{svc.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div><label style={lbl}>Notes</label><textarea rows={2} style={{...inp,resize:'vertical'}} value={form.notes||''} onChange={e=>h('notes',e.target.value)} placeholder="Special instructions…"/></div>
            <div><label style={lbl}>Directions / Location Notes</label><textarea rows={2} style={{...inp,resize:'vertical'}} value={form.location_notes||''} onChange={e=>h('location_notes',e.target.value)} placeholder="Gate code, dock #…"/></div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex',justifyContent:'space-between',padding:'12px 18px',borderTop:'1px solid #eee',background:'#f8f8f8',borderRadius:'0 0 8px 8px',flexShrink:0 }}>
          <button onClick={onDelete} style={{ padding:'8px 16px',border:'1px solid #e53935',color:'#e53935',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer' }}>Delete Stop</button>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px',border:'1px solid #ccc',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer' }}>Cancel</button>
            <button onClick={()=>onSave(form,true)} title="Save stop and auto-add checked services to Accessorial Charges"
              style={{ padding:'8px 16px',border:'1px solid #0063A3',color:'#0063A3',background:'#fff',borderRadius:4,fontSize:12,cursor:'pointer' }}>
              Save + Add Charges
            </button>
            <button onClick={()=>onSave(form,false)} style={{ padding:'8px 22px',border:'none',background:'#003865',color:'#fff',borderRadius:4,fontSize:13,fontWeight:700,cursor:'pointer' }}>Save Stop</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Load Modal ───────────────────────────────────────────────────────────────
export function LoadModal({ open, editing, onClose, customers: customersProp }) {
  // Self-fetch customers if not passed as prop (e.g. when used from dispatch)
  const { data: selfCustomers } = useQuery({
    queryKey: ['customers-dropdown-modal'],
    queryFn: () => api.get('/customers', { params: { limit: 200 } }).then(r => r.data || r),
    enabled: open && !customersProp?.length,
  });
  const customers = customersProp?.length ? customersProp : (selfCustomers || []);
  // Load accessorial types from rate card
  const { data: accTypesData } = useQuery({
    queryKey: ['accessorial-types'],
    queryFn: () => api.get('/accessorials').then(r => (r.data.data || []).filter(a => a.is_active)),
  });
  const ACC_TYPES_DYNAMIC = (accTypesData||[]).map(t => t.name);

  const { data: locationsData } = useQuery({
    queryKey: ['locations-dropdown'],
    queryFn: () => api.get('/locations', { params:{ limit:500 } }).then(r => r.data || r),
  });

  // LC extraction state
  const [lcFile, setLcFile]         = useState(null);
  const [lcExtracting, setLcExtracting] = useState(false);
  const [lcResult, setLcResult]     = useState(null);
  const [lcError, setLcError]       = useState('');
  const lcInputRef = useRef(null);

  const extractLC = async () => {
    if (!lcFile) return;
    setLcExtracting(true);
    setLcError('');
    try {
      const fd = new FormData();
      fd.append('file', lcFile);
      const r = await api.post('/lc/extract', fd);
      const d = r.data.data;
      setLcResult(d);
      // Auto-fill form fields
      const fieldMap = {
        customer_name: d.customer_name,
        customer_id:   d.customer_id,
        carrier_id:    d.carrier_id,
        origin_name: d.origin_name, origin_address: d.origin_address,
        origin_city: d.origin_city, origin_state: d.origin_state, origin_zip: d.origin_zip,
        dest_name: d.dest_name, dest_address: d.dest_address,
        dest_city: d.dest_city, dest_state: d.dest_state, dest_zip: d.dest_zip,
        pickup_date: d.pickup_date, pickup_time: d.pickup_time,
        delivery_date: d.delivery_date, delivery_time: d.delivery_time,
        commodity: d.commodity, weight: d.weight, pieces: d.pieces,
        equipment_type: d.equipment_type || 'Dry Van',
        total_revenue: d.total_revenue,
        rate_type: d.rate_type || 'flat',
        base_rate: d.base_rate, miles: d.miles,
        po_number: d.po_number, bol_number: d.bol_number, ref_number: d.ref_number,
        special_instructions: d.special_instructions,
        requires_liftgate: d.requires_liftgate, requires_appointment: d.requires_appointment,
      };
      setForm(p => {
        const updated = { ...p };
        Object.entries(fieldMap).forEach(([k,v]) => { if (v !== null && v !== undefined && v !== '') updated[k] = v; });
        return updated;
      });
      const extras = []; if (d.customer_id) extras.push('customer linked'); if (d.carrier_id) extras.push('carrier linked'); toast.success('Rate confirmation extracted!' + (extras.length ? ' ' + extras.join(', ') + '.' : ' Review and save the load.'));
    } catch (err) {
      setLcError(err.response?.data?.message || 'Extraction failed — check your API key in Settings');
    } finally { setLcExtracting(false); }
  };
  const qc = useQueryClient();
  const [form, setForm]           = useState(EMPTY_LOAD);
  const [tab, setTab]             = useState('main');
  const [stopPopup, setStopPopup] = useState(null);
  const [printMenu, setPrintMenu] = useState(false);
  const [printDoc, setPrintDoc]   = useState(null); // 'bol'|'loadsheet'|'delivery'|'transport'|'accessorial'
  const [statusModal, setStatusModal] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showCustoms, setShowCustoms] = useState(false);

  // Draggable
  const [pos, setPos]         = useState({ x:0, y:0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPos({ x: 0, y: 0 }); // starts top-left via calc(1% + 0px)
    if (editing) {
      api.get(`/loads/${editing.id}`).then(r => {
        const l = r.data||r;
        // Load stops from saved load_stops or fallback to origin/dest fields
        const savedStops = Array.isArray(l.load_stops) && l.load_stops.length ? l.load_stops : null;
        const stops = savedStops
          ? savedStops.map(s=>({...EMPTY_STOP,...s,date_avail:s.date_avail?.slice(0,10)||'',date_thru:s.date_thru?.slice(0,10)||''}))
          : (l.stops?.length ? l.stops.map(s=>({...EMPTY_STOP,...s,date_avail:s.date_avail?.slice(0,10)||'',date_thru:s.date_thru?.slice(0,10)||''})) : [
          {...EMPTY_STOP,stop_type:'shipper',   company_name:l.origin_name||'',address:l.origin_address||'',city:l.origin_city||'',state:l.origin_state||'',zip:l.origin_zip||'',date_avail:l.pickup_date?.slice(0,10)||''},
          {...EMPTY_STOP,stop_type:'consignee', company_name:l.dest_name||'',  address:l.dest_address||'',  city:l.dest_city||'',  state:l.dest_state||'',  zip:l.dest_zip||'',  date_avail:l.delivery_date?.slice(0,10)||''},
        ]);
        const rawComm = l.load_commodities || l.commodities || [];
        const validComm = Array.isArray(rawComm) ? rawComm.filter(c => c && (c.commodity||c.weight||c.pieces||c.description)) : [];
        const commodities = validComm.length ? validComm : [{...EMPTY_COMM,commodity:l.commodity||'',weight:l.weight||'',pieces:l.pieces||''}];
        const accessorials = Array.isArray(l.accessorials) ? l.accessorials : (l.load_accessorials && Array.isArray(l.load_accessorials) ? l.load_accessorials : []);
        setForm({...EMPTY_LOAD,...l,stops,commodities,accessorials,received_date:l.received_date?.slice(0,10)||new Date().toISOString().slice(0,10),release_date:l.release_date?.slice(0,10)||''});
      }).catch(()=>toast.error('Failed to load details'));
    } else {
      // Check for cloned load data from sessionStorage
      const cloneData = sessionStorage.getItem('__cloneLoad');
      if (cloneData) {
        sessionStorage.removeItem('__cloneLoad');
        try {
          const cl = JSON.parse(cloneData);
          const stops = Array.isArray(cl.load_stops) && cl.load_stops.length
            ? cl.load_stops.map(s=>({...EMPTY_STOP,...s,date_avail:'',date_thru:''}))
            : Array.isArray(cl.stops) && cl.stops.length
              ? cl.stops.map(s=>({...EMPTY_STOP,...s,date_avail:'',date_thru:''}))
              : [{...EMPTY_STOP,stop_type:'shipper',company_name:cl.origin_name||'',address:cl.origin_address||'',city:cl.origin_city||'',state:cl.origin_state||'',zip:cl.origin_zip||''},
                 {...EMPTY_STOP,stop_type:'consignee',company_name:cl.dest_name||'',address:cl.dest_address||'',city:cl.dest_city||'',state:cl.dest_state||'',zip:cl.dest_zip||''}];
          const rawComm = cl.load_commodities || cl.commodities || [];
          const commodities = Array.isArray(rawComm) && rawComm.length ? rawComm : [{...EMPTY_COMM,commodity:cl.commodity||'',weight:cl.weight||'',pieces:cl.pieces||''}];
          const accessorials = Array.isArray(cl.load_accessorials) ? cl.load_accessorials : [];
          setForm({...EMPTY_LOAD,...cl,stops,commodities,accessorials,received_date:new Date().toISOString().slice(0,10)});
        } catch { setForm({...EMPTY_LOAD,received_date:new Date().toISOString().slice(0,10)}); }
      } else {
        setForm({...EMPTY_LOAD,received_date:new Date().toISOString().slice(0,10)});
      }
    }
    setTab('main');
  }, [open, editing]);

  useEffect(() => {
    if (!dragging) return;
    const move = e => setPos({x:e.clientX-dragStart.current.mx,y:e.clientY-dragStart.current.my});
    const up   = () => setDragging(false);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
    return ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
  }, [dragging]);

  const onMouseDown = e => {
    if (e.target.closest('input,select,textarea,button,a')) return;
    setDragging(true);
    dragStart.current = { mx:e.clientX-pos.x, my:e.clientY-pos.y };
  };

  const saveMut = useMutation({
    mutationFn: b => {
      const accSum = sumAcc(b.accessorials);
      const base   = parseFloat(b.base_rate)||0;
      const fuel   = parseFloat(b.fuel_surcharge)||0;
      const miles  = parseFloat(b.miles)||0;
      const total  = b.rate_type==='per_mile' ? (base*miles)+fuel+accSum : base+fuel+accSum;
      // Derive liftgate/appointment from stops OR accessorials
      const stops = b.stops || [];
      const accArr = Array.isArray(b.accessorials) ? b.accessorials : [];
      const accHasLiftgate = accArr.some(a =>
        a.charge_type && a.charge_type.toLowerCase().includes('liftgate')
      );
      const requires_liftgate    = stops.some(s => s.liftgate_required) || accHasLiftgate;
      const requires_appointment = stops.some(s => s.appt_required);
      // Sum weight and pieces from all commodity rows
      const comms = Array.isArray(b.commodities) ? b.commodities : [];
      const totalWeight = comms.reduce((s,c) => s + (parseFloat(c.weight)||0), 0);
      const totalPieces = comms.reduce((s,c) => s + (parseInt(c.pieces)||0), 0);
      // Build commodity string for display
      const commodityStr = comms.map(c=>c.commodity).filter(Boolean).join(', ') || b.commodity || '';

      // Map stops → origin/dest fields for backend
      const shipper   = stops.find(s=>s.stop_type==='shipper')   || stops[0] || {};
      const consignee = stops.find(s=>s.stop_type==='consignee') || stops[stops.length-1] || {};

      const payload = {
        ...b,
        accessorials: accSum.toFixed(2),
        load_accessorials: Array.isArray(b.accessorials) ? b.accessorials : [],
        load_commodities: comms,
        load_stops: stops,
        total_revenue: total.toFixed(2),
        requires_liftgate,
        requires_appointment,
        weight:    totalWeight || b.weight || null,
        pieces:    totalPieces || b.pieces || null,
        commodity: commodityStr,
        // Map shipper stop → origin fields
        origin_name:    shipper.company_name || b.origin_name || '',
        origin_address: shipper.address      || b.origin_address || '',
        origin_city:    shipper.city         || b.origin_city || '',
        origin_state:   shipper.state        || b.origin_state || '',
        origin_zip:     shipper.zip          || b.origin_zip || '',
        pickup_date:    shipper.date_avail   || b.pickup_date || null,
        pickup_time:    shipper.time_from    || b.pickup_time || null,
        // Map consignee stop → dest fields
        dest_name:      consignee.company_name || b.dest_name || '',
        dest_address:   consignee.address      || b.dest_address || '',
        dest_city:      consignee.city         || b.dest_city || '',
        dest_state:     consignee.state        || b.dest_state || '',
        dest_zip:       consignee.zip          || b.dest_zip || '',
        delivery_date:  consignee.date_avail   || b.delivery_date || null,
        delivery_time:  consignee.time_from    || b.delivery_time || null,
      };
      return editing ? api.put(`/loads/${editing.id}`, payload) : api.post('/loads', payload);
    },
    onSuccess: () => { toast.success(editing?'Load updated':'Load created'); qc.invalidateQueries(['loads']); onClose(); },
    onError: e => toast.error(e.response?.data?.message||'Save failed'),
  });
  const statusMut = useMutation({
    mutationFn: ({id,status}) => api.put(`/loads/${id}/status`,{status}),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['loads']); setStatusModal(false); },
    onError: e => toast.error(e.response?.data?.message||'Failed'),
  });

  const setField = (f,v) => setForm(p=>({...p,[f]:v}));
  const setStop  = (i,f,v) => setForm(p=>{const s=[...p.stops];s[i]={...s[i],[f]:v};return{...p,stops:s};});
  const setComm  = (i,f,v) => setForm(p=>{const c=[...p.commodities];c[i]={...c[i],[f]:v};return{...p,commodities:c};});
  const setAcc = (i,f,v) => setForm(p=>{
    const a=[...p.accessorials];
    a[i]={...a[i],[f]:v};
    // Auto-fill rate from rate card when charge type selected
    if(f==='charge_type'&&v){
      const t=(accTypesData||[]).find(t=>t.name===v);
      if(t){a[i].rate=String(t.default_rate);a[i].units='1';a[i].amount=String(t.default_rate);}
    }
    return{...p,accessorials:a};
  });
  const addStop  = () => setForm(p=>({...p,stops:[...p.stops,{...EMPTY_STOP,stop_type:'stop'}]}));
  const remStop  = i  => setForm(p=>({...p,stops:p.stops.filter((_,idx)=>idx!==i)}));
  const addComm  = () => setForm(p=>({...p,commodities:[...p.commodities,{...EMPTY_COMM}]}));
  const remComm  = i  => setForm(p=>({...p,commodities:p.commodities.filter((_,idx)=>idx!==i)}));
  const addAcc   = () => setForm(p=>({...p,accessorials:[...p.accessorials,{...EMPTY_ACC}]}));
  const remAcc   = i  => setForm(p=>({...p,accessorials:p.accessorials.filter((_,idx)=>idx!==i)}));

  const saveStopPopup  = s  => { setForm(p=>{const st=[...p.stops];st[stopPopup.idx]=s;return{...p,stops:st};}); setStopPopup(null); };
  const deleteStopPopup = () => { if(form.stops.length<=2){toast.error('Minimum 2 stops');return;} remStop(stopPopup.idx); setStopPopup(null); };

  const accTotalNum = sumAcc(form.accessorials);
  const base   = parseFloat(form.base_rate)||0;
  const fuel   = parseFloat(form.fuel_surcharge)||0;
  const miles  = parseFloat(form.miles)||0;
  const totalRev = form.rate_type==='per_mile' ? (base*miles)+fuel+accTotalNum : base+fuel+accTotalNum;
  const customer = (customers||[]).find(c=>c.id===form.customer_id);

  const handlePrint = (type) => {
    setPrintMenu(false);
    const args = { load:{...form,total_revenue:totalRev,load_number:editing?.load_number||'NEW',truck_unit:editing?.truck_unit}, stops:form.stops, commodities:form.commodities, accessorials:form.accessorials, customer };
    if (type==='bol')         { setPrintDoc('bol'); return; }
    if (type==='loadsheet')   { printHTML(buildLoadsheetHTML(args),   `Loadsheet ${editing?.load_number||''}`); return; }
    if (type==='delivery')    { printHTML(buildDeliveryReceiptHTML(args), `Delivery Receipt ${editing?.load_number||''}`); return; }
    if (type==='transport')   { printHTML(buildTransportAgreementHTML(args), `Transport Agreement ${editing?.load_number||''}`); return; }
    if (type==='accessorial') { printHTML(buildAccessorialNotifHTML(args), `Accessorial Notification ${editing?.load_number||''}`); return; }
  };

  if (!open) return null;

  const printItems = [
    { label:'Bill of Lading',          key:'bol' },
    { label:'Loadsheet',               key:'loadsheet' },
    { label:'Delivery Receipt',        key:'delivery' },
    { label:'Transport Agreement',     key:'transport' },
    { label:'Accessorial Notification',key:'accessorial' },
  ];

  return (
    <>
      <div style={{ position:'fixed',inset:0,zIndex:1100,background:'rgba(0,0,0,0.35)',pointerEvents:'none' }} />
      <div style={{
        position:'fixed', zIndex:1200,
        top: pos.y === 0 ? '2%' : `${pos.y}px`,
        left: pos.x === 0 ? '50%' : `${pos.x}px`,
        transform: pos.x === 0 ? 'translateX(-50%)' : 'none',
        width:'90vw', maxWidth:1100, height:'90vh', maxHeight:'90vh',
        background:'#fff', borderRadius:6, boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
        display:'flex', flexDirection:'column', overflow:'hidden',
        cursor: dragging?'grabbing':'default',
      }}>
        {/* Title bar */}
        <div onMouseDown={onMouseDown} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 14px',background:'#003865',color:'#fff',flexShrink:0,cursor:'grab',userSelect:'none' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            {/* Print dropdown */}
            <div style={{ position:'relative' }}>
              <button onClick={e=>{e.stopPropagation();setPrintMenu(p=>!p);}}
                style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.35)',color:'#fff',padding:'3px 10px',borderRadius:3,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                <Printer size={13}/> Print <ChevronDown size={11}/>
              </button>
              {printMenu && (
                <div onClick={e=>e.stopPropagation()} style={{ position:'absolute',top:'100%',left:0,background:'#fff',border:'1px solid #ccc',borderRadius:4,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',zIndex:9999,minWidth:210,marginTop:3 }}>
                  {printItems.map(item=>(
                    <div key={item.key} onClick={()=>handlePrint(item.key)}
                      style={{ padding:'9px 16px',fontSize:13,color:'#222',cursor:'pointer',borderBottom:'1px solid #f0f0f0',transition:'background 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f0f4f8'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Broker Sheet button */}
            {editing && (
              <button
                onClick={e=>{e.stopPropagation(); setShowCustoms(true);}}
                style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.35)',color:'#fff',padding:'3px 10px',borderRadius:3,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                📋 Broker Sheet
              </button>
            )}
            <span style={{ fontWeight:700,fontSize:15 }}>{editing?`Load: ${editing.load_number}`:'New Load'}</span>
            {editing && <span style={{ background:'rgba(255,255,255,0.2)',padding:'2px 10px',borderRadius:3,fontSize:12 }}>{STATUS_LABELS[editing.status]||editing.status}</span>}
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>

            <button onClick={e=>{e.stopPropagation();saveMut.mutate(form);}} disabled={saveMut.isPending}
              style={{ background:'#00A3E0',border:'none',color:'#fff',padding:'5px 18px',borderRadius:4,fontWeight:700,fontSize:13,cursor:'pointer' }}>
              {saveMut.isPending?'Saving…':'Save'}
            </button>
            <button onClick={e=>{e.stopPropagation();onClose();}} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer',padding:4 }}><X size={18}/></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',borderBottom:'2px solid #dde3ea',background:'#f0f4f8',flexShrink:0 }}>
          {[['main','Load Details'],['docs','Documents'],['activity','Activity']].map(([id,label])=>(
            <button key={id} onClick={()=>id==='docs'?setShowDocUpload(true):setTab(id)} style={{ padding:'8px 20px',border:'none',background:'transparent',fontSize:13,fontWeight:tab===id&&id!=='docs'?700:400,color:tab===id&&id!=='docs'?'#003865':'#666',borderBottom:tab===id&&id!=='docs'?'2px solid #003865':'2px solid transparent',cursor:'pointer' }}>{label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:'auto' }}>
          {/* LC Upload — new loads only */}
          {!editing && (
            <div style={{margin:'8px 16px 4px',padding:'9px 14px',background:'#f3e5f5',border:'1px solid #ce93d8',borderRadius:6}}>
              <div style={{fontSize:11,fontWeight:700,color:'#6A1B9A',marginBottom:5,display:'flex',alignItems:'center',gap:5}}>
                🤖 Auto-fill from Rate Confirmation PDF
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <input ref={lcInputRef} type="file" accept="application/pdf" style={{display:'none'}}
                  onChange={e=>{ if(e.target.files[0]){setLcFile(e.target.files[0]);setLcResult(null);setLcError('');} }}/>
                <button type="button" onClick={()=>lcInputRef.current?.click()}
                  style={{padding:'4px 10px',border:'1px solid #9c27b0',color:'#6A1B9A',background:'#fff',borderRadius:4,fontSize:11,cursor:'pointer'}}>
                  📎 {lcFile ? lcFile.name.slice(0,28)+'…' : 'Select LC / Rate Confirmation'}
                </button>
                {lcFile && (
                  <button type="button" onClick={extractLC} disabled={lcExtracting}
                    style={{padding:'4px 12px',border:'none',background:'#6A1B9A',color:'#fff',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    {lcExtracting ? '⏳ Extracting…' : '🤖 Extract & Fill Form'}
                  </button>
                )}
                {lcResult && <span style={{fontSize:11,color:'#2e7d32',fontWeight:600}}>✓ Fields auto-filled from LC</span>}
                {lcError  && <span style={{fontSize:11,color:'#c62828'}}>{lcError}</span>}
              </div>
              {!lcFile && <div style={{fontSize:10,color:'#888',marginTop:3}}>Upload Rate Confirmation PDF → AI auto-fills all load details</div>}
            </div>
          )}

          {tab==='main' && (
            <div>
              {/* Bill To + Right */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:'1px solid #dde' }}>
                <div style={{ padding:'12px 16px',borderRight:'1px solid #dde' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse' }}><tbody>
                    <tr>
                      <td style={{ fontSize:12,fontWeight:600,color:'#555',paddingBottom:6,paddingRight:10,whiteSpace:'nowrap',width:68 }}>Bill To</td>
                      <td style={{ paddingBottom:6 }}>
                        <select name="customer_id" style={{ width:'100%',padding:'5px 8px',border:'1px solid #ccc',borderRadius:3,fontSize:13,fontWeight:600,color:'#003865' }} value={form.customer_id} onChange={e=>setField('customer_id',e.target.value)}>
                          <option value="">Select customer…</option>
                          {(customers||[]).map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
                        </select>
                      </td>
                    </tr>
                    {customer && <tr><td/><td style={{ fontSize:12,color:'#0063A3',lineHeight:1.7,paddingBottom:4 }}>
                      {customer.address_line1&&<div>{customer.address_line1}</div>}
                      {(customer.city||customer.state)&&<div>{[customer.city,customer.state,customer.postal_code].filter(Boolean).join(', ')}</div>}
                      {customer.phone&&<div>{customer.phone}</div>}
                    </td></tr>}
                    <tr>
                      <td style={{ fontSize:12,fontWeight:600,color:'#555',paddingRight:10,paddingTop:6 }}>Reference</td>
                      <td style={{ paddingTop:6 }}><input style={{ width:'100%',padding:'4px 8px',border:'1px solid #ccc',borderRadius:3,fontSize:12 }} value={form.ref_number||''} onChange={e=>setField('ref_number',e.target.value)} placeholder="Customer reference…" /></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize:12,fontWeight:600,color:'#555',paddingRight:10,paddingTop:6,verticalAlign:'top' }}>Notes</td>
                      <td style={{ paddingTop:6 }}><textarea style={{ width:'100%',padding:'4px 8px',border:'1px solid #ccc',borderRadius:3,fontSize:12,resize:'vertical',minHeight:44 }} value={form.notes||''} onChange={e=>setField('notes',e.target.value)} /></td>
                    </tr>
                  </tbody></table>
                </div>
                <div style={{ padding:'12px 16px' }}>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'7px 10px' }}>
                    {[
                      {label:'Bill Miles',f:'bill_miles',t:'number',ph:'0'},
                      {label:'Received',f:'received_date',t:'date'},
                      {label:'Release',f:'release_date',t:'date'},
                      {label:'Equipment',f:'equipment_type',t:'select',opts:EQUIPMENT},
                      {label:'Load Type',f:'load_type',t:'text',ph:'e.g. LTL, FTL'},
                      {label:'Trailer / BOL #',f:'bol_number',t:'text',ph:'Trailer/BOL #'},
                      {label:'Temperature',f:'temperature',t:'text',ph:'e.g. -18°C'},
                      {label:'Seal No',f:'seal_number',t:'text'},
                      {label:'Pallets',f:'pallets',t:'number',ph:'0'},
                      {label:'Salesman',f:'salesman',t:'text'},
                      {label:'Ref 1',f:'ref1',t:'text'},
                      {label:'PO Number',f:'po_number',t:'text'},
                    ].map(({label,f,t,opts,ph})=>(
                      <div key={f}>
                        <label style={{ fontSize:10,fontWeight:700,color:'#666',textTransform:'uppercase',letterSpacing:'0.04em',display:'block',marginBottom:2 }}>{label}</label>
                        {t==='select'
                          ? <select style={{ width:'100%',padding:'4px 6px',border:'1px solid #ccc',borderRadius:3,fontSize:12 }} value={form[f]||''} onChange={e=>setField(f,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                          : <input type={t} style={{ width:'100%',padding:'4px 6px',border:'1px solid #ccc',borderRadius:3,fontSize:12 }} value={form[f]||''} onChange={e=>setField(f,e.target.value)} placeholder={ph} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex',gap:16,marginTop:8 }}>
                    <label style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,cursor:'pointer' }}><input type="checkbox" checked={form.team_load||false} onChange={e=>setField('team_load',e.target.checked)}/> Team Load</label>
                    <label style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,cursor:'pointer' }}><input type="checkbox" checked={form.exchange_load||false} onChange={e=>setField('exchange_load',e.target.checked)}/> Exchange</label>
                  </div>
                </div>
              </div>

              {/* Disp/Acc Pay bar */}
              <div style={{ display:'flex',gap:12,padding:'7px 16px',background:'#f0f4f8',borderBottom:'1px solid #dde3ea',alignItems:'center',flexWrap:'wrap' }}>
                {[['Disp Pay','disp_pay'],['Acc Pay','acc_pay']].map(([l,f])=>(
                  <div key={f} style={{ display:'flex',alignItems:'center',gap:5 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:'#555' }}>{l}</span>
                    <input type="number" step="0.01" style={{ width:75,padding:'3px 6px',border:'1px solid #ccc',borderRadius:3,fontSize:12 }} value={form[f]||''} onChange={e=>setField(f,e.target.value)} placeholder="0.00" />
                  </div>
                ))}
                <div style={{ flex:1,display:'flex',alignItems:'center',gap:5 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:'#555',whiteSpace:'nowrap' }}>Broadcast Notes</span>
                  <input style={{ flex:1,padding:'3px 8px',border:'1px solid #ccc',borderRadius:3,fontSize:12 }} value={form.broadcast_notes||''} onChange={e=>setField('broadcast_notes',e.target.value)} />
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:'#003865' }}>Miles</span>
                  <input type="number" style={{ width:70,padding:'3px 6px',border:'1px solid #99b',borderRadius:3,fontSize:12,fontWeight:700,color:'#003865' }} value={form.miles||''} onChange={e=>setField('miles',e.target.value)} placeholder="0" />
                </div>
                <div style={{ padding:'4px 14px',background:'#003865',color:'#fff',borderRadius:3,fontSize:13,fontWeight:700 }}>Revenue: ${totalRev.toFixed(2)}</div>
              </div>

              {/* Stops */}
              <div style={{ padding:'8px 16px',borderBottom:'1px solid #dde' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase',letterSpacing:'0.06em' }}>Stops</span>
                  <button onClick={addStop} style={{ background:'none',border:'1px solid #003865',color:'#003865',padding:'2px 10px',borderRadius:3,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:3 }}><Plus size={11}/> Add Stop</button>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                      {form.stops.map((stop,i)=>{
                        const typeColor = stop.stop_type==='shipper'?'#0063A3':stop.stop_type==='consignee'?'#2E7D32':'#888';
                        const typeBg    = stop.stop_type==='shipper'?'#E3F2FD':stop.stop_type==='consignee'?'#E8F5E9':'#f5f5f5';
                        return (
                        <div key={i} style={{ border:'1px solid #e0e0e0',borderRadius:6,overflow:'hidden',
                          borderLeft:`4px solid ${typeColor}`,background:'#fff' }}>
                          {/* Stop header row — click to open popup */}
                          <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#fafafa',borderBottom:'1px solid #f0f0f0',cursor:'pointer' }}
                            onClick={()=>setStopPopup({idx:i,stop:{...stop}})}>
                            <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:typeBg,color:typeColor,textTransform:'uppercase',flexShrink:0 }}>
                              {i+1} · {stop.stop_type==='shipper'?'Shipper':stop.stop_type==='consignee'?'Consignee':'Stop'}
                            </span>
                            <span style={{ fontWeight:700,fontSize:13,color:'#003865',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                              {stop.company_name||<span style={{ color:'#aaa',fontWeight:400 }}>Click to add company…</span>}
                            </span>
                            {stop.liftgate_required&&<span style={{ fontSize:10,color:'#0063A3',fontWeight:600,flexShrink:0 }}>🔵 LG</span>}
                            {stop.appt_required&&<span style={{ fontSize:10,color:'#E65100',fontWeight:600,flexShrink:0 }}>📅 APPT</span>}
                            {stop.notify_required&&<span style={{ fontSize:10,color:'#6A1B9A',fontWeight:600,flexShrink:0 }}>🔔 NOTIFY</span>}
                            {stop.job_site&&<span style={{ fontSize:10,color:'#795548',fontWeight:600,flexShrink:0 }}>🏗️ SITE</span>}
                            {stop.limited_access&&<span style={{ fontSize:10,color:'#B71C1C',fontWeight:600,flexShrink:0 }}>⚠️ LTD</span>}
                            {stop.inside_delivery&&<span style={{ fontSize:10,color:'#1B5E20',fontWeight:600,flexShrink:0 }}>📦 INSIDE</span>}
                            <span style={{ fontSize:11,color:'#aaa',flexShrink:0 }}>✏️ Edit</span>
                          </div>
                          {/* Stop detail row — inline fields */}
                          <div style={{ display:'grid',gridTemplateColumns:'1fr 100px 100px 80px 80px auto',gap:6,padding:'8px 12px',alignItems:'center' }}>
                            <div style={{ fontSize:12,color:'#555' }}>
                              {[stop.address,stop.city,stop.state,stop.zip].filter(Boolean).join(', ')||
                                <span style={{ color:'#bbb',fontSize:11,fontStyle:'italic' }}>No address — click Edit</span>}
                            </div>
                            <div>
                              <div style={{ fontSize:9,fontWeight:700,color:'#aaa',textTransform:'uppercase',marginBottom:1 }}>Date</div>
                              <input type="date" style={{ ...CI,width:'100%',fontSize:11 }} value={stop.date_avail||''} onChange={e=>setStop(i,'date_avail',e.target.value)}/>
                            </div>
                            <div>
                              <div style={{ fontSize:9,fontWeight:700,color:'#aaa',textTransform:'uppercase',marginBottom:1 }}>Open</div>
                              <input type="time" style={{ ...CI,width:'100%',fontSize:11 }} value={stop.time_from||'08:00'} onChange={e=>setStop(i,'time_from',e.target.value)}/>
                            </div>
                            <div>
                              <div style={{ fontSize:9,fontWeight:700,color:'#aaa',textTransform:'uppercase',marginBottom:1 }}>Close</div>
                              <input type="time" style={{ ...CI,width:'100%',fontSize:11 }} value={stop.time_to||'16:00'} onChange={e=>setStop(i,'time_to',e.target.value)}/>
                            </div>
                            <div>
                              <div style={{ fontSize:9,fontWeight:700,color:'#aaa',textTransform:'uppercase',marginBottom:1 }}>LG</div>
                              <input type="checkbox" checked={!!stop.liftgate_required} onChange={e=>setStop(i,'liftgate_required',e.target.checked)} style={{ width:16,height:16,marginTop:2 }}/>
                            </div>
                            {form.stops.length>2&&(
                              <button onClick={()=>remStop(i)} title="Remove stop"
                                style={{ background:'none',border:'none',cursor:'pointer',color:'#c00',padding:'2px',fontSize:16,lineHeight:1 }}>×</button>
                            )}
                          </div>
                        </div>
                        );
                      })}
              </div>
              </div>

              {/* Commodity + Accessorials */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:'1px solid #dde' }}>
                {/* Commodity */}
                <div style={{ padding:'8px 16px',borderRight:'1px solid #dde' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase',letterSpacing:'0.06em' }}>Commodity</span>
                    <button onClick={addComm} style={{ background:'none',border:'1px solid #003865',color:'#003865',padding:'1px 8px',borderRadius:3,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:2 }}><Plus size={10}/> Add</button>
                  </div>
                  <div style={{ overflowX:'auto',border:'1px solid #ddd',borderRadius:4 }}>
                    <table style={{ borderCollapse:'collapse',fontSize:12,width:'100%' }}>
                      <thead><tr>{['Commodity','Ref','Desc','Wgt','Pcs','Spc','Notes',''].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                      <tbody>
                        <tr><td colSpan={8} onClick={addComm} style={{ ...TD,padding:'3px 8px',color:'#0063A3',cursor:'pointer',background:'#f8fafd',fontStyle:'italic',fontSize:11 }}>&lt;Add New&gt;</td></tr>
                        {form.commodities.map((c,i)=>(
                          <tr key={i}>
                            <td style={TD}><input style={{ ...CI,width:105 }} value={c.commodity} onChange={e=>setComm(i,'commodity',e.target.value)} placeholder="e.g. WOOD PRODUC" /></td>
                            <td style={TD}><input style={{ ...CI,width:65 }} value={c.reference} onChange={e=>setComm(i,'reference',e.target.value)} /></td>
                            <td style={TD}><input style={{ ...CI,width:100 }} value={c.description} onChange={e=>setComm(i,'description',e.target.value)} /></td>
                            <td style={TD}><input type="number" style={{ ...CI,width:55 }} value={c.weight} onChange={e=>setComm(i,'weight',e.target.value)} /></td>
                            <td style={TD}><input type="number" style={{ ...CI,width:40 }} value={c.pieces} onChange={e=>setComm(i,'pieces',e.target.value)} /></td>
                            <td style={TD}><input style={{ ...CI,width:38 }} value={c.spc} onChange={e=>setComm(i,'spc',e.target.value)} /></td>
                            <td style={TD}><input style={{ ...CI,width:90 }} value={c.notes} onChange={e=>setComm(i,'notes',e.target.value)} /></td>
                            <td style={{ ...TD,width:22 }}><button onClick={()=>remComm(i)} style={{ background:'none',border:'none',cursor:'pointer',color:'#c00',padding:'2px' }}><Trash2 size={12}/></button></td>
                          </tr>
                        ))}
                        {form.commodities.length>0&&(
                          <tr style={{ background:'#f5f5f5',fontWeight:700 }}>
                            <td colSpan={3} style={{ ...TD,padding:'4px 8px',fontSize:11,color:'#555' }}>Totals</td>
                            <td style={{ ...TD,padding:'4px 6px',fontSize:12 }}>{form.commodities.reduce((s,c)=>s+(parseFloat(c.weight)||0),0)||''}</td>
                            <td style={{ ...TD,padding:'4px 6px',fontSize:12 }}>{form.commodities.reduce((s,c)=>s+(parseInt(c.pieces)||0),0)||''}</td>
                            <td colSpan={3} style={TD}></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accessorials */}
                <div style={{ padding:'8px 16px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:'#003865',textTransform:'uppercase',letterSpacing:'0.06em' }}>Accessorial Charges</span>
                    <button onClick={addAcc} style={{ background:'#003865',border:'none',color:'#fff',padding:'2px 10px',borderRadius:3,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:2 }}><Plus size={10}/> Add Accessorial</button>
                  </div>
                  <div style={{ overflowX:'auto',border:'1px solid #ddd',borderRadius:4 }}>
                    <table style={{ borderCollapse:'collapse',fontSize:12,width:'100%' }}>
                      <thead><tr>{['Accessorial','Ref','Rate','Units','Amt','Pay','App','Notes',''].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                      <tbody>
                        <tr><td colSpan={9} onClick={addAcc} style={{ ...TD,padding:'3px 8px',color:'#0063A3',cursor:'pointer',background:'#f8fafd',fontStyle:'italic',fontSize:11 }}>&lt;Add New&gt;</td></tr>
                        {form.accessorials.map((a,i)=>(
                          <tr key={i}>
                            <td style={TD}><select style={{ ...CI,width:115 }} value={a.charge_type} onChange={e=>setAcc(i,'charge_type',e.target.value)}><option value="">Select…</option>{(ACC_TYPES_DYNAMIC.length>0?ACC_TYPES_DYNAMIC:['Detention','TONU','Layover','Lumper','Fuel Advance','Overweight','Extra Stop','Re-consignment','Storage','Other']).map(t=><option key={t}>{t}</option>)}</select></td>
                            <td style={TD}><input style={{ ...CI,width:60 }} value={a.reference} onChange={e=>setAcc(i,'reference',e.target.value)} /></td>
                            <td style={TD}><input type="number" step="0.01" style={{ ...CI,width:58 }} value={a.rate} onChange={e=>{const r=e.target.value,amt=((parseFloat(r)||0)*(parseFloat(a.units)||0)).toFixed(2);setAcc(i,'rate',r);setAcc(i,'amount',amt);}} /></td>
                            <td style={TD}><input type="number" step="0.5" style={{ ...CI,width:40 }} value={a.units} onChange={e=>{const u=e.target.value,amt=((parseFloat(a.rate)||0)*(parseFloat(u)||0)).toFixed(2);setAcc(i,'units',u);setAcc(i,'amount',amt);}} /></td>
                            <td style={TD}><input type="number" step="0.01" style={{ ...CI,width:60 }} value={a.amount} onChange={e=>setAcc(i,'amount',e.target.value)} /></td>
                            <td style={{ ...TD,textAlign:'center',width:28 }}><input type="checkbox" checked={a.pay_driver} onChange={e=>setAcc(i,'pay_driver',e.target.checked)} /></td>
                            <td style={{ ...TD,textAlign:'center',width:28 }}><input type="checkbox" checked={a.approved} onChange={e=>setAcc(i,'approved',e.target.checked)} /></td>
                            <td style={TD}><input style={{ ...CI,width:85 }} value={a.notes} onChange={e=>setAcc(i,'notes',e.target.value)} /></td>
                            <td style={{ ...TD,width:22 }}><button onClick={()=>remAcc(i)} style={{ background:'none',border:'none',cursor:'pointer',color:'#c00',padding:'2px' }}><Trash2 size={12}/></button></td>
                          </tr>
                        ))}
                        {form.accessorials.length>0&&(
                          <tr style={{ background:'#f5f5f5',fontWeight:700 }}>
                            <td colSpan={4} style={{ ...TD,padding:'4px 8px',fontSize:11,color:'#555' }}>Total Accessorials</td>
                            <td style={{ ...TD,padding:'4px 6px',fontWeight:700,color:'#003865',fontSize:13 }}>${accTotalNum.toFixed(2)}</td>
                            <td colSpan={4} style={TD}></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Rate */}
                  <div style={{ marginTop:10,padding:'10px 12px',background:'#f0f4f8',borderRadius:4,border:'1px solid #dde3ea' }}>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px 10px' }}>
                      {[
                        {label:'Rate Type',f:'rate_type',t:'select',opts:[['per_mile','Per Mile'],['flat','Flat Rate'],['percentage','% of Revenue']]},
                        {label:form.rate_type==='per_mile'?'Rate/Mile ($)':'Base Rate ($)',f:'base_rate',t:'number'},
                        {label:'Fuel Surcharge ($)',f:'fuel_surcharge',t:'number'},
                      ].map(({label,f,t,opts})=>(
                        <div key={f}>
                          <label style={{ fontSize:10,fontWeight:700,color:'#555',textTransform:'uppercase',display:'block',marginBottom:2 }}>{label}</label>
                          {t==='select'
                            ? <select style={{ width:'100%',padding:'4px 6px',border:'1px solid #ccc',borderRadius:3,fontSize:12 }} value={form[f]} onChange={e=>setField(f,e.target.value)}>{opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
                            : <input type="number" step="0.0001" style={{ width:'100%',padding:'4px 6px',border:'1px solid #ccc',borderRadius:3,fontSize:12 }} value={form[f]||''} onChange={e=>setField(f,e.target.value)} />}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:8,display:'flex',justifyContent:'flex-end',gap:14,fontSize:12,flexWrap:'wrap' }}>
                      <span>Miles: <b>{form.miles||0}</b></span>
                      <span>Base: <b>${(form.rate_type==='per_mile'?base*miles:base).toFixed(2)}</b></span>
                      <span>Fuel: <b>${fuel.toFixed(2)}</b></span>
                      <span>Acc: <b>${accTotalNum.toFixed(2)}</b></span>
                      <span style={{ fontWeight:700,fontSize:13,color:'#003865' }}>Total: <b>${totalRev.toFixed(2)}</b></span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Special instructions */}
              <div style={{ padding:'8px 16px' }}>
                <label style={{ fontSize:11,fontWeight:700,color:'#555',textTransform:'uppercase' }}>Special Instructions</label>
                <textarea style={{ width:'100%',padding:'6px 8px',border:'1px solid #ccc',borderRadius:3,fontSize:12,marginTop:4,resize:'vertical',minHeight:44 }} value={form.special_instructions||''} onChange={e=>setField('special_instructions',e.target.value)} />
              </div>
            </div>
          )}
          {showDocUpload && editing && (
            <DocsPopup entityType="load" entityId={editing.id}
              title={`Documents — ${editing.load_number}`} docTypes={LOAD_DOCS}
              onClose={()=>setShowDocUpload(false)} />
          )}
          {tab==='activity' && <div style={{ padding:16 }}>{editing?<ActivityLog loadId={editing.id}/>:<p style={{ color:'#999',fontSize:13 }}>No activity yet.</p>}</div>}
        </div>

        {/* Footer */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 16px',borderTop:'1px solid #dde',background:'#f8f8f8',flexShrink:0 }}>
          <div style={{ fontSize:12,color:'#666' }}>{editing?`Load #${editing.load_number} · ${STATUS_LABELS[editing.status]||editing.status}`:'New load — fill in details above'}</div>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={onClose} style={{ padding:'6px 16px',border:'1px solid #ccc',borderRadius:4,background:'#fff',fontSize:13,cursor:'pointer' }}>Cancel</button>
            <button onClick={()=>saveMut.mutate(form)} disabled={saveMut.isPending} style={{ padding:'6px 22px',border:'none',borderRadius:4,background:'#003865',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer' }}>
              {saveMut.isPending?'Saving…':editing?'Save Changes':'Create Load'}
            </button>
          </div>
        </div>
      </div>

      {stopPopup && (
        <StopInfoPopup
          stop={stopPopup.stop}
          onSave={saveStopPopup}
          onDelete={deleteStopPopup}
          onClose={()=>setStopPopup(null)}
          locations={locationsData || []}
        />
      )}



      {printDoc==='bol' && (
        <BOLPrint
          load={{ ...form, load_number:editing?.load_number||'NEW', truck_unit:editing?.truck_unit, total_revenue:totalRev, accessorials_arr:form.accessorials }}
          stops={form.stops}
          commodities={form.commodities}
          onClose={()=>setPrintDoc(null)}
        />
      )}
      {showCustoms && editing?.id && (
        <CustomsPopup
          loadId={editing.id}
          loadNumber={editing.load_number}
          customsType={form.customs_type || editing.customs_type || 'PAPS'}
          pieces={form.total_pieces || editing.total_pieces || 0}
          onClose={() => setShowCustoms(false)}
        />
      )}
    </>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
function ActivityLog({ loadId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['load-activity', loadId],
    queryFn: () => api.get(`/loads/${loadId}`).then(r=>r.data.data?.status_events||[]),
    enabled: !!loadId,
  });
  if (isLoading) return <Spinner />;
  const events = data || [];
  if (!events.length) return <p style={{ color:'#999',fontSize:13 }}>No activity recorded yet.</p>;
  return (
    <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
      <thead><tr style={{ background:'#f5f5f5' }}>{['Posted By','Type','Date','Time','Notes'].map(h=><th key={h} style={{ ...TH,padding:'7px 12px' }}>{h}</th>)}</tr></thead>
      <tbody>
        {events.map((e,i)=>{
          const dt=new Date(e.created_at);
          return (
            <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
              <td style={{ padding:'7px 12px',fontWeight:600 }}>{e.changed_by_name||'System'}</td>
              <td style={{ padding:'7px 12px',color:'#0063A3',fontWeight:600 }}>LN</td>
              <td style={{ padding:'7px 12px',color:'#666' }}>{dt.toLocaleDateString()}</td>
              <td style={{ padding:'7px 12px',color:'#666' }}>{dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td>
              <td style={{ padding:'7px 12px',color:'#666' }}>{e.note||`Status: ${e.status?.replace(/_/g,' ')}`}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Main Loads page ──────────────────────────────────────────────────────────
export default function Loads() {
  const qc = useQueryClient();
  const [page,setPage]     = useState(1);
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('');
  const [specialFilter,setSpecialFilter] = useState('');
  const [modal,setModal]   = useState(false);
  const [editing,setEditing] = useState(null);
  const [confirmDel,setConfirmDel] = useState(null);
  const [docUpload,setDocUpload]   = useState(null);
  const [tenderLoad,setTenderLoad] = useState(null);
  const { menu,openMenu,closeMenu } = useContextMenu();
  const [searchParams, setSearchParams] = useSearchParams();
  const [custFilter,setCustFilter] = useState('');
  const [driverFilter,setDriverFilter] = useState('');
  const [dateFrom,setDateFrom] = useState('');
  const [dateTo,setDateTo]     = useState('');
  const [showCols,setShowCols] = useState({
    load_num:true, customer:true, origin:true, dest:true,
    pu_date:true, del_date:true, pieces:true, weight:true,
    equip:true, services:true, driver:true, revenue:true,
    margin:true, status:true, reference:false, miles:false,
  });
  const [showColPicker,setShowColPicker] = useState(false);

  // Auto-open load from ?load=LD-XXXX query param (e.g. from Invoicing page)
  useEffect(() => {
    const loadNum = searchParams.get('load');
    if (!loadNum) return;
    // Wait for data, then find and open the matching load
    api.get('/loads', { params: { search: loadNum, limit: 5 } }).then(r => {
      const match = (r.data.data || []).find(l => l.load_number === loadNum);
      if (match) {
        setEditing(match);
        setModal(true);
        setSearch(loadNum);
      }
      setSearchParams({}, { replace: true }); // clear the param
    }).catch(() => setSearchParams({}, { replace: true }));
  }, []); // eslint-disable-line

  const { data,isLoading } = useQuery({
    queryKey: ['loads',page,search,status,custFilter,driverFilter,dateFrom,dateTo],
    queryFn: ()=>api.get('/loads',{params:{page,limit:20,search,status,
      customer_id:custFilter||undefined,
      driver_name:driverFilter||undefined,
      from:dateFrom||undefined,
      to:dateTo||undefined,
    }}).then(r=>r),
    keepPreviousData:true,
  });
  const { data:customers } = useQuery({
    queryKey:['customers-dropdown'],
    queryFn:()=>api.get('/customers',{params:{limit:200}}).then(r=>r.data||r),
  });
  const { data:driversData } = useQuery({
    queryKey:['drivers-dropdown'],
    queryFn:()=>api.get('/drivers',{params:{limit:200}}).then(r=>r.data.data),
  });
  const { data:carriersData } = useQuery({
    queryKey:['carriers-dropdown'],
    queryFn:()=>api.get('/carriers',{params:{limit:200}}).then(r=>r.data.data),
  });
  // Batch fetch tender statuses for visible loads
  const loadIds = (data?.data||[]).map(l=>l.id);
  const { data:tenderStatusMap } = useQuery({
    queryKey:['tender-status-batch',loadIds.join(',')],
    queryFn:()=>api.get('/loads/tenders/batch',{params:{load_ids:loadIds}}).then(r=>r.data.data||{}),
    enabled:loadIds.length>0,
    staleTime:15000,
  });

  const cancelMut = useMutation({
    mutationFn: id=>api.delete(`/loads/${id}`),
    onSuccess:()=>{toast.success('Load cancelled');qc.invalidateQueries(['loads']);setConfirmDel(null);},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });
  const invMut = useMutation({
    mutationFn: id=>api.post('/invoices',{load_id:id}),
    onSuccess:()=>{toast.success('Invoice created');qc.invalidateQueries(['invoices']);},
    onError:e=>toast.error(e.response?.data?.message||'Failed'),
  });

  const openModal  = (l=null)=>{ setEditing(l); setModal(true); };
  const closeModal = ()=>{ setModal(false); setEditing(null); };

  const cloneLoad = async (l) => {
    try {
      const r = await api.get(`/loads/${l.id}`);
      const src = r.data.data;
      const cloned = { ...src };
      // Strip fields that should not carry over
      delete cloned.id; delete cloned.load_number; delete cloned.status;
      delete cloned.received_date; delete cloned.release_date;
      delete cloned.pickup_date; delete cloned.delivery_date;
      delete cloned.bol_number; delete cloned.driver_id; delete cloned.driver_name;
      delete cloned.truck_id; delete cloned.trailer_id; delete cloned.trip_id;
      delete cloned.created_at; delete cloned.updated_at;
      delete cloned.status_events;
      sessionStorage.setItem('__cloneLoad', JSON.stringify(cloned));
      setEditing(null);
      setModal(true);
      toast.success(`Duplicating ${l.load_number}`);
    } catch { toast.error('Failed to load details for cloning'); }
  };

  const rowCtx = useCallback((e,l)=>openMenu(e,[
    {label:'Edit load',               icon:Edit,       action:()=>openModal(l),                                               shortcut:'E'},
    {label:'Assign driver / carrier', icon:Truck,      action:()=>{window.location.href='/dispatch';},                       shortcut:'D'},
    {label:'Duplicate load',          icon:Copy,       action:()=>cloneLoad(l)},
    {label:'Tender to carrier',      icon:Send,       action:()=>setTenderLoad(l)},
    {divider:true},
    {label:'Upload BOL',              icon:Upload,     action:()=>setDocUpload({id:l.id,label:l.load_number,docType:'bol'})},
    {label:'Upload POD',              icon:Upload,     action:()=>setDocUpload({id:l.id,label:l.load_number,docType:'pod'})},
    {label:'Upload Rate Confirmation',icon:Upload,     action:()=>setDocUpload({id:l.id,label:l.load_number,docType:'rate_confirmation'})},
    {divider:true},
    {label:'Generate invoice',        icon:DollarSign, action:()=>{if(window.confirm(`Generate invoice for ${l.load_number}?`))invMut.mutate(l.id);}},
    {label:'Email rate confirmation', icon:Mail,       action:()=>toast('Email coming in Phase 2')},
    {divider:true},
    {label:'Copy load #',             icon:Copy,       action:()=>{navigator.clipboard.writeText(l.load_number);toast.success('Copied!');}},
    {label:'Copy pickup address',     icon:Copy,       action:()=>{navigator.clipboard.writeText(`${l.origin_city}, ${l.origin_state}`);toast.success('Copied!');}},
    {label:'Copy delivery address',   icon:Copy,       action:()=>{navigator.clipboard.writeText(`${l.dest_city}, ${l.dest_state}`);toast.success('Copied!');}},
    {divider:true},
    {label:'Cancel load',icon:X,danger:true,action:()=>setConfirmDel(l)},
  ]),[openMenu]);

  const rows=data?.data||[]; const paging=data?.pagination;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Loads</h1><p className="page-subtitle">{paging?.total||0} total loads</p></div>
        <button className="btn btn-primary" onClick={()=>openModal()}><Plus size={14}/>New Load</button>
      </div>
      {/* ── Trimble-style Search Bar ── */}
      <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'10px 12px',marginBottom:10}}>
        {/* Row 1 — Search + Status + Customer + Driver */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
          <div style={{position:'relative',flex:'2',minWidth:180}}>
            <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF'}}/>
            <input style={{width:'100%',paddingLeft:28,padding:'6px 8px 6px 28px',border:'1px solid #D1D5DB',borderRadius:5,fontSize:12,outline:'none',boxSizing:'border-box'}}
              placeholder="Search load #, customer, city, reference…"
              value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>
          <select style={{flex:1,minWidth:130,padding:'6px 8px',border:'1px solid #D1D5DB',borderRadius:5,fontSize:12,background:'#fff'}}
            value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>
            <option value="">All Status</option>
            {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select style={{flex:1,minWidth:140,padding:'6px 8px',border:'1px solid #D1D5DB',borderRadius:5,fontSize:12,background:'#fff'}}
            value={custFilter} onChange={e=>{setCustFilter(e.target.value);setPage(1);}}>
            <option value="">All Customers</option>
            {(customers||[]).map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <select style={{flex:1,minWidth:130,padding:'6px 8px',border:'1px solid #D1D5DB',borderRadius:5,fontSize:12,background:'#fff'}}
            value={driverFilter} onChange={e=>{setDriverFilter(e.target.value);setPage(1);}}>
            <option value="">All Drivers</option>
            {(driversData||[]).map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
          </select>
          <button onClick={()=>qc.invalidateQueries(['loads'])}
            style={{padding:'6px 8px',border:'1px solid #D1D5DB',background:'#fff',borderRadius:5,cursor:'pointer',display:'flex',alignItems:'center',color:'#6B7280'}}>
            <RefreshCw size={13}/>
          </button>
        </div>
        {/* Row 2 — Date range + Quick filters + Column picker */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:11,color:'#6B7280',fontWeight:600,whiteSpace:'nowrap'}}>PU Date:</span>
            <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}}
              style={{padding:'4px 7px',border:'1px solid #D1D5DB',borderRadius:5,fontSize:12,width:135}}/>
            <span style={{fontSize:11,color:'#9CA3AF'}}>to</span>
            <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}}
              style={{padding:'4px 7px',border:'1px solid #D1D5DB',borderRadius:5,fontSize:12,width:135}}/>
          </div>
          <div style={{width:1,background:'#E5E7EB',alignSelf:'stretch'}}/>
          {/* Status chips */}
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {[['','All'],['available','Available'],['on_dock','On Dock'],['en_route','En Route'],['delivered','Delivered'],['invoiced','Invoiced'],['cancelled','Cancelled']].map(([val,label])=>(
              <button key={val} onClick={()=>{setStatus(val);setPage(1);}}
                style={{padding:'3px 9px',border:`1px solid ${status===val?'#003865':'#D1D5DB'}`,
                  background:status===val?'#003865':'#fff',color:status===val?'#fff':'#555',
                  borderRadius:12,fontSize:11,fontWeight:status===val?700:400,cursor:'pointer'}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{width:1,background:'#E5E7EB',alignSelf:'stretch'}}/>
          {/* Special filters */}
          {[['liftgate','🔵 LG'],['appt','📅 Appt'],['reefer','❄️ Reefer']].map(([key,label])=>(
            <button key={key} onClick={()=>setSpecialFilter(f=>f===key?'':key)}
              style={{padding:'3px 9px',border:`1px solid ${specialFilter===key?'#0063A3':'#D1D5DB'}`,
                background:specialFilter===key?'#EFF6FF':'#fff',color:specialFilter===key?'#0063A3':'#555',
                borderRadius:12,fontSize:11,fontWeight:specialFilter===key?700:400,cursor:'pointer'}}>
              {label}
            </button>
          ))}
          {/* Clear filters */}
          {(search||status||custFilter||driverFilter||dateFrom||dateTo||specialFilter)&&(
            <button onClick={()=>{setSearch('');setStatus('');setCustFilter('');setDriverFilter('');setDateFrom('');setDateTo('');setSpecialFilter('');setPage(1);}}
              style={{padding:'3px 9px',border:'1px solid #FECACA',background:'#FEF2F2',color:'#DC2626',borderRadius:12,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
              <X size={10}/> Clear
            </button>
          )}
          {/* Column picker */}
          <div style={{marginLeft:'auto',position:'relative'}}>
            <button onClick={()=>setShowColPicker(p=>!p)}
              style={{padding:'4px 10px',border:'1px solid #D1D5DB',background:showColPicker?'#003865':'#fff',
                color:showColPicker?'#fff':'#374151',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
              ⚙ Columns
            </button>
            {showColPicker&&(
              <div style={{position:'absolute',right:0,top:'110%',background:'#fff',border:'1px solid #E5E7EB',borderRadius:6,
                boxShadow:'0 8px 24px rgba(0,0,0,0.12)',padding:'10px 14px',zIndex:100,minWidth:180}}>
                <div style={{fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Show / Hide Columns</div>
                {[
                  ['reference','Reference #'],
                  ['miles','Miles'],
                  ['pieces','Pieces'],
                  ['weight','Weight'],
                  ['equip','Equipment'],
                  ['services','LG / Appt'],
                  ['margin','Margin %'],
                ].map(([key,label])=>(
                  <label key={key} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,cursor:'pointer',padding:'3px 0'}}>
                    <input type="checkbox" checked={!!showCols[key]}
                      onChange={e=>setShowCols(p=>({...p,[key]:e.target.checked}))}/>
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{fontSize:12,color:'#666',padding:'4px 0'}}>Showing {rows.length} of {paging?.total||0} loads</div>
      <div className="table-wrapper">
        {isLoading?<Spinner/>:!rows.length?(
          <EmptyState title="No loads yet" action={<button className="btn btn-primary" onClick={()=>openModal()}><Plus size={14}/>New Load</button>}/>
        ):(
          <table>
            <thead><tr>
                {[
                  {key:'load_num', label:'Load #', always:true},
                  {key:'customer', label:'Customer', always:true},
                  {key:'reference', label:'Ref #'},
                  {key:'origin', label:'Origin', always:true},
                  {key:'dest', label:'Destination', always:true},
                  {key:'pu_date', label:'PU Date'},
                  {key:'del_date', label:'Del Date'},
                  {key:'pieces', label:'Pcs', align:'right'},
                  {key:'weight', label:'Wgt', align:'right'},
                  {key:'equip', label:'Equip'},
                  {key:'miles', label:'Miles', align:'right'},
                  {key:'services', label:'🔵LG / 📅Appt', align:'center'},
                  {key:'driver', label:'Driver', always:true},
                  {key:'revenue', label:'Revenue', always:true, align:'right'},
                  {key:'margin', label:'Margin'},
                  {key:'status', label:'Status', always:true},
                ].filter(c=>c.always||showCols[c.key]).map(c=>(
                  <th key={c.key} style={{fontSize:11,fontWeight:700,padding:'6px 8px',background:'#003865',color:'#fff',whiteSpace:'nowrap',textAlign:c.align||'left'}}>{c.label}</th>
                ))}
              </tr></thead>
            <tbody>
              {rows.map(l=>{
                const stops = l.stops || [];
                const lgPU  = stops.some(s=>s.liftgate_required&&s.stop_type==='shipper');
                const lgDEL = stops.some(s=>s.liftgate_required&&s.stop_type==='consignee');
                const lgAny = l.requires_liftgate;
                const apPU  = stops.some(s=>s.appt_required&&s.stop_type==='shipper');
                const apDEL = stops.some(s=>s.appt_required&&s.stop_type==='consignee');
                const apAny = l.requires_appointment;
                const hasSvc = lgAny||apAny;
                return (
                <tr key={l.id} onContextMenu={e=>rowCtx(e,l)} onDoubleClick={()=>openModal(l)}
                  style={{
                    borderBottom:'1px solid #e0e0e0',cursor:'pointer',
                    borderLeft: l.requires_liftgate&&l.requires_appointment?'4px solid #7B1FA2'
                              : l.requires_liftgate?'4px solid #1565C0'
                              : l.requires_appointment?'4px solid #E65100'
                              :'4px solid transparent',
                    background: l.requires_liftgate&&l.requires_appointment?'#F3E5F5'
                              : l.requires_liftgate?'#E3F2FD'
                              : l.requires_appointment?'#FFF8E1'
                              :'#fff',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.filter='brightness(0.95)'}
                  onMouseLeave={e=>e.currentTarget.style.filter=''}>
                  {/* Load # — always */}
                  <td style={{fontWeight:700,fontFamily:'monospace',fontSize:12,padding:'5px 8px',whiteSpace:'nowrap'}}>{l.load_number}</td>
                  {/* Customer — always */}
                  <td style={{fontSize:12,padding:'5px 8px',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.customer_name}</td>
                  {/* Reference — optional */}
                  {showCols.reference&&<td style={{fontSize:11,padding:'5px 8px',color:'#6B7280',whiteSpace:'nowrap'}}>{l.ref_number||l.po_number||'—'}</td>}
                  {/* Origin — always */}
                  <td style={{fontSize:11,padding:'5px 8px',color:'#555',whiteSpace:'nowrap'}}>{l.origin_city}, {l.origin_state}</td>
                  {/* Dest — always */}
                  <td style={{fontSize:11,padding:'5px 8px',color:'#555',whiteSpace:'nowrap'}}>{l.dest_city}, {l.dest_state}</td>
                  {/* PU Date */}
                  {showCols.pu_date&&<td style={{fontSize:11,padding:'5px 8px',color:'#666',whiteSpace:'nowrap'}}>{l.pickup_date?new Date(l.pickup_date).toLocaleDateString('en-CA',{month:'numeric',day:'numeric'}):'—'}</td>}
                  {/* Del Date */}
                  {showCols.del_date&&<td style={{fontSize:11,padding:'5px 8px',color:'#666',whiteSpace:'nowrap'}}>{l.delivery_date?new Date(l.delivery_date).toLocaleDateString('en-CA',{month:'numeric',day:'numeric'}):'—'}</td>}
                  {/* Pieces */}
                  {showCols.pieces&&<td style={{fontSize:11,padding:'5px 8px',textAlign:'right',color:'#555'}}>{l.pieces||'—'}</td>}
                  {/* Weight */}
                  {showCols.weight&&<td style={{fontSize:11,padding:'5px 8px',textAlign:'right',color:'#555',whiteSpace:'nowrap'}}>{l.weight?`${parseFloat(l.weight).toLocaleString()} lb`:'—'}</td>}
                  {/* Equipment */}
                  {showCols.equip&&<td style={{fontSize:11,padding:'5px 8px',whiteSpace:'nowrap'}}><span style={{fontSize:10,padding:'1px 5px',background:'#e8edf2',borderRadius:3}}>{l.equipment_type||'—'}</span></td>}
                  {/* Miles */}
                  {showCols.miles&&<td style={{fontSize:11,padding:'5px 8px',textAlign:'right',color:'#6B7280'}}>{l.miles?parseFloat(l.miles).toLocaleString():'—'}</td>}
                  {/* Services */}
                  {showCols.services&&<td style={{padding:'5px 8px',textAlign:'center',whiteSpace:'nowrap',minWidth:80}}>
                    {hasSvc?(
                      <span style={{fontSize:11,display:'flex',flexWrap:'wrap',gap:2,justifyContent:'center'}}>
                        {(lgPU||(!stops.length&&lgAny))&&<span title="Liftgate at Pickup" style={{background:'#e3f2fd',color:'#0063A3',padding:'1px 4px',borderRadius:3,fontWeight:700,fontSize:10}}>🔵PU</span>}
                        {lgDEL&&<span title="Liftgate at Delivery" style={{background:'#e3f2fd',color:'#0063A3',padding:'1px 4px',borderRadius:3,fontWeight:700,fontSize:10}}>🔵DEL</span>}
                        {(!lgPU&&!lgDEL&&lgAny)&&<span title="Liftgate required" style={{background:'#e3f2fd',color:'#0063A3',padding:'1px 4px',borderRadius:3,fontWeight:700,fontSize:10}}>🔵LG</span>}
                        {(apPU||(!stops.length&&apAny))&&<span title="Appointment at Pickup" style={{background:'#fff3e0',color:'#E65100',padding:'1px 4px',borderRadius:3,fontWeight:700,fontSize:10}}>📅PU</span>}
                        {apDEL&&<span title="Appointment at Delivery" style={{background:'#fff3e0',color:'#E65100',padding:'1px 4px',borderRadius:3,fontWeight:700,fontSize:10}}>📅DEL</span>}
                        {(!apPU&&!apDEL&&apAny)&&<span title="Appointment required" style={{background:'#fff3e0',color:'#E65100',padding:'1px 4px',borderRadius:3,fontWeight:700,fontSize:10}}>📅APPT</span>}
                      </span>
                    ):<span style={{color:'#ddd',fontSize:11}}>—</span>}
                  </td>}
                  {/* Driver — always */}
                  <td style={{fontSize:11,padding:'5px 8px'}}>{l.driver_name||<span style={{color:'var(--danger)',fontSize:11}}>Unassigned</span>}</td>
                  {/* Revenue — always */}
                  <td style={{fontSize:12,padding:'5px 8px',fontWeight:600,textAlign:'right',whiteSpace:'nowrap'}}><Currency value={l.total_revenue}/></td>
                  {/* Margin — optional */}
                  {showCols.margin&&(()=>{
                    const rev=parseFloat(l.total_revenue)||0;
                    const cost=parseFloat(l.carrier_rate)||parseFloat(l.disp_pay)||0;
                    if(!cost||!rev) return <td style={{fontSize:11,padding:'5px 8px',color:'#9CA3AF',textAlign:'center'}}>—</td>;
                    const m$=rev-cost;
                    const pct=Math.round((m$/rev)*100);
                    const color=pct>=30?'#059669':pct>=15?'#15803D':pct>=0?'#D97706':'#DC2626';
                    const bg=pct>=30?'#ECFDF5':pct>=15?'#F0FDF4':pct>=0?'#FFFBEB':'#FEF2F2';
                    return <td style={{padding:'5px 8px',textAlign:'center'}} title={`Revenue: $${rev.toFixed(2)}\nCost: $${cost.toFixed(2)}\nMargin: $${m$.toFixed(2)} (${pct}%)`}>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:10,background:bg,color,display:'inline-block'}}>{pct}%</span>
                      <div style={{fontSize:9,color:'#6B7280',marginTop:1}}>${m$.toLocaleString('en-CA',{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
                    </td>;
                  })()}
                  {/* Status — always */}
                  <td style={{padding:'5px 8px',whiteSpace:'nowrap'}}>
                    <StatusBadge status={l.status}/>
                    {tenderStatusMap?.[l.id]==='pending'&&<span style={{marginLeft:4,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:8,background:'#FFFBEB',color:'#D97706',border:'1px solid #FDE68A'}}>Tendered</span>}
                    {tenderStatusMap?.[l.id]==='accepted'&&<span style={{marginLeft:4,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:8,background:'#ECFDF5',color:'#059669',border:'1px solid #A7F3D0'}}>Confirmed</span>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={paging} onPage={setPage}/>
      <ContextMenu {...menu} onClose={closeMenu}/>
      <Confirm open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={()=>cancelMut.mutate(confirmDel?.id)} danger title="Cancel Load" message={`Cancel load ${confirmDel?.load_number}?`}/>
      <DocUploadModal open={!!docUpload} onClose={()=>setDocUpload(null)} entityType="load" entityId={docUpload?.id} entityLabel={docUpload?.label} docTypes={LOAD_DOC_TYPES}/>
      <LoadModal open={modal} editing={editing} onClose={closeModal} customers={customers}/>
      {tenderLoad&&<TenderModal open={!!tenderLoad} load={tenderLoad} carriers={carriersData||[]} onClose={()=>setTenderLoad(null)}/>}
    </div>
  );
}
