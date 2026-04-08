import React, { useState } from 'react';
import { Edit, FileText, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { Badge, ContextMenu } from '../../../shared/components';
import { formatDate } from '../../../shared/utils/formatters';

function ExpiryCell({ date }) {
  if (!date) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>--</span>;
  const days = Math.floor((new Date(date) - new Date()) / 86400000);
  let color = 'var(--success)';
  if (days < 0) color = 'var(--danger)';
  else if (days < 30) color = 'var(--danger)';
  else if (days < 60) color = 'var(--warning)';
  return <span style={{ color, fontSize: 11, fontWeight: 600 }}>{formatDate(date)}</span>;
}

const TYPE_STYLE = {
  truck: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'Truck' },
  trailer: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Trailer' },
};

export default function FleetList({ vehicles, onSelect, onEdit, onDeactivate }) {
  const [ctx, setCtx] = useState(null);
  const handleCtx = (e, row) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, row }); };

  const ctxItems = ctx ? [
    { label: 'Edit Equipment', icon: Edit, onClick: () => onEdit?.(ctx.row) },
    { label: 'View Documents', icon: FileText, onClick: () => onEdit?.(ctx.row) },
    { label: 'Add Maintenance', icon: Wrench, onClick: () => onEdit?.(ctx.row) },
    { divider: true },
    { label: ctx.row.status === 'in_shop' ? 'Mark Active' : 'Mark In Shop', icon: CheckCircle, onClick: () => {} },
    { label: 'Deactivate', icon: XCircle, danger: true, onClick: () => onDeactivate?.(ctx.row) },
  ] : [];

  return (
    <div onContextMenu={e => e.preventDefault()}>
      <table className="tms-table">
        <thead>
          <tr>
            <th>Unit #</th><th style={{ width: 70 }}>Type</th><th>Make / Model</th><th style={{ width: 50 }}>Year</th>
            <th>Plate</th><th style={{ width: 90 }}>Reg Expiry</th><th style={{ width: 90 }}>Inspection</th>
            <th style={{ width: 90 }}>Insurance</th><th>Driver</th><th style={{ width: 80 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(v => {
            const ts = TYPE_STYLE[v.type] || TYPE_STYLE.truck;
            return (
              <tr key={v.id} onClick={() => onSelect?.(v)} onContextMenu={e => handleCtx(e, v)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 700 }}>{v.unit_number}</td>
                <td>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700,
                    background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{ts.label}</span>
                </td>
                <td>{[v.make, v.model].filter(Boolean).join(' ') || '--'}</td>
                <td>{v.year || '--'}</td>
                <td>{v.license_plate || '--'}</td>
                <td><ExpiryCell date={v.registration_expiry} /></td>
                <td><ExpiryCell date={v.cvip_expiry} /></td>
                <td><ExpiryCell date={v.insurance_expiry} /></td>
                <td>{v.assigned_driver_name || '--'}</td>
                <td><Badge status={v.status || 'active'} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </div>
  );
}
