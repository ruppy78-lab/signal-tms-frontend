import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Modal, Spinner, Pagination, EmptyState, Confirm } from '../../shared/components';
import useCustomers from './hooks/useCustomers';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CustomerProfile from './components/CustomerProfile';
import customersApi from './services/customersApi';
import toast from 'react-hot-toast';

export default function CustomersModule() {
  const { customers, loading, total, params, setParams, createCustomer, updateCustomer, deleteCustomer, fetchCustomers } = useCustomers();
  const [formOpen, setFormOpen] = useState(false);
  const [editCust, setEditCust] = useState(null);
  const [profileCust, setProfileCust] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [portalCust, setPortalCust] = useState(null);
  const [portalForm, setPortalForm] = useState({ email: '', password: '' });
  const [portalSaving, setPortalSaving] = useState(false);
  const pages = Math.ceil(total / (params.limit || 50));

  const handleSave = async (data) => {
    if (editCust?.id) await updateCustomer(editCust.id, data);
    else await createCustomer(data);
  };

  const handleEdit = (c) => { setProfileCust(null); setEditCust(c); setFormOpen(true); };
  const handleDeactivate = async () => {
    if (confirmDeactivate) await deleteCustomer(confirmDeactivate.id);
    setConfirmDeactivate(null);
  };

  const openPortal = (c) => {
    setPortalCust(c);
    setPortalForm({ email: c.portal_email || c.main_email || '', password: '' });
  };

  const savePortal = async () => {
    if (!portalForm.email) { toast.error('Email required'); return; }
    if (!portalCust.portal_enabled && !portalForm.password) { toast.error('Password required for new portal access'); return; }
    setPortalSaving(true);
    try {
      await customersApi.setPortalAccess(portalCust.id, {
        portal_email: portalForm.email,
        portal_password: portalForm.password || undefined,
        portal_enabled: true,
      });
      toast.success('Portal access enabled');
      setPortalCust(null);
      fetchCustomers();
    } catch (e) { toast.error(e.message || 'Failed to save'); }
    setPortalSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">{total} customers</div>
        </div>
        <Button icon={Plus} onClick={() => { setEditCust(null); setFormOpen(true); }}>New Customer</Button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '0 0 260px' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search name, code, city, email..."
              value={params.search || ''}
              onChange={e => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
              style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['', 'active', 'inactive'].map(s => (
              <button key={s}
                className={`btn btn-xs ${(params.status || '') === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setParams(p => ({ ...p, status: s, page: 1 }))}>
                {s === '' ? 'All' : s === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : customers.length === 0 ? <EmptyState title="No customers found" message="Create your first customer" />
            : <CustomerList customers={customers}
                onSelect={setProfileCust}
                onEdit={handleEdit}
                onDeactivate={setConfirmDeactivate}
                onPortalAccess={openPortal} />}
        </div>
      </div>

      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pagination page={params.page || 1} pages={pages} total={total}
            onPrev={() => setParams(p => ({ ...p, page: p.page - 1 }))}
            onNext={() => setParams(p => ({ ...p, page: p.page + 1 }))}
            onGoTo={(n) => setParams(p => ({ ...p, page: n }))} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total} customers total</span>
        </div>
      )}

      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} customer={editCust} onSave={handleSave} />
      <CustomerProfile open={!!profileCust} onClose={() => setProfileCust(null)} customer={profileCust} onEdit={handleEdit} />

      <Confirm open={!!confirmDeactivate} onClose={() => setConfirmDeactivate(null)}
        onConfirm={handleDeactivate} title="Deactivate Customer"
        message={`Are you sure you want to deactivate ${confirmDeactivate?.company_name}?`}
        confirmText="Deactivate" variant="danger" />

      {/* Portal Access Modal */}
      <Modal open={!!portalCust} onClose={() => setPortalCust(null)}
        title={`Portal Access — ${portalCust?.company_name || ''}`} size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setPortalCust(null)}>Cancel</Button>
            <Button onClick={savePortal} loading={portalSaving}>Enable Portal</Button>
          </div>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-label">Portal Email *</label>
            <input className="form-input" type="email" value={portalForm.email}
              onChange={e => setPortalForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">{portalCust?.portal_enabled ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input className="form-input" type="password" value={portalForm.password}
              onChange={e => setPortalForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px', background: 'var(--gray-50)', borderRadius: 4 }}>
            Customer will log in at <strong>localhost:3000/portal</strong> with this email and password.
          </div>
        </div>
      </Modal>
    </div>
  );
}
