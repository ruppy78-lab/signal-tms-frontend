import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children, variant = 'primary', size = 'md', loading, disabled, icon: Icon, ...props
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'xs' ? 'btn-xs' : '';
  return (
    <button
      className={`btn btn-${variant} ${sizeClass}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={13} className="spin" /> : Icon && <Icon size={13} />}
      {children}
    </button>
  );
}
