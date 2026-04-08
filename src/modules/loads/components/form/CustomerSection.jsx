import React from 'react';
import { Input, Select } from '../../../../shared/components';
import { EQUIPMENT_TYPES } from '../../../../shared/utils/constants';
import CreditAlert from './CreditAlert';

export default function CustomerSection({ form, set, customers }) {
  return (
    <div className="form-section">
      <div className="form-section-header">Customer & References</div>
      <div className="form-section-body">
        <Select label="Customer *" options={[{ value: '', label: '— Select Customer —' }, ...customers]}
          value={form.customer_id} onChange={e => set('customer_id', e.target.value)} />
        <CreditAlert customerId={form.customer_id} />
        <div className="form-grid-4" style={{ marginTop: 8 }}>
          <Input label="Reference #" value={form.ref_number} onChange={e => set('ref_number', e.target.value)} />
          <Select label="Equipment" options={EQUIPMENT_TYPES.map(t => ({ value: t, label: t }))}
            value={form.equipment_type} onChange={e => set('equipment_type', e.target.value)} />
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', paddingTop: 18 }}>
              <input type="checkbox" checked={form.is_cross_border || false} onChange={e => set('is_cross_border', e.target.checked)} />
              <span style={{ fontWeight: 600 }}>Cross-Border</span>
            </label>
            {form.is_cross_border && (
              <select className="form-input" value={form.customs_type || ''} onChange={e => set('customs_type', e.target.value)}
                style={{ height: 26, fontSize: 11, padding: '0 6px' }}>
                <option value="">Type...</option>
                <option value="PAPS">PAPS (to USA)</option>
                <option value="PARS">PARS (to Canada)</option>
              </select>
            )}
          </div>
          <Select label="Status" options={[
            { value: 'available', label: 'Available' }, { value: 'dispatched', label: 'Dispatched' },
            { value: 'at_pickup', label: 'At Pickup' }, { value: 'in_transit', label: 'In Transit' },
            { value: 'at_delivery', label: 'At Delivery' }, { value: 'delivered', label: 'Delivered' },
            { value: 'on_dock', label: 'On Dock' }, { value: 'cancelled', label: 'Cancelled' },
          ]} value={form.status} onChange={e => set('status', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
