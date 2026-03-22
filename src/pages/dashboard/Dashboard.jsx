import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Spinner, StatusBadge, Currency } from '../../components/common';
import { Package, TrendingUp, DollarSign, AlertCircle, Users, Truck } from 'lucide-react';

const fetchStats = () => api.get('/dashboard/stats').then(r => r.data.data);

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  if (isLoading) return <Spinner />;

  const loads    = data?.loads   || {};
  const revenue  = data?.revenue || {};
  const drivers  = data?.drivers || [];
  const fleet    = data?.fleet   || [];

  const activeLoads   = (loads.dispatched||0)+(loads.en_route_pickup||0)+(loads.at_pickup||0)+(loads.in_transit||0)+(loads.at_delivery||0);
  const availDrivers  = drivers.find(d => d.status === 'available')?.count || 0;
  const openInvoices  = (data?.invoices||[]).filter(i => ['unpaid','partial'].includes(i.status));
  const openInvTotal  = openInvoices.reduce((a, i) => a + parseFloat(i.total || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live operations overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Active Loads"      value={activeLoads}  sub={`${loads.pending||0} pending`} icon={Package}    color="var(--primary-light)" />
        <StatCard label="Month Revenue"     value={<Currency value={revenue.month||0} />} sub="Current month" icon={TrendingUp}  color="var(--success)" />
        <StatCard label="YTD Revenue"       value={<Currency value={revenue.ytd||0} />}   sub="Year to date"  icon={DollarSign}  color="var(--info)" />
        <StatCard label="Open Invoices"     value={<Currency value={openInvTotal} />} sub={`${openInvoices.length} invoices`} icon={AlertCircle} color="var(--warning)" />
        <StatCard label="Available Drivers" value={availDrivers} sub="Ready to dispatch" icon={Users}       color="var(--success)" />
        <StatCard label="Active Fleet"      value={fleet.find(f=>f.status==='active')?.count||0} sub="Vehicles" icon={Truck} color="var(--primary)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Loads</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Load #</th><th>Customer</th><th>Pickup</th><th>Status</th></tr>
              </thead>
              <tbody>
                {!data?.recent_loads?.length && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No loads yet</td></tr>
                )}
                {data?.recent_loads?.map(l => (
                  <tr key={l.load_number}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{l.load_number}</td>
                    <td className="truncate">{l.customer}</td>
                    <td className="text-muted text-sm">{l.pickup_date ? new Date(l.pickup_date).toLocaleDateString() : '—'}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Load Status Breakdown</span></div>
          <div className="card-body">
            {[
              ['Pending',    loads.pending||0,           '#9E9E9E'],
              ['Dispatched', loads.dispatched||0,        '#0063A3'],
              ['In Transit', (loads.en_route_pickup||0)+(loads.in_transit||0), '#E65100'],
              ['Delivered',  loads.delivered||0,         '#2E7D32'],
              ['Cancelled',  loads.cancelled||0,         '#B71C1C'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
