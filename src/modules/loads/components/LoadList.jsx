import React, { useState } from 'react';
import { Edit, Copy, Truck, Printer, FileText, Upload, FolderOpen, XCircle } from 'lucide-react';
import { Badge, ContextMenu } from '../../../shared/components';
import { formatCurrency, formatDate, formatWeight, formatNumber } from '../../../shared/utils/formatters';

const FLAG_ICONS = [
  { key: 'appointment', icon: '🔔', title: 'Appointment' },
  { key: 'liftgate', icon: '⬆', title: 'Liftgate' },
  { key: 'residential', icon: '🏠', title: 'Residential' },
  { key: 'construction', icon: '🏗', title: 'Construction' },
  { key: 'hazmat', icon: '⚠', title: 'Hazmat' },
];

function isOverdue(load) {
  if (!load.deliveryDate || load.status === 'delivered' || load.status === 'cancelled') return false;
  return new Date(load.deliveryDate) < new Date(new Date().toDateString());
}

export default function LoadList({ loads, selected, onToggle, onToggleAll, onView, onEdit, onClone, onCancel }) {
  const [ctx, setCtx] = useState(null);
  const allSelected = loads.length > 0 && selected.length === loads.length;

  const handleCtx = (e, row) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, row });
  };

  const ctxItems = ctx ? [
    { label: 'Edit Load', icon: Edit, onClick: () => onEdit?.(ctx.row) },
    { label: 'Clone Load', icon: Copy, onClick: () => onClone?.(ctx.row) },
    { label: 'Assign to Trip', icon: Truck, onClick: () => {} },
    { divider: true },
    { label: 'Print BOL', icon: Printer, onClick: () => {} },
    { label: 'Print Confirmation', icon: FileText, onClick: () => {} },
    { divider: true },
    { label: 'Upload Document', icon: Upload, onClick: () => {} },
    { label: 'View Documents', icon: FolderOpen, onClick: () => {} },
    { divider: true },
    { label: 'Cancel Load', icon: XCircle, danger: true, onClick: () => onCancel?.(ctx.row) },
  ] : [];

  return (
    <div onContextMenu={e => e.preventDefault()}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tms-table">
          <thead>
            <tr>
              <th style={{ width: 30, textAlign: 'center' }}>
                <input type="checkbox" checked={allSelected} onChange={() => onToggleAll?.()} />
              </th>
              <th style={{ width: 80 }}>LOAD #</th>
              <th>CUSTOMER</th>
              <th style={{ width: 100 }}>ORIGIN</th>
              <th style={{ width: 100 }}>DESTINATION</th>
              <th style={{ width: 70 }}>PU DATE</th>
              <th style={{ width: 70 }}>DEL DATE</th>
              <th style={{ width: 40 }}>PCS</th>
              <th style={{ width: 70 }}>WGT</th>
              <th style={{ width: 70 }}>EQUIP</th>
              <th style={{ width: 70 }}>FLAGS</th>
              <th style={{ width: 90 }}>DRIVER</th>
              <th style={{ width: 75 }}>REVENUE</th>
              <th style={{ width: 65 }}>MARGIN</th>
              <th style={{ width: 85 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loads.map(row => {
              const isSel = selected.includes(row.id);
              const overdue = isOverdue(row);
              return (
                <tr key={row.id}
                  className={overdue ? 'loads-row-overdue' : ''}
                  style={{ cursor: 'pointer', background: isSel ? 'var(--info-bg)' : undefined }}
                  onClick={() => onView?.(row)}
                  onDoubleClick={() => onEdit?.(row)}
                  onContextMenu={e => handleCtx(e, row)}>
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSel} onChange={() => onToggle?.(row.id)} />
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.load_number}</td>
                  <td>{row.customer_name || '—'}</td>
                  <td>{row.origin_city ? `${row.origin_city}, ${row.origin_state}` : '—'}</td>
                  <td>{row.dest_city ? `${row.dest_city}, ${row.dest_state}` : '—'}</td>
                  <td>{formatDate(row.pickup_date)}</td>
                  <td>{formatDate(row.delivery_date)}</td>
                  <td>{(row.total_pieces ?? row.pieces) || '—'}</td>
                  <td>{(row.total_weight || row.weight) ? formatWeight(row.total_weight || row.weight) : '—'}</td>
                  <td><span style={{ fontSize: 9, padding: '1px 4px', background: 'var(--gray-100)', borderRadius: 3 }}>{row.equipment_type || 'DV'}</span></td>
                  <td>
                    <div className="load-flags">
                      {FLAG_ICONS.map(f => row[f.key] ? (
                        <span key={f.key} className="load-flag" title={f.title}>{f.icon}</span>
                      ) : null)}
                    </div>
                  </td>
                  <td>{row.driver_name || '—'}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                    {row.total_revenue ? formatCurrency(row.total_revenue) : '—'}
                  </td>
                  <td style={{ color: row.margin > 0 ? 'var(--success)' : row.margin < 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {row.margin ? formatCurrency(row.margin) : '—'}
                  </td>
                  <td><Badge status={row.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </div>
  );
}
