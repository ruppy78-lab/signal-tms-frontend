import React, { useState } from 'react';
import { Edit, Truck, DollarSign, FileText, UserX } from 'lucide-react';
import { Badge, ContextMenu } from '../../../shared/components';
import { formatPhone, formatDate } from '../../../shared/utils/formatters';

function ExpiryCell({ date }) {
  if (!date) return <span style={{ color: '#94A3B8', fontSize: 11 }}>--</span>;
  const d = new Date(date);
  const now = new Date();
  const days = Math.floor((d - now) / 86400000);
  let color = '#1a1a1a';
  let prefix = '';
  if (days < 0) { color = '#B71C1C'; prefix = '❌ '; }
  else if (days < 30) { color = '#92400E'; prefix = '⚠️ '; }
  return <span style={{ color, fontSize: 11, fontWeight: 600 }}>{prefix}{formatDate(date)}</span>;
}

const TYPE_STYLE = {
  company: { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', label: 'Company' },
  owner_op: { bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD', label: 'Owner Op' },
};

export default function DriverList({ drivers, onSelect, onEdit, onViewTrips, onViewSettlements, onDeactivate }) {
  const [ctx, setCtx] = useState(null);

  const handleCtx = (e, row) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, row }); };

  const ctxItems = ctx ? [
    { label: 'Edit Driver', icon: Edit, onClick: () => onEdit?.(ctx.row) },
    { divider: true },
    { label: 'View Trip History', icon: Truck, onClick: () => onViewTrips?.(ctx.row) },
    { label: 'View Settlements', icon: DollarSign, onClick: () => onViewSettlements?.(ctx.row) },
    { label: 'View Documents', icon: FileText, onClick: () => onEdit?.(ctx.row) },
    { divider: true },
    { label: 'Deactivate Driver', icon: UserX, danger: true, onClick: () => onDeactivate?.(ctx.row) },
  ] : [];

  return (
    <div onContextMenu={e => e.preventDefault()}>
      <table className="tms-table">
        <thead>
          <tr>
            <th>Driver</th><th style={{ width: 80 }}>Type</th><th style={{ width: 80 }}>Status</th>
            <th style={{ width: 100 }}>License Exp</th><th style={{ width: 100 }}>Medical Exp</th>
            <th style={{ width: 90 }}>Pay Type</th><th style={{ width: 110 }}>Phone</th><th style={{ width: 50 }}></th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => {
            const ts = TYPE_STYLE[d.driver_type] || TYPE_STYLE.company;
            const payType = d.pay_rate_type || d.default_pay_type || 'pallet';
            let payLabel = 'Pallet';
            if (payType === 'per_mile') payLabel = d.per_mile_rate ? `$${parseFloat(d.per_mile_rate).toFixed(2)}/mi` : 'Per Mile';
            else if (payType === 'hourly') payLabel = d.hourly_rate ? `$${parseFloat(d.hourly_rate).toFixed(2)}/hr` : 'Hourly';
            else if (payType === 'pallet') payLabel = 'Pallet';
            else payLabel = payType;

            return (
              <tr key={d.id} onClick={() => onSelect?.(d)} onContextMenu={e => handleCtx(e, d)} style={{ cursor: 'pointer' }}>
                <td>
                  {d.driver_code && <div style={{ fontSize: 10, color: '#94A3B8' }}>{d.driver_code}</div>}
                  <div style={{ fontWeight: 600, color: '#003865' }}>{d.first_name} {d.last_name}</div>
                  {d.email && <div style={{ fontSize: 10, color: '#94A3B8' }}>{d.email}</div>}
                </td>
                <td>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700,
                    background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{ts.label}</span>
                </td>
                <td><Badge status={d.status || 'available'} /></td>
                <td><ExpiryCell date={d.license_expiry} /></td>
                <td><ExpiryCell date={d.medical_card_expiry} /></td>
                <td style={{ fontSize: 11 }}>{payLabel}</td>
                <td>{formatPhone(d.phone)}</td>
                <td><button className="btn btn-xs btn-secondary" onClick={(e) => { e.stopPropagation(); onEdit?.(d); }}>Edit</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </div>
  );
}
