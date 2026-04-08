import React from 'react';
import { Badge } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatters';
import { tripTypeLabel } from '../../../shared/utils/helpers';

export default function TripCard({ trip, onClick, selected }) {
  if (!trip) return null;

  return (
    <div
      className={`reorder-item ${selected ? 'selected' : ''}`}
      onClick={() => onClick?.(trip)}
      style={{
        cursor: 'pointer',
        borderLeft: selected ? '3px solid var(--accent)' : undefined,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{trip.trip_number}</span>
          <Badge status={trip.status} />
          <Badge status={trip.trip_type} label={tripTypeLabel(trip.trip_type)} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {trip.driver_name || 'No driver'} &middot; {trip.truck_number || 'No truck'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {trip.stop_count || 0} stops
        </div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          {formatCurrency(trip.total_revenue)}
        </div>
      </div>
    </div>
  );
}
