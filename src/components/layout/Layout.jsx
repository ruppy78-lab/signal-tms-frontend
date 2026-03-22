import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
