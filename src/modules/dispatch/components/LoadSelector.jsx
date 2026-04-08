import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';
import { groupLoadsByDate } from '../utils/tripCalculations';

export default function LoadSelector({ loads, selected, setSelected, tripType }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => loads.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return [l.load_number, l.customer_name, l.origin_city, l.dest_city]
      .some(f => f?.toLowerCase().includes(s));
  }), [loads, search]);

  const groups = useMemo(() => groupLoadsByDate(filtered), [filtered]);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleSection = (sectionLoads) => {
    const ids = sectionLoads.map(l => l.id);
    const allIn = ids.every(id => selected.includes(id));
    setSelected(p => allIn ? p.filter(x => !ids.includes(x)) : [...new Set([...p, ...ids])]);
  };

  const today = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  const tom = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  const da = new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

  return (
    <div className="ct-section">
      <label className="ct-label">{tripType === 'outbound' ? 'Select Dock Loads' : 'Select Loads'}</label>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <Search size={13} style={{ position: 'absolute', left: 8, top: 7, color: 'var(--text-muted)' }} />
        <input className="ct-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search loads..." style={{ paddingLeft: 26 }} />
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {tripType === 'outbound' ? (
          <DateSection label="ON DOCK" loads={filtered} selected={selected}
            onToggle={toggle} onToggleAll={toggleSection} defaultOpen dock />
        ) : (
          <>
            <DateSection label={`TODAY \u2014 ${today}`} loads={groups.today} selected={selected}
              onToggle={toggle} onToggleAll={toggleSection} defaultOpen />
            <DateSection label={`TOMORROW \u2014 ${tom}`} loads={groups.tomorrow} selected={selected}
              onToggle={toggle} onToggleAll={toggleSection} />
            <DateSection label={`DAY AFTER \u2014 ${da}`} loads={groups.dayAfter} selected={selected}
              onToggle={toggle} onToggleAll={toggleSection} />
            <DateSection label="FUTURE" loads={groups.future} selected={selected}
              onToggle={toggle} onToggleAll={toggleSection} />
            <DateSection label="NO PICKUP DATE SET" loads={groups.noDate} selected={selected}
              onToggle={toggle} onToggleAll={toggleSection} defaultOpen />
          </>
        )}
      </div>
    </div>
  );
}

function DateSection({ label, loads, selected, onToggle, onToggleAll, defaultOpen, dock }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (!loads.length && !dock) return null;
  const allIn = loads.length > 0 && loads.every(l => selected.includes(l.id));

  return (
    <div className="load-select-section">
      <div className="load-select-header" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <input type="checkbox" checked={allIn && loads.length > 0}
          onChange={() => onToggleAll(loads)} onClick={e => e.stopPropagation()} />
        <span>{label} ({loads.length})</span>
      </div>
      {open && loads.map(l => (
        <div key={l.id} className={`load-select-row ${selected.includes(l.id) ? 'selected' : ''}`}>
          <input type="checkbox" checked={selected.includes(l.id)} onChange={() => onToggle(l.id)} />
          <span className="ls-num">{l.load_number}</span>
          <span className="ls-cust">{l.customer_name}</span>
          <span className="ls-route">{l.origin_city}\u2192{l.dest_city}</span>
          <span className="ls-pcs">{l.pieces}pcs</span>
          <span className="ls-wt">{l.weight ? Number(l.weight).toLocaleString() + 'lb' : ''}</span>
          <span className="ls-rev">{formatCurrency(l.total_revenue || l.revenue)}</span>
          <span className="ls-flags">
            {l.requires_appointment && '\u{1F514}'}
            {l.requires_liftgate && '\u2B06\uFE0F'}
            {l.residential && '\u{1F3E0}'}
            {l.construction_site && '\u{1F6A7}'}
          </span>
        </div>
      ))}
    </div>
  );
}
