import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Navigation, FileText,
  Building2, Truck, UserCheck, DollarSign,
  Wallet, FolderOpen, Settings, LogOut, ClipboardList, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { section: 'Operations' },
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/loads',        label: 'Loads',         icon: Package },
  { to: '/dispatch',     label: 'Dispatch',      icon: Navigation },
  { to: '/quotes',       label: 'Quotes',         icon: ClipboardList },
  { section: 'Customers & Partners' },
  { to: '/customers',    label: 'Customers',     icon: Building2 },
  { to: '/carriers',     label: 'Carriers',      icon: Truck },
  { to: '/locations',    label: 'Locations',     icon: MapPin },
  { section: 'People & Fleet' },
  { to: '/drivers',      label: 'Drivers',       icon: UserCheck },
  { to: '/fleet',        label: 'Fleet',          icon: Truck },
  { section: 'Finance' },
  { to: '/invoicing',    label: 'Invoicing',     icon: DollarSign },
  { to: '/expenses',     label: 'Accounting',    icon: DollarSign },
  { to: '/settlements',  label: 'Settlements',   icon: Wallet },
  { to: '/documents',    label: 'Documents',     icon: FolderOpen },
  { section: 'Admin' },
  { to: '/settings',     label: 'Settings',      icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <h1>Signal TMS</h1>
        <p>Transportation Management</p>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) return <div key={i} className="nav-section">{item.section}</div>;
          return (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <item.icon size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <p>{user?.name}</p>
            <span>{user?.role}</span>
          </div>
        </div>
        <button onClick={logout}
          className="nav-item"
          style={{ marginTop: 8, width: '100%', border: 'none', background: 'none' }}>
          <LogOut size={16} />Logout
        </button>
      </div>
    </aside>
  );
}
