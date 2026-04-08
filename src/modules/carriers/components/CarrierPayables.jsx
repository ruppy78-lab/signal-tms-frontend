import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Input, Spinner } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatters';
import { DollarSign, Clock, AlertTriangle } from 'lucide-react';
import carriersApi from '../services/carriersApi';
import toast from 'react-hot-toast';

export default function CarrierPayables() {
  const [payables, setPayables] = useState([]);
  const [summary, setSummary] = useState({ totalOutstanding: 0, overdue: 0, dueThisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const res = await carriersApi.getPayables();
      const data = res.data || res;
      setPayables(data.payables || []);
      setSummary(data.summary || summary);
    } catch (e) { toast.error('Failed to load payables'); }
    setLoading(false);
  };

  useEffect(() => { fetchPayables(); }, []);

  const handlePay = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    setPaying(true);
    try {
      await carriersApi.payCarrier(payModal.carrierId, { amount: parseFloat(payAmount), tripIds: payModal.tripIds });
      toast.success('Payment recorded');
      setPayModal(null);
      fetchPayables();
    } catch (e) { toast.error(e.message || 'Payment failed'); }
    setPaying(false);
  };

  const cards = [
    { label: 'Total Outstanding', value: formatCurrency(summary.totalOutstanding), icon: DollarSign, color: 'var(--primary)' },
    { label: 'Overdue', value: formatCurrency(summary.overdue), icon: AlertTriangle, color: 'var(--danger)' },
    { label: 'Due This Week', value: formatCurrency(summary.dueThisWeek), icon: Clock, color: 'var(--warning)' },
  ];

  const columns = [
    { key: 'carrierName', label: 'Carrier' },
    { key: 'tripCount', label: 'Trips', width: 60 },
    { key: 'amountOwed', label: 'Amount Owed', render: v => formatCurrency(v) },
    { key: 'daysOutstanding', label: 'Days Out', width: 70 },
    { key: 'status', label: 'Status', width: 90, render: v => <Badge status={v} /> },
    { key: 'actions', label: '', width: 80, render: (_, row) => (
      <Button size="xs" onClick={(e) => { e.stopPropagation(); setPayAmount(row.amountOwed); setPayModal(row); }}>Pay</Button>
    )},
  ];

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="stat-card">
              <Icon size={20} style={{ color: c.color }} />
              <div>
                <div className="stat-number" style={{ color: c.color }}>{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <Table columns={columns} data={payables} emptyMessage="No outstanding payables" />
        </div>
      </div>
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Pay ${payModal?.carrierName}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button><Button onClick={handlePay} loading={paying}>Record Payment</Button></>}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Outstanding: {formatCurrency(payModal?.amountOwed)} ({payModal?.tripCount} trips)
        </div>
        <Input label="Payment Amount" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
      </Modal>
    </div>
  );
}
