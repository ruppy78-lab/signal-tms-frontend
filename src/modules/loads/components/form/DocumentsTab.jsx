import React, { useState, useRef } from 'react';
import { Upload, Download, Trash2, Eye, FileText, Image, File } from 'lucide-react';
import api from '../../../../shared/services/api';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  'BOL', 'POD', 'Rate Confirmation', 'Load Confirmation', 'Invoice',
  'Weight Certificate', 'Customs Document', 'Photo', 'Other/Custom',
];

const iconForFile = (name) => {
  if (!name) return File;
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return Image;
  if (ext === 'pdf') return FileText;
  return File;
};
const fmtSize = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1048576).toFixed(1)}MB`;
};
const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function DocumentsTab({ loadId, documents, onRefresh }) {
  const [docType, setDocType] = useState('BOL');
  const [customName, setCustomName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file || !loadId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB per file'); return; }
    const label = docType === 'Other/Custom' && customName.trim() ? customName.trim() : docType;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('entity_type', 'load');
    fd.append('entity_id', loadId);
    fd.append('doc_type', label);
    setUploading(true);
    setProgress(0);
    try {
      await api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      toast.success(`Uploaded ${file.name}`);
      onRefresh?.();
    } catch { toast.error('Upload failed'); }
    setUploading(false);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadMultiple = async (files) => {
    for (const f of files) { await uploadFile(f); }
  };

  const del = async (doc) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try { await api.delete(`/documents/${doc.id}`); toast.success('Deleted'); onRefresh?.(); }
    catch { toast.error('Delete failed'); }
  };

  const preview = (doc) => {
    const url = `${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${doc.file_url}`;
    window.open(url, '_blank');
  };

  const isCustom = docType === 'Other/Custom';

  return (
    <div>
      {/* Type selector */}
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 6 }}>
        {DOC_TYPES.map(t => (
          <button key={t} onClick={() => setDocType(t)} style={{
            padding: '2px 6px', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-family)',
            background: docType === t ? 'var(--primary)' : 'var(--bg-card)',
            color: docType === t ? 'var(--text-white)' : 'var(--text-secondary)',
            border: `1px solid ${docType === t ? 'var(--primary)' : 'var(--gray-300)'}`,
          }}>{t}</button>
        ))}
      </div>

      {/* Custom name field */}
      {isCustom && (
        <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
          placeholder="Document Name" style={{ width: '100%', height: 26, fontSize: 11, marginBottom: 6,
            padding: '0 8px', border: '1px solid var(--border-dark)', background: 'var(--bg-card)',
            fontFamily: 'var(--font-family)', color: 'var(--text-primary)' }} />
      )}

      {/* Upload area */}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); uploadMultiple(Array.from(e.dataTransfer.files)); }}
        onClick={() => fileRef.current?.click()}
        style={{ border: `1px dashed ${dragOver ? 'var(--primary)' : 'var(--gray-300)'}`,
          padding: '10px 8px', textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'var(--info-bg)' : 'var(--gray-50)', marginBottom: 6 }}>
        <Upload size={14} style={{ color: 'var(--text-muted)' }} />
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          {uploading ? 'Uploading...' : 'Drop files or click to browse'}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>PDF, JPG, PNG, DOC, DOCX, XLS — 10MB max</div>
      </div>
      <input ref={fileRef} type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        onChange={e => uploadMultiple(Array.from(e.target.files || []))} />

      {/* Progress bar */}
      {uploading && (
        <div style={{ height: 4, background: 'var(--gray-200)', marginBottom: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)',
            transition: 'width 0.2s' }} />
        </div>
      )}

      {/* File list */}
      {documents.length === 0 ? (
        <div style={{ padding: 8, textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          No documents attached
        </div>
      ) : (
        <table className="tms-table">
          <thead><tr>
            <th></th><th>File</th><th style={{ width: 70 }}>Type</th>
            <th style={{ width: 42 }}>Size</th><th style={{ width: 65 }}>Date</th><th style={{ width: 60 }}></th>
          </tr></thead>
          <tbody>
            {documents.map(doc => {
              const Icon = iconForFile(doc.file_name);
              return (
                <tr key={doc.id}>
                  <td style={{ width: 20, padding: '0 4px' }}><Icon size={11} style={{ color: 'var(--primary)' }} /></td>
                  <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{doc.file_name}</td>
                  <td>{doc.doc_type}</td>
                  <td>{fmtSize(doc.file_size)}</td>
                  <td>{fmtDate(doc.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button className="btn btn-xs btn-secondary" style={{ padding: '0 3px' }}
                        onClick={() => preview(doc)} title="Preview"><Eye size={9} /></button>
                      <a href={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${doc.file_url}`} target="_blank" rel="noreferrer"
                        className="btn btn-xs btn-secondary" style={{ padding: '0 3px' }} title="Download"><Download size={9} /></a>
                      <button className="btn btn-xs btn-secondary" style={{ padding: '0 3px' }}
                        onClick={() => del(doc)} title="Delete"><Trash2 size={9} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
