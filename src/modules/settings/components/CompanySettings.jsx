import React, { useState, useEffect } from 'react';
import { Button, Spinner } from '../../../shared/components';
import { FormGrid, FormSection } from '../../../shared/components/Form';
import { Save } from 'lucide-react';
import api from '../../../shared/services/api';
import toast from 'react-hot-toast';

const TIMEZONES = ['America/Vancouver', 'America/Edmonton', 'America/Toronto', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC'];
const CURRENCIES = ['CAD', 'USD'];
const PAYMENT_TERMS_OPTS = [15, 30, 45, 60];

const defaults = {
  companyName: '', address: '', city: '', state: '', zip: '', phone: '', email: '', website: '', taxNumber: '',
  loadPrefix: 'LD', tripPrefix: 'TR', invoicePrefix: 'INV', settlementPrefix: 'STL',
  nextLoadNumber: 1000, nextTripNumber: 1000, nextInvoiceNumber: 1000, nextSettlementNumber: 1000,
  defaultPaymentTerms: 30, taxRate: 0, currency: 'CAD', timezone: 'America/Vancouver',
};

export default function CompanySettings() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      const d = r.data || r.settings || r;
      const clean = {};
      for (const [k, v] of Object.entries(d)) { if (v !== null && v !== undefined) clean[k] = v; }
      setForm(f => ({ ...f, ...clean }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <h3 className="settings-page-title">Company Settings</h3>
      <p className="settings-page-desc">Company information, numbering, and defaults.</p>

      <FormSection title="Company Information">
        <FormGrid cols={2}>
          <div style={{ gridColumn: '1/-1' }}><label className="form-label">Company Name</label>
            <input className="form-input" value={form.companyName} onChange={e => set('companyName', e.target.value)} /></div>
          <div style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <div><label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
          <div><label className="form-label">State / Province</label>
            <input className="form-input" value={form.state} onChange={e => set('state', e.target.value)} /></div>
          <div><label className="form-label">Zip / Postal</label>
            <input className="form-input" value={form.zip} onChange={e => set('zip', e.target.value)} /></div>
          <div><label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="form-label">Website</label>
            <input className="form-input" value={form.website} onChange={e => set('website', e.target.value)} /></div>
          <div><label className="form-label">Tax Number</label>
            <input className="form-input" value={form.taxNumber} onChange={e => set('taxNumber', e.target.value)} /></div>
        </FormGrid>
      </FormSection>

      <FormSection title="Numbering Prefixes">
        <FormGrid cols={4}>
          <div><label className="form-label">Load Prefix</label>
            <input className="form-input" value={form.loadPrefix} onChange={e => set('loadPrefix', e.target.value)} /></div>
          <div><label className="form-label">Trip Prefix</label>
            <input className="form-input" value={form.tripPrefix} onChange={e => set('tripPrefix', e.target.value)} /></div>
          <div><label className="form-label">Invoice Prefix</label>
            <input className="form-input" value={form.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value)} /></div>
          <div><label className="form-label">Settlement Prefix</label>
            <input className="form-input" value={form.settlementPrefix} onChange={e => set('settlementPrefix', e.target.value)} /></div>
          <div><label className="form-label">Next Load #</label>
            <input className="form-input" type="number" value={form.nextLoadNumber} onChange={e => set('nextLoadNumber', Number(e.target.value))} /></div>
          <div><label className="form-label">Next Trip #</label>
            <input className="form-input" type="number" value={form.nextTripNumber} onChange={e => set('nextTripNumber', Number(e.target.value))} /></div>
          <div><label className="form-label">Next Invoice #</label>
            <input className="form-input" type="number" value={form.nextInvoiceNumber} onChange={e => set('nextInvoiceNumber', Number(e.target.value))} /></div>
          <div><label className="form-label">Next Settlement #</label>
            <input className="form-input" type="number" value={form.nextSettlementNumber} onChange={e => set('nextSettlementNumber', Number(e.target.value))} /></div>
        </FormGrid>
      </FormSection>

      <FormSection title="Defaults">
        <FormGrid cols={4}>
          <div><label className="form-label">Payment Terms</label>
            <select className="form-input" value={form.defaultPaymentTerms} onChange={e => set('defaultPaymentTerms', Number(e.target.value))}>
              {PAYMENT_TERMS_OPTS.map(t => <option key={t} value={t}>Net {t}</option>)}
            </select></div>
          <div><label className="form-label">Tax Rate (%)</label>
            <input className="form-input" type="number" step="0.01" value={form.taxRate} onChange={e => set('taxRate', Number(e.target.value))} /></div>
          <div><label className="form-label">Currency</label>
            <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="form-label">Timezone</label>
            <select className="form-input" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
              {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
        </FormGrid>
      </FormSection>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button icon={Save} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
      </div>
    </div>
  );
}
