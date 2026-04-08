import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '../../../../shared/utils/formatters';
import StopEditor from './StopEditor';

const FLAGS = {
  appointment_required: 'APT', liftgate_required: 'LG', residential: 'RES',
  construction_site: 'CON', limited_access: 'LTD', inside_delivery: 'INS', hazmat: 'HAZ',
};

export default function StopsSection({ stops, onChange }) {
  const [editing, setEditing] = useState(null);

  const saveStop = (data) => {
    const next = [...stops];
    if (editing.index !== null) next[editing.index] = { ...data, stop_number: editing.index + 1 };
    else { data.stop_type = editing.type; data.stop_number = next.length + 1; next.push(data); }
    next.forEach((s, i) => { s.stop_number = i + 1; });
    onChange(next);
    setEditing(null);
  };
  const removeStop = (i) => { const n = stops.filter((_, j) => j !== i); n.forEach((s, j) => { s.stop_number = j + 1; }); onChange(n); };

  return (
    <div className="form-section">
      <div className="form-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Stops ({stops.length})</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm btn-primary" onClick={() => setEditing({ type: 'pickup', index: null })}
            style={{ fontSize: 10, height: 22, padding: '0 8px' }}>
            <Plus size={10} /> Pickup
          </button>
          <button className="btn btn-sm btn-success" onClick={() => setEditing({ type: 'delivery', index: null })}
            style={{ fontSize: 10, height: 22, padding: '0 8px' }}>
            <Plus size={10} /> Delivery
          </button>
        </div>
      </div>

      {editing && <StopEditor stop={editing.index !== null ? { ...stops[editing.index] } : { stop_type: editing.type }}
        onSave={saveStop} onCancel={() => setEditing(null)} />}

      <table className="tms-table">
        <thead><tr>
          <th style={{ width: 24 }}>#</th><th style={{ width: 38 }}>Type</th>
          <th>Shipper / Consignee</th>
          <th style={{ width: 70 }}>Date</th><th style={{ width: 54 }}>Time</th>
          <th style={{ width: 50 }}>Wgt</th>
          <th style={{ width: 60 }}>Flags</th><th style={{ width: 44 }}></th>
        </tr></thead>
        <tbody>
          {stops.map((s, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'center' }}>{s.stop_number}</td>
              <td><span className={`badge ${s.stop_type === 'pickup' ? 'badge-pu' : 'badge-del'}`}>
                {s.stop_type === 'pickup' ? 'PU' : 'DEL'}</span></td>
              <td>{[s.company_name, [s.address, s.city, [s.state, s.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(' — ') || '—'}</td>
              <td>{formatDate(s.date)}</td>
              <td style={{ fontSize: 10 }}>{s.time_from ? s.time_from.slice(0,5) : ''}{s.time_from && s.time_to ? '–' : ''}{s.time_to && !s.time_from ? '' : ''}{s.time_to ? s.time_to.slice(0,5) : ''}</td>
              <td>{s.weight ? Number(s.weight).toLocaleString() : '—'}</td>
              <td style={{ fontSize: 9 }}>
                {Object.entries(FLAGS).map(([k, lbl]) => s[k] ?
                  <span key={k} title={k.replace(/_/g, ' ')} className="badge badge-pending"
                    style={{ fontSize: 9, padding: '0 2px', marginRight: 1 }}>{lbl}</span> : null)}
              </td>
              <td>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="btn btn-sm btn-ghost" style={{ padding: '0 3px', height: 22 }}
                    onClick={() => setEditing({ type: stops[i].stop_type, index: i })}><Edit2 size={10} /></button>
                  <button className="btn btn-sm btn-ghost" style={{ padding: '0 3px', height: 22 }}
                    onClick={() => removeStop(i)}><Trash2 size={10} /></button>
                </div>
              </td>
            </tr>
          ))}
          {!stops.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>
            No stops — click Pickup or Delivery to add</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
