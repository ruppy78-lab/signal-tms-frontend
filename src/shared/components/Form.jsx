import React from 'react';

export default function Form({ children, onSubmit, className = '' }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };
  return <form className={className} onSubmit={handleSubmit}>{children}</form>;
}

export function FormGrid({ children, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
      {children}
    </div>
  );
}

export function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {title && (
        <div className="section-header">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
