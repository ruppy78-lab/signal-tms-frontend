import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          fontSize: 12,
          fontFamily: 'var(--font-family)',
          borderRadius: 6,
          padding: '8px 14px',
        },
        success: { style: { background: 'var(--success-bg)', color: '#065F46', border: '1px solid var(--success-border)' } },
        error: { style: { background: 'var(--danger-bg)', color: '#991B1B', border: '1px solid var(--danger-border)' } },
      }}
    />
  );
}
