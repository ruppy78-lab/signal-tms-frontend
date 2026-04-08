import React, { useState, useEffect } from 'react';
import { Modal, Badge, Button, Spinner } from '../../../shared/components';
import { FormSection } from '../../../shared/components/Form';
import { formatCurrency, formatDate, formatWeight } from '../../../shared/utils/formatters';
import api from '../../../shared/services/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{value != null && value !== '' ? value : '—'}</div>
    </div>
  );
}

export default function LoadDetail({ open, onClose, load: loadProp, onEdit }) {
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !loadProp?.id) { setLoad(null); return; }
    if (!UUID_RE.test(loadProp.id)) { setLoad(loadProp); return; }
    setLoading(true);
    api.get(`/loads/${loadProp.id}`)
      .then(r => setLoad(r.data || loadProp))
      .catch(() => setLoad(loadProp))
      .finally(() => setLoading(false));
  }, [open, loadProp]);

  if (!open) return null;
  if (loading || !load) return <Modal open={open} onClose={onClose} title="Loading..."><div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div></Modal>;

  const stops = Array.isArray(load.stops) ? load.stops : [];
  const pickups = stops.filter(s => s.stop_type === 'pickup');
  const deliveries = stops.filter(s => s.stop_type === 'delivery');

  return (
    <Modal open={open} onClose={onClose} title={`Load ${load.load_number}`} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit?.(load)}>Edit</Button></>}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Badge status={load.status} />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(load.total_revenue)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormSection title={`Pickup${pickups.length > 1 ? 's' : ''}`}>
          {pickups.length ? pickups.map((s, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <Field label="Name" value={s.company_name} />
              <Field label="Address" value={[s.address, s.city, s.state, s.zip].filter(Boolean).join(', ')} />
              <Field label="Date" value={formatDate(s.date)} />
            </div>
          )) : (
            <>
              <Field label="Name" value={load.origin_name} />
              <Field label="Address" value={[load.origin_address, load.origin_city, load.origin_state].filter(Boolean).join(', ')} />
              <Field label="Date" value={formatDate(load.pickup_date)} />
            </>
          )}
        </FormSection>
        <FormSection title={`Deliver${deliveries.length > 1 ? 'ies' : 'y'}`}>
          {deliveries.length ? deliveries.map((s, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <Field label="Name" value={s.company_name} />
              <Field label="Address" value={[s.address, s.city, s.state, s.zip].filter(Boolean).join(', ')} />
              <Field label="Date" value={formatDate(s.date)} />
            </div>
          )) : (
            <>
              <Field label="Name" value={load.dest_name} />
              <Field label="Address" value={[load.dest_address, load.dest_city, load.dest_state].filter(Boolean).join(', ')} />
              <Field label="Date" value={formatDate(load.delivery_date)} />
            </>
          )}
        </FormSection>
      </div>

      <FormSection title="Freight">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <Field label="Commodity" value={load.commodity} />
          <Field label="Weight" value={formatWeight(load.total_weight ?? load.weight)} />
          <Field label="Pieces" value={load.total_pieces ?? load.pieces} />
          <Field label="Equipment" value={load.equipment_type} />
        </div>
      </FormSection>

      <FormSection title="References">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <Field label="PO #" value={load.po_number} />
          <Field label="BOL #" value={load.bol_number} />
          <Field label="Ref #" value={load.ref_number} />
          <Field label="Customer" value={load.customer_name} />
        </div>
      </FormSection>

      {load.special_instructions && (
        <FormSection title="Special Instructions">
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{load.special_instructions}</p>
        </FormSection>
      )}
    </Modal>
  );
}
