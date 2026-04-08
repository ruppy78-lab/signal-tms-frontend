import React from 'react';
import { Input, Select } from '../../../../shared/components';
import { FormGrid, FormSection } from '../../../../shared/components/Form';

export default function TabCompanyInfo({ form, set }) {
  return (
    <>
      <FormSection title="Company Info">
        <FormGrid cols={1}>
          <Input label="Company Name *" value={form.company_name ?? ''}
            onChange={e => set('company_name', e.target.value)} />
        </FormGrid>
        <FormGrid cols={2} style={{ marginTop: 10 }}>
          <Input label="Customer Code" value={form.code ?? ''}
            onChange={e => set('code', e.target.value)} placeholder="Auto-generated if blank" />
          <Select label="Status" value={form.status ?? 'active'}
            onChange={e => set('status', e.target.value)}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </FormGrid>
        <FormGrid cols={2} style={{ marginTop: 10 }}>
          <Input label="Phone" value={form.main_phone ?? ''}
            onChange={e => set('main_phone', e.target.value)} />
          <Input label="Email" type="email" value={form.main_email ?? ''}
            onChange={e => set('main_email', e.target.value)} />
        </FormGrid>
        <FormGrid cols={2} style={{ marginTop: 10 }}>
          <Input label="Billing Email" type="email" value={form.billing_email ?? ''}
            onChange={e => set('billing_email', e.target.value)} />
          <Input label="Website" value={form.website ?? ''}
            onChange={e => set('website', e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Address" style={{ marginTop: 14 }}>
        <FormGrid cols={1}>
          <Input label="Address" value={form.address ?? ''}
            onChange={e => set('address', e.target.value)} />
        </FormGrid>
        <FormGrid cols={4} style={{ marginTop: 10 }}>
          <Input label="City" value={form.city ?? ''}
            onChange={e => set('city', e.target.value)} />
          <Input label="Province/State" value={form.state ?? ''}
            onChange={e => set('state', e.target.value)} />
          <Input label="Postal/ZIP" value={form.zip ?? ''}
            onChange={e => set('zip', e.target.value)} />
          <Select label="Country" value={form.country ?? 'Canada'}
            onChange={e => set('country', e.target.value)}
            options={['Canada', 'USA']} />
        </FormGrid>
      </FormSection>
    </>
  );
}
