import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Spinner, Pagination, EmptyState } from '../../shared/components';
import useCarriers from './hooks/useCarriers';
import CarrierList from './components/CarrierList';
import CarrierForm from './components/CarrierForm';
import CarrierProfile from './components/CarrierProfile';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'inactive', label: 'Inactive' },
];

export default function CarriersModule() {
  const { carriers, loading, total, params, setParams, createCarrier, updateCarrier } = useCarriers();
  const [formOpen, setFormOpen] = useState(false);
  const [editCarrier, setEditCarrier] = useState(null);
  const [profileCarrier, setProfileCarrier] = useState(null);
  const pages = Math.ceil(total / (params.limit || 50));

  const handleSave = async (data) => {
    if (editCarrier?.id) await updateCarrier(editCarrier.id, data);
    else await createCarrier(data);
  };

  const handleEdit = (c) => { setProfileCarrier(null); setEditCarrier(c); setFormOpen(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Carriers</div>
          <div className="page-subtitle">{total} carriers</div>
        </div>
        <Button icon={Plus} onClick={() => { setEditCarrier(null); setFormOpen(true); }}>New Carrier</Button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_TABS.map(t => (
              <button key={t.key} className={`btn btn-xs ${(params.status || '') === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setParams(p => ({ ...p, status: t.key, page: 1 }))}>{t.label}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '0 0 220px', marginLeft: 'auto' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search carriers..." value={params.search || ''}
              onChange={e => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
              style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : carriers.length === 0 ? <EmptyState title="No carriers found" />
            : <CarrierList carriers={carriers} onSelect={setProfileCarrier} />}
        </div>
      </div>

      <Pagination page={params.page || 1} pages={pages} total={total}
        onPrev={() => setParams(p => ({ ...p, page: p.page - 1 }))}
        onNext={() => setParams(p => ({ ...p, page: p.page + 1 }))}
        onGoTo={(n) => setParams(p => ({ ...p, page: n }))} />

      <CarrierForm open={formOpen} onClose={() => setFormOpen(false)} carrier={editCarrier} onSave={handleSave} />
      <CarrierProfile open={!!profileCarrier} onClose={() => setProfileCarrier(null)} carrier={profileCarrier} onEdit={handleEdit} />
    </div>
  );
}
