import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ContextMenu, useContextMenu, Pagination, StatusBadge, Spinner, EmptyState, DocList, DocUploadModal } from '../../components/common';
import {
  Plus, Search, Edit, Trash2, Phone, Mail, RefreshCw, X, User, MapPin,
  FileText, Bell, Upload, Download, Trash, Star, ChevronDown, Building2,
  AlertCircle, CheckCircle, Clock, MessageSquare
} from 'lucide-react';

// ─── API helpers ────────────────────────────────────────────────────────────
const fetchCustomers  = (p) => api.get('/customers', { params: p }).then(r => r.data);
const fetchContacts   = (id) => api.get(`/customers/${id}/contacts`).then(r => r.data);
const fetchDocs       = (id) => api.get(`/documents/customer/${id}`).then(r => r.data);

// ─── Constants ───────────────────────────────────────────────────────────────
const EMPTY_CUSTOMER = {
  company_name: '', address_line1: '', address_line2: '', city: '', state: '',
  postal_code: '', country: 'Canada', phone: '', fax: '', main_email: '',
  primary_contact_name: '', tax_id: '', payment_terms: 30, credit_limit: '',
  status: 'active', general_notes: '',
  // dispatch prefs
  dispatch_notification_method: 'email', dispatch_pickup_reminder: 24,
  dispatch_delivery_reminder: 2, dispatch_special_instructions: '',
  alert_on_create: false,
};

const EMPTY_CONTACT = { name: '', title: '', email: '', phone: '', is_primary: false, notes: '' };

const TABS = [
  { id: 'info',     label: 'Company Info',    icon: Building2 },
  { id: 'contacts', label: 'Contacts',         icon: User },
  { id: 'dispatch', label: 'Dispatch & Alerts', icon: Bell },
  { id: 'docs',     label: 'Documents',         icon: FileText },
];

