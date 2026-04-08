import React, { useState } from 'react';
import { Badge, ContextMenu } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { Eye, Printer, Send, CreditCard, RotateCcw, XCircle } from 'lucide-react';

export default function InvoiceList({ invoices, onSelect, onPrint, onSend, onRecordPayment, onMoveToDraft, onVoid }) {
  const [ctx, setCtx] = useState(null);
  const handleCtx = (e, row) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, row }); };

  const ctxItems = ctx ? [
    { label: 'View Invoice', icon: Eye, onClick: () => onSelect?.(ctx.row) },
    { label: 'Print Invoice', icon: Printer, onClick: () => onPrint?.(ctx.row) },
    { divider: true },
    { label: 'Send to Customer', icon: Send, onClick: () => onSend?.(ctx.row.id), disabled: ctx.row.status !== 'draft' },
    { label: 'Record Payment', icon: CreditCard, onClick: () => { onSelect?.(ctx.row); }, disabled: !['sent','unpaid','partial'].includes(ctx.row.status) },
    { divider: true },
    { label: 'Move to Draft', icon: RotateCcw, onClick: () => onMoveToDraft?.(ctx.row.id), disabled: ctx.row.status === 'paid' || ctx.row.status === 'draft' },
    { label: 'Void Invoice', icon: XCircle, danger: true, onClick: () => onVoid?.(ctx.row.id), disabled: ctx.row.status === 'void' || ctx.row.status === 'paid' },
  ] : [];

  return (
    <div onContextMenu={e => e.preventDefault()}>
      <table className="tms-table">
        <thead><tr>
          <th style={{ width: 100 }}>Invoice #</th><th style={{ width: 90 }}>Load #</th><th>Customer</th>
          <th style={{ width: 90 }}>Date</th><th style={{ width: 90 }}>Total</th><th style={{ width: 90 }}>Paid</th>
          <th style={{ width: 90 }}>Balance</th><th style={{ width: 90 }}>Due Date</th><th style={{ width: 80 }}>Status</th>
        </tr></thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} onClick={() => onSelect?.(inv)} onContextMenu={e => handleCtx(e, inv)} style={{ cursor: 'pointer' }}>
              <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
              <td>{inv.load_number || '—'}</td>
              <td>{inv.customer_name || '—'}</td>
              <td>{formatDate(inv.created_at)}</td>
              <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total_amount)}</td>
              <td style={{ color: 'var(--success)' }}>{formatCurrency(inv.amount_paid)}</td>
              <td style={{ color: parseFloat(inv.balance_due) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{formatCurrency(inv.balance_due)}</td>
              <td>{formatDate(inv.due_date)}</td>
              <td><Badge status={inv.status || 'draft'} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </div>
  );
}
