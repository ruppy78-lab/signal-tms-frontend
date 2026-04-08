import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  const modalRef = useRef(null);
  const mouseDownTarget = useRef(null);

  useEffect(() => {
    if (open) {
      const handler = (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose?.();
        }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        // Record whether mouseDown started on the overlay itself
        mouseDownTarget.current = e.target;
      }}
      onClick={(e) => {
        // Only close if BOTH mouseDown and click landed on the overlay
        // Prevents accidental close when clicking inside modal content
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
          onClose?.();
        }
        mouseDownTarget.current = null;
      }}
    >
      <div
        className={`modal modal-${size}`}
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button
            className="modal-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="modal-body"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
        {footer && (
          <div
            className="modal-footer"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
