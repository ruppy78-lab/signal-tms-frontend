import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../../../shared/components';
import { FormGrid, FormSection } from '../../../shared/components/Form';
import { EQUIPMENT_TYPES, PAYMENT_TERMS } from '../../../shared/utils/constants';
import toast from 'react-hot-toast';

const empty = {
  name: '', mcNumber: '', dotNumber: '', scac: '',
  contactName: '', email: '', phone: '', fax: '',
  address: '', city: '', state: '', zip: '',
  insuranceCompany: '', insurancePolicy: '', insuranceExpiry: '', liabilityLimit: '', cargoLimit: '',
  equipmentTypes: '', paymentTerms: 30, hasW9: false, factoringCompany: '',
  safetyRating: '', rating: '', preferredLanes: '',
  dnu: false, dnuReason: '', notes: '', status: 'active',
};

export default function CarrierForm({ open, onClose, carrier, onSave }) {
  const isEdit = !!carrier?.id;
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (carrier?.id) {
        setForm({
          ...empty,
          name: carrier.name || '',
          mcNumber: carrier.mc_number || carrier.mcNumber || '',
          dotNumber: carrier.dot_number || carrier.dotNumber || '',
          scac: carrier.scac_code || carrier.scac || '',
          contactName: carrier.contact_name || carrier.contactName || '',
          email: carrier.email || '',
          phone: carrier.phone || '',
          fax: carrier.fax_number || carrier.fax || '',
          address: carrier.address || '',
          city: carrier.city || '',
          state: carrier.state || '',
          zip: carrier.zip || '',
          insuranceCompany: carrier.insurance_company || carrier.insuranceCompany || '',
          insurancePolicy: carrier.insurance_policy || carrier.insurancePolicy || '',
          insuranceExpiry: carrier.insurance_expiry || carrier.insuranceExpiry || '',
          liabilityLimit: carrier.liability_amount || carrier.liabilityLimit || '',
          cargoLimit: carrier.cargo_amount || carrier.cargoLimit || '',
          equipmentTypes: carrier.equipment_types || carrier.equipmentTypes || '',
          paymentTerms: carrier.payment_terms || carrier.paymentTerms || 30,
          hasW9: carrier.w9_on_file || carrier.hasW9 || false,
          factoringCompany: carrier.factoring_company || carrier.factoringCompany || '',
          safetyRating: carrier.safety_rating || carrier.safetyRating || '',
          rating: carrier.rating || '',
          preferredLanes: carrier.preferred_lanes || carrier.preferredLanes || '',
          dnu: carrier.dnu || false,
          dnuReason: carrier.dnu_reason || carrier.dnuReason || '',
          notes: carrier.notes || '',
          status: carrier.status || 'active',
        });
      } else {
        setForm({ ...empty });
      }
    }
  }, [open, carrier]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { toast.error('Carrier name is required'); return; }
    setSaving(true);
    try {
      const data = { ...form, status: form.dnu ? 'blocked' : form.status };
      await onSave(data);
      onClose();
    } catch (e) { toast.error(e.message || 'Save failed'); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${carrier.name}` : 'New Carrier'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave} loading={saving}>{isEdit ? 'Update' : 'Create'}</Button></>}>

      <FormSection title="Company">
        <FormGrid cols={4}>
          <Input label="Carrier Name" value={form.name} onChange={e => set('name', e.target.value)} style={{ gridColumn: 'span 2' }} />
          <Input label="MC #" value={form.mcNumber} onChange={e => set('mcNumber', e.target.value)} />
          <Input label="DOT #" value={form.dotNumber} onChange={e => set('dotNumber', e.target.value)} />
          <Input label="SCAC" value={form.scac} onChange={e => set('scac', e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Contact">
        <FormGrid cols={4}>
          <Input label="Contact Name" value={form.contactName} onChange={e => set('contactName', e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Fax" value={form.fax} onChange={e => set('fax', e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Location">
        <FormGrid cols={4}>
          <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} style={{ gridColumn: 'span 2' }} />
          <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} />
          <Input label="State" value={form.state} onChange={e => set('state', e.target.value)} />
          <Input label="Zip" value={form.zip} onChange={e => set('zip', e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Insurance">
        <FormGrid cols={3}>
          <Input label="Insurance Company" value={form.insuranceCompany} onChange={e => set('insuranceCompany', e.target.value)} />
          <Input label="Policy #" value={form.insurancePolicy} onChange={e => set('insurancePolicy', e.target.value)} />
          <Input label="Expiry Date" type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
          <Input label="Liability Limit" type="number" value={form.liabilityLimit} onChange={e => set('liabilityLimit', e.target.value)} />
          <Input label="Cargo Limit" type="number" value={form.cargoLimit} onChange={e => set('cargoLimit', e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Operations">
        <FormGrid cols={3}>
          <Input label="Equipment Types" value={form.equipmentTypes} onChange={e => set('equipmentTypes', e.target.value)} placeholder="e.g. Dry Van, Flatbed" />
          <Select label="Payment Terms" options={PAYMENT_TERMS} value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, paddingTop: 20 }}>
            <input type="checkbox" checked={form.hasW9 || false} onChange={e => set('hasW9', e.target.checked)} /> W-9 on File
          </label>
          <Input label="Factoring Company" value={form.factoringCompany} onChange={e => set('factoringCompany', e.target.value)} />
          <Input label="Safety Rating" value={form.safetyRating} onChange={e => set('safetyRating', e.target.value)} />
          <Select label="Rating" options={[1,2,3,4,5].map(n => ({ value: n, label: `${n}/5` }))} value={form.rating} onChange={e => set('rating', e.target.value)} placeholder="Rate" />
          <Input label="Preferred Lanes" value={form.preferredLanes} onChange={e => set('preferredLanes', e.target.value)} placeholder="e.g. BC-AB, ON-QC" style={{ gridColumn: 'span 3' }} />
        </FormGrid>
      </FormSection>

      <FormSection title="Do Not Use">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
            <input type="checkbox" checked={form.dnu || false} onChange={e => set('dnu', e.target.checked)} /> Mark as DNU
          </label>
        </div>
        {form.dnu && <Input label="DNU Reason" value={form.dnuReason} onChange={e => set('dnuReason', e.target.value)} placeholder="Why is this carrier DNU?" />}
      </FormSection>

      <FormSection title="Notes">
        <textarea className="form-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
      </FormSection>
    </Modal>
  );
}
