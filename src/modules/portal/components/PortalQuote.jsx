import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EQUIPMENT = ['Dry Van', '53ft Dry Van', '48ft Dry Van', 'Flatbed', 'Reefer', 'Straight Truck', 'Sprinter Van'];

export default function PortalQuote({ portalApi }) {
  const [form, setForm] = useState({
    origin_city: '', origin_state: '', dest_city: '', dest_state: '',
    equipment: 'Dry Van', pieces: '', weight: '', commodity: '', notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.origin_city || !form.dest_city) { toast.error('Origin and destination required'); return; }
    setSaving(true);
    try {
      const res = await portalApi.post('/portal/quotes', form);
      setSubmitted(res.data?.quote_number || res.quote_number || true);
    } catch { toast.error('Failed to submit quote'); }
    setSaving(false);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <CheckCircle size={48} style={{ color: '#059669', marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C2B3A', marginBottom: 8 }}>Quote Submitted!</h2>
        {typeof submitted === 'string' && <p style={{ color: '#4D82B8', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{submitted}</p>}
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>We'll review your request and contact you shortly with a rate.</p>
        <button onClick={() => { setSubmitted(false); setForm({ origin_city: '', origin_state: '', dest_city: '', dest_state: '', equipment: 'Dry Van', pieces: '', weight: '', commodity: '', notes: '' }); }}
          style={{ padding: '8px 20px', background: '#4D82B8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Submit Another Quote
        </button>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #D1D9E0', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-family)' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B3A', marginBottom: 16 }}>Request a Quote</h2>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', padding: 24, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 16 }}>
            <div><label style={labelStyle}>Origin City</label>
              <input style={inputStyle} value={form.origin_city} onChange={e => set('origin_city', e.target.value)} placeholder="e.g. Surrey" required /></div>
            <div><label style={labelStyle}>Prov/State</label>
              <input style={inputStyle} value={form.origin_state} onChange={e => set('origin_state', e.target.value)} placeholder="BC" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 16 }}>
            <div><label style={labelStyle}>Destination City</label>
              <input style={inputStyle} value={form.dest_city} onChange={e => set('dest_city', e.target.value)} placeholder="e.g. Kelowna" required /></div>
            <div><label style={labelStyle}>Prov/State</label>
              <input style={inputStyle} value={form.dest_state} onChange={e => set('dest_state', e.target.value)} placeholder="BC" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={labelStyle}>Equipment</label>
              <select style={inputStyle} value={form.equipment} onChange={e => set('equipment', e.target.value)}>
                {EQUIPMENT.map(e => <option key={e} value={e}>{e}</option>)}
              </select></div>
            <div><label style={labelStyle}>Pieces</label>
              <input style={inputStyle} type="number" value={form.pieces} onChange={e => set('pieces', e.target.value)} /></div>
            <div><label style={labelStyle}>Weight (lbs)</label>
              <input style={inputStyle} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Commodity</label>
            <input style={inputStyle} value={form.commodity} onChange={e => set('commodity', e.target.value)} placeholder="General Freight, Building Materials, etc." />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Special requirements, timing, etc." />
          </div>
          <button type="submit" disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px', background: '#4D82B8', color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <Send size={14} /> {saving ? 'Submitting...' : 'Request This Quote'}
          </button>
        </form>
      </div>
    </div>
  );
}
