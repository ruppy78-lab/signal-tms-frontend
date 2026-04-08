import React from 'react';
import { formatCurrency } from '../../../shared/utils/formatters';

export default function RevenueChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="card">
      <div className="card-header">Weekly Revenue (Last 8 Weeks)</div>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, padding: '0 8px' }}>
          {data.map((d, i) => {
            const height = Math.max((d.revenue / max) * 140, 4);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatCurrency(d.revenue)}
                </span>
                <div style={{
                  width: '100%', height, borderRadius: '4px 4px 0 0',
                  background: `linear-gradient(180deg, var(--primary) 0%, rgba(59,130,246,0.5) 100%)`,
                  transition: 'height 0.3s ease',
                }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{d.week}</span>
              </div>
            );
          })}
        </div>
        {!data.length && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 20 }}>
            No revenue data available
          </div>
        )}
      </div>
    </div>
  );
}
