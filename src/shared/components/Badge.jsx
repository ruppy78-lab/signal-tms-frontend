import React from 'react';
import { statusColor } from '../utils/helpers';

export default function Badge({ status, label, className = '' }) {
  const text = label || (status || '').replace(/_/g, ' ');
  return <span className={`badge ${statusColor(status)} ${className}`}>{text}</span>;
}
