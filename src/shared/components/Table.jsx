import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function Table({ columns, data = [], onRowClick, onSort, sortField, sortDir, emptyMessage }) {
  if (!data.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        {emptyMessage || 'No data found'}
      </div>
    );
  }

  return (
    <table className="tms-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
              onClick={() => col.sortable && onSort?.(col.key)}
            >
              {col.label}
              {sortField === col.key && (
                sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
            {columns.map((col) => (
              <td key={col.key} style={{ maxWidth: col.maxWidth }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
