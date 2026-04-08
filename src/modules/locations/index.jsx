import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Spinner, Pagination, EmptyState } from '../../shared/components';
import useLocations from './hooks/useLocations';
import LocationList from './components/LocationList';
import LocationForm from './components/LocationForm';

const TYPE_TABS = [
  { key: '', label: 'All' },
  { key: 'shipper', label: 'Shippers' },
  { key: 'consignee', label: 'Consignees' },
  { key: 'shipper_consignee', label: 'Both' },
  { key: 'warehouse', label: 'Warehouses' },
];

export default function LocationsModule() {
  const { locations, loading, total, params, setParams, createLocation, updateLocation, deleteLocation } = useLocations();
  const [formOpen, setFormOpen] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const pages = Math.ceil(total / (params.limit || 50));

  const handleSave = async (data) => {
    if (editLocation?.id) await updateLocation(editLocation.id, data);
    else await createLocation(data);
  };

  const handleSelect = (loc) => { setEditLocation(loc); setFormOpen(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Locations</div>
          <div className="page-subtitle">{total} locations</div>
        </div>
        <Button icon={Plus} onClick={() => { setEditLocation(null); setFormOpen(true); }}>New Location</Button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {TYPE_TABS.map(t => (
              <button key={t.key} className={`btn btn-xs ${(params.type || '') === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setParams(p => ({ ...p, type: t.key, page: 1 }))}>{t.label}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '0 0 250px', marginLeft: 'auto' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search locations..." value={params.search || ''}
              onChange={e => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
              style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : locations.length === 0 ? <EmptyState title="No locations found" />
            : <LocationList locations={locations} onSelect={handleSelect} />}
        </div>
      </div>

      <Pagination page={params.page || 1} pages={pages} total={total}
        onPrev={() => setParams(p => ({ ...p, page: p.page - 1 }))}
        onNext={() => setParams(p => ({ ...p, page: p.page + 1 }))}
        onGoTo={(n) => setParams(p => ({ ...p, page: n }))} />

      <LocationForm open={formOpen} onClose={() => setFormOpen(false)}
        location={editLocation} onSave={handleSave} onDelete={deleteLocation} />
    </div>
  );
}
