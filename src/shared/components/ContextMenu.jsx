import React, { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, items = [], onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = () => onClose?.();
    // Delay listener registration so the opening event doesn't immediately close the menu
    const timer = setTimeout(() => {
      document.addEventListener('click', handler);
      document.addEventListener('contextmenu', handler);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  if (!x && !y) return null;

  return (
    <div ref={ref} className="context-menu" style={{ position: 'fixed', left: x, top: y, zIndex: 2000 }}>
      {items.map((item, i) => item.divider ? (
        <div key={i} className="context-divider" />
      ) : (
        <button key={i} className={`context-item ${item.danger ? 'danger' : ''}`} onClick={() => { item.onClick?.(); onClose?.(); }} disabled={item.disabled}>
          {item.icon && <item.icon size={13} />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
