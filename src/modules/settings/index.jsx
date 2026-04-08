import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2, Hash, CreditCard, Mail, Palette, Users, Shield, Activity as ActivityIcon,
  Upload, Download, FileArchive, Database, RotateCcw, Heart, Wifi, HardDrive,
  AlertTriangle, Gauge, BookOpen, Map, Smartphone, DollarSign, Fuel,
  ListPlus, FileText, FolderOpen, Globe
} from 'lucide-react';
import './settings.css';
import ImportExportPage from './ImportExport';
import CompanySettings from './components/CompanySettings';
import BrokerList from '../customs/BrokerList';
import UserSettings from './components/UserSettings';
import { ModuleStatusPage, ApiHealthPage, DbStatusPage, ErrorLogsPage } from './components/SystemSettings';

const settingsSections = [
  {
    label: 'Company',
    items: [
      { id: 'company-info', icon: Building2, label: 'Company Info' },
      { id: 'numbering', icon: Hash, label: 'Numbering' },
      { id: 'payment-terms', icon: CreditCard, label: 'Payment Terms' },
      { id: 'email-settings', icon: Mail, label: 'Email Settings' },
      { id: 'branding', icon: Palette, label: 'Branding' },
    ]
  },
  {
    label: 'Users',
    items: [
      { id: 'user-mgmt', icon: Users, label: 'User Management' },
      { id: 'roles', icon: Shield, label: 'Roles & Permissions' },
      { id: 'user-activity', icon: ActivityIcon, label: 'Activity Log' },
    ]
  },
  {
    label: 'Data',
    items: [
      { id: 'import', icon: Upload, label: 'Import Data' },
      { id: 'export', icon: Download, label: 'Export Data' },
      { id: 'tms-export', icon: FileArchive, label: 'TMS Format Export' },
      { id: 'backup', icon: Database, label: 'Backup Data' },
      { id: 'restore', icon: RotateCcw, label: 'Restore Data' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'module-status', icon: Heart, label: 'Module Status' },
      { id: 'api-health', icon: Wifi, label: 'API Health' },
      { id: 'db-status', icon: HardDrive, label: 'Database Status' },
      { id: 'error-logs', icon: AlertTriangle, label: 'Error Logs' },
      { id: 'performance', icon: Gauge, label: 'Performance' },
    ]
  },
  {
    label: 'Integrations',
    items: [
      { id: 'customs-brokers', icon: Globe, label: 'Customs Brokers' },
      { id: 'quickbooks', icon: BookOpen, label: 'QuickBooks' },
      { id: 'google-maps', icon: Map, label: 'Google Maps' },
      { id: 'email-provider', icon: Mail, label: 'Email Provider' },
      { id: 'sms', icon: Smartphone, label: 'SMS' },
    ]
  },
  {
    label: 'Rates',
    items: [
      { id: 'rate-tables', icon: DollarSign, label: 'Rate Tables' },
      { id: 'fsc', icon: Fuel, label: 'Fuel Surcharge' },
      { id: 'accessorials', icon: ListPlus, label: 'Accessorials' },
    ]
  },
  {
    label: 'Documents',
    items: [
      { id: 'doc-templates', icon: FileText, label: 'Document Templates' },
      { id: 'doc-storage', icon: FolderOpen, label: 'Storage' },
    ]
  },
];

function PlaceholderPage({ title, description }) {
  return (
    <div>
      <h3 className="settings-page-title">{title}</h3>
      {description && <p className="settings-page-desc">{description}</p>}
      <div className="settings-placeholder">This section is under development.</div>
    </div>
  );
}

const descriptions = {
  'company-info': 'Company name, address, logo, and contact details.',
  'numbering': 'Configure load prefix, trip prefix, and invoice prefix sequences.',
  'payment-terms': 'Default payment terms, tax rates, and currency settings.',
  'email-settings': 'SMTP configuration and email notification templates.',
  'branding': 'Logo, colors, and document header customization.',
  'user-mgmt': 'Add, edit, and deactivate user accounts.',
  'roles': 'Configure Admin, Dispatcher, Accounting, and ReadOnly roles.',
  'user-activity': 'Audit log — who did what and when.',
  'tms-export': 'Export data in standard TMS/EDI interchange formats.',
  'backup': 'Create a manual database backup.',
  'restore': 'Restore system from a previous backup.',
  'performance': 'Response times, slow queries, and system performance metrics.',
  'quickbooks': 'Connect and sync with QuickBooks.',
  'google-maps': 'Google Maps API key and map settings.',
  'email-provider': 'Gmail / SMTP email provider configuration.',
  'sms': 'SMS text message alert configuration.',
  'rate-tables': 'Customer and carrier rate table management.',
  'fsc': 'Fuel surcharge tables by week.',
  'accessorials': 'Liftgate, residential, and other accessorial charges.',
  'doc-templates': 'Customize BOL, rate confirmation, and invoice templates.',
  'doc-storage': 'Document storage location and file management.',
};

const pageComponents = {
  'company-info': CompanySettings,
  'numbering': CompanySettings,
  'payment-terms': CompanySettings,
  'user-mgmt': UserSettings,
  'module-status': ModuleStatusPage,
  'api-health': ApiHealthPage,
  'db-status': DbStatusPage,
  'error-logs': ErrorLogsPage,
  'customs-brokers': BrokerList,
  'import': ImportExportPage,
  'export': ImportExportPage,
};

export default function SettingsModule() {
  const location = useLocation();
  const pathSlug = location.pathname.replace('/settings/', '').replace('/settings', '');
  const [active, setActive] = useState(pathSlug || 'company-info');

  useEffect(() => {
    if (pathSlug && settingsSections.flatMap(s => s.items).some(i => i.id === pathSlug)) {
      setActive(pathSlug);
    }
  }, [pathSlug]);
  const PageComp = pageComponents[active];

  const activeItem = settingsSections.flatMap(s => s.items).find(i => i.id === active);
  const title = activeItem?.label || 'Settings';
  const desc = descriptions[active] || '';

  return (
    <div className="settings-layout">
      <div className="settings-nav">
        {settingsSections.map(section => (
          <div key={section.label} className="settings-nav-section">
            <div className="settings-nav-label">{section.label}</div>
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`settings-nav-item ${active === item.id ? 'active' : ''}`}
                  onClick={() => setActive(item.id)}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="settings-content">
        {PageComp ? <PageComp /> : <PlaceholderPage title={title} description={desc} />}
      </div>
    </div>
  );
}
