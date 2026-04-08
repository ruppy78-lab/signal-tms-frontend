import React from 'react';
import { Table, Badge } from '../../../shared/components';
import { formatPhone, formatDate } from '../../../shared/utils/formatters';
import { AlertTriangle } from 'lucide-react';

function InsExpiry({ date }) {
  if (!date) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  const d = new Date(date);
  const now = new Date();
  const days = Math.floor((d - now) / 86400000);
  const color = days < 0 ? 'var(--danger)' : days < 30 ? 'var(--warning)' : 'var(--text-primary)';
  return (
    <span style={{ color, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
      {days < 30 && <AlertTriangle size={11} />}
      {formatDate(date)}
    </span>
  );
}

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State', width: 50 },
  { key: 'contact_name', label: 'Contact' },
  { key: 'phone', label: 'Phone', render: v => formatPhone(v) },
  { key: 'mc_number', label: 'MC#', width: 80 },
  { key: 'dot_number', label: 'DOT#', width: 80 },
  { key: 'insurance_expiry', label: 'Ins Expiry', width: 100, render: v => <InsExpiry date={v} /> },
  { key: 'rating', label: 'Rating', width: 60, render: v => v ? `${v}/5` : '—' },
  { key: 'status', label: 'Status', width: 80, render: v => <Badge status={v || 'active'} /> },
];

export default function CarrierList({ carriers, onSelect, onSort, sortField, sortDir }) {
  return (
    <Table
      columns={columns}
      data={carriers}
      onRowClick={onSelect}
      onSort={onSort}
      sortField={sortField}
      sortDir={sortDir}
      emptyMessage="No carriers found"
    />
  );
}
