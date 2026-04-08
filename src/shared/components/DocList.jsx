import React from 'react';
import { Download, Trash2, FileText, Image, File } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import api from '../services/api';
import toast from 'react-hot-toast';

const iconForFile = (name) => {
  if (!name) return File;
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return Image;
  if (ext === 'pdf') return FileText;
  return File;
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocList({ documents = [], onDeleted }) {
  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success('Deleted');
      onDeleted?.();
    } catch (e) { toast.error('Delete failed'); }
  };

  if (!documents.length) {
    return (
      <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        No documents
      </div>
    );
  }

  return (
    <table className="tms-table">
      <thead>
        <tr>
          <th>Name</th>
          <th style={{ width: 100 }}>Type</th>
          <th style={{ width: 70 }}>Size</th>
          <th style={{ width: 90 }}>Date</th>
          <th style={{ width: 80 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {documents.map(doc => {
          const Icon = iconForFile(doc.file_name);
          return (
            <tr key={doc.id}>
              <td><Icon size={12} style={{ marginRight: 4 }} />{doc.file_name}</td>
              <td>{doc.doc_type || '—'}</td>
              <td>{formatSize(doc.file_size)}</td>
              <td>{formatDate(doc.created_at)}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <a href={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${doc.file_url}`} target="_blank" rel="noreferrer"
                    className="btn btn-xs btn-secondary"><Download size={11} /></a>
                  <button className="btn btn-xs btn-secondary" onClick={() => handleDelete(doc)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
