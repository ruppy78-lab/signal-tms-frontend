import React from 'react';

export default function DriverFormNotes({ form, set }) {
  return (
    <div>
      <div className="form-section-header">Internal Notes</div>
      <textarea className="form-input" rows={8} value={form?.notes || ''} onChange={e => set?.('notes', e.target.value)}
        placeholder="Internal notes about this driver..." style={{ resize: 'vertical', minHeight: 120 }} />
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Notes are saved when you click Save Driver.</div>
    </div>
  );
}
