import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const inputS = { width: '100%', padding: '8px 10px', border: '1px solid #D1D9E0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const labelS = { fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' };
const secS = { background: '#EDF2F7', color: '#2D4A6B', padding: '6px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', borderLeft: '3px solid #4D82B8', borderRadius: '0 4px 4px 0', marginBottom: 10, marginTop: 16 };

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };

export default function PickupRequestModal({ open, onClose, quoteData, portalApi }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    shipper_company: '', shipper_address: '', shipper_city: '', shipper_state: '', shipper_zip: '',
    shipper_contact: '', shipper_phone: '', shipper_date: tomorrow(), shipper_time_from: '08:00', shipper_time_to: '17:00',
    shipper_appointment: false, shipper_apt_ref: '',
    consignee_company: '', consignee_address: '', consignee_city: '', consignee_state: '', consignee_zip: '',
    consignee_contact: '', consignee_phone: '', consignee_date: '', consignee_time_from: '', consignee_time_to: '',
    consignee_appointment: false, consignee_apt_ref: '',
    commodity: 'General Freight', pieces: quoteData?.pieces || '', weight: quoteData?.weight || '', pallets: '',
    requires_liftgate_pickup: false, requires_liftgate_delivery: false, residential: false, construction_site: false, inside_delivery: false,
    po_number: '', reference_number: '', special_instructions: '',
  });
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await portalApi.post('/pickup-requests', {
        ...form, equipment_type: quoteData?.equipment || 'Dry Van',
        agreed_rate: quoteData?.total, base_rate: quoteData?.base,
        fuel_surcharge: quoteData?.fsc || 0, accessorials: quoteData?.accTotal || 0,
        customer_name: quoteData?.customerName, customer_email: quoteData?.customerEmail,
      });
      setSubmitted(res.data?.request_number || 'Submitted');
    } catch (e) { toast.error(e.message || 'Submit failed'); }
    setSaving(false);
  };

  if (!open) return null;

  if (submitted) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 40, width: 420, textAlign: 'center' }}>
        <CheckCircle size={48} style={{ color: '#059669', marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C2B3A', marginBottom: 8 }}>Pickup Request Submitted!</h2>
        <p style={{ color: '#4D82B8', fontSize: 16, fontWeight: 700 }}>{submitted}</p>
        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>You will receive a confirmation email. Our team will review within 2 business hours.</p>
        <button onClick={onClose} style={{ padding: '8px 24px', background: '#4D82B8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Close</button>
      </div>
    </div>
  );

  const fmt = v => '$' + (parseFloat(v) || 0).toFixed(2);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 8, width: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#1C2B3A', color: '#fff', padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>
          Step {step} of 3 — {step === 1 ? 'Booking Details' : step === 2 ? 'Freight & Services' : 'Review & Confirm'}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {step === 1 && <>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13 }}>Estimated Rate</span>
              <strong style={{ fontSize: 16, color: '#059669' }}>{fmt(quoteData?.total)}</strong>
            </div>
            <div style={secS}>Shipper (Pickup)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div style={{ gridColumn: '1/-1' }}><label style={labelS}>Company *</label><input style={inputS} value={form.shipper_company} onChange={e => set('shipper_company', e.target.value)} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={labelS}>Address *</label><input style={inputS} value={form.shipper_address} onChange={e => set('shipper_address', e.target.value)} /></div>
              <div><label style={labelS}>City *</label><input style={inputS} value={form.shipper_city} onChange={e => set('shipper_city', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={labelS}>State</label><input style={inputS} value={form.shipper_state} onChange={e => set('shipper_state', e.target.value)} /></div>
                <div><label style={labelS}>ZIP *</label><input style={inputS} value={form.shipper_zip} onChange={e => set('shipper_zip', e.target.value)} /></div>
              </div>
              <div><label style={labelS}>Contact</label><input style={inputS} value={form.shipper_contact} onChange={e => set('shipper_contact', e.target.value)} /></div>
              <div><label style={labelS}>Phone</label><input style={inputS} value={form.shipper_phone} onChange={e => set('shipper_phone', e.target.value)} /></div>
              <div><label style={labelS}>Pickup Date *</label><input style={inputS} type="date" value={form.shipper_date} onChange={e => set('shipper_date', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={labelS}>From</label><input style={inputS} type="time" value={form.shipper_time_from} onChange={e => set('shipper_time_from', e.target.value)} /></div>
                <div><label style={labelS}>To</label><input style={inputS} type="time" value={form.shipper_time_to} onChange={e => set('shipper_time_to', e.target.value)} /></div>
              </div>
            </div>
            <div style={secS}>Consignee (Delivery)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ gridColumn: '1/-1' }}><label style={labelS}>Company *</label><input style={inputS} value={form.consignee_company} onChange={e => set('consignee_company', e.target.value)} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={labelS}>Address *</label><input style={inputS} value={form.consignee_address} onChange={e => set('consignee_address', e.target.value)} /></div>
              <div><label style={labelS}>City *</label><input style={inputS} value={form.consignee_city} onChange={e => set('consignee_city', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={labelS}>State</label><input style={inputS} value={form.consignee_state} onChange={e => set('consignee_state', e.target.value)} /></div>
                <div><label style={labelS}>ZIP *</label><input style={inputS} value={form.consignee_zip} onChange={e => set('consignee_zip', e.target.value)} /></div>
              </div>
              <div><label style={labelS}>Contact</label><input style={inputS} value={form.consignee_contact} onChange={e => set('consignee_contact', e.target.value)} /></div>
              <div><label style={labelS}>Phone</label><input style={inputS} value={form.consignee_phone} onChange={e => set('consignee_phone', e.target.value)} /></div>
              <div><label style={labelS}>Delivery Date</label><input style={inputS} type="date" value={form.consignee_date} onChange={e => set('consignee_date', e.target.value)} /></div>
            </div>
          </>}

          {step === 2 && <>
            <div style={secS}>Commodity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', gap: 8, marginBottom: 12 }}>
              <div><label style={labelS}>Description *</label><input style={inputS} value={form.commodity} onChange={e => set('commodity', e.target.value)} /></div>
              <div><label style={labelS}>Pieces *</label><input style={inputS} type="number" value={form.pieces} onChange={e => set('pieces', e.target.value)} /></div>
              <div><label style={labelS}>Weight *</label><input style={inputS} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
              <div><label style={labelS}>Pallets</label><input style={inputS} type="number" value={form.pallets} onChange={e => set('pallets', e.target.value)} /></div>
            </div>
            <div style={secS}>Services</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              {[['requires_liftgate_pickup','Liftgate at Pickup'],['requires_liftgate_delivery','Liftgate at Delivery'],
                ['residential','Residential Delivery'],['construction_site','Construction Site'],['inside_delivery','Inside Delivery']].map(([k,l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} /> {l}
                </label>
              ))}
            </div>
            <div style={secS}>References</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div><label style={labelS}>PO Number</label><input style={inputS} value={form.po_number} onChange={e => set('po_number', e.target.value)} /></div>
              <div><label style={labelS}>Reference #</label><input style={inputS} value={form.reference_number} onChange={e => set('reference_number', e.target.value)} /></div>
            </div>
            <div><label style={labelS}>Special Instructions</label>
              <textarea style={{ ...inputS, resize: 'vertical' }} rows={3} value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} placeholder="Call before delivery, fragile items, dock hours..." /></div>
          </>}

          {step === 3 && <>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div style={secS}>Pickup</div>
              <p><strong>{form.shipper_company}</strong><br/>{form.shipper_address}, {form.shipper_city} {form.shipper_state} {form.shipper_zip}<br/>Date: {form.shipper_date || 'TBD'}</p>
              <div style={secS}>Delivery</div>
              <p><strong>{form.consignee_company}</strong><br/>{form.consignee_address}, {form.consignee_city} {form.consignee_state} {form.consignee_zip}<br/>Date: {form.consignee_date || 'TBD'}</p>
              <div style={secS}>Freight</div>
              <p>{form.commodity} | {form.pieces} pcs | {form.weight} lb{form.pallets ? ` | ${form.pallets} pallets` : ''}</p>
              <div style={secS}>Rate</div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>{fmt(quoteData?.total)}</p>
              {form.special_instructions && <><div style={secS}>Instructions</div><p>{form.special_instructions}</p></>}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, cursor: 'pointer', padding: '10px 12px', background: '#F7F8FA', borderRadius: 6 }}>
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
              I confirm all details are correct and accurate
            </label>
          </>}

        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose}
            style={{ padding: '8px 16px', background: '#fff', border: '1px solid #D1D9E0', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} style={{ padding: '8px 16px', background: '#4D82B8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!confirmed || saving}
              style={{ padding: '8px 20px', background: confirmed ? '#059669' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, cursor: confirmed ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
