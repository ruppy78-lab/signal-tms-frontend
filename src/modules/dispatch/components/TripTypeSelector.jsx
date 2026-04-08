import React from 'react';
import { tripTypeLabel } from '../../../shared/utils/helpers';
import { getRoutePreview, getTripTypeIcon } from '../utils/tripCalculations';

export default function TripTypeSelector({ types, value, onChange }) {
  return (
    <div className="ct-section">
      <label className="ct-label">Trip Type</label>
      <div className="trip-type-btns">
        {types.map(t => (
          <button key={t} className={`trip-type-btn ${value === t ? 'active' : ''}`}
            onClick={() => onChange(t)}>
            <span className="trip-type-icon">{getTripTypeIcon(t)}</span>
            <span>{tripTypeLabel(t)}</span>
          </button>
        ))}
      </div>
      <div className="trip-route-preview">{getRoutePreview(value)}</div>
    </div>
  );
}
