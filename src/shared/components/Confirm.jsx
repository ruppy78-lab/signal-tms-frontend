import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function Confirm({ open, onClose, onConfirm, title = 'Confirm', message, confirmText = 'Confirm', variant = 'danger', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </>
    }>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
}
