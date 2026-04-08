import React from 'react';

export default function ModulePlaceholder({ title, subtitle }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{title}</div>
          {subtitle && <div className="page-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title} Module</div>
          <div style={{ fontSize: 12 }}>This module will be built in a future step.</div>
        </div>
      </div>
    </div>
  );
}
