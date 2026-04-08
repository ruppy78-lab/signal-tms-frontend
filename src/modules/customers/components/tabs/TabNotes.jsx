import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '../../../../shared/components';
import { formatDateTime } from '../../../../shared/utils/formatters';
import customersApi from '../../services/customersApi';
import toast from 'react-hot-toast';

export default function TabNotes({ customerId }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!customerId) return;
    customersApi.getNotes(customerId)
      .then(r => setNotes(r.data || r || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [customerId]);

  const addNote = async () => {
    if (!text.trim()) { toast.error('Enter a note'); return; }
    setSaving(true);
    try {
      await customersApi.addNote(customerId, text.trim());
      setText('');
      toast.success('Note added');
      load();
    } catch (e) { toast.error('Failed to add note'); }
    setSaving(false);
  };

  if (!customerId) {
    return <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 16 }}>
      Save the customer first to add notes.
    </p>;
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <textarea className="form-input" rows={3} value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a note about this customer..."
          style={{ width: '100%', resize: 'vertical', marginBottom: 8 }} />
        <Button size="sm" icon={Plus} onClick={addNote} loading={saving}>Add Note</Button>
      </div>

      <div>
        {notes.map(n => (
          <div key={n.id} style={{
            padding: '10px 12px', borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={13} style={{ color: 'var(--info)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{n.note}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {formatDateTime(n.created_at)}
                {n.created_by_name && <> &middot; {n.created_by_name}</>}
              </div>
            </div>
          </div>
        ))}
        {!notes.length && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No notes yet
          </div>
        )}
      </div>
    </div>
  );
}
