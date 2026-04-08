// Shim — re-exports from shared/components for legacy Loads.jsx imports
import React, { useState, useCallback } from 'react';
export { default as Confirm } from '../../shared/components/Confirm';
export { default as ContextMenu } from '../../shared/components/ContextMenu';
export { default as Pagination } from '../../shared/components/Pagination';
export { default as Spinner } from '../../shared/components/Spinner';
export { default as EmptyState } from '../../shared/components/EmptyState';
export { default as DocList } from '../../shared/components/DocList';
export { default as StatusBadge } from '../../shared/components/Badge';
export { default as Modal } from '../../shared/components/Modal';
export { default as Button } from '../../shared/components/Button';
export { default as Input } from '../../shared/components/Input';
export { default as Select } from '../../shared/components/Select';

export function Field({ label, required, children, className, style }) {
  return React.createElement('div', { className, style },
    React.createElement('label', { className: 'form-label' }, label, required && ' *'),
    children
  );
}

// Stubs for components not in shared
export function useContextMenu() {
  const [menu, setMenu] = useState({ x: 0, y: 0, items: [] });
  const openMenu = useCallback((e, items) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, items }); }, []);
  const closeMenu = useCallback(() => setMenu({ x: 0, y: 0, items: [] }), []);
  return { menu, openMenu, closeMenu };
}

export function Currency({ value }) {
  const n = parseFloat(value) || 0;
  return React.createElement('span', null, '$' + n.toFixed(2));
}

export { default as DocUploadModal } from '../../shared/components/DocUploadModal';
export { LOAD_DOC_TYPES } from '../../shared/components/DocUploadModal';
