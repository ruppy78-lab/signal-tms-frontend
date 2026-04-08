import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Send, CheckCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import PickupRequestModal from './PickupRequestModal';
import { calculateRate, CITY_GROUPS } from '../../quotes/rateEngine';

const fmt = v => '$' + (v || 0).toFixed(2);
const inputS = { width: '100%', padding: '8px 10px', border: '1px solid #D1D9E0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

export default function FreightCalculator({ portalApi }) {
  const [pickup, setPickup] = useState('Surrey');
  const [delivery, setDelivery] = useState('Seattle');
  const [pallets, setPallets] = useState([{ count: 1, len: 48, wid: 48, ht: 60, weight: 500 }]);
  const [svc, setSvc] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pickupModal, setPickupModal] = useState(false);

  const result = useMemo(() => calculateRate({ pickupCity: pickup, deliveryCity: delivery, pallets, accessories: svc }),
    [pickup, delivery, pallets, svc]);

  const setPallet = (i, k, v) => setPallets(p => p.map((r, j) => j === i ? { ...r, [k]: Number(v) || 0 } : r));
  const addRow = () => setPallets(p => [...p, { count: 1, len: 48, wid: 48, ht: 60, weight: 0 }]);
  const removeRow = (i) => setPallets(p => p.filter((_, j) => j !== i));
  const toggleSvc = (k) => setSvc(s => ({ ...s, [k]: !s[k] }));

  const handleSubmit = async () => {
    if (result.error) { toast.error(result.error); return; }
    setSaving(true);
    try {
      const res = await portalApi.post('/portal/quotes', {
        origin_city: pickup, origin_state: result.zone?.startsWith('BC') ? 'WA' : 'BC',
        dest_city: delivery, dest_state: result.zone === 'PDX' ? 'OR' : result.zone?.startsWith('WA') ? 'WA' : 'BC',
        equipment: 'Dry Van', pieces: result.totalPieces, weight: result.totalWeight,
        estimated_rate: result.total, notes: `${result.totalSpots} spots, Zone ${result.zone}`,
      });
      const qn = res.data?.quote_number || 'Submitted';
      setSubmitted(qn);
      setTimeout(() => {
        setSubmitted(null);
        setPallets([{ count: 1, len: 48, wid: 48, ht: 60, weight: 500 }]);
        setSvc({});
      }, 5000);
    } catch { toast.error('Failed to submit'); }
    setSaving(false);
  };

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <CheckCircle size={48} style={{ color: '#059669', marginBottom: 16 }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C2B3A', marginBottom: 8 }}>Quote {submitted} has been saved!</h2>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>Our team will contact you shortly.</p>
      <button onClick={() => { setSubmitted(null); setPallets([{ count: 1, len: 48, wid: 48, ht: 60, weight: 500 }]); setSvc({}); }}
        style={{ padding: '8px 20px', background: '#4D82B8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>New Quote</button>
    </div>
  );

  const secStyle = { background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 16, overflow: 'hidden' };
  const secHead = { background: '#1C2B3A', color: '#fff', padding: '10px 14px', fontSize: 13, fontWeight: 600 };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B3A', marginBottom: 16 }}>Rate Quote Calculator</h2>

      {/* Route */}
      <div style={secStyle}>
        <div style={secHead}>Route</div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Pickup Location</label>
            <select style={inputS} value={pickup} onChange={e => setPickup(e.target.value)}>
              {CITY_GROUPS.map(g => <optgroup key={g.label} label={g.label}>{g.cities.sort().map(c => <option key={c} value={c}>{c}</option>)}</optgroup>)}
            </select></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Delivery Location</label>
            <select style={inputS} value={delivery} onChange={e => setDelivery(e.target.value)}>
              {CITY_GROUPS.map(g => <optgroup key={g.label} label={g.label}>{g.cities.sort().map(c => <option key={c} value={c}>{c}</option>)}</optgroup>)}
            </select></div>
        </div>
      </div>

      {/* Pallets */}
      <div style={secStyle}>
        <div style={secHead}>Pallet Rating Information</div>
        <div style={{ padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '6px 4px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '6px 4px' }}>Count</th><th style={{ padding: '6px 4px' }}>Length</th>
              <th style={{ padding: '6px 4px' }}>Width</th><th style={{ padding: '6px 4px' }}>Height</th>
              <th style={{ padding: '6px 4px' }}>Weight</th><th style={{ padding: '6px 4px', width: 40 }}></th>
            </tr></thead>
            <tbody>
              {pallets.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '4px', color: '#9CA3AF' }}>{i + 1}</td>
                  {['count','len','wid','ht','weight'].map(k => (
                    <td key={k} style={{ padding: '2px' }}>
                      <input type="number" value={p[k] || ''} onChange={e => setPallet(i, k, e.target.value)}
                        style={{ ...inputS, padding: '6px 8px', fontSize: 12, textAlign: 'center' }}
                        placeholder={k === 'weight' ? 'lb' : k === 'count' ? 'qty' : 'in'} />
                    </td>
                  ))}
                  <td style={{ padding: '2px' }}>
                    <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}>
                      <Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            background: '#fff', border: '1px solid #D1D9E0', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            <Plus size={12} /> Add Row</button>
        </div>
      </div>

      {/* Pickup Services */}
      <div style={secStyle}>
        <div style={secHead}>Pickup Services</div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[['liftPU','Liftgate Pickup'],['apptPU','Appointment Fee'],['limitedPU','Limited Access'],
            ['notifyPU','Notify Before'],['jobPU','Job Site']].map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!svc[k]} onChange={() => toggleSvc(k)} /> {label}
            </label>))}
        </div>
      </div>

      {/* Delivery Services */}
      <div style={secStyle}>
        <div style={secHead}>Delivery Services</div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[['liftDEL','Liftgate Delivery'],['apptDEL','Appointment Fee'],['limitedDEL','Limited Access'],
            ['notifyDEL','Notify Before'],['jobDEL','Job Site']].map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!svc[k]} onChange={() => toggleSvc(k)} /> {label}
            </label>))}
        </div>
      </div>

      {/* Result */}
      {result.error ? (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
          {result.error}
        </div>
      ) : (
        <div style={secStyle}>
          <div style={secHead}>Quote Summary</div>
          <div style={{ padding: 16 }}>
            {result.breakdown.map((line, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #E5E7EB', fontSize: 13 }}>
                <span>{line.label}</span><span>{fmt(line.amt)}</span></div>))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 18, fontWeight: 700, color: '#1C2B3A', marginTop: 8 }}>
              <span>Total</span><span>{fmt(result.total)}</span></div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{result.totalPieces} pieces, {(result.totalWeight || 0).toLocaleString()} lb</div>
          </div>
        </div>
      )}

      {/* Submit */}
      {!result.error && (<>
        <button onClick={handleSubmit} disabled={saving} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '12px', background: '#4D82B8', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}><Send size={14} /> {saving ? 'Saving...' : 'Create Quote'}</button>
        <button onClick={() => setPickupModal(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8,
        }}><Truck size={14} /> Request Pickup</button>
      </>)}

      <PickupRequestModal open={pickupModal} onClose={() => setPickupModal(false)} portalApi={portalApi}
        quoteData={{ total: result.total, base: result.baseRate || 0, fsc: 0, accTotal: result.svcTotal || 0,
          pieces: result.totalPieces, weight: result.totalWeight, equipment: 'Dry Van' }} />
    </div>
  );
}
