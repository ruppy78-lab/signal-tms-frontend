import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Spinner, Confirm } from '../../shared/components';
import api from '../../shared/services/api';
import toast from 'react-hot-toast';

export default function BrokerList() {
  const [brokers, setBrokers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('brokers');

  // Form state
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [emails, setEmails] = useState('');
  const [statusUrl, setStatusUrl] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/customs/brokers'),
      api.get('/customs/history'),
    ]).then(([bRes, hRes]) => {
      setBrokers(bRes.data || []);
      setHistory(hRes.data || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setEditId(''); setName(''); setEmails(''); setStatusUrl(''); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Broker name is required'); return; }
    try {
      if (editId) {
        await api.put(`/customs/brokers/${editId}`, { name, email: emails, phone: '', contact_name: '', is_default: false });
      } else {
        await api.post('/customs/brokers', { name, email: emails, phone: '', contact_name: '', is_default: false });
      }
      toast.success(editId ? 'Broker updated' : 'Broker saved');
      resetForm();
      fetchAll();
    } catch (e) { toast.error(e.message || 'Save failed'); }
  };

  const handleEdit = (b) => {
    setEditId(b.id);
    setName(b.name);
    setEmails(b.email || b.emails || '');
    setStatusUrl(b.status_url || '');
    setTab('brokers');
  };

  const handleDeleteBroker = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/customs/brokers/${deleteTarget.id}`);
      toast.success('Broker deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await api.delete(`/customs/history/${id}`);
      toast.success('Record deleted');
      setHistory(h => h.filter(r => r.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <h3 className="settings-page-title" style={{ marginBottom: 0 }}>Customs Brokers</h3>
      <p className="settings-page-desc">Manage customs brokers for PARS/PAPS shipments</p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 16 }}>
        {[['brokers', 'Manage Brokers'], ['history', 'History']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '8px 18px', border: 'none', background: 'transparent', fontSize: 13,
              fontWeight: tab === id ? 700 : 400, color: tab === id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Manage Brokers Tab */}
      {tab === 'brokers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left — Add/Edit Form */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>
              {editId ? 'Edit Broker' : 'Add Broker'}
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Broker Name *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Carson International" />
              </div>
              <div>
                <label className="form-label">Email(s)</label>
                <input className="form-input" value={emails} onChange={e => setEmails(e.target.value)} placeholder="blaine@carson.ca" />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Separate multiple by comma</div>
              </div>
              <div>
                <label className="form-label">Status URL (optional)</label>
                <input className="form-input" value={statusUrl} onChange={e => setStatusUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Update Broker' : 'Save Broker'}</button>
                {editId && <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
              </div>
            </div>
          </div>

          {/* Right — Saved Brokers */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>
              Saved Brokers ({brokers.length})
            </div>
            <div style={{ padding: 16 }}>
              {!brokers.length && (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 12 }}>No brokers saved yet</div>
              )}
              {brokers.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{b.email || b.emails || '—'}{b.is_default ? ' ⭐ Default' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-xs btn-secondary" onClick={() => handleEdit(b)}>Edit</button>
                    <button className="btn btn-xs btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => setDeleteTarget(b)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {!history.length ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 12 }}>No history yet</div>
          ) : (
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Load #</th><th>Broker</th>
                  <th>Email</th><th>Crossing</th><th>ETA</th><th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        color: '#fff', background: h.type === 'PAPS' ? 'var(--primary)' : '#2E7D32' }}>
                        {h.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{h.load_number || '—'}</td>
                    <td>{h.broker_name || '—'}</td>
                    <td style={{ fontSize: 11 }}>{h.broker_email || '—'}</td>
                    <td>{h.crossing || '—'}</td>
                    <td>{h.eta || '—'}</td>
                    <td>
                      <button className="btn btn-xs btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteHistory(h.id)}>
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteBroker}
        title="Delete Broker" message={`Delete broker "${deleteTarget?.name}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
