import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Download, FileText } from 'lucide-react';
import { Button, Select } from '../../../../shared/components';
import { formatDate } from '../../../../shared/utils/formatters';
import customersApi from '../../services/customersApi';
import api from '../../../../shared/services/api';
import toast from 'react-hot-toast';

const CUSTOMER_DOC_TYPES = [
  'Tax Form / W9', 'GST/HST Certificate', 'Credit Application', 'Credit Reference',
  'Business License', 'Insurance Certificate', 'Rate Agreement / Contract',
  'Trading Terms', 'Bill of Lading Template', 'Banking Information', 'Signed Agreement', 'Other',
];

export default function TabDocuments({ customerId }) {
  const [docs, setDocs] = useState([]);
  const [docType, setDocType] = useState('Other');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    if (!customerId) return;
    customersApi.getDocuments(customerId)
      .then(r => setDocs(r.data || r || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [customerId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File exceeds 10MB limit'); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('entity_type', 'customer');
    fd.append('entity_id', customerId);
    fd.append('doc_type', docType);

    setUploading(true);
    try {
      await api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded');
      load();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error('Delete failed'); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!customerId) {
    return <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 16 }}>
      Save the customer first to upload documents.
    </p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 160 }}>
          <Select label="Document Type" value={docType}
            onChange={e => setDocType(e.target.value)}
            options={CUSTOMER_DOC_TYPES.map(t => ({ value: t, label: t }))} />
        </div>
        <Button size="sm" icon={Upload} onClick={() => fileRef.current?.click()} loading={uploading}>
          Upload
        </Button>
        <input ref={fileRef} type="file" hidden
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={handleUpload} />
      </div>

      <table className="tms-table">
        <thead>
          <tr>
            <th>Name</th><th style={{ width: 100 }}>Type</th>
            <th style={{ width: 70 }}>Size</th><th style={{ width: 90 }}>Date</th>
            <th style={{ width: 80 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(doc => (
            <tr key={doc.id}>
              <td><FileText size={12} style={{ marginRight: 4 }} />{doc.file_name}</td>
              <td>{doc.doc_type}</td>
              <td>{formatSize(doc.file_size)}</td>
              <td>{formatDate(doc.created_at)}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.file_url}`} target="_blank" rel="noreferrer"
                    className="btn btn-xs btn-secondary"><Download size={11} /></a>
                  <button className="btn btn-xs btn-secondary" onClick={() => remove(doc)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!docs.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No documents</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
