import React from 'react';

export default function NotesSection({ form, set }) {
  return (
    <div className="form-section">
      <div className="form-section-header">Notes</div>
      <div className="form-section-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="label">Special Instructions</label>
            <textarea className="form-input" rows={3} value={form.special_instructions || ''}
              onChange={e => set('special_instructions', e.target.value)}
              placeholder="Call before delivery, dock hours, fragile..." />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Printed on BOL</span>
          </div>
          <div className="form-group">
            <label className="label">Internal Notes</label>
            <textarea className="form-input" rows={3} value={form.internal_notes || ''}
              onChange={e => set('internal_notes', e.target.value)}
              placeholder="Dispatcher use only..." />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Not printed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
