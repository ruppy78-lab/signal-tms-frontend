import React from 'react';
import { Truck, Package, Warehouse, DollarSign, UserCheck } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';

const CARD_DEFS = [
  {
    key: 'active_trips',
    label: 'Active Trips',
    icon: Truck,
    color: '#003865',
    bg: 'rgba(0,56,101,0.08)',
  },
  {
    key: 'available_loads',
    label: 'Available Loads',
    icon: Package,
    color: '#0063A3',
    bg: 'rgba(0,99,163,0.08)',
  },
  {
    key: 'on_dock',
    label: 'On Dock',
    icon: Warehouse,
    color: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    key: 'en_route',
    label: 'En Route',
    icon: Truck,
    color: '#2E7D32',
    bg: 'rgba(46,125,50,0.08)',
  },
  {
    key: 'delivered_today',
    label: 'Delivered Today',
    icon: Package,
    color: '#00796B',
    bg: 'rgba(0,121,107,0.08)',
  },
  {
    key: 'revenue_today',
    label: 'Revenue Today',
    icon: DollarSign,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    currency: true,
  },
  {
    key: 'available_drivers',
    label: 'Free Drivers',
    icon: UserCheck,
    color: '#1D4ED8',
    bg: 'rgba(29,78,216,0.08)',
  },
];

export default function StatsCards({ stats = {} }) {
  return (
    <div className="dashboard-stats">
      {CARD_DEFS.map(card => {
        const Icon = card.icon;
        const value = stats[card.key] ?? 0;
        const display = card.currency ? formatCurrency(value) : value;
        return (
          <div key={card.key} className="dashboard-stat">
            <div
              className="dashboard-stat-icon"
              style={{ background: card.bg }}
            >
              <Icon size={20} style={{ color: card.color }} />
            </div>
            <div>
              <div className="dashboard-stat-value" style={{ color: card.color }}>
                {display}
              </div>
              <div className="dashboard-stat-label">{card.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
