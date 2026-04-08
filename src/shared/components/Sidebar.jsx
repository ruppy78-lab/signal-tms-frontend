import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, MessageSquare, Users, Building2,
  MapPin, Globe, UserCircle, CarFront, Receipt, BarChart3, DollarSign,
  FileText, Settings, UserCog, LogOut, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import './Sidebar.css';

const navSections = [
  {
    label: 'Operations',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Package, label: 'Loads', path: '/loads', badgeKey: 'loads' },
      { icon: Truck, label: 'Dispatch', path: '/dispatch', badgeKey: 'dispatch' },
      { icon: MessageSquare, label: 'Quotes', path: '/quotes' },
    ]
  },
  {
    label: 'Customers & Partners',
    items: [
      { icon: Users, label: 'Customers', path: '/customers' },
      { icon: Building2, label: 'Carriers', path: '/carriers' },
      { icon: MapPin, label: 'Locations', path: '/locations' },
      { icon: Globe, label: 'Customer Portal', path: '/portal' },
    ]
  },
  {
    label: 'People & Fleet',
    items: [
      { icon: UserCircle, label: 'Drivers', path: '/drivers' },
      { icon: CarFront, label: 'Fleet', path: '/fleet' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { icon: Receipt, label: 'Invoicing', path: '/invoicing', badgeKey: 'invoicing' },
      { icon: BarChart3, label: 'Accounting', path: '/accounting' },
      { icon: DollarSign, label: 'Settlements', path: '/settlements', badgeKey: 'settlements' },
      { icon: FileText, label: 'Documents', path: '/documents' },
    ]
  },
  {
    label: 'Admin',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: UserCog, label: 'Users', path: '/settings/users' },
      { icon: ShieldCheck, label: 'Customs Brokers', path: '/settings/customs-brokers' },
      { icon: LogOut, label: 'Logout', path: '/logout', isLogout: true },
    ]
  }
];

const badges = { loads: 3, dispatch: 5, invoicing: 2, settlements: 1 };

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">S</div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-title">Signal TMS</span>
            <span className="logo-subtitle">Transportation Management</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label} className="nav-section">
            {!collapsed && <div className="nav-section-label">{section.label}</div>}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/settings' && location.pathname.startsWith(item.path + '/'));
              const badge = item.badgeKey ? badges[item.badgeKey] : null;

              if (item.isLogout) {
                return (
                  <button
                    key={item.path}
                    className="nav-item nav-logout"
                    onClick={handleLogout}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={16} />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.comingSoon ? '#' : item.path}
                  className={`nav-item ${isActive ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
                  onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={16} />
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.comingSoon && <span className="soon-badge">Soon</span>}
                      {badge > 0 && <span className="nav-badge">{badge}</span>}
                    </>
                  )}
                  {collapsed && badge > 0 && <span className="nav-badge-dot" />}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar">{user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0,2) : '?'}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'dispatcher'}</span>
            </div>
          </div>
        )}
        <button className="collapse-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
