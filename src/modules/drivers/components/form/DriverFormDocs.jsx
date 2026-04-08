import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, FileText, X, Paperclip } from 'lucide-react';
import { formatDate } from '../../../../shared/utils/formatters';
import api from '../../../../shared/services/api';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  'Driver License', 'Medical Card', 'Abstract/MVR', 'CVOR',
  'Drug Test', 'Criminal Check', 'Contract/Agreement',
  'Direct Deposit Form', 'Photo ID', 'Driver Photo',
  'Operating Authority', 'Liability Insurance', 'Cargo Insurance',
  'W9 / T4A', 'WSBC/WCB Certificate', 'Other',
];

function UploadWindow({ onClose, driverId, onUploaded, onPendingAdd }) {
  const [docType, setDocType] = useState('Driver License');
  const [docName, setDocName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pos, setPos] = useState({
    x: Math.max(0, (window.innerWidth - 450) / 2),
    y: Math.max(0, (window.innerHeight - 380) / 2)
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onHeaderMouseDown = useCallback((e) => {
    if (['INPUT','SELECT','BUTTON','LABEL'].includes(e.target.tagName)) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
    e.stopPropagation();
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (isDragging.current) {
        setPos({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handleUpload = async () => {
    if (!file) { toast.error('Choose a file first'); return; }
    if (!driverId) {
      onPendingAdd?.({
        file, doc_type: docType, doc_name: docName,
        expiry_date: expiryDate, file_name: file.name, id: Date.now()
      });
      toast.success('Document queued — will save with driver');
      onClose();
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);
      fd.append('entity_type', 'driver');
      fd.append('entity_id', driverId);
      if (docName) fd.append('doc_name', docName);
      if (expiryDate) fd.append('expiry_date', expiryDate);
      await api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded');
      onUploaded?.();
      onClose();
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const stop = (e) => { e.stopPropagation(); };

  return (
    // NO BACKDROP AT ALL
    // Just a floating window on top of everything
    // zIndex 99999 puts it above the driver modal
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 450,
        zIndex: 99999,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #ccd6e0',
        boxShadow: '0 8px 40px rgba(0,0,56,0.25)',
        minWidth: 350,
      }}
      onClick={stop}
      onMouseDown={stop}
      onMouseUp={stop}
      onPointerDown={stop}
      onPointerUp={stop}
    >
      {/* Header */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          background: '#003865',
          color: '#fff',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'move',
          userSelect: 'none',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paperclip size={14} /> Upload Document
        </span>
        <button
          onMouseDown={stop}
          onClick={(e) => { stop(e); onClose(); }}
          style={{ background: 'none', border: 'none',
            color: '#fff', cursor: 'pointer', padding: 2 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: 'flex',
        flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            Document Type
          </label>
          <select className="form-input" value={docType}
            onChange={e => setDocType(e.target.value)}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            Document Name (optional)
          </label>
          <input className="form-input" value={docName}
            onChange={e => setDocName(e.target.value)}
            placeholder="e.g. DL_2026" />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            Expiry Date (optional)
          </label>
          <input className="form-input" type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            File
          </label>
          <label className="btn btn-sm btn-secondary"
            style={{ cursor: 'pointer', display: 'inline-flex', gap: 4 }}>
            <Paperclip size={12} />
            {file ? file.name : 'Choose File'}
            <input type="file" hidden
              onChange={e => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </label>
          {!file && (
            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>
              No file chosen
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        background: '#f8fafc',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        borderRadius: '0 0 8px 8px',
      }}>
        <button className="btn btn-sm btn-secondary"
          onMouseDown={stop}
          onClick={(e) => { stop(e); onClose(); }}>
          Cancel
        </button>
        <button className="btn btn-sm btn-primary"
          onMouseDown={stop}
          onClick={(e) => { stop(e); handleUpload(); }}
          disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

function ExpiryBadge({ date }) {
  if (!date) return null;
  const days = Math.floor((new Date(date) - new Date()) / 86400000);
  if (days > 30) return null;
  if (days < 0) return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px',
      borderRadius: 8, background: '#B71C1C',
      color: '#fff', marginLeft: 6 }}>EXPIRED</span>
  );
  if (days < 15) return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px',
      borderRadius: 8, background: '#FEF2F2', color: '#B71C1C',
      border: '1px solid #FECACA', marginLeft: 6 }}>⚠️ {days}d</span>
  );
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px',
      borderRadius: 8, background: '#FFF7ED', color: '#92400E',
      border: '1px solid #FDE68A', marginLeft: 6 }}>⚠️ {days}d</span>
  );
}

export default function DriverFormDocs({
  driverId, pendingDocs = [], setPendingDocs
}) {
  const [docs, setDocs] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [ctx, setCtx] = useState(null);

  const fetchDocs = useCallback(() => {
    if (!driverId) return;
    // Correct: backend uses URL params GET /documents/:entityType/:entityId
    api.get(`/documents/driver/${driverId}`)
     .then(r => setDocs(r.data?.data || r.data || []))
      .catch(() => setDocs([]));
  }, [driverId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  useEffect(() => {
    const close = () => setCtx(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success('Deleted');
      fetchDocs();
    } catch { toast.error('Delete failed'); }
  };

  const allDocs = driverId ? docs : [];
  const totalCount = allDocs.length + pendingDocs.length;

  return (
    <div onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}>

      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="form-section-header" style={{ marginBottom: 0 }}>
          Documents ({totalCount})
        </div>
        <button
          className="btn btn-sm btn-primary"
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowUpload(true);
          }}
        >
          <Upload size={12} /> Upload Document
        </button>
      </div>

      {pendingDocs.length > 0 && (
        <table className="tms-table"
          style={{ marginBottom: allDocs.length > 0 ? 12 : 0 }}>
          <thead>
            <tr>
              <th>Type</th><th>File Name</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 80 }}>Expiry</th>
              <th style={{ width: 70 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingDocs.map(doc => (
              <tr key={doc.id}>
                <td><span style={{ fontSize: 10, fontWeight: 600,
                  padding: '1px 6px', borderRadius: 8,
                  background: '#e8edf2', color: '#003865' }}>
                  {doc.doc_type || 'Other'}</span></td>
                <td><FileText size={11} style={{ marginRight: 4,
                  color: '#003865' }} />{doc.file_name}</td>
                <td><span style={{ fontSize: 9, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 8,
                  background: '#FFF7ED', color: '#92400E',
                  border: '1px solid #FDE68A' }}>PENDING</span></td>
                <td>{doc.expiry_date || '--'}</td>
                <td>
                  <button className="btn btn-xs btn-secondary"
                    onClick={() => setPendingDocs?.(
                      prev => prev.filter(d => d.id !== doc.id)
                    )}>
                    <Trash2 size={10} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {allDocs.length > 0 && (
        <table className="tms-table">
          <thead>
            <tr>
              <th>Type</th><th>File Name</th>
              <th style={{ width: 90 }}>Uploaded</th>
              <th style={{ width: 80 }}>Expiry</th>
              <th style={{ width: 70 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allDocs.map(doc => (
              <tr key={doc.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCtx({ x: e.clientX, y: e.clientY, doc });
                }}>
                <td><span style={{ fontSize: 10, fontWeight: 600,
                  padding: '1px 6px', borderRadius: 8,
                  background: '#e8edf2', color: '#003865' }}>
                  {doc.doc_type || 'Other'}</span></td>
                <td><FileText size={11} style={{ marginRight: 4,
                  color: '#003865' }} />{doc.file_name}</td>
                <td>{formatDate(doc.created_at)}</td>
                <td>{doc.expiry_date
                  ? formatDate(doc.expiry_date) : '--'}
                  <ExpiryBadge date={doc.expiry_date} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button className="btn btn-xs btn-secondary"
                      title="Download"
                      onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/api/documents/${doc.id}/download`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                          });
                          if (!res.ok) throw new Error();
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = doc.file_name || 'document';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch { toast.error('Download failed'); }
                      }}>
                      <Download size={10} />
                    </button>
                    <button className="btn btn-xs btn-secondary"
                      title="Delete"
                      onClick={() => handleDelete(doc)}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {ctx && (
        <div
          style={{
            position: 'fixed',
            top: ctx.y,
            left: ctx.x,
            zIndex: 99999,
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: 160,
            padding: '4px 0',
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 14px', border: 'none', background: 'none',
              fontSize: 12, cursor: 'pointer', color: '#1a1a1a' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={async () => {
              try {
                const res = await fetch(`http://localhost:5000/api/documents/${ctx.doc.id}/download`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (!res.ok) throw new Error();
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = ctx.doc.file_name || 'document';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch { toast.error('Download failed'); }
              setCtx(null);
            }}
          >
            <Download size={13} /> Download
          </button>
          <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 14px', border: 'none', background: 'none',
              fontSize: 12, cursor: 'pointer', color: '#B71C1C' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => {
              handleDelete(ctx.doc);
              setCtx(null);
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {totalCount === 0 && (
        <div style={{ padding: 16, textAlign: 'center',
          color: '#94A3B8', fontSize: 12 }}>
          No documents uploaded
        </div>
      )}

      {showUpload && (
        <UploadWindow
          driverId={driverId}
          onClose={() => setShowUpload(false)}
          onUploaded={fetchDocs}
          onPendingAdd={(doc) =>
            setPendingDocs?.(prev => [...prev, doc])
          }
        />
      )}
    </div>
  );
}
