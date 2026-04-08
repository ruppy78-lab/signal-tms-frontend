import React, { useState } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Button, Spinner, Pagination, EmptyState } from '../../shared/components';
import useDrivers from './hooks/useDrivers';
import DriverList from './components/DriverList';
import DriverForm from './components/DriverForm';

const TYPE_TABS = [
  { key: '', label: 'All' },
  { key: 'company', label: 'Company' },
  { key: 'owner_op', label: 'Owner Operator' },
];
const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'on_trip', label: 'On Trip' },
  { key: 'inactive', label: 'Inactive' },
];

export default function DriversModule() {
  const { drivers, loading, total, alerts, params, setParams, createDriver, updateDriver, deleteDriver } = useDrivers();
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [initType, setInitType] = useState('company');
  const pages = Math.ceil(total / (params.limit || 50));

  const handleSave = async (data) => {
    if (editDriver?.id) return await updateDriver(editDriver.id, data);
    else return await createDriver(data);
  };

  const handleEdit = (d) => { setEditDriver(d); setInitType(d.driver_type || 'company'); setFormOpen(true); };
  const handleDeactivate = async (d) => {
    if (!window.confirm(`Deactivate ${d.first_name} ${d.last_name}?`)) return;
    await deleteDriver(d.id);
  };

  const openNew = (type) => { setEditDriver(null); setInitType(type); setFormOpen(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Drivers</div>
          <div className="page-subtitle">{total} drivers</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button icon={Plus} onClick={() => openNew('company')}>Add Company Driver</Button>
          <Button icon={Plus} variant="secondary" onClick={() => openNew('owner_op')}>Add Owner Operator</Button>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 10,
          background: '#FFF7ED', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 12, color: '#92400E' }}>
          <AlertTriangle size={14} />
          <strong>{alerts.length} driver{alerts.length > 1 ? 's' : ''} with expiring documents</strong>
        </div>
      )}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Type filter */}
          <div style={{ display: 'flex', gap: 3 }}>
            {TYPE_TABS.map(t => (
              <button key={t.key} className={`btn btn-xs ${(params.driver_type || '') === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setParams(p => ({ ...p, driver_type: t.key, page: 1 }))}>{t.label}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: '#e0e0e0' }} />
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 3 }}>
            {STATUS_TABS.map(t => (
              <button key={t.key} className={`btn btn-xs ${(params.status || '') === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setParams(p => ({ ...p, status: t.key, page: 1 }))}>{t.label}</button>
            ))}
          </div>
          {/* Search */}
          <div style={{ position: 'relative', flex: '0 0 220px', marginLeft: 'auto' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: '#94A3B8' }} />
            <input className="form-input" placeholder="Search drivers..." value={params.search || ''}
              onChange={e => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
              style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : drivers.length === 0 ? <EmptyState title="No drivers found" />
            : <DriverList drivers={drivers} onSelect={handleEdit} onEdit={handleEdit} onDeactivate={handleDeactivate} />}
        </div>
      </div>

      <Pagination page={params.page || 1} pages={pages} total={total}
        onPrev={() => setParams(p => ({ ...p, page: p.page - 1 }))}
        onNext={() => setParams(p => ({ ...p, page: p.page + 1 }))}
        onGoTo={(n) => setParams(p => ({ ...p, page: n }))} />

      <DriverForm open={formOpen} onClose={() => setFormOpen(false)} driver={editDriver}
        onSave={handleSave} onDelete={deleteDriver} driverType={initType} />
    </div>
  );
}
