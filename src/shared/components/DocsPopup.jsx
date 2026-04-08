import React, { useState, useEffect,
  useRef, useCallback } from 'react';
import { X, Upload, Download,
  Trash2, FileText, Paperclip } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Document types per module
export const LOAD_DOC_TYPES = [
  'BOL', 'POD', 'Rate Confirmation',
  'Load Confirmation', 'Commercial Invoice',
  'Packing List', 'Customs Docs',
  'LC Document', 'Insurance Certificate',
  'Delivery Receipt', 'Other',
];

export const DRIVER_DOC_TYPES = [
  'Driver License', 'Medical Card',
  'Abstract/MVR', 'CVOR', 'Drug Test',
  'Criminal Check', 'Contract/Agreement',
  'Direct Deposit Form', 'Photo ID',
  'Liability Insurance', 'Other',
];

export const FLEET_DOC_TYPES = [
  'Registration', 'Insurance',
  'DOT Inspection', 'Maintenance Record',
  'Title', 'Lease Agreement', 'Other',
];

export const CUSTOMER_DOC_TYPES = [
  'Contract', 'Credit Application',
  'Insurance Certificate', 'W9', 'Other',
];

// ── Upload Form (inner popup) ──────────────
function UploadForm({ entityType, entityId,
  docTypes, onClose, onUploaded }) {
  const [docType, setDocType] =
    useState(docTypes[0]);
  const [docName, setDocName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const stop = (e) => e.stopPropagation();

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a file first');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entity_type', entityType);
      fd.append('entity_id', entityId);
      fd.append('doc_type', docType);
      if (docName) fd.append('doc_name', docName);
      if (expiry) fd.append('expiry_date', expiry);
      await api.post('/documents/upload', fd, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document uploaded');
      onUploaded?.();
      onClose();
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 420,
      background: '#fff',
      borderRadius: 8,
      border: '1px solid #ccd6e0',
      boxShadow: '0 8px 40px rgba(0,0,56,0.3)',
      zIndex: 99999,
    }}
      onClick={stop}
      onMouseDown={stop}
    >
      {/* Header */}
      <div style={{
        background: '#003865', color: '#fff',
        padding: '10px 16px', borderRadius: '8px 8px 0 0',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paperclip size={14} /> Upload Document
        </span>
        <button onClick={(e) => { stop(e); onClose(); }}
          style={{ background: 'none', border: 'none',
            color: '#fff', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            Document Type
          </label>
          <select className="form-input" value={docType}
            onChange={e => setDocType(e.target.value)}>
            {docTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            Document Name (optional)
          </label>
          <input className="form-input" value={docName}
            onChange={e => setDocName(e.target.value)}
            placeholder="e.g. BOL_LD1036" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            Expiry Date (optional)
          </label>
          <input className="form-input" type="date"
            value={expiry}
            onChange={e => setExpiry(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600,
            color: '#666', display: 'block', marginBottom: 3 }}>
            File
          </label>
          <label className="btn btn-sm btn-secondary"
            style={{ cursor: 'pointer',
              display: 'inline-flex', gap: 4 }}>
            <Paperclip size={12} />
            {file ? file.name : 'Choose File'}
            <input type="file" hidden
              onChange={e =>
                setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </label>
          {!file && (
            <span style={{ fontSize: 11,
              color: '#94A3B8', marginLeft: 8 }}>
              No file chosen
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', background: '#f8fafc',
        borderTop: '1px solid #e0e0e0',
        borderRadius: '0 0 8px 8px',
        display: 'flex', justifyContent: 'flex-end', gap: 8,
      }}>
        <button className="btn btn-sm btn-secondary"
          onClick={(e) => { stop(e); onClose(); }}>
          Cancel
        </button>
        <button className="btn btn-sm btn-primary"
          onClick={(e) => { stop(e); handleUpload(); }}
          disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

// ── Main DocsPopup ─────────────────────────
export default function DocsPopup({
  entityType, entityId, title,
  docTypes, onClose
}) {
  const [docs, setDocs] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [pos, setPos] = useState({
    x: Math.max(0, (window.innerWidth - 600) / 2),
    y: Math.max(0, (window.innerHeight - 500) / 2),
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const types = docTypes || ['BOL', 'POD', 'Other'];

  const fetchDocs = useCallback(() => {
    if (!entityId) return;
    api.get(`/documents/${entityType}/${entityId}`)
      .then(r => setDocs(r.data || []))
      .catch(() => setDocs([]));
  }, [entityType, entityId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const onHeaderMouseDown = useCallback((e) => {
    if (['INPUT','SELECT','BUTTON','LABEL']
      .includes(e.target.tagName)) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
    e.preventDefault();
    e.stopPropagation();
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (isDragging.current) {
        setPos({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
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

  const handleDelete = async (doc) => {
    if (!window.confirm(
      `Delete ${doc.file_name}?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success('Deleted');
      fetchDocs();
    } catch { toast.error('Delete failed'); }
  };

  const handleDownload = (doc) => {
    const token = localStorage.getItem('token');
    fetch(
      `${api.defaults.baseURL}/documents/` +
      `${doc.id}/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Download failed'));
  };

  const stop = (e) => e.stopPropagation();

  return (
    <>
      {/* Main docs popup — no backdrop */}
      <div
        style={{
          position: 'fixed',
          left: pos.x, top: pos.y,
          width: 600, minWidth: 400,
          height: 500, minHeight: 300,
          zIndex: 9000,
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #ccd6e0',
          boxShadow: '0 8px 40px rgba(0,0,56,0.2)',
          display: 'flex', flexDirection: 'column',
          resize: 'both', overflow: 'hidden',
        }}
        onClick={stop}
        onMouseDown={stop}
        onPointerDown={stop}
      >
        {/* Header — draggable */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            background: '#003865', color: '#fff',
            padding: '10px 16px', cursor: 'move',
            userSelect: 'none', flexShrink: 0,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} />
            {title || 'Documents'}
          </span>
          <button
            onMouseDown={stop}
            onClick={(e) => { stop(e); onClose(); }}
            style={{ background: 'none', border: 'none',
              color: '#fff', cursor: 'pointer', padding: 2 }}>
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0, background: '#f8fafc',
        }}>
          <button
            className="btn btn-sm btn-primary"
            onMouseDown={stop}
            onClick={(e) => {
              stop(e);
              setShowUpload(true);
            }}
          >
            <Upload size={12} /> Upload Document
          </button>
          <span style={{ fontSize: 11,
            color: '#666', marginLeft: 12 }}>
            {docs.length} document{docs.length !== 1
              ? 's' : ''}
          </span>
        </div>

        {/* Document list */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 12,
        }}>
          {docs.length === 0 ? (
            <div style={{ padding: 24,
              textAlign: 'center', color: '#94A3B8',
              fontSize: 12 }}>
              No documents uploaded yet
            </div>
          ) : (
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>File Name</th>
                  <th style={{ width: 90 }}>Date</th>
                  <th style={{ width: 80 }}>Expiry</th>
                  <th style={{ width: 70 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <span style={{ fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 8,
                        background: '#e8edf2',
                        color: '#003865' }}>
                        {doc.doc_type || 'Other'}
                      </span>
                    </td>
                    <td style={{ fontSize: 11 }}>
                      <FileText size={11} style={{
                        marginRight: 4, color: '#003865'
                      }} />
                      {doc.file_name}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {doc.created_at
                        ? new Date(doc.created_at)
                          .toLocaleDateString()
                        : '--'}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {doc.expiry_date
                        ? new Date(doc.expiry_date)
                          .toLocaleDateString()
                        : '--'}
                    </td>
                    <td>
                      <div style={{
                        display: 'flex', gap: 3
                      }}>
                        <button
                          className="btn btn-xs btn-secondary"
                          title="Download"
                          onClick={() =>
                            handleDownload(doc)}>
                          <Download size={10} />
                        </button>
                        <button
                          className="btn btn-xs btn-secondary"
                          title="Delete"
                          onClick={() =>
                            handleDelete(doc)}>
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

      {/* Upload form — appears on top */}
      {showUpload && (
        <UploadForm
          entityType={entityType}
          entityId={entityId}
          docTypes={types}
          onClose={() => setShowUpload(false)}
          onUploaded={fetchDocs}
        />
      )}
    </>
  );
}
