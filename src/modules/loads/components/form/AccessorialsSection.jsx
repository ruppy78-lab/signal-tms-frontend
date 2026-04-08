import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../../shared/utils/formatters';

const CHARGES = [
  { type: 'Liftgate Pickup', rate: 75 },
  { type: 'Liftgate Delivery', rate: 75 },
  { type: 'Residential Pickup', rate: 50 },
  { type: 'Residential Delivery', rate: 50 },
  { type: 'Inside Pickup', rate: 75 },
  { type: 'Inside Delivery', rate: 75 },
  { type: 'Limited Access Pickup', rate: 75 },
  { type: 'Limited Access Delivery', rate: 75 },
  { type: 'Detention', rate: 75, unit: '/hr' },
  { type: 'Re-delivery', rate: 125 },
  { type: 'Storage', rate: 25, unit: '/day' },
  { type: 'Notify Before Delivery', rate: 25 },
  { type: 'Sort & Segregate', rate: 50 },
  { type: 'Fuel Surcharge', rate: 0, unit: '%' },
  { type: 'Custom Charge', rate: 0 },
];

export default function AccessorialsSection({ accessorials: rawAcc, onChange }) {
  const accessorials = Array.isArray(rawAcc) ? rawAcc : [];
  const [selected, setSelected] = useState('');
  const [amount, setAmount] = useState('');

  const handleSelect = (e) => {
    const val = e.target.value;
    setSelected(val);
    const ch = CHARGES.find(c => c.type === val);
    setAmount(ch ? String(ch.rate) : '');
  };

  const handleAdd = () => {
    if (!selected) return;
    const amt = parseFloat(amount) || 0;
    onChange([...accessorials, { charge_type: selected, description: '', rate: amt, units: 1, amount: amt }]);
    setSelected('');
    setAmount('');
  };
  const remove = (i) => onChange(accessorials.filter((_, j) => j !== i));
  const total = accessorials.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);

  const selStyle = {
    flex: 1, maxWidth: 420, height: 28, fontSize: 11, padding: '0 6px',
    border: '1px solid var(--input-border)', borderRadius: 5,
    background: 'var(--form-bg)', fontFamily: 'var(--font-family)', color: 'var(--input-text)',
  };
  const inputStyle = {
    width: 90, height: 28, fontSize: 11, padding: '0 6px',
    border: '1px solid var(--input-border)', borderRadius: 5,
    background: 'var(--form-bg)', fontFamily: 'var(--font-family)', color: 'var(--input-text)',
    textAlign: 'right',
  };

  return (
    <div>
      {/* Add Charge — Dropdown + Amount + Add button */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 10 }}>
        <select value={selected} onChange={handleSelect} style={selStyle}>
          <option value="">— Add Charge —</option>
          {CHARGES.map(c => (
            <option key={c.type} value={c.type}>
              {c.type} — {c.rate > 0 ? `$${c.rate.toFixed(2)}` : '$0.00'}{c.unit || ''}
            </option>
          ))}
        </select>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 4, fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none' }}>$</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" style={{ ...inputStyle, paddingLeft: 14 }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <button onClick={handleAdd} disabled={!selected}
          className="btn btn-sm btn-primary"
          style={{ height: 28, fontSize: 11, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 3,
            opacity: selected ? 1 : 0.5 }}>
          <Plus size={11} /> Add
        </button>
      </div>

      {/* Active Charges */}
      {accessorials.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
          {accessorials.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px',
              borderBottom: '1px solid var(--border)', fontSize: 11 }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--danger)', padding: 0, display: 'flex', flexShrink: 0 }}
                onClick={() => remove(i)}><Trash2 size={10} /></button>
              <span style={{ flex: 1, color: 'var(--text-primary)' }}>{a.charge_type}</span>
              <span style={{ fontWeight: 700, color: 'var(--blue, #0063A3)', flexShrink: 0 }}>
                {formatCurrency(a.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0',
        borderTop: '2px solid var(--border-dark)', fontSize: 12, fontWeight: 700 }}>
        <span style={{ color: 'var(--text-primary)', marginRight: 8 }}>Total Accessorials:</span>
        <span style={{ color: 'var(--blue, #0063A3)' }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
