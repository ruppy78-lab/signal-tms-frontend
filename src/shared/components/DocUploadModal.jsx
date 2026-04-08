import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paperclip, X, Upload, Download, Trash2, FileText } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import api from '../services/api';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  'BOL', 'POD', 'Rate Confirmation', 'Load Confirmation', 'Invoice',
  'Weight Certificate', 'Customs Document', 'Driver License', 'Medical Card',
  'Insurance', 'Registration', 'Inspection', 'Photo', 'Other',
];

export const LOAD_DOC_TYPES = [
  'BOL', 'POD', 'Rate Confirmation', 'Load Confirmation',
  'Commercial Invoice', 'Packing List', 'Customs Docs',
  'LC Document', 'Insurance Certificate', 'Delivery Receipt', 'Other',
];

export default function DocUploadModal({ open, onClose, entityType, entityId, entityLabel, docTypes }) {
  const [docs, setDocs] = useState([]);
  const [docType, setDocType] = useState('Other');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pos, setPos] = useState({
    x: Math.max(0, (window.innerWidth - 480) / 2),
    y: Math.max(0, (window.innerHeight - 420) / 2),
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const fetchDocs = useCallback(() => {
    if (!entityId) return;
    api.get(`/documents/${entityType}/${entityId}`)
      .then(r => setDocs(r.data || []))
      .catch(() => setDocs([]));
  }, [entityType, entityId]);

  useEffect(() => { if (open) fetchDocs(); }, [open, fetchDocs]);

  useEffect(() => {
    if (!open) return;
    const onMove = (e) => {
      if (isDragging.current) {
        setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
      }
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [open]);

  const onHeaderMouseDown = useCallback((e) => {
    if (['INPUT','SELECT','BUTTON','LABEL'].includes(e.target.tagName)) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
    e.stopPropagation();
  }, [pos]);

  const handleUpload = async () => {
    if (!file) { toast.error('Choose a file first'); return; }
    if (!entityId) { toast.error('Save the record first'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entity_type', entityType);
      fd.append('entity_id', entityId);
      fd.append('doc_type', docType);
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      setFile(null);
      fetchDocs();
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success('Deleted');
      fetchDocs();
    } catch { toast.error('Delete failed'); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await fetch(`http://localhost:5000/api/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
  };

  if (!open) return null;

  const stop = (e) => { e.stopPropagation(); };

  return (
    <div
      style={{
        position: 'fixed', left: pos.x, top: pos.y, width: 480, zIndex: 99999,
        background: '#fff', borderRadius: 8, border: '1px solid #ccd6e0',
        boxShadow: '0 8px 40px rgba(0,0,56,0.25)', minWidth: 350,
      }}
      onClick={stop} onMouseDown={stop}
    >
      {/* Header */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          background: '#003865', color: '#fff', padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'move', userSelect: 'none', borderRadius: '8px 8px 0 0',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paperclip size={14} /> Documents {entityLabel ? `— ${entityLabel}` : ''}
        </span>
        <button onClick={(e) => { stop(e); onClose(); }}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      {/* Upload area */}
      <div style={{ padding: 14, borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Type</label>
            <select className="form-input" value={docType} onChange={e => setDocType(e.target.value)}
              style={{ fontSize: 12, height: 32 }}>
              {(docTypes || DOC_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', gap: 4, height: 32 }}>
            <Paperclip size={12} /> {file ? file.name.slice(0, 20) : 'Choose File'}
            <input type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          </label>
          <button className="btn btn-sm btn-primary" onClick={handleUpload}
            disabled={uploading || !file} style={{ height: 32 }}>
            <Upload size={12} /> {uploading ? '...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Document list */}
      <div style={{ maxHeight: 250, overflowY: 'auto', padding: docs.length ? 0 : 16 }}>
        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>No documents</div>
        ) : (
          <table className="tms-table" style={{ fontSize: 11 }}>
            <thead>
              <tr><th>Name</th><th style={{ width: 80 }}>Type</th><th style={{ width: 70 }}>Date</th><th style={{ width: 60 }}>Actions</th></tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id}>
                  <td><FileText size={11} style={{ marginRight: 4 }} />{doc.file_name}</td>
                  <td>{doc.doc_type || '—'}</td>
                  <td>{formatDate(doc.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button className="btn btn-xs btn-secondary" title="Download" onClick={() => handleDownload(doc)}>
                        <Download size={10} />
                      </button>
                      <button className="btn btn-xs btn-secondary" title="Delete" onClick={() => handleDelete(doc)}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
