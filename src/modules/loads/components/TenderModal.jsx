import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import { Modal, Field } from '../../../components/common';
import { Send, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

const STATUS_COLORS = {
  pending:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  accepted:  { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  rejected:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  expired:   { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
  withdrawn: { bg: '#F3F4F6', color: '#9CA3AF', border: '#E5E7EB' },
};

const EXPIRY_OPTIONS = [
  { label: '2 hours', value: 2 },
  { label: '4 hours', value: 4 },
  { label: '8 hours', value: 8 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: 'No expiry', value: 0 },
];

export default function TenderModal({ open, load, carriers, onClose }) {
  const qc = useQueryClient();
  const [carrierId, setCarrierId] = useState('');
  const [rate, setRate] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) { setCarrierId(''); setRate(''); setExpiryHours(24); setNotes(''); }
  }, [open]);

  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ['load-tenders', load?.id],
    queryFn: () => api.get(`/loads/${load.id}/tenders`).then(r => r.data.data || []),
    enabled: !!load?.id && open,
  });

  const sendMut = useMutation({
    mutationFn: () => api.post(`/loads/${load.id}/tenders`, {
      carrier_id: carrierId,
      offered_rate: parseFloat(rate),
      expires_in_hours: expiryHours || undefined,
      notes: notes || undefined,
    }),
    onSuccess: (r) => {
      toast.success(r.data.message || 'Tender sent');
      qc.invalidateQueries(['load-tenders', load.id]);
      qc.invalidateQueries(['loads']);
      setCarrierId(''); setRate(''); setNotes('');
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to send tender'),
  });

  const respondMut = useMutation({
    mutationFn: ({ tenderId, status }) => api.put(`/loads/${load.id}/tenders/${tenderId}`, { status }),
    onSuccess: (_, { status }) => {
      toast.success(status === 'accepted' ? 'Tender accepted — load dispatched to carrier' : 'Tender rejected');
      qc.invalidateQueries(['load-tenders', load.id]);
      qc.invalidateQueries(['loads']);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const withdrawMut = useMutation({
    mutationFn: (tenderId) => api.delete(`/loads/${load.id}/tenders/${tenderId}`),
    onSuccess: () => {
      toast.success('Tender withdrawn');
      qc.invalidateQueries(['load-tenders', load.id]);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const hasPending = (tenders || []).some(t => t.status === 'pending');
  const selectedCarrier = (carriers || []).find(c => c.id === carrierId);

  return (
    <Modal open={open} onClose={onClose} title={`Tender Load — ${load?.load_number || ''}`} size="md"
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}>

      {/* Send New Tender Form */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#003865', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Send size={13} /> Send New Tender
        </div>

        {/* Load summary */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 11, color: '#6B7280' }}>
          <span><strong>Route:</strong> {load?.origin_city}, {load?.origin_state} → {load?.dest_city}, {load?.dest_state}</span>
          <span><strong>Date:</strong> {load?.pickup_date ? new Date(load.pickup_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
          <span><strong>Revenue:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>${parseFloat(load?.total_revenue || 0).toFixed(2)}</span></span>
        </div>

        <div className="form-grid">
          <Field label="Carrier" required>
            <select className="form-input" value={carrierId} onChange={e => setCarrierId(e.target.value)}>
              <option value="">Select carrier...</option>
              {(carriers || []).filter(c => c.status === 'active').map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.mc_number ? ` (MC ${c.mc_number})` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Offered Rate ($)" required>
            <input type="number" step="0.01" className="form-input" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Expires In">
            <select className="form-input" value={expiryHours} onChange={e => setExpiryHours(parseFloat(e.target.value))}>
              {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions for carrier..." />
          </Field>
        </div>

        {selectedCarrier && !selectedCarrier.email && (
          <div style={{ padding: '6px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 4, fontSize: 11, color: '#92400E', marginTop: 8 }}>
            <AlertCircle size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            No email on file for {selectedCarrier.name} — tender will be created but email won't be sent
          </div>
        )}

        <button onClick={() => sendMut.mutate()} disabled={sendMut.isPending || !carrierId || !rate}
          style={{ marginTop: 10, padding: '8px 18px', background: '#003865', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: (!carrierId || !rate) ? 0.5 : 1 }}>
          <Send size={12} /> {sendMut.isPending ? 'Sending...' : 'Send Tender'}
        </button>
      </div>

      {/* Tender History */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
        Tender History ({(tenders || []).length})
      </div>

      {tendersLoading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>Loading...</div>
      ) : !(tenders || []).length ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
          No tenders sent yet for this load
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {(tenders || []).map(t => {
            const sc = STATUS_COLORS[t.status] || STATUS_COLORS.expired;
            const isExpired = t.status === 'pending' && t.expires_at && new Date(t.expires_at) < new Date();
            return (
              <div key={t.id} style={{ border: `1px solid ${sc.border}`, borderRadius: 6, padding: '10px 12px', background: sc.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#111' }}>{t.carrier_name || t.carrier_name_resolved}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.color, color: '#fff', textTransform: 'uppercase' }}>
                    {isExpired ? 'EXPIRED' : t.status}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginLeft: 'auto' }}>${parseFloat(t.offered_rate).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#6B7280' }}>
                  <span>Sent: {new Date(t.created_at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  {t.expires_at && <span>Expires: {new Date(t.expires_at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
                  {t.responded_at && <span>Responded: {new Date(t.responded_at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
                </div>
                {t.notes && <div style={{ fontSize: 11, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>{t.notes}</div>}

                {/* Action buttons for pending tenders */}
                {t.status === 'pending' && !isExpired && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => respondMut.mutate({ tenderId: t.id, status: 'accepted' })}
                      disabled={respondMut.isPending}
                      style={{ padding: '4px 12px', border: '1px solid #059669', background: '#ECFDF5', color: '#059669', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> Accept
                    </button>
                    <button onClick={() => respondMut.mutate({ tenderId: t.id, status: 'rejected' })}
                      disabled={respondMut.isPending}
                      style={{ padding: '4px 12px', border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <XCircle size={11} /> Reject
                    </button>
                    <button onClick={() => { if (window.confirm('Withdraw this tender?')) withdrawMut.mutate(t.id); }}
                      disabled={withdrawMut.isPending}
                      style={{ padding: '4px 12px', border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      <Trash2 size={11} /> Withdraw
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Warning if pending tenders exist */}
      {hasPending && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 11, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} /> Pending tender(s) active — load cannot be manually dispatched until resolved
        </div>
      )}
    </Modal>
  );
}
