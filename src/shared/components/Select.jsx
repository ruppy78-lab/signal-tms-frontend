import React from 'react';

export default function Select({ label, options = [], error, placeholder, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <select className={`form-input ${error ? 'input-error' : ''}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
      {error && <span style={{ color: 'var(--danger)', fontSize: 10 }}>{error}</span>}
    </div>
  );
}
