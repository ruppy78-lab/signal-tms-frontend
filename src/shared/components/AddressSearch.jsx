import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import api from '../services/api';

export default function AddressSearch({ value, onChange, onSelect, placeholder }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q) => {
    setQuery(q);
    onChange?.(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get('/loads/address-search', { params: { q } });
        const data = res.data || res || [];
        setResults(Array.isArray(data) ? data : []);
        setOpen(data.length > 0);
      } catch (e) { setResults([]); }
    }, 250);
  };

  const pick = (addr) => {
    setQuery(addr.company_name);
    setOpen(false);
    onSelect?.(addr);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin size={12} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
        <input className="form-input" value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Type company name...'}
          style={{ paddingLeft: 26, height: 30, fontSize: 11 }} />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid var(--border)', borderRadius: 6,
          boxShadow: 'var(--shadow-lg)', maxHeight: 220, overflowY: 'auto',
        }}>
          {results.map(r => (
            <div key={r.id} onClick={() => pick(r)} style={{
              padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
              transition: 'background 0.1s',
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
               onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                <MapPin size={11} style={{ marginRight: 4, color: 'var(--primary)' }} />
                {r.company_name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, paddingLeft: 15 }}>
                {r.address && `${r.address}, `}{r.city}{r.state && `, ${r.state}`} {r.zip}
              </div>
              {r.contact_name && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 15 }}>
                  {r.contact_name}{r.phone && ` · ${r.phone}`}
                  <span style={{ float: 'right' }}>Used {r.use_count}x</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
