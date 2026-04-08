import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, Table } from '../../../shared/components';
import { FormSection } from '../../../shared/components/Form';
import { formatCurrency, formatDate, formatPhone } from '../../../shared/utils/formatters';
import customersApi from '../services/customersApi';

const TABS = ['Details', 'Loads', 'Invoices', 'Contacts', 'Notes'];

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  );
}

function CreditStatus({ customer, balance }) {
  if (!balance) return null;
  const pct = balance.credit_used_percent || 0;
  let color = '#059669';
  if (pct >= 100) color = '#DC2626';
  else if (pct >= 80) color = '#ea580c';
  else if (pct >= 50) color = '#D97706';

  return (
    <FormSection title="Credit Status">
      <div style={{ display: 'flex', gap: 16 }}>
        <Field label="Balance" value={<span style={{ color, fontWeight: 700 }}>{formatCurrency(balance.balance)}</span>} />
        <Field label="Credit Limit" value={formatCurrency(balance.credit_limit)} />
        <Field label="Used" value={<span style={{ color, fontWeight: 700 }}>{pct}%</span>} />
      </div>
      <div style={{ height: 6, background: 'var(--gray-200)', borderRadius: 3, marginTop: 4 }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </FormSection>
  );
}

export default function CustomerProfile({ open, onClose, customer, onEdit }) {
  const [tab, setTab] = useState('Details');
  const [loads, setLoads] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!customer?.id || !open) return;
    setTab('Details');
    customersApi.getLoads(customer.id).then(r => setLoads(r.data || [])).catch(() => {});
    customersApi.getInvoices(customer.id).then(r => setInvoices(r.data || [])).catch(() => {});
    customersApi.getContacts(customer.id).then(r => setContacts(r.data || r || [])).catch(() => {});
    customersApi.getNotes(customer.id).then(r => setNotes(r.data || r || [])).catch(() => {});
    customersApi.getBalance(customer.id).then(r => setBalance(r.data || r)).catch(() => {});
  }, [customer, open]);

  if (!customer) return null;
  const c = customer;

  const loadCols = [
    { key: 'load_number', label: 'Load #' },
    { key: 'origin_city', label: 'Origin', render: (_, r) => `${r.origin_city || ''}, ${r.origin_state || ''}` },
    { key: 'dest_city', label: 'Dest', render: (_, r) => `${r.dest_city || ''}, ${r.dest_state || ''}` },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
    { key: 'total_revenue', label: 'Revenue', render: v => formatCurrency(v) },
  ];
  const invCols = [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'due_date', label: 'Due', render: v => formatDate(v) },
    { key: 'total_amount', label: 'Total', render: v => formatCurrency(v) },
    { key: 'balance_due', label: 'Balance', render: v => formatCurrency(v) },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title={c.company_name} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit?.(c)}>Edit</Button></>}>
      <div className="tabs" style={{ marginBottom: 12 }}>
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormSection title="Company">
            <Field label="Code" value={c.code} />
            <Field label="Company" value={c.company_name} />
            <Field label="Address" value={`${c.address || ''}, ${c.city || ''} ${c.state || ''} ${c.zip || ''}`} />
            <Field label="Status" value={<Badge status={c.status || 'active'} />} />
          </FormSection>
          <FormSection title="Contact">
            <Field label="Phone" value={formatPhone(c.main_phone)} />
            <Field label="Email" value={c.main_email} />
            <Field label="Billing" value={c.billing_email} />
            <Field label="Website" value={c.website} />
          </FormSection>
          <CreditStatus customer={c} balance={balance} />
          <FormSection title="Settings">
            <Field label="Payment Terms" value={c.payment_terms > 0 ? `Net ${c.payment_terms}` : c.payment_terms === 0 ? 'Due on Receipt' : 'COD'} />
            <Field label="Currency" value={c.currency} />
            <Field label="Tax Exempt" value={c.tax_exempt ? 'Yes' : 'No'} />
          </FormSection>
        </div>
      )}
      {tab === 'Loads' && <Table columns={loadCols} data={loads} emptyMessage="No loads" />}
      {tab === 'Invoices' && <Table columns={invCols} data={invoices} emptyMessage="No invoices" />}
      {tab === 'Contacts' && (
        <table className="tms-table">
          <thead><tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th><th>Primary</th></tr></thead>
          <tbody>
            {contacts.map(ct => (
              <tr key={ct.id}><td>{ct.name}</td><td>{ct.title || '—'}</td><td>{ct.email || '—'}</td>
                <td>{formatPhone(ct.phone)}</td><td>{ct.is_primary ? 'Yes' : ''}</td></tr>
            ))}
            {!contacts.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No contacts</td></tr>}
          </tbody>
        </table>
      )}
      {tab === 'Notes' && (
        <div>{notes.map(n => (
          <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12 }}>{n.note}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {formatDate(n.created_at)} {n.created_by_name && `· ${n.created_by_name}`}
            </div>
          </div>
        ))}{!notes.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No notes</div>}</div>
      )}
    </Modal>
  );
}
