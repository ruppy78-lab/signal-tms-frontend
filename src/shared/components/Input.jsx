import React from 'react';

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${error ? 'input-error' : ''}`} {...props} />
      {error && <span style={{ color: 'var(--danger)', fontSize: 10 }}>{error}</span>}
    </div>
  );
}
