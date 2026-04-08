import React, { useState, useEffect } from 'react';
import driversApi from '../../../drivers/services/driversApi';

export default function FleetFormDetails({ form, set }) {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    driversApi.getAll({ limit: 200, status: 'available' })
      .then(r => setDrivers(r.data || []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header">Ownership</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Owner Type</label>
          <select className="form-input" value={form.owner_type} onChange={e => set('owner_type', e.target.value)}>
            <option value="company">Company</option><option value="owner_op">Owner Operator</option>
          </select></div>
        {form.owner_type === 'owner_op' && (
          <div><label className="form-label">Owner Name</label>
            <input className="form-input" value={form.owner_name} onChange={e => set('owner_name', e.target.value)} /></div>
        )}
        <div><label className="form-label">Fleet Number</label>
          <input className="form-input" value={form.fleet_number} onChange={e => set('fleet_number', e.target.value)} /></div>
        <div><label className="form-label">IFTA Number</label>
          <input className="form-input" value={form.ifta_number} onChange={e => set('ifta_number', e.target.value)} /></div>
      </div>

      <div className="section-header">Assignment</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Assigned Driver</label>
          <select className="form-input" value={form.assigned_driver_id} onChange={e => set('assigned_driver_id', e.target.value)}>
            <option value="">-- None --</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
          </select></div>
      </div>

      <div className="section-header">Odometer / Hours</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label className="form-label">Current Odometer</label>
          <input className="form-input" type="number" value={form.odometer} onChange={e => set('odometer', e.target.value)} /></div>
        <div><label className="form-label">Engine Hours</label>
          <input className="form-input" type="number" value={form.engine_hours} onChange={e => set('engine_hours', e.target.value)} /></div>
      </div>
    </div>
  );
}
