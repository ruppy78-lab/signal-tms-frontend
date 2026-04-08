import React from 'react';
import { Bell, Truck, Home } from 'lucide-react';
import { Select } from '../../../../shared/components';
import { FormSection } from '../../../../shared/components/Form';
import { EQUIPMENT_TYPES } from '../../../../shared/utils/constants';

function Toggle({ checked, onChange, label, description, icon: Icon }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked || false} onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 2 }} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          {Icon && <Icon size={13} />} {label}
        </div>
        {description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
    </label>
  );
}

export default function TabDispatch({ form, set }) {
  return (
    <>
      <FormSection title="Email Alerts">
        <Toggle icon={Bell} label="Alert on Dispatch"
          description="Send email when load is assigned to a trip"
          checked={form.alert_on_dispatch}
          onChange={v => set('alert_on_dispatch', v)} />
        <Toggle icon={Truck} label="Alert on Pickup"
          description="Send email when driver arrives at pickup"
          checked={form.alert_on_pickup}
          onChange={v => set('alert_on_pickup', v)} />
        <Toggle icon={Bell} label="Alert on Delivery"
          description="Send email when load is delivered"
          checked={form.alert_on_delivery}
          onChange={v => set('alert_on_delivery', v)} />
      </FormSection>

      <FormSection title="Default Load Settings" style={{ marginTop: 14 }}>
        <div style={{ maxWidth: 300, marginBottom: 10 }}>
          <Select label="Equipment Type" value={form.default_equipment ?? ''}
            onChange={e => set('default_equipment', e.target.value)}
            options={[{ value: '', label: 'None' }, ...EQUIPMENT_TYPES.map(t => ({ value: t, label: t }))]} />
        </div>

        <Toggle icon={Truck} label="Requires Liftgate by default"
          checked={form.requires_liftgate}
          onChange={v => set('requires_liftgate', v)} />
        <Toggle icon={Home} label="Residential deliveries"
          description="Default for all loads from this customer"
          checked={form.residential_default}
          onChange={v => set('residential_default', v)} />

        <div style={{ marginTop: 10 }}>
          <label className="form-label">Special Instructions</label>
          <textarea className="form-input" rows={3} value={form.special_instructions || ''}
            onChange={e => set('special_instructions', e.target.value)}
            placeholder="Applied to all loads for this customer"
            style={{ width: '100%', resize: 'vertical' }} />
        </div>
      </FormSection>
    </>
  );
}
