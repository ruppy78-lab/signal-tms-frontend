import React from 'react';
import { Spinner, EmptyState } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatters';
import { TrendingUp, TrendingDown, Truck, Users, Receipt, Percent } from 'lucide-react';
import { useProfitLoss } from '../hooks/useAccounting';

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

function MetricCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {subtext && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtext}</div>}
    </div>
  );
}

export default function ProfitLoss() {
  const { data, loading, params, setParams } = useProfitLoss();
  const isCustom = params.period === 'custom';

  const d = data?.data || data || {};
  const revenue = d.revenue || 0;
  const carrierCosts = d.carrier_costs || 0;
  const driverPay = d.driver_pay || 0;
  const expenses = d.expenses || 0;
  const netProfit = d.net_profit ?? (revenue - carrierCosts - driverPay - expenses);
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0';
  const breakdown = d.breakdown || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setParams(pr => ({ ...pr, period: p.value }))}
            style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: params.period === p.value ? 'var(--primary)' : 'var(--bg-primary)', color: params.period === p.value ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontWeight: params.period === p.value ? 600 : 400 }}>
            {p.label}
          </button>
        ))}
        {isCustom && (
          <>
            <input className="form-input" type="date" value={params.dateFrom || ''}
              onChange={e => setParams(p => ({ ...p, dateFrom: e.target.value }))}
              style={{ height: 32, fontSize: 12, width: 140, marginLeft: 8 }} />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input className="form-input" type="date" value={params.dateTo || ''}
              onChange={e => setParams(p => ({ ...p, dateTo: e.target.value }))}
              style={{ height: 32, fontSize: 12, width: 140 }} />
          </>
        )}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <MetricCard icon={TrendingUp} label="Total Revenue" value={formatCurrency(revenue)} color="#22c55e" />
            <MetricCard icon={Truck} label="Carrier Costs" value={formatCurrency(carrierCosts)} color="#ef4444" />
            <MetricCard icon={Users} label="Driver Pay" value={formatCurrency(driverPay)} color="#ef4444" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <MetricCard icon={Receipt} label="Expenses" value={formatCurrency(expenses)} color="#ef4444" />
            <MetricCard icon={netProfit >= 0 ? TrendingUp : TrendingDown} label="Net Profit" value={formatCurrency(netProfit)} color={netProfit >= 0 ? '#22c55e' : '#ef4444'} />
            <MetricCard icon={Percent} label="Margin" value={`${margin}%`} color={Number(margin) >= 0 ? '#22c55e' : '#ef4444'} />
          </div>

          {breakdown.length > 0 && (
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="tms-table">
                  <thead><tr><th>Category</th><th style={{ textAlign: 'right' }}>Revenue</th><th style={{ textAlign: 'right' }}>Costs</th><th style={{ textAlign: 'right' }}>Profit</th><th style={{ textAlign: 'right' }}>Margin</th></tr></thead>
                  <tbody>
                    {breakdown.map((b, i) => {
                      const profit = (b.revenue || 0) - (b.costs || 0);
                      const m = b.revenue > 0 ? ((profit / b.revenue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={i}>
                          <td><strong>{b.category}</strong></td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(b.revenue)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{formatCurrency(b.costs)}</td>
                          <td style={{ textAlign: 'right', color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{formatCurrency(profit)}</td>
                          <td style={{ textAlign: 'right' }}>{m}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
