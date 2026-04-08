import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Badge } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { tripTypeLabel } from '../../../shared/utils/helpers';

export default function TripsPanel({ trips = [], onSelectTrip, selectedTripId }) {
  const [typeFilter, setTypeFilter] = useState(null);

  const filtered = typeFilter
    ? trips.filter((t) => t.trip_type === typeFilter)
    : trips;

  return (
    <div className="dp-panel trips">
      <div className="dp-panel-header">
        <ClipboardList size={14} />
        ACTIVE TRIPS
        <span className="dp-count">({filtered.length})</span>
      </div>
      <div className="dp-panel-body">
        <table className="dp-table">
          <thead>
            <tr>
              <th>Trip#</th><th>Status</th><th>Type</th>
              <th>Date</th><th>Driver</th><th>Truck</th>
              <th>Stops</th><th>Rev</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}
                className={t.id === selectedTripId ? 'selected' : ''}
                onClick={() => onSelectTrip?.(t)}
                style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600 }}>{t.trip_number}</td>
                <td><Badge status={t.status} /></td>
                <td><Badge status={t.trip_type} label={tripTypeLabel(t.trip_type)} /></td>
                <td>{formatDate(t.planned_date)}</td>
                <td>{t.driver_name || '—'}</td>
                <td>{t.truck_number || '—'}</td>
                <td>{t.load_count || t.stop_count || 0}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(t.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dp-panel-footer">
        <div className="type-filters">
          <button className={`type-filter-btn ${!typeFilter ? 'active' : ''}`}
            onClick={() => setTypeFilter(null)}>All</button>
          {['direct', 'inbound', 'outbound'].map((t) => (
            <button key={t} className={`type-filter-btn ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}>
              {tripTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
