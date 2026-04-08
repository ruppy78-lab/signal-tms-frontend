import React, { useState, useEffect } from 'react';
import {
  Bell, Search, BarChart3, MessageSquare, Activity, Settings,
  X, Check, Send
} from 'lucide-react';
import './RightPanel.css';

const panelConfig = [
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'search', icon: Search, label: 'Quick Search' },
  { id: 'stats', icon: BarChart3, label: 'Live Stats' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
  { id: 'activity', icon: Activity, label: 'Activity Feed' },
  { id: 'quick-settings', icon: Settings, label: 'Quick Settings' },
];

const mockNotifications = [
  { id: 1, title: 'New load LD-1015 assigned', time: '2 min ago', read: false, type: 'load' },
  { id: 2, title: 'Trip TRIP-1009 completed', time: '15 min ago', read: false, type: 'trip' },
  { id: 3, title: 'Invoice INV-1003 overdue', time: '1 hr ago', read: true, type: 'invoice' },
  { id: 4, title: 'Carrier Reddaway accepted tender', time: '2 hr ago', read: true, type: 'carrier' },
  { id: 5, title: 'Driver Gurpreet dispatched', time: '3 hr ago', read: true, type: 'driver' },
];

const mockActivity = [
  { id: 1, text: 'Trip TRIP-1009 completed — Gurpreet', time: '15 min ago' },
  { id: 2, text: 'Invoice INV-1001 created — $1,575', time: '1 hr ago' },
  { id: 3, text: 'Load LD-1010 delivered — Signal TMS', time: '2 hr ago' },
  { id: 4, text: 'Carrier Reddaway accepted tender', time: '3 hr ago' },
  { id: 5, text: 'Load LD-1012 created — ABC Corp', time: '4 hr ago' },
  { id: 6, text: 'Driver Mike checked in at pickup', time: '5 hr ago' },
];

const mockMessages = [
  { id: 1, from: 'Mike D.', role: 'Dispatcher', text: 'LD-1015 needs a carrier ASAP', time: '5 min ago', unread: true },
  { id: 2, from: 'Sarah K.', role: 'Accounting', text: 'Invoice INV-1003 payment received', time: '30 min ago', unread: true },
  { id: 3, from: 'Gurpreet S.', role: 'Driver', text: 'At pickup, waiting for dock', time: '1 hr ago', unread: false },
  { id: 4, from: 'Admin', role: 'System', text: 'Backup completed successfully', time: '3 hr ago', unread: false },
];

