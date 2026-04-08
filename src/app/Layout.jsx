import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../shared/components/Sidebar';
import TopBar from '../shared/components/TopBar';
import RightPanel from '../shared/components/RightPanel';
import './Layout.css';

export default function Layout({ children }) {
  const location = useLocation();
  const isDispatch = location.pathname === '/dispatch';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(isDispatch);

  useEffect(() => {
    setSidebarCollapsed(isDispatch);
  }, [isDispatch]);

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="main-area">
        <TopBar />
        <div className="content-area">
          {children}
        </div>
      </div>
      <RightPanel />
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: 13, zIndex: 99999 } }} />
    </div>
  );
}
