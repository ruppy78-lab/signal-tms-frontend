import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import { formatDate } from '../../../../shared/utils/formatters';
import api from '../../../../shared/services/api';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  'Registration', 'Insurance Certificate', 'CVIP Report', 'Annual Inspection',
  'Lease Agreement', 'Purchase Agreement', 'Title', 'IFTA License',
  'Weight Certificate', 'Photo', 'Other',
];

export default function FleetFormDocs({ fleetId }) {
  const [docs, setDocs] = useState([]);
  const [docType, setDocType] = useState('Registration');
  const [uploading, setUploading] = useState(false);

  const fetchDocs = () => {
    if (!fleetId) return;
    api.get(`/documents/fleet/${fleetId}`).then(r => setDocs(r.data || [])).catch(() => setDocs([]));
  };
  useEffect(() => { fetchDocs(); }, [fleetId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !fleetId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('doc_type', docType);
      fd.append('entity_type', 'fleet'); fd.append('entity_id', fleetId);
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded'); fetchDocs();
    } catch { toast.error('Upload failed'); }
    setUploading(false); e.target.value = '';
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try { await api.delete(`/documents/${doc.id}`); toast.success('Deleted'); fetchDocs(); }
    catch { toast.error('Delete failed'); }
  };

  if (!fleetId) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Save the vehicle first to upload documents.</div>;

  return (
    <div>
      <div className="section-header">Upload Document</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <select className="form-input" value={docType} onChange={e => setDocType(e.target.value)} style={{ width: 200 }}>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="btn btn-sm btn-primary" style={{ cursor: 'pointer' }}>
          <Upload size={12} /> {uploading ? 'Uploading...' : 'Choose File'}
          <input type="file" hidden onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      </div>
      <div className="section-header">Documents ({docs.length})</div>
      {docs.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No documents uploaded</div>
      ) : (
        <table className="tms-table">
          <thead><tr><th>Name</th><th style={{ width: 120 }}>Type</th><th style={{ width: 90 }}>Date</th><th style={{ width: 70 }}>Actions</th></tr></thead>
          <tbody>
            {docs.map(doc => (
              <tr key={doc.id}>
                <td><FileText size={11} style={{ marginRight: 4 }} />{doc.file_name}</td>
                <td>{doc.doc_type || 'Other'}</td>
                <td>{formatDate(doc.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.file_url}`} target="_blank" rel="noreferrer"
                      className="btn btn-xs btn-secondary"><Download size={10} /></a>
                    <button className="btn btn-xs btn-secondary" onClick={() => handleDelete(doc)}><Trash2 size={10} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
