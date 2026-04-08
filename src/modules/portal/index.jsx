import React, { useState, useEffect } from 'react';
import { Package, Receipt, FileText, Calculator, ClipboardList, LogOut } from 'lucide-react';
import api from '../../shared/services/api';
import PortalLogin from './components/PortalLogin';
import FreightCalculator from './components/FreightCalculator';
import PortalMyQuotes from './components/PortalMyQuotes';
import PortalShipments from './components/PortalShipments';
import PortalInvoices from './components/PortalInvoices';
import PortalDocuments from './components/PortalDocuments';

const TABS = [
  { key: 'quote', label: 'Quote', icon: Calculator },
  { key: 'myquotes', label: 'My Quotes', icon: ClipboardList },
  { key: 'shipments', label: 'My Shipments', icon: Package },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'documents', label: 'Documents', icon: FileText },
];

export default function PortalModule() {
  const [token, setToken] = useState(localStorage.getItem('portal_token'));
  const [customer, setCustomer] = useState(null);
  const [tab, setTab] = useState('shipments');

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCustomer({ id: payload.customerId, email: payload.email });
    }
  }, [token]);

  const handleLogin = (data) => {
    localStorage.setItem('portal_token', data.token);
    setToken(data.token);
    setCustomer(data.customer);
  };

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    setToken(null);
    setCustomer(null);
  };

  if (!token) return <PortalLogin onLogin={handleLogin} />;

  // Use portal token for API calls
  const portalApi = {
    get: (url, opts) => api.get(url, { ...opts, headers: { Authorization: `Bearer ${token}` } }),
    post: (url, data, opts) => api.post(url, data, { ...opts, headers: { Authorization: `Bearer ${token}` } }),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#1C2B3A', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Signal Transportation</span>
          <span style={{ color: '#94A3B8', fontSize: 12 }}>Customer Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#94A3B8', fontSize: 12 }}>{customer?.company_name || customer?.email}</span>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: '1px solid #475569', borderRadius: 4, padding: '4px 10px',
            color: '#94A3B8', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-family)' }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', display: 'flex', gap: 0 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px',
              border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-family)', fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#4D82B8' : '#6B7280',
              borderBottom: tab === t.key ? '2px solid #4D82B8' : '2px solid transparent',
            }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        {tab === 'quote' && <FreightCalculator portalApi={portalApi} />}
        {tab === 'myquotes' && <PortalMyQuotes portalApi={portalApi} />}
        {tab === 'shipments' && <PortalShipments portalApi={portalApi} />}
        {tab === 'invoices' && <PortalInvoices portalApi={portalApi} />}
        {tab === 'documents' && <PortalDocuments portalApi={portalApi} />}
      </div>
    </div>
  );
}
