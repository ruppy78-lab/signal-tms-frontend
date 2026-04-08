import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../../shared/utils/formatters';
import customersApi from '../../../customers/services/customersApi';

export default function CreditAlert({ customerId }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!customerId) { setBalance(null); return; }
    customersApi.getBalance(customerId)
      .then(r => setBalance(r.data || r))
      .catch(() => setBalance(null));
  }, [customerId]);

  if (!balance || !balance.credit_limit) return null;

  const pct = balance.credit_used_percent;
  let bg, border, color, text;

  if (pct >= 100) {
    bg = 'var(--danger-bg)'; border = 'var(--danger-border)'; color = 'var(--danger)';
    text = `OVER LIMIT — ${formatCurrency(balance.balance)} / ${formatCurrency(balance.credit_limit)} (${pct}%)`;
  } else if (pct >= 80) {
    bg = 'var(--warning-bg)'; border = 'var(--warning-border)'; color = 'var(--warning)';
    text = `NEAR LIMIT — ${formatCurrency(balance.balance)} / ${formatCurrency(balance.credit_limit)} (${pct}%)`;
  } else if (pct >= 50) {
    bg = 'var(--warning-bg)'; border = 'var(--warning-border)'; color = 'var(--gray-600)';
    text = `${formatCurrency(balance.balance)} / ${formatCurrency(balance.credit_limit)} (${pct}%)`;
  } else {
    bg = 'var(--success-bg)'; border = 'var(--success-border)'; color = 'var(--success)';
    text = `Credit OK — ${formatCurrency(balance.balance)} / ${formatCurrency(balance.credit_limit)}`;
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
      background: bg, border: `1px solid ${border}`,
      fontSize: 'var(--font-size-xs)', color, fontWeight: 600, marginTop: 3,
    }}>{text}</div>
  );
}
