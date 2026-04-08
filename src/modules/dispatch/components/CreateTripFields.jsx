import React from 'react';
import { formatCurrency } from '../../../shared/utils/formatters';
import { PAY_TYPES } from '../../../shared/utils/constants';
import { getPayRateLabel } from '../utils/tripCalculations';

export function CompanySection({ form, set, drivers, trucks, trailers, estPay, selDriver }) {
  return (
    <div className="ct-section">
      <label className="ct-label">Driver & Equipment</label>
      <div className="ct-grid2">
        <div>
          <label className="ct-sm-label">Driver</label>
          <select className="ct-input" value={form.driver_id} onChange={e => set('driver_id', e.target.value)}>
            <option value="">Select Driver</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.status === 'available' ? '\u2713' : '\u{1F69B}'} {d.first_name} {d.last_name} \u2014 {d.status}{d.driver_type === 'owner_operator' ? ' (Owner Op)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ct-sm-label">Co-Driver</label>
          <select className="ct-input" value={form.co_driver_id} onChange={e => set('co_driver_id', e.target.value)}>
            <option value="">None</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
          </select>
        </div>
        <div>
          <label className="ct-sm-label">Truck</label>
          <select className="ct-input" value={form.truck_id} onChange={e => set('truck_id', e.target.value)}>
            <option value="">Select Truck</option>
            {trucks.map(t => <option key={t.id} value={t.id}>{t.unit_number} \u2014 {t.make} {t.model}</option>)}
          </select>
        </div>
        <div>
          <label className="ct-sm-label">Trailer</label>
          <select className="ct-input" value={form.trailer_id} onChange={e => set('trailer_id', e.target.value)}>
            <option value="">Select Trailer</option>
            {trailers.map(t => <option key={t.id} value={t.id}>{t.unit_number}</option>)}
          </select>
        </div>
      </div>
      <label className="ct-label" style={{ marginTop: 8 }}>Driver Pay</label>
      <div className="ct-grid2">
        <div>
          <label className="ct-sm-label">Pay Type</label>
          <select className="ct-input" value={form.driver_pay_type} onChange={e => set('driver_pay_type', e.target.value)}>
            {PAY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="ct-sm-label">{getPayRateLabel(form.driver_pay_type)}</label>
          <input className="ct-input" type="number" value={form.driver_pay_rate} onChange={e => set('driver_pay_rate', e.target.value)} />
        </div>
      </div>
      <div className="ct-est-pay">Driver earns approx <b>{formatCurrency(estPay)}</b> this trip</div>
    </div>
  );
}

export function CarrierSection({ form, set, carriers }) {
  const selCarrier = carriers.find(c => c.id === form.carrier_id);
  return (
    <div className="ct-section">
      <label className="ct-label">Carrier Info</label>
      <div className="ct-grid2">
        <div>
          <label className="ct-sm-label">Carrier</label>
          <select className="ct-input" value={form.carrier_id} onChange={e => set('carrier_id', e.target.value)}>
            <option value="">Select Carrier</option>
            {carriers.filter(c => !c.dnu).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="ct-sm-label">Carrier Rate</label>
          <input className="ct-input" type="number" value={form.carrier_rate} onChange={e => set('carrier_rate', e.target.value)} />
        </div>
      </div>
      {selCarrier && (
        <div className="ct-carrier-info">MC# {selCarrier.mc_number || '\u2014'} | DOT# {selCarrier.dot_number || '\u2014'} | {selCarrier.phone || '\u2014'}</div>
      )}
      <div className="ct-grid2" style={{ marginTop: 4 }}>
        <div>
          <label className="ct-sm-label">Their Driver</label>
          <input className="ct-input" value={form.carrier_driver} onChange={e => set('carrier_driver', e.target.value)} />
        </div>
        <div>
          <label className="ct-sm-label">Their Truck#</label>
          <input className="ct-input" value={form.carrier_truck} onChange={e => set('carrier_truck', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
