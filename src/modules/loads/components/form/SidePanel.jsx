import React from 'react';
import AccessorialsSection from './AccessorialsSection';

const panelHead = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-primary)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  padding: '6px 12px', background: 'var(--bg-main)',
  borderTop: '2px solid var(--primary)', borderBottom: '1px solid var(--border)',
};

export default function SidePanel({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
      borderLeft: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={panelHead}>Accessorial Charges</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        <AccessorialsSection accessorials={form.accessorials}
          onChange={a => set('accessorials', a)} />
      </div>
    </div>
  );
}
