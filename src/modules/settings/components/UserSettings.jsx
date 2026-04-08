import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Confirm } from '../../../shared/components';
import { FormGrid } from '../../../shared/components/Form';
import { formatDateTime } from '../../../shared/utils/formatters';
import { statusColor } from '../../../shared/utils/helpers';
import { Plus, Edit2, UserX } from 'lucide-react';
import api from '../../../shared/services/api';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'dispatcher', 'accounting', 'readonly'];
const emptyUser = { name: '', email: '', password: '', role: 'dispatcher' };

export default function UserSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [deactivateId, setDeactivateId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/users');
      setUsers(res.data || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditUser(null); setForm(emptyUser); setFormOpen(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    if (!editUser && !form.password) { toast.error('Password required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editUser && !payload.password) delete payload.password;
      if (editUser) await api.put(`/settings/users/${editUser.id}`, payload);
      else await api.post('/settings/users', payload);
      toast.success(editUser ? 'User updated' : 'User created');
      setFormOpen(false);
      fetchUsers();
    } catch (e) { toast.error(e?.message || 'Failed to save user'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    try {
      await api.put(`/settings/users/${deactivateId}`, { status: 'inactive' });
      toast.success('User deactivated');
      setDeactivateId(null);
      fetchUsers();
    } catch { toast.error('Failed to deactivate user'); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 className="settings-page-title" style={{ marginBottom: 0 }}>User Management</h3>
          <p className="settings-page-desc">Add, edit, and deactivate user accounts.</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add User</Button>
      </div>

      <table className="tms-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th style={{ width: 100 }}></th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td><strong>{u.name}</strong></td>
              <td>{u.email}</td>
              <td><span className="badge badge-active" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
              <td><span className={`badge ${statusColor(u.status || 'active')}`}>{u.status || 'active'}</span></td>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDateTime(u.last_login)}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(u)} title="Edit"><Edit2 size={12} /></button>
                  {(u.status !== 'inactive') && (
                    <button className="btn btn-sm btn-secondary" onClick={() => setDeactivateId(u.id)} title="Deactivate" style={{ color: 'var(--danger)' }}><UserX size={12} /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>}
        </tbody>
      </table>

      {formOpen && (
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editUser ? 'Edit User' : 'Add User'} width={420}>
          <FormGrid cols={1}>
            <div><label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="form-label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <div><label className="form-label">Role</label>
              <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select></div>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editUser ? 'Update' : 'Create'}</Button>
          </div>
        </Modal>
      )}

      <Confirm open={!!deactivateId} onClose={() => setDeactivateId(null)} onConfirm={handleDeactivate}
        title="Deactivate User" message="This user will no longer be able to log in. Continue?" confirmText="Deactivate" variant="danger" />
    </div>
  );
}
