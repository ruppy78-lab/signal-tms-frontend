import React from 'react';
import { Input, Select } from '../../../../shared/components';
import { formatCurrency } from '../../../../shared/utils/formatters';

export default function RateSection({ form, set, accTotal, totalRevenue }) {
  return (
    <div className="form-section">
      <div className="form-section-header">Rate & Revenue</div>
      <div className="form-section-body">
        <div className="form-grid-4">
          <Select label="Rate Type" options={[
            { value: 'flat', label: 'Flat' }, { value: 'per_mile', label: 'Per Mile' },
            { value: 'per_cwt', label: 'Per CWT' }, { value: 'quote', label: 'Quote' },
          ]} value={form.rate_type} onChange={e => set('rate_type', e.target.value)} />
          <Input label="Base Rate $" type="number" value={form.base_rate}
            onChange={e => set('base_rate', e.target.value)} />
          <Input label="Miles" type="number" value={form.miles}
            onChange={e => set('miles', e.target.value)} />
          <Input label="Fuel Surcharge $" type="number" value={form.fuel_surcharge}
            onChange={e => set('fuel_surcharge', e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline',
          gap: 16, marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Base: {formatCurrency(parseFloat(form.base_rate) || 0)}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Fuel: {formatCurrency(parseFloat(form.fuel_surcharge) || 0)}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Acc: {formatCurrency(accTotal)}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue, #0063A3)' }}>
            Total: {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>
    </div>
  );
}
