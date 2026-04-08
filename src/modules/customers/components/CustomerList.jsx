import React, { useState } from 'react';
import { Edit, Plus, Eye, FileText, Truck, XCircle, Globe, Key, Copy } from 'lucide-react';
import { Table, Badge, ContextMenu } from '../../../shared/components';
import { formatPhone, formatCurrency } from '../../../shared/utils/formatters';

function CreditCell({ row }) {
  const limit = parseFloat(row.credit_limit) || 0;
  const balance = parseFloat(row.outstanding_balance) || 0;
  if (!limit) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const pct = Math.round((balance / limit) * 100);
  let color = 'var(--success)';
  if (pct >= 100) color = 'var(--danger)';
  else if (pct >= 80) color = '#ea580c';
  else if (pct >= 50) color = 'var(--warning)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--gray-200)', borderRadius: 2, maxWidth: 50 }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}%</span>
    </div>
  );
}

const columns = [
  { key: 'code', label: 'Code', width: 85, sortable: true },
  { key: 'company_name', label: 'Company', sortable: true },
  { key: 'city', label: 'City', width: 100 },
  { key: 'state', label: 'State', width: 50 },
  { key: 'main_phone', label: 'Phone', width: 110, render: v => formatPhone(v) },
  { key: 'main_email', label: 'Email', maxWidth: 180 },
  { key: 'credit_limit', label: 'Credit Limit', width: 95, render: v => v ? formatCurrency(v) : '—' },
  { key: 'outstanding_balance', label: 'Balance', width: 90, render: v => v > 0 ? formatCurrency(v) : '—' },
  { key: 'credit_used', label: 'Used %', width: 80, render: (_, row) => <CreditCell row={row} /> },
  { key: 'status', label: 'Status', width: 75, render: v => <Badge status={v || 'active'} /> },
];

export default function CustomerList({ customers, onSelect, onEdit, onNewLoad, onDeactivate, onPortalAccess }) {
  const [ctx, setCtx] = useState(null);

  const handleContext = (e, row) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, row });
  };

  const ctxItems = ctx ? [
    { label: 'View Profile', icon: Eye, onClick: () => onSelect?.(ctx.row) },
    { label: 'Edit Customer', icon: Edit, onClick: () => onEdit?.(ctx.row) },
    { divider: true },
    { label: ctx.row.portal_enabled ? 'Portal Access Settings' : 'Enable Portal Access', icon: Globe, onClick: () => onPortalAccess?.(ctx.row) },
    { label: 'Reset Portal Password', icon: Key, onClick: () => onPortalAccess?.(ctx.row) },
    { divider: true },
    { label: 'New Load', icon: Plus, onClick: () => onNewLoad?.(ctx.row) },
    { label: 'Copy Customer Name', icon: Copy, onClick: () => navigator.clipboard.writeText(ctx.row.company_name) },
    { divider: true },
    { label: 'Deactivate', icon: XCircle, danger: true, onClick: () => onDeactivate?.(ctx.row) },
  ] : [];

  return (
    <div onContextMenu={e => e.preventDefault()}>
      <table className="tms-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map((row, i) => (
            <tr key={row.id || i}
              onClick={() => onSelect?.(row)}
              onContextMenu={e => handleContext(e, row)}
              style={{ cursor: 'pointer' }}>
              {columns.map(col => (
                <td key={col.key} style={{ maxWidth: col.maxWidth }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </div>
  );
}
