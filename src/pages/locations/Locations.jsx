import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Edit, Trash2, MapPin, X } from 'lucide-react';
import { Spinner, Pagination } from '../../components/common';

const TYPES = [
  { val: 'shipper',   label: 'Shipper',    color: '#0063A3', bg: '#E3F2FD' },
  { val: 'consignee', label: 'Consignee',  color: '#2E7D32', bg: '#E8F5E9' },
  { val: 'warehouse', label: 'Warehouse',  color: '#6A1B9A', bg: '#F3E5F5' },
  { val: 'both',      label: 'Shipper/Consignee', color: '#E65100', bg: '#FFF3E0' },
];

const EMPTY = {
  name: '', company: '', location_type: 'both',
  address: '', city: '', state: '', zip: '', country: 'Canada',
  phone: '', email: '', contact_name: '', notes: '',
};

const TH = { fontSize: 11, fontWeight: 700, color: '#fff', padding: '8px 10px', background: '#003865', textAlign: 'left', whiteSpace: 'nowrap' };
const TD = { fontSize: 12, padding: '8px 10px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

function TypeBadge({ type }) {
  const t = TYPES.find(x => x.val === type) || TYPES[3];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: t.bg, color: t.color }}>
      {t.label}
    </span>
  );
}

function LocationModal({ location, onClose, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(location ? { ...location } : { ...EMPTY });
  const isNew = !location?.id;

  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const saveMut = useMutation({
    mutationFn: () => isNew
      ? api.post('/locations', form)
      : api.put(`/locations/${location.id}`, form),
    onSuccess: () => {
      toast.success(isNew ? 'Location added' : 'Location updated');
      qc.invalidateQueries(['locations']);
      qc.invalidateQueries(['locations-dropdown']);
      onSaved();
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const FI = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#003865', color: '#fff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            <MapPin size={14} style={{ marginRight: 6 }} />
            {isNew ? 'Add New Location' : `Edit — ${location.name}`}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Form */}
        <div style={{ overflowY: 'auto', padding: 18, flex: 1 }}>
          {/* Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase' }}>Location Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TYPES.map(t => (
                <button key={t.val} onClick={() => setF('location_type', t.val)}
                  style={{ padding: '6px 14px', border: 'none', borderRadius: 16, fontSize: 12, fontWeight: form.location_type === t.val ? 700 : 400,
                    background: form.location_type === t.val ? t.color : '#f0f0f0',
                    color: form.location_type === t.val ? '#fff' : '#555', cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name + Company */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Location Name *</label>
              <input value={form.name} onChange={e => setF('name', e.target.value)} style={FI} placeholder="e.g. Beverage Specialists Tukwila" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Company (optional)</label>
              <input value={form.company} onChange={e => setF('company', e.target.value)} style={FI} placeholder="Parent company name" />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Street Address</label>
            <input value={form.address} onChange={e => setF('address', e.target.value)} style={FI} placeholder="905 Industry Drive Bldg 2" />
          </div>

          {/* City/State/Zip/Country */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>City</label>
              <input value={form.city} onChange={e => setF('city', e.target.value)} style={FI} placeholder="Tukwila" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>State/Province</label>
              <input value={form.state} onChange={e => setF('state', e.target.value)} style={FI} placeholder="WA" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>ZIP/Postal</label>
              <input value={form.zip} onChange={e => setF('zip', e.target.value)} style={FI} placeholder="98188" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Country</label>
              <select value={form.country} onChange={e => setF('country', e.target.value)} style={FI}>
                <option value="Canada">Canada</option>
                <option value="USA">USA</option>
              </select>
            </div>
          </div>

          {/* Contact info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Phone</label>
              <input value={form.phone} onChange={e => setF('phone', e.target.value)} style={FI} placeholder="Phone" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Email</label>
              <input value={form.email} onChange={e => setF('email', e.target.value)} style={FI} placeholder="Email" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Contact Name</label>
              <input value={form.contact_name} onChange={e => setF('contact_name', e.target.value)} style={FI} placeholder="Contact person" />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Notes / Instructions</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3}
              style={{ ...FI, resize: 'vertical' }} placeholder="Dock hours, gate codes, special instructions…" />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #ddd', background: '#fff', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.name}
            style={{ padding: '8px 20px', border: 'none', background: '#003865', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saveMut.isPending ? 'Saving…' : isNew ? 'Add Location' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Locations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'new' | location object

  const { data, isLoading } = useQuery({
    queryKey: ['locations', page, search, type],
    queryFn: () => api.get('/locations', { params: { page, limit: 25, search, type } }).then(r => r.data),
    keepPreviousData: true,
  });

  const rows = data?.data || [];
  const paging = data?.pagination;

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/locations/${id}`),
    onSuccess: () => { toast.success('Location deleted'); qc.invalidateQueries(['locations']); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, flexShrink: 0 }}>
        <h1 className="page-title">Locations</h1>
        <span style={{ fontSize: 12, color: '#888', marginRight: 'auto' }}>{data?.pagination?.total || 0} saved locations</span>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={14} /> Add Location
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input className="form-input" style={{ paddingLeft: 28 }} placeholder="Search name, city…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ val: '', label: 'All' }, ...TYPES].map(t => (
            <button key={t.val} onClick={() => { setType(t.val); setPage(1); }}
              style={{ padding: '4px 12px', border: 'none', borderRadius: 16, fontSize: 12,
                fontWeight: type === t.val ? 700 : 400, cursor: 'pointer',
                background: type === t.val ? '#003865' : '#f0f0f0',
                color: type === t.val ? '#fff' : '#555' }}>
              {t.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => qc.invalidateQueries(['locations'])}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
          ) : !rows.length ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#aaa' }}>
              <MapPin size={36} style={{ marginBottom: 12, opacity: 0.25 }} /><br />
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No locations saved yet</p>
              <p style={{ fontSize: 12, marginBottom: 16 }}>Add shippers, consignees, and warehouses to quickly fill stop details</p>
              <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>
                <Plus size={12} /> Add Location
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  {['Name', 'Type', 'Address', 'City', 'State', 'Phone', 'Contact', ''].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((loc, i) => (
                  <tr key={loc.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                    <td style={{ ...TD, fontWeight: 600, color: '#003865' }}>{loc.name}</td>
                    <td style={TD}><TypeBadge type={loc.location_type} /></td>
                    <td style={{ ...TD, color: '#555' }}>{loc.address || '—'}</td>
                    <td style={{ ...TD, color: '#555' }}>{loc.city || '—'}</td>
                    <td style={{ ...TD, color: '#555' }}>{loc.state || '—'}</td>
                    <td style={{ ...TD, color: '#555' }}>{loc.phone || '—'}</td>
                    <td style={{ ...TD, color: '#555' }}>{loc.contact_name || '—'}</td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                      <button onClick={() => setModal(loc)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0063A3', padding: '2px 6px' }}>
                        <Edit size={13} />
                      </button>
                      <button onClick={() => { if (window.confirm(`Delete ${loc.name}?`)) deleteMut.mutate(loc.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c00', padding: '2px 6px' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination pagination={paging} onPage={setPage} />
      </div>

      {/* Modal */}
      {modal && (
        <LocationModal
          location={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}
    </div>
  );
}
