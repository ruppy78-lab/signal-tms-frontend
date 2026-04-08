import React, { useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Button, Spinner, Pagination, EmptyState } from '../../shared/components';
import useFleet from './hooks/useFleet';
import FleetList from './components/FleetList';
import FleetForm from './components/FleetForm';

const TYPE_TABS = [
  { key: '', label: 'All' },
  { key: 'truck', label: 'Trucks' },
  { key: 'trailer', label: 'Trailers' },
];
const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'in_shop', label: 'In Shop' },
  { key: 'inactive', label: 'Inactive' },
];

export default function FleetModule() {
  const { vehicles, loading, total, alerts, params, setParams, createVehicle, updateVehicle, deleteVehicle } = useFleet();
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [initType, setInitType] = useState('truck');
  const pages = Math.ceil(total / (params.limit || 50));

  const counts = useMemo(() => {
    const c = { trucks: 0, trailers: 0 };
    vehicles.forEach(v => { if (v.type === 'truck') c.trucks++; else c.trailers++; });
    return c;
  }, [vehicles]);

  const handleSave = async (data) => {
    if (editVehicle?.id) await updateVehicle(editVehicle.id, data);
    else await createVehicle(data);
  };

  const handleEdit = (v) => { setEditVehicle(v); setInitType(v.type || 'truck'); setFormOpen(true); };
  const handleDeactivate = async (v) => {
    if (!window.confirm(`Deactivate ${v.unit_number}?`)) return;
    await deleteVehicle(v.id);
  };
  const openNew = (type) => { setEditVehicle(null); setInitType(type); setFormOpen(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Fleet</div>
          <div className="page-subtitle">{total} units</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button icon={Plus} onClick={() => openNew('truck')}>Add Truck</Button>
          <Button icon={Plus} variant="secondary" onClick={() => openNew('trailer')}>Add Trailer</Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 10,
          background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 12, color: 'var(--warning)' }}>
          <AlertTriangle size={14} />
          <strong>{alerts.length} unit{alerts.length > 1 ? 's' : ''} with expiring documents</strong>
        </div>
      )}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {TYPE_TABS.map(t => (
              <button key={t.key} className={`btn btn-xs ${(params.type || '') === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setParams(p => ({ ...p, type: t.key, page: 1 }))}>{t.label}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{ display: 'flex', gap: 3 }}>
            {STATUS_TABS.map(t => (
              <button key={t.key} className={`btn btn-xs ${(params.status || '') === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setParams(p => ({ ...p, status: t.key, page: 1 }))}>{t.label}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '0 0 220px', marginLeft: 'auto' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search fleet..." value={params.search || ''}
              onChange={e => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
              style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : vehicles.length === 0 ? <EmptyState title="No vehicles found" />
            : <FleetList vehicles={vehicles} onSelect={handleEdit} onEdit={handleEdit} onDeactivate={handleDeactivate} />}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {counts.trucks} trucks | {counts.trailers} trailers | {total} total
        </div>
        <Pagination page={params.page || 1} pages={pages} total={total}
          onPrev={() => setParams(p => ({ ...p, page: p.page - 1 }))}
          onNext={() => setParams(p => ({ ...p, page: p.page + 1 }))}
          onGoTo={(n) => setParams(p => ({ ...p, page: n }))} />
      </div>

      <FleetForm open={formOpen} onClose={() => setFormOpen(false)} vehicle={editVehicle}
        onSave={handleSave} onDelete={deleteVehicle} initType={initType} />
    </div>
  );
}