// ─── Small reusable pieces ───────────────────────────────────────────────────
function Field({ label, children, required, span2 }) {
  return (
    <div style={{ gridColumn: span2 ? 'span 2' : 'span 1' }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inp = {
  width: '100%', padding: '7px 10px', border: '1px solid var(--color-border-secondary)',
  borderRadius: 4, fontSize: 13, color: 'var(--color-text-primary)',
  background: 'var(--color-background-primary)', outline: 'none', boxSizing: 'border-box',
};

const sectionHead = { fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--color-border-tertiary)' };

// ─── Tab: Company Info ────────────────────────────────────────────────────────
function TabInfo({ form, setForm }) {
  const h = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
      <Field label="Company Name" required span2>
        <input name="company_name" style={inp} value={form.company_name} onChange={h} required placeholder="Legal company name" />
      </Field>

      <div style={{ gridColumn: 'span 2' }}><div style={sectionHead}>Address</div></div>

      <Field label="Address Line 1" span2>
        <input name="address_line1" style={inp} value={form.address_line1 || ''} onChange={h} placeholder="Street address" />
      </Field>
      <Field label="Address Line 2">
        <input name="address_line2" style={inp} value={form.address_line2 || ''} onChange={h} placeholder="Suite, unit, etc." />
      </Field>
      <Field label="City">
        <input name="city" style={inp} value={form.city || ''} onChange={h} />
      </Field>
      <Field label="Province / State">
        <input name="state" style={inp} value={form.state || ''} onChange={h} />
      </Field>
      <Field label="Postal / ZIP">
        <input name="postal_code" style={inp} value={form.postal_code || ''} onChange={h} />
      </Field>
      <Field label="Country">
        <select name="country" style={inp} value={form.country || 'Canada'} onChange={h}>
          <option>Canada</option><option>United States</option><option>Mexico</option>
        </select>
      </Field>

      <div style={{ gridColumn: 'span 2', marginTop: 4 }}><div style={sectionHead}>Contact & Billing</div></div>

      <Field label="Phone">
        <input name="phone" style={inp} value={form.phone || ''} onChange={h} placeholder="(000) 000-0000" />
      </Field>
      <Field label="Fax">
        <input name="fax" style={inp} value={form.fax || ''} onChange={h} />
      </Field>
      <Field label="Main Email">
        <input name="main_email" type="email" style={inp} value={form.main_email || ''} onChange={h} placeholder="billing@company.com" />
      </Field>
      <Field label="Primary Contact Name">
        <input name="primary_contact_name" style={inp} value={form.primary_contact_name || ''} onChange={h} />
      </Field>
      <Field label="Tax ID / GST / BN">
        <input name="tax_id" style={inp} value={form.tax_id || ''} onChange={h} placeholder="e.g. 123456789 RT0001" />
      </Field>
      <Field label="Payment Terms (days)">
        <input name="payment_terms" type="number" style={inp} value={form.payment_terms || 30} onChange={h} min={0} />
      </Field>
      <Field label="Credit Limit ($)">
        <input name="credit_limit" type="number" style={inp} value={form.credit_limit || ''} onChange={h} placeholder="0.00" />
      </Field>
      <Field label="Status">
        <select name="status" style={inp} value={form.status} onChange={h}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Field>
      <Field label="General Notes" span2>
        <textarea name="general_notes" style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={form.general_notes || ''} onChange={h} placeholder="Internal notes about this customer…" />
      </Field>
    </div>
  );
}

// ─── Tab: Contacts ────────────────────────────────────────────────────────────
function TabContacts({ customerId, isNew }) {
  const qc = useQueryClient();
  const [adding, setAdding]   = useState(false);
  const [editingC, setEditingC] = useState(null);
  const [cform, setCform]     = useState(EMPTY_CONTACT);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', customerId],
    queryFn: () => fetchContacts(customerId),
    enabled: !!customerId && !isNew,
  });

  const saveMut = useMutation({
    mutationFn: (body) => editingC
      ? api.put(`/customers/${customerId}/contacts/${editingC.id}`, body)
      : api.post(`/customers/${customerId}/contacts`, body),
    onSuccess: () => { toast.success(editingC ? 'Contact updated' : 'Contact added'); qc.invalidateQueries(['contacts', customerId]); setAdding(false); setEditingC(null); setCform(EMPTY_CONTACT); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const [resetModal, setResetModal] = useState(null);

  const resetPwMut = useMutation({
    mutationFn: b => api.put(`/portal/auth/reset-password`, b),
    onSuccess: (_, vars) => {
      toast.success(`Password reset for ${vars._email}`);
      setResetModal(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed — check if portal user exists'),
  });

  const portalMut = useMutation({
    mutationFn: b => api.post('/portal/auth/register', b),
    onSuccess: (_, vars) => {
      toast.success(`Portal access created for ${vars._name} — URL: localhost:3000/portal`);
      setPortalModal(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const delMut = useMutation({
    mutationFn: (cid) => api.delete(`/customers/${customerId}/contacts/${cid}`),
    onSuccess: () => { toast.success('Contact removed'); qc.invalidateQueries(['contacts', customerId]); },
  });

  const openAdd = () => { setCform(EMPTY_CONTACT); setEditingC(null); setAdding(true); };
  const openEdit = (c) => { setCform({ ...c }); setEditingC(c); setAdding(true); };
  const hc = (e) => setCform(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (isNew) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
      <User size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
      <p style={{ fontSize: 13 }}>Save the customer first, then add contacts.</p>
    </div>
  );

  const contacts = data?.data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={13} />Add Contact</button>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && contacts.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-secondary)', border: '1px dashed var(--color-border-tertiary)', borderRadius: 6 }}>
          <p style={{ fontSize: 13 }}>No contacts yet. Add your first contact.</p>
        </div>
      )}

      {/* Contact list */}
      {contacts.map(c => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--color-border-tertiary)', borderRadius: 6, marginBottom: 8, background: 'var(--color-background-primary)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
              {c.is_primary && <span style={{ fontSize: 10, padding: '1px 6px', background: '#E6F1FB', color: 'var(--primary)', borderRadius: 10, fontWeight: 600 }}>PRIMARY</span>}
            </div>
            {c.title && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{c.title}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
              {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>{c.email}</a>}
              {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{c.phone}</a>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--color-text-secondary)', borderRadius: 4 }} title="Edit"><Edit size={14} /></button>
            <button onClick={() => delMut.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--danger)', borderRadius: 4 }} title="Delete"><Trash size={14} /></button>
          </div>
        </div>
      ))}

      {/* Add / Edit contact form */}
      {adding && (
        <div style={{ border: '1px solid var(--primary)', borderRadius: 6, padding: 16, marginTop: 12, background: 'var(--color-background-secondary)' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{editingC ? 'Edit Contact' : 'New Contact'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            <Field label="Full Name" required>
              <input name="name" style={inp} value={cform.name} onChange={hc} autoFocus required />
            </Field>
            <Field label="Title / Role">
              <input name="title" style={inp} value={cform.title || ''} onChange={hc} placeholder="e.g. Logistics Manager" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" style={inp} value={cform.email || ''} onChange={hc} />
            </Field>
            <Field label="Phone">
              <input name="phone" style={inp} value={cform.phone || ''} onChange={hc} />
            </Field>
            <Field label="Notes" span2>
              <input name="notes" style={inp} value={cform.notes || ''} onChange={hc} placeholder="Optional notes" />
            </Field>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="is_primary" name="is_primary" checked={cform.is_primary || false} onChange={hc} style={{ width: 14, height: 14, cursor: 'pointer' }} />
              <label htmlFor="is_primary" style={{ fontSize: 13, cursor: 'pointer' }}>Set as primary contact</label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setAdding(false); setEditingC(null); }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={() => saveMut.mutate(cform)} disabled={saveMut.isPending || !cform.name.trim()}>
              {saveMut.isPending ? 'Saving…' : editingC ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Dispatch & Alerts ───────────────────────────────────────────────────
function TabDispatch({ form, setForm }) {
  const h = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div>
      <div style={sectionHead}>Notification Method</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['email', 'sms', 'both'].map(v => (
          <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: `1.5px solid ${form.dispatch_notification_method === v ? 'var(--primary)' : 'var(--color-border-secondary)'}`, borderRadius: 6, cursor: 'pointer', background: form.dispatch_notification_method === v ? '#E6F1FB' : 'transparent', fontSize: 13, fontWeight: form.dispatch_notification_method === v ? 600 : 400, color: form.dispatch_notification_method === v ? 'var(--primary)' : 'var(--color-text-primary)' }}>
            <input type="radio" name="dispatch_notification_method" value={v} checked={form.dispatch_notification_method === v} onChange={h} style={{ display: 'none' }} />
            {v === 'email' ? <Mail size={14} /> : v === 'sms' ? <MessageSquare size={14} /> : <Bell size={14} />}
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </label>
        ))}
      </div>

      <div style={sectionHead}>Automatic Reminders</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 20 }}>
        <Field label="Pickup Reminder (hours before)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input name="dispatch_pickup_reminder" type="number" style={{ ...inp, width: 80 }} value={form.dispatch_pickup_reminder || 24} onChange={h} min={1} max={72} />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>hours before scheduled pickup</span>
          </div>
        </Field>
        <Field label="Delivery Reminder (hours before)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input name="dispatch_delivery_reminder" type="number" style={{ ...inp, width: 80 }} value={form.dispatch_delivery_reminder || 2} onChange={h} min={1} max={24} />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>hours before scheduled delivery</span>
          </div>
        </Field>
      </div>

      <div style={sectionHead}>Alert Triggers</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'alert_on_create',    label: 'Load Created',         icon: CheckCircle,  color: '#0063A3' },
          { key: 'alert_on_dispatch',  label: 'Load Dispatched',     icon: CheckCircle,  color: '#1D9E75' },
          { key: 'alert_on_pickup',    label: 'Picked Up',            icon: CheckCircle,  color: '#1D9E75' },
          { key: 'alert_on_transit',   label: 'In Transit',           icon: Clock,        color: '#BA7517' },
          { key: 'alert_on_delay',     label: 'Delay / Exception',    icon: AlertCircle,  color: '#D85A30' },
          { key: 'alert_on_delivery',  label: 'Delivered',            icon: CheckCircle,  color: '#1D9E75' },
          { key: 'alert_on_invoice',   label: 'Invoice Sent',         icon: FileText,     color: 'var(--primary)' },
        ].map(({ key, label, icon: Icon, color }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1px solid ${form[key] ? color : 'var(--color-border-tertiary)'}`, borderRadius: 6, cursor: 'pointer', background: form[key] ? `${color}12` : 'transparent' }}>
            <input type="checkbox" name={key} checked={form[key] || false} onChange={h} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: color }} />
            <Icon size={14} style={{ color }} />
            <span style={{ fontSize: 13 }}>{label}</span>
          </label>
        ))}
      </div>

      <div style={sectionHead}>Special Instructions</div>
      <textarea
        name="dispatch_special_instructions"
        style={{ ...inp, minHeight: 80, resize: 'vertical' }}
        value={form.dispatch_special_instructions || ''}
        onChange={h}
        placeholder="e.g. Always call 30 min before arrival, dock hours 6am–4pm, require liftgate…"
      />
    </div>
  );
}

// ─── Tab: Documents ───────────────────────────────────────────────────────────
function TabDocuments({ customerId, isNew, companyName }) {
  if (isNew || !customerId) {
    return <p style={{ color:'var(--gray-400)', fontSize:13, padding:'20px 0' }}>Save the customer first to upload documents.</p>;
  }
  return <DocList entityType="customer" entityId={customerId} entityLabel={companyName} />;
}

// ─── CustomerModal ────────────────────────────────────────────────────────────
function CustomerModal({ open, customer, onClose, onSaved }) {
  const qc = useQueryClient();
  const isNew = !customer;
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (open) {
      setForm(customer ? { ...EMPTY_CUSTOMER, ...customer } : EMPTY_CUSTOMER);
      setActiveTab('info');
    }
  }, [open, customer]);

  const saveMut = useMutation({
    mutationFn: b => isNew ? api.post('/customers', b) : api.put(`/customers/${customer.id}`, b),
    onSuccess: () => {
      toast.success(isNew ? 'Customer created' : 'Customer updated');
      qc.invalidateQueries(['customers']);
      if (onSaved) onSaved();
      onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const submit = e => { e.preventDefault(); saveMut.mutate(form); };

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:40, paddingBottom:40 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div style={{ position:'relative', width:'100%', maxWidth:780, maxHeight:'calc(100vh - 80px)', background:'#fff', borderRadius:8, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid var(--gray-200)', background:'var(--primary)', color:'#fff', flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>{isNew ? 'New Customer' : `Edit — ${customer.company_name}`}</h2>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', padding:4, borderRadius:4, display:'flex' }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--gray-200)', background:'var(--gray-50)', flexShrink:0 }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const disabled = isNew && t.id !== 'info';
            return (
              <button key={t.id} onClick={() => !disabled && setActiveTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', border:'none', background:'transparent', fontSize:13, fontWeight: activeTab===t.id ? 700 : 400,
                  color: disabled ? 'var(--gray-300)' : activeTab===t.id ? 'var(--primary)' : 'var(--gray-600)',
                  borderBottom: activeTab===t.id ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer' }}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {activeTab === 'info'     && <TabInfo     form={form} setForm={setForm} />}
          {activeTab === 'contacts' && <TabContacts customerId={customer?.id} isNew={isNew} />}
          {activeTab === 'dispatch' && <TabDispatch form={form} setForm={setForm} />}
          {activeTab === 'docs'     && <TabDocuments customerId={customer?.id} isNew={isNew} companyName={customer?.company_name} />}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 24px', borderTop:'1px solid var(--gray-200)', background:'var(--gray-50)', flexShrink:0 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {(activeTab === 'info' || activeTab === 'dispatch') && (
            <button className="btn btn-primary" onClick={submit} disabled={saveMut.isPending}>
              {saveMut.isPending ? 'Saving…' : isNew ? 'Create Customer' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ customer, onClose, onSave, isPending }) {
  const [email,    setEmail]    = React.useState(customer?.main_email || '');
  const [password, setPassword] = React.useState('');
  const [showPw,   setShowPw]   = React.useState(false);
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:10,width:380,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
        <div style={{background:'#E65100',padding:'14px 18px',color:'#fff'}}>
          <div style={{fontWeight:700,fontSize:15}}>Reset Portal Password</div>
          <div style={{fontSize:12,opacity:0.9,marginTop:2}}>{customer?.company_name}</div>
        </div>
        <div style={{padding:20}}>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:4}}>Portal Email</label>
            <input type="email" style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:6,fontSize:13,boxSizing:'border-box'}}
              value={email} onChange={e=>setEmail(e.target.value)} placeholder="customer@company.com"/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:4}}>New Password</label>
            <div style={{position:'relative'}}>
              <input type={showPw?'text':'password'}
                style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:6,fontSize:13,boxSizing:'border-box',paddingRight:40}}
                value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"/>
              <button onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#888'}}>
                {showPw?'🙈':'👁️'}
              </button>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:'10px',border:'1px solid #ddd',background:'#fff',borderRadius:6,fontSize:13,cursor:'pointer'}}>Cancel</button>
            <button onClick={()=>{if(!email||!password||password.length<6){alert('Email and password (min 6 chars) required');return;}onSave(email,password);}} disabled={isPending}
              style={{flex:2,padding:'10px',background:'#E65100',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {isPending?'Resetting…':'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Portal Login Modal ──────────────────────────────────────────────────────
function PortalLoginModal({ customer, onClose, onSave, isPending }) {
  const [name,     setName]     = React.useState(customer?.contact_name || customer?.company_name || '');
  const [email,    setEmail]    = React.useState(customer?.main_email || '');
  const [password, setPassword] = React.useState('');
  const [showPw,   setShowPw]   = React.useState(false);

  const handleSave = () => {
    if (!email || !password || !name) { alert('All fields required'); return; }
    if (password.length < 6) { alert('Password must be at least 6 characters'); return; }
    onSave(email, password, name);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:10,width:420,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
        <div style={{background:'#003865',padding:'14px 18px',color:'#fff'}}>
          <div style={{fontWeight:700,fontSize:15}}>Create Customer Portal Login</div>
          <div style={{fontSize:12,opacity:0.8,marginTop:2}}>{customer?.company_name}</div>
        </div>
        <div style={{padding:20}}>
          <div style={{background:'#e3f2fd',border:'1px solid #c5d9f0',borderRadius:6,padding:'10px 12px',marginBottom:16,fontSize:12,color:'#0063A3'}}>
            <b>Portal URL:</b> localhost:3000/portal<br/>
            Share this URL and the credentials below with your customer.
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:4}}>Contact Name</label>
            <input style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:6,fontSize:13,boxSizing:'border-box'}}
              value={name} onChange={e=>setName(e.target.value)} placeholder="Contact person name"/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:4}}>Email Address</label>
            <input type="email" style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:6,fontSize:13,boxSizing:'border-box'}}
              value={email} onChange={e=>setEmail(e.target.value)} placeholder="customer@company.com"/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:4}}>Password</label>
            <div style={{position:'relative'}}>
              <input type={showPw?'text':'password'}
                style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:6,fontSize:13,boxSizing:'border-box',paddingRight:40}}
                value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"/>
              <button onClick={()=>setShowPw(p=>!p)}
                style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#888',fontSize:14}}>
                {showPw?'🙈':'👁️'}
              </button>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose}
              style={{flex:1,padding:'10px',border:'1px solid #ddd',background:'#fff',borderRadius:6,fontSize:13,cursor:'pointer'}}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={isPending}
              style={{flex:2,padding:'10px',background:'#003865',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {isPending?'Creating…':'Create Portal Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [portalModal, setPortalModal] = useState(null); // customer object

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, status],
    queryFn:  () => fetchCustomers({ page, limit: 20, search, status }),
    keepPreviousData: true,
  });

  const [resetModal, setResetModal] = useState(null);

  const resetPwMut = useMutation({
    mutationFn: b => api.put(`/portal/auth/reset-password`, b),
    onSuccess: (_, vars) => {
      toast.success(`Password reset for ${vars._email}`);
      setResetModal(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed — check if portal user exists'),
  });

  const portalMut = useMutation({
    mutationFn: b => api.post('/portal/auth/register', b),
    onSuccess: (_, vars) => {
      toast.success(`Portal access created for ${vars._name} — URL: localhost:3000/portal`);
      setPortalModal(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => { toast.success('Customer deactivated'); qc.invalidateQueries(['customers']); setConfirmDel(null); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openModal  = (c = null) => { setEditing(c); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const rowContext = useCallback((e, c) => openMenu(e, [
    { label: 'Edit customer',         icon: Edit,    action: () => openModal(c), shortcut: 'E' },
    { divider: true },
    { label: 'Call primary contact',  icon: Phone,   action: () => c.phone      && window.open(`tel:${c.phone}`) },
    { label: 'Email primary contact', icon: Mail,    action: () => c.main_email && window.open(`mailto:${c.main_email}`) },
    { divider: true },
    { label: 'Set inactive',          icon: Trash2,  danger: true, action: () => setConfirmDel(c) },
    { divider: true },
    { label: 'Create Portal Login',    icon: Mail,    action: () => setPortalModal(c) },
    { label: 'Reset Portal Password',  icon: Edit,    action: () => setResetModal(c) },
  ]), [openMenu]);

  const rows   = data?.data || [];
  const paging = data?.pagination;

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{paging?.total || 0} total customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> New Customer
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={14} />
          <input placeholder="Search by name, code, email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => qc.invalidateQueries(['customers'])} title="Refresh">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {isLoading ? <Spinner /> : rows.length === 0 ? (
          <EmptyState title="No customers yet" message="Add your first customer to get started."
            action={<button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} />New Customer</button>} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Company</th>
                <th>Primary Contact</th>
                <th>Phone</th>
                <th>City</th>
                <th>Terms</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Loads</th>
                <th style={{ textAlign: 'center' }}>Open Inv.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} onContextMenu={e => rowContext(e, c)} onDoubleClick={() => openModal(c)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)' }}>{c.code}</td>
                  <td style={{ fontWeight: 600 }}>{c.company_name}</td>
                  <td className="text-muted">{c.primary_contact_name || '—'}</td>
                  <td className="text-muted">{c.phone || '—'}</td>
                  <td className="text-muted">{c.city ? `${c.city}, ${c.state}` : '—'}</td>
                  <td className="text-muted">{c.payment_terms ? `Net ${c.payment_terms}` : '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ textAlign: 'center' }}>{c.load_count || 0}</td>
                  <td style={{ textAlign: 'center' }}>
                    {c.open_invoices > 0
                      ? <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{c.open_invoices}</span>
                      : <span style={{ color: 'var(--color-text-tertiary)' }}>0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={paging} onPage={setPage} />

      <ContextMenu {...menu} onClose={closeMenu} />

      {/* Reset Password Modal */}
      {resetModal && (
        <ResetPasswordModal
          customer={resetModal}
          onClose={()=>setResetModal(null)}
          onSave={(email,password)=>resetPwMut.mutate({email,password,_email:email})}
          isPending={resetPwMut.isPending}
        />
      )}

      {/* Portal Login Modal */}
      {portalModal && (
        <PortalLoginModal
          customer={portalModal}
          onClose={()=>setPortalModal(null)}
          onSave={(email,password,name)=>{
            portalMut.mutate({customer_id:portalModal.id,name,email,password,_name:portalModal.company_name});
          }}
          isPending={portalMut.isPending}
        />
      )}

      {/* Confirm deactivate */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setConfirmDel(null)} />
          <div style={{ position: 'relative', background: 'var(--color-background-primary)', borderRadius: 8, padding: 24, width: 380, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--danger)' }}>Deactivate Customer</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Deactivate <strong>{confirmDel.company_name}</strong>? They will be marked as inactive.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => delMut.mutate(confirmDel.id)} disabled={delMut.isPending}>
                {delMut.isPending ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed Customer Modal */}
      <CustomerModal open={modal} customer={editing} onClose={closeModal} onSaved={() => qc.invalidateQueries(['customers'])} />
    </div>
  );
}
