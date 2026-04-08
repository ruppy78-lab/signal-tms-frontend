import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Trash2, Image, File } from 'lucide-react';
import { Spinner, Select, EmptyState, Pagination } from '../../shared/components';
import { DOC_TYPES } from '../../shared/utils/constants';
import { formatDate } from '../../shared/utils/formatters';
import api from '../../shared/services/api';
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

export default function DocumentsModule() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (docType) params.doc_type = docType;
      const res = await api.get('/documents', { params });
      const data = res.data || res || {};
      setDocs(data.rows || []);
      setTotal(data.total || 0);
    } catch (e) { toast.error('Failed to load documents'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search, docType]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error('Delete failed'); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Documents</div>
          <div className="page-subtitle">{total} documents</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ padding: '8px 12px', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: '0 0 240px' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search by filename..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
          </div>
          <Select value={docType} onChange={e => { setDocType(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All Types' }, ...DOC_TYPES.map(t => ({ value: t, label: t }))]}
            style={{ height: 32, fontSize: 12, width: 160 }} />
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : !docs.length ? <EmptyState title="No documents" message="Upload documents from customer or load profiles" />
            : (
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Name</th><th style={{ width: 100 }}>Type</th>
                  <th style={{ width: 80 }}>Entity</th>
                  <th style={{ width: 90 }}>Date</th><th style={{ width: 70 }}>Size</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => {
                  const Icon = iconForFile(doc.file_name);
                  return (
                    <tr key={doc.id}>
                      <td><Icon size={12} style={{ marginRight: 4 }} />{doc.file_name}</td>
                      <td>{doc.doc_type || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{doc.entity_type || '—'}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>{formatSize(doc.file_size)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.file_url}`} target="_blank" rel="noreferrer"
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
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} total={total}
        onPrev={() => setPage(p => p - 1)}
        onNext={() => setPage(p => p + 1)}
        onGoTo={setPage} />
    </div>
  );
}
