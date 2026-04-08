import React from 'react';
import { Package, Truck, DollarSign, UserCheck, AlertTriangle, FileText } from 'lucide-react';
import { formatDateTime } from '../../../shared/utils/formatters';

const TYPE_ICON = {
  load: Package, trip: Truck, invoice: DollarSign,
  carrier: UserCheck, alert: AlertTriangle, document: FileText,
};

const TYPE_COLOR = {
  load: 'var(--primary)', trip: 'var(--info)', invoice: 'var(--success)',
  carrier: 'var(--warning)', alert: 'var(--danger)', document: 'var(--text-secondary)',
};

export default function ActivityFeed({ items = [] }) {
  return (
    <div className="card">
      <div className="card-header">Recent Activity</div>
      <div className="card-body" style={{ padding: 0 }}>
        {!items.length && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No recent activity
          </div>
        )}
        {items.map((item, i) => {
          const Icon = TYPE_ICON[item.type] || Package;
          const color = TYPE_COLOR[item.type] || 'var(--text-muted)';
          return (
            <div key={item.id || i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15`, flexShrink: 0 }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.description}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {formatDateTime(item.createdAt || item.timestamp)}
                  {item.user && <span> &middot; {item.user}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
