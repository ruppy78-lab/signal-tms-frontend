import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, Inbox, Upload, FileText, Trash2, Download } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const Modal = ({ open, onClose, title, children, footer, size = '' }) => {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ? `modal-${size}` : ''}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const Confirm = ({ open, onClose, onConfirm, title = 'Confirm', message, danger = false }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm"
    footer={<>
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
        onClick={() => { onConfirm(); onClose(); }}>Confirm</button>
    </>}>
    <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 }}>{message}</p>
  </Modal>
);

export const ContextMenu = ({ x, y, items, onClose }) => {
  const ref = useRef();
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('contextmenu', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [onClose]);
  if (!x && !y) return null;
  const left = Math.min(x, window.innerWidth  - 230);
  const top  = Math.min(y, window.innerHeight - (items?.length || 1) * 36 - 16);
  return (
    <div ref={ref} className="ctx-menu" style={{ left, top }} onClick={(e) => e.stopPropagation()}>
      {items.map((item, i) => {
        if (item.divider) return <div key={i} className="ctx-divider" />;
        if (item.label && !item.action) return <div key={i} className="ctx-label">{item.label}</div>;
        return (
          <div key={i} className={`ctx-item ${item.danger ? 'danger' : ''}`}
            onClick={() => { item.action(); onClose(); }}>
            {item.icon && <item.icon size={14} />}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.shortcut && <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace' }}>{item.shortcut}</span>}
          </div>
        );
      })}
    </div>
  );
};

export const useContextMenu = () => {
  const [menu, setMenu] = React.useState({ x: null, y: null, items: [] });
  const openMenu = useCallback((e, items) => {
    e.preventDefault(); e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);
  const closeMenu = useCallback(() => setMenu({ x: null, y: null, items: [] }), []);
  return { menu, openMenu, closeMenu };
};

export const Pagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);
  return (
    <div className="pagination">
      <span className="pagination-info">Showing {start}–{end} of {total}</span>
      <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1}>← Prev</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = pages <= 7 ? i + 1 : (page <= 4 ? i + 1 : (page >= pages - 3 ? pages - 6 + i : page - 3 + i));
        return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>;
      })}
      <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page >= pages}>Next →</button>
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  if (!status) return null;
  return <span className={`badge badge-${status.replace(/\s/g,'_')}`}>{status.replace(/_/g,' ')}</span>;
};

export const Spinner = () => <div className="loading-row"><div className="spinner" /></div>;

export const EmptyState = ({ title, message, action }) => (
  <div className="empty-state">
    <Inbox />
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

export const Field = ({ label, children, required, className = '' }) => (
  <div className={`form-group ${className}`}>
    <label className={`form-label ${required ? 'required' : ''}`}>{label}</label>
    {children}
  </div>
);

export const Currency = ({ value }) => {
  const n = parseFloat(value);
  if (isNaN(n)) return <span>—</span>;
  return <span>${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
};

// ── DocUploadModal ─────────────────────────────────────────────────────────
const DOC_TYPES = [
  { value: 'bol',               label: 'Bill of Lading (BOL)' },
  { value: 'pod',               label: 'Proof of Delivery (POD)' },
  { value: 'rate_confirmation', label: 'Rate Confirmation' },
  { value: 'invoice',           label: 'Invoice' },
  { value: 'insurance',         label: 'Insurance Certificate' },
  { value: 'license',           label: 'License / Permit' },
  { value: 'other',             label: 'Other' },
];

export const DocUploadModal = ({ open, onClose, entityType, entityId, entityLabel = '', defaultDocType = 'other' }) => {
  const [file, setFile]     = useState(null);
  const [docType, setDocType] = useState(defaultDocType);
  const [notes, setNotes]   = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  useEffect(() => { if (!open) { setFile(null); setNotes(''); setDocType(defaultDocType); } }, [open, defaultDocType]);

  const uploadMut = useMutation({
    mutationFn: (fd) => api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      toast.success('Document uploaded');
      qc.invalidateQueries(['docs', entityType, entityId]);
      qc.invalidateQueries(['documents']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  const submit = () => {
    if (!file)     { toast.error('Select a file first'); return; }
    if (!entityId) { toast.error('No entity selected');  return; }
    const fd = new FormData();
    fd.append('file',        file);
    fd.append('entity_type', entityType);
    fd.append('entity_id',   entityId);
    fd.append('doc_type',    docType);
    fd.append('notes',       notes);
    uploadMut.mutate(fd);
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); };
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Upload Document${entityLabel ? ` — ${entityLabel}` : ''}`} size="sm"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={uploadMut.isPending || !file}>
          {uploadMut.isPending ? 'Uploading…' : 'Upload'}
        </button>
      </>}>
      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? 'var(--primary-light)' : 'var(--gray-300)'}`, borderRadius: 8,
          padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'var(--info-bg)' : 'var(--gray-50)', marginBottom: 16, transition: '0.15s' }}>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
        {file ? (
          <div>
            <FileText size={24} style={{ color: 'var(--primary)', marginBottom: 6 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{file.name}</p>
            <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>{(file.size / 1024).toFixed(1)} KB</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
              onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</button>
          </div>
        ) : (
          <div>
            <Upload size={24} style={{ color: 'var(--gray-400)', marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>Drag & drop or <strong>click to browse</strong></p>
            <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>PDF, JPG, PNG, DOCX up to 25MB</p>
          </div>
        )}
      </div>
      <div className="form-grid">
        <div className="form-group full">
          <label className="form-label required">Document Type</label>
          <select className="form-input" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-group full">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Signed POD from ABC Receiving" />
        </div>
      </div>
    </Modal>
  );
};

// ── DocList ──────────────────────────────────────────────────────────────────
// Inline document list panel for use inside modals / detail tabs
export const DocList = ({ entityType, entityId, entityLabel = '' }) => {
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['docs', entityType, entityId],
    queryFn: () => api.get(`/documents/${entityType}/${entityId}`).then(r => r.data.data),
    enabled: !!entityId,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['docs', entityType, entityId]); },
    onError: () => toast.error('Delete failed'),
  });

  const docs = data || [];
  const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace('/api', '');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => setUploadOpen(true)}>
          <Upload size={13} /> Upload
        </button>
      </div>
      {isLoading ? <Spinner /> : !docs.length ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
          <FileText size={28} style={{ marginBottom: 8, opacity: 0.4 }} /><p>No documents yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)', borderRadius: 6 }}>
              <FileText size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.file_name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                  <StatusBadge status={doc.doc_type} />
                  {' · '}{new Date(doc.created_at).toLocaleDateString()}
                  {doc.uploaded_by_name && ` · ${doc.uploaded_by_name}`}
                </p>
              </div>
              <a href={`${API_BASE}/${doc.file_path}`} target="_blank" rel="noreferrer"
                className="btn-icon" title="Download / View"><Download size={14} /></a>
              <button className="btn-icon" title="Delete" style={{ color: 'var(--danger)' }}
                onClick={() => { if (window.confirm('Delete this document?')) deleteMut.mutate(doc.id); }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <DocUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)}
        entityType={entityType} entityId={entityId} entityLabel={entityLabel} />
    </div>
  );
};
