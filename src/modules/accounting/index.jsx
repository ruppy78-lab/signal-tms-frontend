import React, { useState } from 'react';
import { Truck, Receipt, TrendingUp } from 'lucide-react';
import CarrierPayables from './components/CarrierPayables';
import ExpenseList from './components/ExpenseList';
import ProfitLoss from './components/ProfitLoss';

const TABS = [
  { id: 'payables', label: 'Carrier Payables', icon: Truck },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp },
];

export default function AccountingModule() {
  const [tab, setTab] = useState('payables');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Accounting</div>
          <div className="page-subtitle">Financial overview and management</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: '10px 20px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)', fontWeight: tab === t.id ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab === 'payables' && <CarrierPayables />}
      {tab === 'expenses' && <ExpenseList />}
      {tab === 'pnl' && <ProfitLoss />}
    </div>
  );
}
