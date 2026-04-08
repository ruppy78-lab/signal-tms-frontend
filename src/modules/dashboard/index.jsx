import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Truck, FileText, Users, Package, RefreshCw,
} from 'lucide-react';
import api from '../../shared/services/api';
import { Spinner } from '../../shared/components';
import { formatCurrency, formatDate, formatDateTime } from '../../shared/utils/formatters';
import StatsCards from './components/StatsCards';
import RevenueChart from './components/RevenueChart';
import ActivityFeed from './components/ActivityFeed';
import './dashboard.css';

export default function DashboardModule() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [activity, setActivity] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, actRes, revRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: {} })),
        api.get('/dashboard/activity').catch(() => ({ data: [] })),
        api.get('/dashboard/revenue-chart').catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data || statsRes || {});

      const actRows = actRes.data || actRes || [];
      setActivity(Array.isArray(actRows) ? actRows.map(r => ({
        id: r.id,
        type: r.event_type?.includes('trip') ? 'trip'
          : r.event_type?.includes('invoice') ? 'invoice' : 'load',
        description: r.description || `${r.event_type} — ${r.trip_number || ''}`,
        createdAt: r.created_at,
        user: r.created_by_name || '',
      })) : []);

      const revRows = revRes.data || revRes || [];
      setRevenueData(Array.isArray(revRows) ? revRows.map(r => ({
        week: formatDate(r.week_start),
        revenue: Number(r.revenue) || 0,
      })) : []);
    } catch (e) {
      console.error('Dashboard load error', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your operations</div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => loadData(true)}
          disabled={refreshing}
        >
          <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Quick Actions */}
      <div className="dashboard-section-title">Quick Actions</div>
      <div className="dashboard-actions">
        <button className="dashboard-action" onClick={() => navigate('/loads')}>
          <Plus size={14} /> New Load
        </button>
        <button className="dashboard-action" onClick={() => navigate('/dispatch')}>
          <Truck size={14} /> Dispatch Board
        </button>
        <button className="dashboard-action" onClick={() => navigate('/invoicing')}>
          <FileText size={14} /> Invoicing
        </button>
        <button className="dashboard-action" onClick={() => navigate('/drivers')}>
          <Users size={14} /> Drivers
        </button>
        <button className="dashboard-action" onClick={() => navigate('/customers')}>
          <Package size={14} /> Customers
        </button>
      </div>

      {/* Charts & Activity */}
      <div className="dashboard-grid">
        <RevenueChart data={revenueData} />
        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
