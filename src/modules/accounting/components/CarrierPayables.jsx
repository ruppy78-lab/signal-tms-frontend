import React, { useState } from 'react';
import { Button, Modal, Spinner, EmptyState } from '../../../shared/components';
import { FormGrid } from '../../../shared/components/Form';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { statusColor } from '../../../shared/utils/helpers';
import { DollarSign, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useCarrierPayables } from '../hooks/useAccounting';

const PAY_METHODS = ['Check', 'EFT', 'Wire', 'ACH'];

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div></div>
    </div>
  );
}

export default function CarrierPayables() {
  const { payables, summary, loading, payCarrier } = useCarrierPayables();
  const [payModal, setPayModal] = useState(null);
  const [pay, setPay] = useState({ amount: '', method: 'EFT', reference: '', date: '' });

  const handlePay = () => {
    if (!pay.amount) return;
    payCarrier(payModal.id, { ...pay, amount: Number(pay.amount) });
    setPayModal(null);
    setPay({ amount: '', method: 'EFT', reference: '', date: '' });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard icon={DollarSign} label="Total Outstanding" value={formatCurrency(summary.totalOutstanding)} color="#3b82f6" />
        <SummaryCard icon={AlertTriangle} label="Overdue" value={formatCurrency(summary.overdue)} color="#ef4444" />
        <SummaryCard icon={Clock} label="Due This Week" value={formatCurrency(summary.dueThisWeek)} color="#f59e0b" />
        <SummaryCard icon={CheckCircle} label="Paid This Month" value={formatCurrency(summary.paidThisMonth)} color="#22c55e" />
      </div>

      {payables.length === 0 ? <EmptyState title="No carrier payables" /> : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="tms-table">
              <thead>
                <tr><th>Carrier</th><th>Trip #</th><th style={{ textAlign: 'right' }}>Amount</th><th>Due Date</th><th>Days</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {payables.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.carrier_name}</strong></td>
                    <td>{p.trip_number || '---'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                    <td>{formatDate(p.due_date)}</td>
                    <td>{p.days_outstanding != null ? p.days_outstanding : '---'}</td>
                    <td><span className={`badge ${statusColor(p.status)}`}>{p.status}</span></td>
                    <td>
                      {p.status !== 'paid' && (
                        <Button size="sm" variant="success" onClick={() => { setPayModal(p); setPay(pr => ({ ...pr, amount: String(p.amount || '') })); }}>
                          Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payModal && (
        <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Pay ${payModal.carrier_name}`} width={400}>
          <FormGrid cols={2}>
            <div><label className="form-label">Amount</label>
              <input className="form-input" type="number" step="0.01" value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label className="form-label">Method</label>
              <select className="form-input" value={pay.method} onChange={e => setPay(p => ({ ...p, method: e.target.value }))}>
                {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select></div>
            <div><label className="form-label">Reference #</label>
              <input className="form-input" value={pay.reference} onChange={e => setPay(p => ({ ...p, reference: e.target.value }))} /></div>
            <div><label className="form-label">Date</label>
              <input className="form-input" type="date" value={pay.date} onChange={e => setPay(p => ({ ...p, date: e.target.value }))} /></div>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button>
            <Button variant="success" onClick={handlePay}>Record Payment</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
