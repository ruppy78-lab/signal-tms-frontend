import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../shared/components';
import DocsPopup, { CUSTOMER_DOC_TYPES } from '../../../shared/components/DocsPopup';
import toast from 'react-hot-toast';
import TabCompanyInfo from './tabs/TabCompanyInfo';
import TabContacts from './tabs/TabContacts';
import TabDispatch from './tabs/TabDispatch';
import TabCredit from './tabs/TabCredit';
import TabNotes from './tabs/TabNotes';

const TABS = ['Company Info', 'Contacts', 'Dispatch Settings', 'Credit & Billing', 'Documents', 'Notes'];

const empty = {
  code: '', company_name: '', address: '', city: '', state: '', zip: '', country: 'Canada',
  main_phone: '', main_email: '', billing_email: '', website: '', contact_name: '',
  payment_terms: 30, credit_limit: '', credit_alert_percent: 80, credit_alert_enabled: true,
  currency: 'CAD', tax_exempt: false, tax_number: '',
  alert_on_dispatch: false, alert_on_pickup: false, alert_on_delivery: false,
  default_equipment: '', requires_liftgate: false, residential_default: false,
  special_instructions: '', internal_notes: '', notes: '', status: 'active',
};

export default function CustomerForm({ open, onClose, customer, onSave }) {
  const isEdit = !!customer?.id;
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    if (open) {
      if (customer?.id) {
        // Coalesce null/undefined DB values to empty defaults so inputs stay controlled
        const safe = { ...empty };
        for (const [k, v] of Object.entries(customer)) {
          safe[k] = v ?? empty[k] ?? '';
        }
        setForm(safe);
      } else {
        setForm({ ...empty });
      }
      setTab(0);
    }
  }, [open, customer]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.company_name) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? `Edit — ${customer.company_name}` : 'New Customer'} size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Customer' : 'Create Customer'}
          </Button>
        </>
      }>

      <div className="tabs" style={{ marginBottom: 14 }}>
        {TABS.map((t, i) => (
          <button key={t} className={`tab ${tab === i && i !== 4 ? 'active' : ''}`}
            onClick={() => i === 4 ? setShowDocs(true) : setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && <TabCompanyInfo form={form} set={set} />}
      {tab === 1 && <TabContacts customerId={customer?.id} />}
      {tab === 2 && <TabDispatch form={form} set={set} />}
      {tab === 3 && <TabCredit form={form} set={set} customerId={customer?.id} />}
      {tab === 5 && <TabNotes customerId={customer?.id} />}
      {showDocs && (
        <DocsPopup entityType="customer" entityId={customer?.id}
          title={`Documents — ${customer?.company_name || 'Customer'}`} docTypes={CUSTOMER_DOC_TYPES}
          onClose={() => setShowDocs(false)} />
      )}
    </Modal>
  );
}
