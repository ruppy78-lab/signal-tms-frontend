import React, { useState } from 'react';
import { Modal, Button, Input } from '../../../shared/components';
import { FormSection } from '../../../shared/components/Form';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { Send } from 'lucide-react';
import carriersApi from '../services/carriersApi';
import toast from 'react-hot-toast';

export default function CarrierTenderModal({ open, onClose, carrier, trip }) {
  const [rate, setRate] = useState(trip?.carrierRate || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!rate) { toast.error('Rate is required'); return; }
    setSending(true);
    try {
      await carriersApi.sendTender(carrier?.id, {
        trip_id: trip?.id,
        carrier_rate: parseFloat(rate),
        message,
      });
      toast.success('Tender sent successfully');
      onClose();
    } catch (e) {
      toast.error(e.message || 'Failed to send tender');
    }
    setSending(false);
  };

  if (!carrier || !trip) return null;

  const preview = [
    `Carrier: ${carrier.name}`,
    `Load: ${trip.loadNumber || trip.tripNumber || '—'}`,
    `Origin: ${trip.originCity || ''}, ${trip.originState || ''}`,
    `Destination: ${trip.destCity || ''}, ${trip.destState || ''}`,
    `Pickup: ${formatDate(trip.pickupDate)}`,
    `Delivery: ${formatDate(trip.deliveryDate)}`,
    `Equipment: ${trip.equipment || '—'}`,
    `Rate: ${formatCurrency(rate)}`,
  ].join('\n');

  return (
    <Modal open={open} onClose={onClose} title="Send Tender" size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Send} onClick={handleSend} loading={sending}>Send Tender</Button></>}>

      <FormSection title="Trip Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Origin:</span> {trip.originCity}, {trip.originState}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Dest:</span> {trip.destCity}, {trip.destState}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Pickup:</span> {formatDate(trip.pickupDate)}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Delivery:</span> {formatDate(trip.deliveryDate)}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Equipment:</span> {trip.equipment || '—'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Weight:</span> {trip.weight ? `${trip.weight} lb` : '—'}</div>
        </div>
      </FormSection>

      <FormSection title="Carrier Rate">
        <Input label="Rate ($)" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="Enter carrier rate" />
      </FormSection>

      <FormSection title="Message Preview">
        <pre style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {preview}
          {message && `\n\nNote: ${message}`}
        </pre>
        <textarea className="form-input" rows={2} placeholder="Optional message to carrier..." value={message}
          onChange={e => setMessage(e.target.value)} style={{ width: '100%', marginTop: 8, resize: 'vertical' }} />
      </FormSection>
    </Modal>
  );
}
