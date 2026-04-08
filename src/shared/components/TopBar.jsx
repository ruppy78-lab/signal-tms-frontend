import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, ChevronRight, RefreshCw, Clock } from 'lucide-react';
import './TopBar.css';

const routeNames = {
  '/dashboard': 'Dashboard',
  '/loads': 'Loads',
  '/dispatch': 'Dispatch',
  '/quotes': 'Quotes',
  '/customers': 'Customers',
  '/carriers': 'Carriers',
  '/locations': 'Locations',
  '/portal': 'Customer Portal',
  '/drivers': 'Drivers',
  '/fleet': 'Fleet',
  '/invoicing': 'Invoicing',
  '/accounting': 'Accounting',
  '/settlements': 'Settlements',
  '/documents': 'Documents',
  '/settings': 'Settings',
};

export default function TopBar({ actions }) {
  const location = useLocation();
  const path = location.pathname;
  const pageName = routeNames[path] || routeNames['/' + path.split('/')[1]] || 'Page';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="breadcrumb">
          <Home size={12} />
          <ChevronRight size={10} className="breadcrumb-sep" />
          <span className="breadcrumb-current">{pageName}</span>
        </div>
      </div>
      <div className="topbar-right">
        {actions}
        <button className="topbar-btn" title="Refresh" onClick={() => window.location.reload()}>
          <RefreshCw size={13} />
        </button>
        <div className="topbar-time">
          <Clock size={11} />
          <span>{dateStr} {timeStr}</span>
        </div>
      </div>
    </div>
  );
}
