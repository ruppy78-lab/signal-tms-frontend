import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal, Button } from '../../../shared/components';
import { formatCurrency, formatWeight } from '../../../shared/utils/formatters';
import { tripTypeLabel } from '../../../shared/utils/helpers';
import { groupLoadsByDate, loadTotals } from '../utils/tripCalculations';

export default function LoadSelectionPopup({ tripType, loads = [], onAdd, onClose }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  const filtered = loads.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return l.load_number?.toLowerCase().includes(s) ||
      l.customer_name?.toLowerCase().includes(s) ||
      l.origin_city?.toLowerCase().includes(s) ||
      l.dest_city?.toLowerCase().includes(s);
  });

  const groups = useMemo(() => groupLoadsByDate(filtered), [filtered]);
  const selLoads = loads.filter((l) => selected.includes(l.id));
  const totals = loadTotals(selLoads);

  const toggle = (id) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleSection = (sectionLoads) => {
    const ids = sectionLoads.map((l) => l.id);
    const allIn = ids.every((id) => selected.includes(id));
    setSelected((p) =>
      allIn ? p.filter((x) => !ids.includes(x)) : [...new Set([...p, ...ids])]
    );
  };

  return (
    <Modal open onClose={onClose}
      title={`Add ${tripTypeLabel(tripType)} Loads`} size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="load-select-counter" style={{ margin: 0 }}>
            <span>{totals.count} loads</span>
            <span>{formatWeight(totals.weight)}</span>
            <span>{formatCurrency(totals.revenue)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onAdd(selected)} disabled={!selected.length}>
              Add {selected.length} Load{selected.length !== 1 ? 's' : ''} to Trip
            </Button>
          </div>
        </div>
      }>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search loads..."
          style={{
            width: '100%', padding: '6px 8px 6px 28px', fontSize: 12,
            border: '1px solid var(--border)', borderRadius: 4,
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
          }} />
      </div>

      <div style={{ maxHeight: 350, overflowY: 'auto' }}>
        <DateSection label="TODAY" loads={groups.today} selected={selected}
          onToggle={toggle} onToggleAll={toggleSection} defaultOpen />
        <DateSection label="TOMORROW" loads={groups.tomorrow} selected={selected}
          onToggle={toggle} onToggleAll={toggleSection} />
        <DateSection label="FUTURE" loads={groups.future} selected={selected}
          onToggle={toggle} onToggleAll={toggleSection} />
        <DateSection label="NO DATE" loads={groups.noDate} selected={selected}
          onToggle={toggle} onToggleAll={toggleSection} />
      </div>
    </Modal>
  );
}

function DateSection({ label, loads, selected, onToggle, onToggleAll, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (!loads.length) return null;
  const allIn = loads.every((l) => selected.includes(l.id));

  return (
    <div className="load-select-section">
      <div className="load-select-header" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <input type="checkbox" checked={allIn}
          onChange={() => onToggleAll(loads)} onClick={(e) => e.stopPropagation()} />
        <span>{label} ({loads.length})</span>
      </div>
      {open && loads.map((l) => (
        <div key={l.id} className="load-select-row">
          <input type="checkbox" checked={selected.includes(l.id)}
            onChange={() => onToggle(l.id)} />
          <span style={{ fontWeight: 600, minWidth: 60 }}>{l.load_number}</span>
          <span style={{ minWidth: 80 }}>{l.customer_name}</span>
          <span style={{ flex: 1 }}>{l.origin_city} → {l.dest_city}</span>
          <span>{l.pieces} pcs</span>
          <span>{l.weight ? Number(l.weight).toLocaleString() + ' lb' : ''}</span>
          <span style={{ fontWeight: 600 }}>{formatCurrency(l.total_revenue)}</span>
        </div>
      ))}
    </div>
  );
}
