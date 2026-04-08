import React from 'react';
import { formatPhone } from '../../../shared/utils/formatters';

const TYPE_STYLES = {
  shipper: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'Shipper' },
  consignee: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Consignee' },
  shipper_consignee: { bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD', label: 'Both' },
  warehouse: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Warehouse' },
  terminal: { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', label: 'Terminal' },
  other: { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB', label: 'Other' },
};

export default function LocationList({ locations, onSelect }) {
  return (
    <table className="tms-table">
      <thead>
        <tr>
          <th>Name</th><th style={{ width: 80 }}>Type</th><th>Address</th>
          <th style={{ width: 130 }}>City / State</th><th style={{ width: 110 }}>Phone</th>
          <th style={{ width: 50 }}>Loads</th>
        </tr>
      </thead>
      <tbody>
        {locations.map(loc => {
          const ts = TYPE_STYLES[loc.location_type] || TYPE_STYLES.other;
          return (
            <tr key={loc.id} onClick={() => onSelect(loc)} style={{ cursor: 'pointer' }}>
              <td style={{ fontWeight: 600 }}>{loc.name}</td>
              <td>
                {loc.location_type ? (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700,
                    background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{ts.label}</span>
                ) : '—'}
              </td>
              <td>{loc.address || '—'}</td>
              <td>{loc.city}{loc.state ? `, ${loc.state}` : ''}{loc.zip ? ` ${loc.zip}` : ''}</td>
              <td>{formatPhone(loc.phone)}</td>
              <td style={{ textAlign: 'center' }}>{loc.load_count || 0}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
