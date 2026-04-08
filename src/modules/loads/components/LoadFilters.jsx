import React from 'react';
import { Search, RefreshCw, Download, Columns } from 'lucide-react';
import { LOAD_STATUSES, EQUIPMENT_TYPES } from '../../../shared/utils/constants';

const STATUS_LABELS = {
  '': 'All', available: 'Available', dispatched: 'Dispatched',
  in_transit: 'In Transit', delivered: 'Delivered', on_dock: 'On Dock', cancelled: 'Cancelled',
};

export default function LoadFilters({ filters, counts, onChange, onRefresh, customers, drivers, carriers }) {
  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 });
  const toggle = (key) => set(key, !filters[key]);

  return (
    <div className="loads-filters">
      {/* Row 1 — Search boxes */}
      <div className="loads-filters-row">
        <div className="loads-filter-search">
          <Search size={12} className="loads-filter-search-icon" />
          <input className="form-input loads-filter-input" placeholder="Load #, customer, ref..."
            value={filters.search || ''} onChange={e => set('search', e.target.value)}
            style={{ paddingLeft: 26, width: 200 }} />
        </div>

        <select className="form-input loads-filter-input" style={{ width: 160 }}
          value={filters.customerId || ''} onChange={e => set('customerId', e.target.value)}>
          <option value="">All Customers</option>
          {customers.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <input className="form-input loads-filter-input" placeholder="Origin City" style={{ width: 110 }}
          value={filters.originCity || ''} onChange={e => set('originCity', e.target.value)} />

        <input className="form-input loads-filter-input" placeholder="Dest City" style={{ width: 110 }}
          value={filters.destCity || ''} onChange={e => set('destCity', e.target.value)} />

        <select className="form-input loads-filter-input" style={{ width: 140 }}
          value={filters.driverId || ''} onChange={e => set('driverId', e.target.value)}>
          <option value="">All Drivers</option>
          {drivers.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <select className="form-input loads-filter-input" style={{ width: 140 }}
          value={filters.carrierId || ''} onChange={e => set('carrierId', e.target.value)}>
          <option value="">All Carriers</option>
          {carriers.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select className="form-input loads-filter-input" style={{ width: 120 }}
          value={filters.equipment || ''} onChange={e => set('equipment', e.target.value)}>
          <option value="">All Equipment</option>
          {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Row 2 — Dates, status pills, flag toggles, actions */}
      <div className="loads-filters-row">
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>PU:</span>
        <input type="date" className="form-input loads-filter-input" style={{ width: 125 }}
          value={filters.dateFrom || ''} onChange={e => set('dateFrom', e.target.value)} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>to</span>
        <input type="date" className="form-input loads-filter-input" style={{ width: 125 }}
          value={filters.dateTo || ''} onChange={e => set('dateTo', e.target.value)} />

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <div className="loads-status-pills">
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <button key={val}
              className={`loads-status-pill ${(filters.status || '') === val ? 'active' : ''}`}
              onClick={() => set('status', val)}>
              {label}
              {counts[val] !== undefined && <span className="pill-count">{counts[val]}</span>}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button className={`loads-flag-btn ${filters.liftgate ? 'active' : ''}`} onClick={() => toggle('liftgate')}>
          LG
        </button>
        <button className={`loads-flag-btn ${filters.appointment ? 'active' : ''}`} onClick={() => toggle('appointment')}>
          Appt
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />

        <button className="loads-flag-btn" onClick={onRefresh} title="Refresh"><RefreshCw size={12} /></button>
        <button className="loads-flag-btn" title="Export CSV"><Download size={12} /></button>
      </div>
    </div>
  );
}
