import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', message, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, color: 'var(--text-muted)' }}>
      <Icon size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {message && <div style={{ fontSize: 12, marginBottom: 12 }}>{message}</div>}
      {action}
    </div>
  );
}
