import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, Table } from '../../../shared/components';
import { FormSection } from '../../../shared/components/Form';
import { formatCurrency, formatDate, formatPhone } from '../../../shared/utils/formatters';
import carriersApi from '../services/carriersApi';

const TABS = ['Details', 'Load History', 'Documents'];

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  );
}

export default function CarrierProfile({ open, onClose, carrier, onEdit }) {
  const [tab, setTab] = useState('Details');
  const [loads, setLoads] = useState([]);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    if (!carrier?.id || !open) return;
    setTab('Details');
    carriersApi.getLoadHistory(carrier.id).then(r => setLoads(r.data || r.loads || [])).catch(() => {});
    carriersApi.getDocuments(carrier.id).then(r => setDocs(r.data || r.documents || [])).catch(() => {});
  }, [carrier, open]);

  if (!carrier) return null;

  const loadCols = [
    { key: 'load_number', label: 'Load #' },
    { key: 'pickup_date', label: 'PU Date', render: v => formatDate(v) },
    { key: 'origin_city', label: 'Origin', render: (_, r) => `${r.origin_city || ''}, ${r.origin_state || ''}` },
    { key: 'dest_city', label: 'Dest', render: (_, r) => `${r.dest_city || ''}, ${r.dest_state || ''}` },
    { key: 'carrier_rate', label: 'Rate', render: v => formatCurrency(v) },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
  ];

  const docCols = [
    { key: 'doc_name', label: 'Document' },
    { key: 'doc_type', label: 'Type' },
    { key: 'created_at', label: 'Uploaded', render: v => formatDate(v) },
  ];

  return (
    <Modal open={open} onClose={onClose} title={carrier.name} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit?.(carrier)}>Edit</Button></>}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <Badge status={carrier.status || 'active'} />
        {carrier.dnu && <Badge status="dnu" label="DNU" />}
        {carrier.mc_number && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MC# {carrier.mc_number}</span>}
        {carrier.dot_number && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>DOT# {carrier.dot_number}</span>}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {TABS.map(t => (
          <button key={t} className={`btn btn-xs ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormSection title="Contact">
            <Field label="Contact" value={carrier.contact_name} />
            <Field label="Phone" value={formatPhone(carrier.phone)} />
            <Field label="Email" value={carrier.email} />
            <Field label="Fax" value={carrier.fax_number} />
          </FormSection>
          <FormSection title="Location">
            <Field label="Address" value={`${carrier.address || ''}, ${carrier.city || ''} ${carrier.state || ''} ${carrier.zip || ''}`} />
          </FormSection>
          <FormSection title="Insurance">
            <Field label="Company" value={carrier.insurance_company} />
            <Field label="Expiry" value={formatDate(carrier.insurance_expiry)} />
            <Field label="Liability" value={carrier.liability_amount ? formatCurrency(carrier.liability_amount) : '—'} />
            <Field label="Cargo" value={carrier.cargo_amount ? formatCurrency(carrier.cargo_amount) : '—'} />
          </FormSection>
          <FormSection title="Operations">
            <Field label="Equipment" value={carrier.equipment_types} />
            <Field label="Rating" value={carrier.rating ? `${carrier.rating}/5` : '—'} />
            <Field label="Preferred Lanes" value={carrier.preferred_lanes} />
          </FormSection>
          {carrier.dnu_reason && <FormSection title="DNU Reason"><p style={{ fontSize: 12, color: 'var(--danger)' }}>{carrier.dnu_reason}</p></FormSection>}
        </div>
      )}
      {tab === 'Load History' && <Table columns={loadCols} data={loads} emptyMessage="No load history" />}
      {tab === 'Documents' && <Table columns={docCols} data={docs} emptyMessage="No documents" />}
    </Modal>
  );
}
