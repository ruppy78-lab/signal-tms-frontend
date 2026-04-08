import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Select } from './index';
import { DOC_TYPES } from '../utils/constants';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DocUpload({ entityType, entityId, onUploaded }) {
  const [docType, setDocType] = useState('Other');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File exceeds 10MB limit'); return; }

    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { toast.error(`File type ${ext} not allowed`); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('entity_type', entityType);
    fd.append('entity_id', entityId);
    fd.append('doc_type', docType);

    setUploading(true);
    try {
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      onUploaded?.();
    } catch (err) { toast.error(err.message || 'Upload failed'); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 160 }}>
          <Select label="Document Type" value={docType}
            onChange={e => setDocType(e.target.value)}
            options={DOC_TYPES.map(t => ({ value: t, label: t }))} />
        </div>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-dark)'}`,
          borderRadius: 8, padding: '20px 16px', textAlign: 'center',
          cursor: 'pointer', background: dragOver ? 'var(--info-bg)' : 'var(--gray-50)',
          transition: 'all 0.15s',
        }}>
        <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          PDF, JPG, PNG, DOC, XLS — Max 10MB
        </div>
      </div>
      <input ref={fileRef} type="file" hidden
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        onChange={e => upload(e.target.files?.[0])} />
    </div>
  );
}
