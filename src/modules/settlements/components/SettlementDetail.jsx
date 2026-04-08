import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../shared/components';
import { FormGrid, FormSection } from '../../../shared/components/Form';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { statusColor } from '../../../shared/utils/helpers';
import { CheckCircle, DollarSign, Plus } from 'lucide-react';
import settlementsApi from '../services/settlementsApi';

const ADJ_TYPES = ['bonus', 'deduction'];

export default function SettlementDetail({ open, onClose, settlement, onApprove, onPay, onUpdate }) {
  const [detail, setDetail] = useState(null);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adj, setAdj] = useState({ type: 'bonus', description: '', amount: '' });

  useEffect(() => {
    if (settlement?.id) settlementsApi.getSettlement(settlement.id).then(r => setDetail(r.data || r)).catch(() => {});
    else setDetail(null);
  }, [settlement]);

  if (!open || !detail) return null;
  const s = detail;
  const lines = s.lines || s.lineItems || [];
  const canApprove = s.status === 'draft' || s.status === 'pending';
  const canPay = s.status === 'approved';

  const handleAddAdj = () => {
    if (!adj.description || !adj.amount) return;
    const newLines = [...lines, { line_type: adj.type, description: adj.description, amount: Number(adj.amount) }];
    onUpdate(s.id, { lines: newLines });
    setAdjOpen(false);
    setAdj({ type: 'bonus', description: '', amount: '' });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Settlement ${s.settlement_number}`} width={650}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{s.settlement_number}</span>
        <span className={`badge ${statusColor(s.status)}`}>{s.status}</span>
      </div>

      <FormSection title="Driver">
        <div style={{ fontSize: 13 }}>
          <strong>{s.driver_name}</strong>
        </div>
      </FormSection>

      <FormSection title="Period">
        <div style={{ fontSize: 13 }}>{formatDate(s.period_start)} -- {formatDate(s.period_end)}</div>
      </FormSection>

      <FormSection title="Line Items">
        <table className="tms-table" style={{ fontSize: 12 }}>
          <thead><tr><th>Trip #</th><th>Type</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody>
            {lines.map((li, i) => (
              <tr key={i}>
                <td>{li.trip_number || '---'}</td>
                <td><span className={`badge ${li.line_type === 'deduction' ? 'badge-cancelled' : li.line_type === 'bonus' ? 'badge-available' : 'badge-active'}`}>{li.line_type || 'trip'}</span></td>
                <td>{li.description}</td>
                <td style={{ textAlign: 'right', color: li.line_type === 'deduction' ? 'var(--danger)' : undefined }}>
                  {li.line_type === 'deduction' ? '-' : ''}{formatCurrency(Math.abs(li.amount))}
                </td>
              </tr>
            ))}
            {lines.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No line items</td></tr>}
          </tbody>
        </table>
        {(s.status === 'draft' || s.status === 'pending') && (
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setAdjOpen(true)} style={{ marginTop: 8 }}>
            Add Adjustment
          </Button>
        )}
      </FormSection>

      <FormSection title="Summary">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 24px', fontSize: 14, maxWidth: 280, marginLeft: 'auto' }}>
          <span>Gross Pay</span><span style={{ textAlign: 'right' }}>{formatCurrency(s.gross_pay)}</span>
          <span style={{ color: 'var(--success)' }}>+ Bonus</span>
          <span style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(s.bonus)}</span>
          <span style={{ color: 'var(--danger)' }}>- Deductions</span>
          <span style={{ textAlign: 'right', color: 'var(--danger)' }}>{formatCurrency(s.deductions)}</span>
          <strong style={{ borderTop: '2px solid var(--border)', paddingTop: 6 }}>Net Pay</strong>
          <strong style={{ textAlign: 'right', borderTop: '2px solid var(--border)', paddingTop: 6 }}>{formatCurrency(s.net_pay)}</strong>
        </div>
      </FormSection>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        {canApprove && <Button icon={CheckCircle} onClick={() => { onApprove(s.id); onClose(); }}>Approve</Button>}
        {canPay && <Button icon={DollarSign} variant="success" onClick={() => { onPay(s.id); onClose(); }}>Mark Paid</Button>}
      </div>

      {adjOpen && (
        <Modal open={adjOpen} onClose={() => setAdjOpen(false)} title="Add Adjustment" width={380}>
          <FormGrid cols={1}>
            <div><label className="form-label">Type</label>
              <select className="form-input" value={adj.type} onChange={e => setAdj(a => ({ ...a, type: e.target.value }))}>
                {ADJ_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select></div>
            <div><label className="form-label">Description</label>
              <input className="form-input" value={adj.description} onChange={e => setAdj(a => ({ ...a, description: e.target.value }))} /></div>
            <div><label className="form-label">Amount ($)</label>
              <input className="form-input" type="number" step="0.01" value={adj.amount} onChange={e => setAdj(a => ({ ...a, amount: e.target.value }))} /></div>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setAdjOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAdj}>Add</Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
