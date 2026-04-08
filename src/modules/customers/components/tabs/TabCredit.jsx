import React, { useState, useEffect } from 'react';
import { Input, Select } from '../../../../shared/components';
import { FormGrid, FormSection } from '../../../../shared/components/Form';
import { PAYMENT_TERMS } from '../../../../shared/utils/constants';
import { formatCurrency } from '../../../../shared/utils/formatters';
import customersApi from '../../services/customersApi';

function CreditBar({ balance }) {
  if (!balance || !balance.credit_limit) return null;
  const pct = Math.min(balance.credit_used_percent, 100);
  let color = '#059669';
  if (pct >= 100) color = '#DC2626';
  else if (pct >= 80) color = '#ea580c';
  else if (pct >= 50) color = '#D97706';

  return (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        Current Credit Usage
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Balance</div>
          <div style={{ fontSize: 16, fontWeight: 800, color }}>{formatCurrency(balance.balance)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Credit Limit</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{formatCurrency(balance.credit_limit)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Used</div>
          <div style={{ fontSize: 16, fontWeight: 800, color }}>{balance.credit_used_percent}%</div>
        </div>
      </div>
      <div style={{ height: 8, background: 'var(--gray-200)', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export default function TabCredit({ form, set, customerId }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (customerId) {
      customersApi.getBalance(customerId)
        .then(r => setBalance(r.data || r))
        .catch(() => {});
    }
  }, [customerId]);

  return (
    <>
      {customerId && <CreditBar balance={balance} />}

      <FormSection title="Payment Terms">
        <FormGrid cols={2}>
          <Select label="Payment Terms" value={form.payment_terms}
            onChange={e => set('payment_terms', parseInt(e.target.value))}
            options={PAYMENT_TERMS} />
          <Select label="Currency" value={form.currency}
            onChange={e => set('currency', e.target.value)}
            options={[{ value: 'CAD', label: 'CAD — Canadian Dollar' }, { value: 'USD', label: 'USD — US Dollar' }]} />
        </FormGrid>
      </FormSection>

      <FormSection title="Credit Limit" style={{ marginTop: 14 }}>
        <FormGrid cols={2}>
          <Input label="Credit Limit ($)" type="number" value={form.credit_limit || ''}
            onChange={e => set('credit_limit', e.target.value)} placeholder="0 = unlimited" />
          <div />
        </FormGrid>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.credit_alert_enabled}
              onChange={e => set('credit_alert_enabled', e.target.checked)} />
            <span style={{ fontWeight: 600 }}>Warn dispatcher when balance reaches threshold</span>
          </label>
        </div>

        {form.credit_alert_enabled && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Alert at</label>
            <input type="range" min={50} max={100} step={5}
              value={form.credit_alert_percent || 80}
              onChange={e => set('credit_alert_percent', parseInt(e.target.value))}
              style={{ flex: 1, maxWidth: 200 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', minWidth: 40 }}>
              {form.credit_alert_percent || 80}%
            </span>
          </div>
        )}
      </FormSection>

      <FormSection title="Tax Information" style={{ marginTop: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', marginBottom: 8 }}>
          <input type="checkbox" checked={form.tax_exempt || false}
            onChange={e => set('tax_exempt', e.target.checked)} />
          <span style={{ fontWeight: 600 }}>Tax Exempt</span>
        </label>
        {!form.tax_exempt && (
          <div style={{ maxWidth: 300 }}>
            <Input label="Tax Number / GST" value={form.tax_number || ''}
              onChange={e => set('tax_number', e.target.value)} />
          </div>
        )}
      </FormSection>

      <PortalAccess customerId={customerId} />
    </>
  );
}

function PortalAccess({ customerId }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    customersApi.getById(customerId).then(r => {
      const c = r.data || r;
      setEmail(c.portal_email || '');
      setEnabled(c.portal_enabled || false);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [customerId]);

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await customersApi.setPortalAccess(customerId, { portal_email: email, portal_password: password || undefined, portal_enabled: enabled });
      setPassword('');
      alert('Portal access updated');
    } catch { alert('Failed to update portal access'); }
    setSaving(false);
  };

  if (!customerId || !loaded) return null;

  return (
    <FormSection title="Customer Portal Access" style={{ marginTop: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <span style={{ fontWeight: 600 }}>Enable Portal Access</span>
        </label>
      </div>
      {enabled && (
        <FormGrid cols={2}>
          <Input label="Portal Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label={password ? 'Set Password' : 'New Password (leave blank to keep)'} type="password"
            value={password} onChange={e => setPassword(e.target.value)} />
        </FormGrid>
      )}
      <div style={{ marginTop: 8 }}>
        <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Portal Access'}
        </button>
      </div>
    </FormSection>
  );
}
