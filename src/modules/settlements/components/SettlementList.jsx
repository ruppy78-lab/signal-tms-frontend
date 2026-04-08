import React from 'react';
import { Table } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { statusColor } from '../../../shared/utils/helpers';

const columns = [
  { key: 'settlement_number', label: 'Settlement #', width: 110, sortable: true },
  { key: 'driver_name', label: 'Driver', sortable: true },
  {
    key: 'period_start', label: 'Period', width: 180,
    render: (v, row) => `${formatDate(v)} - ${formatDate(row.period_end)}`,
  },
  { key: 'gross_pay', label: 'Gross Pay', width: 100, render: v => formatCurrency(v) },
  {
    key: 'deductions', label: 'Deductions', width: 100,
    render: v => v > 0 ? <span style={{ color: 'var(--danger)' }}>-{formatCurrency(v)}</span> : formatCurrency(0),
  },
  {
    key: 'bonus', label: 'Bonus', width: 90,
    render: v => v > 0 ? <span style={{ color: 'var(--success)' }}>+{formatCurrency(v)}</span> : formatCurrency(0),
  },
  {
    key: 'net_pay', label: 'Net Pay', width: 100,
    render: v => <strong>{formatCurrency(v)}</strong>,
  },
  {
    key: 'status', label: 'Status', width: 90,
    render: v => <span className={`badge ${statusColor(v)}`}>{v}</span>,
  },
];

export default function SettlementList({ settlements, onSelect }) {
  return (
    <Table
      columns={columns}
      data={settlements}
      onRowClick={onSelect}
      emptyMessage="No settlements found"
    />
  );
}
