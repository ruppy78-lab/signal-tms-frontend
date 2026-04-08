import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { Button, Input } from '../../../../shared/components';
import { FormGrid } from '../../../../shared/components/Form';
import customersApi from '../../services/customersApi';
import toast from 'react-hot-toast';

const emptyContact = { name: '', title: '', email: '', phone: '', is_primary: false };

export default function TabContacts({ customerId }) {
  const [contacts, setContacts] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | contact object
  const [form, setForm] = useState(emptyContact);

  const load = () => {
    if (!customerId) return;
    customersApi.getContacts(customerId)
      .then(r => setContacts(r.data || r || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [customerId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const startNew = () => { setForm(emptyContact); setEditing('new'); };
  const startEdit = (c) => { setForm({ ...emptyContact, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ''])) }); setEditing(c); };
  const cancel = () => { setEditing(null); setForm(emptyContact); };

  const save = async () => {
    if (!form.name) { toast.error('Contact name required'); return; }
    if (!customerId) { toast.error('Save customer first'); return; }
    try {
      if (editing === 'new') {
        await customersApi.addContact(customerId, form);
        toast.success('Contact added');
      } else {
        await customersApi.updateContact(customerId, editing.id, form);
        toast.success('Contact updated');
      }
      cancel();
      load();
    } catch (e) { toast.error(e.message || 'Save failed'); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete contact ${c.name}?`)) return;
    try {
      await customersApi.deleteContact(customerId, c.id);
      toast.success('Contact deleted');
      load();
    } catch (e) { toast.error('Delete failed'); }
  };

  if (!customerId) {
    return <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 16 }}>
      Save the customer first to add contacts.
    </p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
        </span>
        {!editing && <Button size="xs" icon={Plus} onClick={startNew}>Add Contact</Button>}
      </div>

      {editing && (
        <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid var(--border)' }}>
          <FormGrid cols={2}>
            <Input label="Name *" value={form.name} onChange={e => set('name', e.target.value)} />
            <Input label="Title" value={form.title} onChange={e => set('title', e.target.value)} />
            <Input label="Email" value={form.email} onChange={e => set('email', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </FormGrid>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} />
              Primary Contact
            </label>
            <div style={{ flex: 1 }} />
            <Button size="xs" variant="secondary" onClick={cancel}>Cancel</Button>
            <Button size="xs" onClick={save}>Save</Button>
          </div>
        </div>
      )}

      <table className="tms-table">
        <thead>
          <tr>
            <th>Name</th><th>Title</th><th>Email</th><th>Phone</th>
            <th style={{ width: 60 }}>Primary</th><th style={{ width: 70 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id}>
              <td style={{ fontWeight: 600 }}>{c.name}</td>
              <td>{c.title || '—'}</td>
              <td>{c.email || '—'}</td>
              <td>{c.phone || '—'}</td>
              <td>{c.is_primary && <Star size={12} style={{ color: 'var(--warning)' }} fill="var(--warning)" />}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-xs btn-secondary" onClick={() => startEdit(c)}><Edit size={11} /></button>
                  <button className="btn btn-xs btn-secondary" onClick={() => remove(c)}><Trash2 size={11} /></button>
                </div>
              </td>
            </tr>
          ))}
          {!contacts.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No contacts</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
