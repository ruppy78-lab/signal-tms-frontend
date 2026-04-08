import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 20, text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40, color: 'var(--text-muted)' }}>
      <Loader2 size={size} className="spin" />
      <span style={{ fontSize: 12 }}>{text}</span>
    </div>
  );
}