function NotificationsPanel({ onClose }) {
  const [items, setItems] = useState(mockNotifications);
  const markRead = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const unread = items.filter(n => !n.read).length;

  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Notifications {unread > 0 && <span className="panel-count">{unread}</span>}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="panel-action" onClick={clearAll} title="Mark all read"><Check size={14} /></button>
          <button className="panel-action" onClick={onClose}><X size={14} /></button>
        </div>
      </div>
      <div className="panel-list">
        {items.map(n => (
          <div key={n.id} className={`notif-item ${n.read ? 'read' : ''}`} onClick={() => markRead(n.id)}>
            <div className="notif-dot">{!n.read && <span />}</div>
            <div className="notif-body">
              <div className="notif-title">{n.title}</div>
              <div className="notif-time">{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPanel({ onClose }) {
  const [query, setQuery] = useState('');
  const allResults = {
    loads: [
      { id: 'LD-1010', desc: 'Signal TMS', status: 'Available' },
      { id: 'LD-1011', desc: 'ABC Corp', status: 'Dispatched' },
      { id: 'LD-1015', desc: 'Fast Ship Inc', status: 'Available' },
    ],
    trips: [
      { id: 'TRIP-1009', desc: 'Gurpreet — Calgary', status: 'Active' },
      { id: 'TRIP-1008', desc: 'Mike — Edmonton', status: 'Completed' },
    ],
    customers: [
      { id: 'C-001', desc: 'Signal TMS — Surrey BC', status: '' },
      { id: 'C-002', desc: 'ABC Corp — Toronto ON', status: '' },
    ],
    carriers: [
      { id: 'CR-001', desc: 'Reddaway — MC# 123456', status: '' },
      { id: 'CR-002', desc: 'Day & Ross — MC# 654321', status: '' },
    ],
  };

  const q = query.toLowerCase();
  const filtered = query.length > 0;
  const results = filtered ? Object.fromEntries(
    Object.entries(allResults).map(([group, items]) => [
      group,
      items.filter(i => i.id.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    ]).filter(([, items]) => items.length > 0)
  ) : {};

  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Quick Search</span>
        <button className="panel-action" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="search-input-wrap">
        <Search size={14} />
        <input
          className="search-panel-input"
          placeholder="Search load#, trip#, customer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {filtered && Object.entries(results).map(([group, items]) => (
        <div key={group} className="search-group">
          <div className="search-group-label">{group}</div>
          {items.map(item => (
            <div key={item.id} className="search-result">
              <span className="search-id">{item.id}</span>
              <span className="search-desc">{item.desc}</span>
              {item.status && <span className="search-status">{item.status}</span>}
            </div>
          ))}
        </div>
      ))}
      {filtered && Object.keys(results).length === 0 && (
        <div className="panel-empty">No results for "{query}"</div>
      )}
      {!filtered && <div className="panel-empty">Type to search across all modules</div>}
    </div>
  );
}

function StatsPanel({ onClose }) {
  const [stats, setStats] = useState({
    activeTrips: 8, availableLoads: 12, onDock: 3, freeDrivers: 5,
    revenueToday: 4250, revenueWeek: 28750, outstandingInvoices: 15200,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(s => ({ ...s, revenueToday: s.revenueToday + Math.floor(Math.random() * 50) }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (n) => '$' + n.toLocaleString();

  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Live Stats</span>
        <button className="panel-action" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="stats-list">
        <div className="stat-row"><span>Active Trips</span><strong>{stats.activeTrips}</strong></div>
        <div className="stat-row"><span>Available Loads</span><strong>{stats.availableLoads}</strong></div>
        <div className="stat-row"><span>On Dock</span><strong>{stats.onDock}</strong></div>
        <div className="stat-row"><span>Free Drivers</span><strong>{stats.freeDrivers}</strong></div>
        <div className="stat-row divider"><span>Revenue Today</span><strong className="money">{fmt(stats.revenueToday)}</strong></div>
        <div className="stat-row"><span>Revenue This Week</span><strong className="money">{fmt(stats.revenueWeek)}</strong></div>
        <div className="stat-row"><span>Outstanding Invoices</span><strong className="danger">{fmt(stats.outstandingInvoices)}</strong></div>
      </div>
      <div className="panel-footer-note">Refreshes every 30 seconds</div>
    </div>
  );
}

function MessagesPanel({ onClose }) {
  const [items, setItems] = useState(mockMessages);
  const [newMsg, setNewMsg] = useState('');
  const unread = items.filter(m => m.unread).length;

  const markRead = (id) => setItems(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setItems(prev => [{
      id: Date.now(), from: 'You', role: 'Admin', text: newMsg, time: 'Just now', unread: false
    }, ...prev]);
    setNewMsg('');
  };

  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Messages {unread > 0 && <span className="panel-count">{unread}</span>}</span>
        <button className="panel-action" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="panel-list">
        {items.map(m => (
          <div key={m.id} className={`msg-item ${m.unread ? 'unread' : ''}`} onClick={() => markRead(m.id)}>
            <div className="msg-avatar">{m.from.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
            <div className="msg-body">
              <div className="msg-top">
                <span className="msg-from">{m.from}</span>
                <span className="msg-role">{m.role}</span>
                <span className="msg-time">{m.time}</span>
              </div>
              <div className="msg-text">{m.text}</div>
            </div>
            {m.unread && <div className="msg-unread-dot" />}
          </div>
        ))}
      </div>
      <div className="msg-compose">
        <input
          className="msg-input"
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className="msg-send" onClick={sendMessage} disabled={!newMsg.trim()}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

function ActivityPanel({ onClose }) {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Activity Feed</span>
        <button className="panel-action" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="panel-list">
        {mockActivity.map(a => (
          <div key={a.id} className="activity-item">
            <div className="activity-dot" />
            <div className="activity-body">
              <div className="activity-text">{a.text}</div>
              <div className="activity-time">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickSettingsPanel({ onClose }) {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('default');
  const [density, setDensity] = useState('compact');

  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Quick Settings</span>
        <button className="panel-action" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="qs-body">
        <div className="qs-group">
          <div className="qs-label">Theme</div>
          <div className="qs-options">
            {['light', 'dark', 'auto'].map(t => (
              <button key={t} className={`qs-opt ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="qs-group">
          <div className="qs-label">Font Size</div>
          <div className="qs-options">
            {['small', 'default', 'large'].map(s => (
              <button key={s} className={`qs-opt ${fontSize === s ? 'active' : ''}`} onClick={() => setFontSize(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="qs-group">
          <div className="qs-label">Table Density</div>
          <div className="qs-options">
            {['compact', 'comfortable', 'spacious'].map(d => (
              <button key={d} className={`qs-opt ${density === d ? 'active' : ''}`} onClick={() => setDensity(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="qs-divider" />
        <div className="qs-info">
          <div className="qs-label">Keyboard Shortcuts</div>
          <div className="qs-shortcut"><kbd>Ctrl+K</kbd> Quick Search</div>
          <div className="qs-shortcut"><kbd>Ctrl+N</kbd> New Load</div>
          <div className="qs-shortcut"><kbd>Ctrl+D</kbd> Go to Dispatch</div>
          <div className="qs-shortcut"><kbd>Ctrl+I</kbd> New Invoice</div>
          <div className="qs-shortcut"><kbd>Esc</kbd> Close Panel</div>
        </div>
      </div>
    </div>
  );
}

const panelComponents = {
  notifications: NotificationsPanel,
  search: SearchPanel,
  stats: StatsPanel,
  messages: MessagesPanel,
  activity: ActivityPanel,
  'quick-settings': QuickSettingsPanel,
};

export default function RightPanel() {
  const [activePanel, setActivePanel] = useState(null);
  const unreadNotifs = mockNotifications.filter(n => !n.read).length;
  const unreadMsgs = mockMessages.filter(m => m.unread).length;

  const toggle = (id) => setActivePanel(activePanel === id ? null : id);
  const PanelComponent = activePanel ? panelComponents[activePanel] : null;

  return (
    <div className="right-panel-container">
      {activePanel && PanelComponent && (
        <div className="right-panel-drawer">
          <PanelComponent onClose={() => setActivePanel(null)} />
        </div>
      )}
      <div className="right-panel-strip">
        {panelConfig.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`strip-btn ${activePanel === id ? 'active' : ''}`}
            onClick={() => toggle(id)}
            title={label}
          >
            <Icon size={16} />
            {id === 'notifications' && unreadNotifs > 0 && (
              <span className="strip-badge">{unreadNotifs}</span>
            )}
            {id === 'messages' && unreadMsgs > 0 && (
              <span className="strip-badge">{unreadMsgs}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
