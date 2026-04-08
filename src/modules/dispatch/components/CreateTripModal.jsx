import React, { useState, useEffect } from 'react';
import { Truck, Building2 } from 'lucide-react';
import { Modal, Button } from '../../../shared/components';
import { formatCurrency, formatWeight } from '../../../shared/utils/formatters';
import { WAREHOUSE } from '../../../shared/utils/constants';
import { loadTotals, calculateDriverPay } from '../utils/tripCalculations';
import TripTypeSelector from './TripTypeSelector';
import LoadSelector from './LoadSelector';
import { CompanySection, CarrierSection } from './CreateTripFields';
import driversApi from '../../drivers/services/driversApi';
import carriersApi from '../../carriers/services/carriersApi';
import fleetApi from '../../fleet/services/fleetApi';

const INIT = {
  driver_id: '', co_driver_id: '', truck_id: '', trailer_id: '',
  carrier_id: '', carrier_driver: '', carrier_truck: '', carrier_rate: '',
  driver_pay_type: 'flat', driver_pay_rate: '', driver_bonus: 0, driver_deductions: 0,
  planned_date: new Date().toISOString().slice(0, 10),
  start_time: '06:00', end_time: '', estimated_miles: '',
  email_alert: true, broadcast_notes: '', dispatcher_notes: '',
  starting_point: WAREHOUSE.full,
};

export default function CreateTripModal({ open, onClose, available = [], onDock = [], onCreate }) {
  const [tab, setTab] = useState('company');
  const [tripType, setTripType] = useState('direct');
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(INIT);
  const [drivers, setDrivers] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [carriers, setCarriers] = useState([]);

  useEffect(() => {
    driversApi.getAll({ limit: 100 }).then(r => setDrivers(r.data || r.rows || [])).catch(() => {});
    fleetApi.getAll({ limit: 100 }).then(r => setFleet(r.data || r.rows || [])).catch(() => {});
    carriersApi.getAll({ limit: 100 }).then(r => setCarriers(r.data || r.rows || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const loads = tripType === 'outbound' ? onDock : available;
  const selLoads = loads.filter(l => selected.includes(l.id));
  const totals = loadTotals(selLoads);
  const estPay = calculateDriverPay(form.driver_pay_type, form.driver_pay_rate, form.estimated_miles, totals.revenue, selected.length * 2);
  const trucks = fleet.filter(f => f.type === 'truck' || f.type === 'tractor');
  const trailers = fleet.filter(f => f.type === 'trailer');
  const types = tab === 'carrier' ? ['direct', 'inbound', 'outbound'] : ['direct', 'inbound', 'outbound', 'multi_stop', 'continuation'];
  const selDriver = drivers.find(d => d.id === form.driver_id);

  const handleCreate = () => {
    onCreate({ trip_type: tripType, trip_subtype: tripType, load_ids: selected, is_carrier: tab === 'carrier', ...form, driver_pay_amount: estPay });
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Trip" size="lg" footer={
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} disabled={!selected.length}>Create Trip with {selected.length} load{selected.length !== 1 ? 's' : ''}</Button>
      </div>
    }>
      <div className="create-trip-tabs">
        <div className={`ctt-btn ${tab === 'company' ? 'active' : ''}`} onClick={() => setTab('company')}><Truck size={14} /> Company Driver</div>
        <div className={`ctt-btn ${tab === 'carrier' ? 'active' : ''}`} onClick={() => setTab('carrier')}><Building2 size={14} /> Outside Carrier</div>
      </div>

      <TripTypeSelector types={types} value={tripType} onChange={t => { setTripType(t); setSelected([]); }} />

      {tripType === 'continuation' && (
        <div className="ct-section">
          <label className="ct-label">Starting Point</label>
          <input className="ct-input" value={form.starting_point} onChange={e => set('starting_point', e.target.value)} />
        </div>
      )}

      <LoadSelector loads={loads} selected={selected} setSelected={setSelected} tripType={tripType} />
      <div className="ct-totals">
        <span>{totals.count} loads selected</span><span>{formatWeight(totals.weight)}</span><span>{formatCurrency(totals.revenue)}</span>
      </div>

      {tab === 'company'
        ? <CompanySection form={form} set={set} drivers={drivers} trucks={trucks} trailers={trailers} estPay={estPay} selDriver={selDriver} />
        : <CarrierSection form={form} set={set} carriers={carriers} />}

      <div className="ct-section">
        <label className="ct-label">Schedule</label>
        <div className="ct-grid3">
          <div><label className="ct-sm-label">Date</label><input className="ct-input" type="date" value={form.planned_date} onChange={e => set('planned_date', e.target.value)} /></div>
          <div><label className="ct-sm-label">Start</label><input className="ct-input" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} /></div>
          <div><label className="ct-sm-label">End</label><input className="ct-input" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></div>
        </div>
      </div>

      {tab === 'company' && (
        <div className="ct-section">
          <label className="ct-check"><input type="checkbox" checked={form.email_alert} onChange={e => set('email_alert', e.target.checked)} /> Send trip details to driver email</label>
          {selDriver && <div className="ct-hint">{selDriver.email || 'No email on file'}</div>}
          {selDriver && !selDriver.email && <div className="ct-warn">Driver has no email on file</div>}
        </div>
      )}

      <div className="ct-section">
        <label className="ct-label">Notes</label>
        <textarea className="ct-textarea" placeholder="Broadcast notes (visible to driver)..." value={form.broadcast_notes} onChange={e => set('broadcast_notes', e.target.value)} />
        <textarea className="ct-textarea" placeholder="Internal dispatcher notes..." value={form.dispatcher_notes} onChange={e => set('dispatcher_notes', e.target.value)} style={{ marginTop: 4 }} />
      </div>
    </Modal>
  );
}
