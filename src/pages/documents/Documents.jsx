import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { StatusBadge, Spinner, EmptyState, DocUploadModal } from '../../components/common';
import { Search, Plus, Trash2, Download, FileText, RefreshCw } from 'lucide-react';

const ENTITY_TYPES = ['load','customer','carrier','driver','fleet'];

export default function Documents() {
  const qc = useQueryClient();
  const [entityType, setEntityType] = useState('load');
  const [entityId, setEntityId]     = useState('');
  const [searched, setSearched]     = useState(false);
  const [uploadModal, setUploadModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: () => api.get(`/documents/${entityType}/${entityId}`).then(r => r.data.data),
    enabled: !!entityId && searched,
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/documents/${id}`),
    onSuccess: () => { toast.success('Document deleted'); refetch(); },
    onError: () => toast.error('Delete failed'),
  });

  const doSearch = () => {
    if (!entityId.trim()) { toast.error('Enter an entity ID'); return; }
    setSearched(true);
  };

  const reset = () => { setEntityId(''); setSearched(false); };

  const rows = data || [];
  const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace('/api', '');

  const iconColor = (t) => {
    const map = { bol:'var(--primary)', pod:'var(--success)', rate_confirmation:'var(--warning)', invoice:'var(--info)', insurance:'var(--danger)' };
    return map[t] || 'var(--gray-500)';
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Documents</h1><p className="page-subtitle">BOL, POD, insurance and more</p></div>
        <button className="btn btn-primary" onClick={() => setUploadModal(true)}><Plus size={14} />Upload Document</button>
      </div>

      {/* Entity search */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header">
          <span className="card-title">Search Documents</span>
          {searched && <button className="btn btn-secondary btn-sm" onClick={reset}><RefreshCw size={13} /> Reset</button>}
        </div>
        <div className="card-body">
          <p style={{ fontSize:13, color:'var(--gray-500)', marginBottom:12 }}>
            Find documents by selecting an entity type and entering its ID. Each load, customer, carrier, driver, and vehicle has its own document folder.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-700)' }}>Entity Type</label>
              <select className="filter-select" style={{ minWidth:130 }} value={entityType}
                onChange={e => { setEntityType(e.target.value); setSearched(false); }}>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:220, display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-700)' }}>{entityType.charAt(0).toUpperCase()+entityType.slice(1)} ID (UUID)</label>
              <input className="form-input" placeholder={`Paste ${entityType} UUID here…`}
                value={entityId} onChange={e => { setEntityId(e.target.value); setSearched(false); }}
                onKeyDown={e => e.key === 'Enter' && doSearch()} />
            </div>
            <button className="btn btn-primary" onClick={doSearch}><Search size={14} />Search</button>
          </div>
          <p style={{ fontSize:11, color:'var(--gray-400)', marginTop:10 }}>
            Tip: You can also upload and view documents directly from each module (Loads, Carriers, Drivers, etc.) via right-click or the Documents tab in the detail panel.
          </p>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {isLoading ? 'Loading…' : `${rows.length} document${rows.length !== 1 ? 's' : ''} — ${entityType} / ${entityId.slice(0,8)}…`}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setUploadModal(true)}>
              <Plus size={13} /> Upload to this entity
            </button>
          </div>
          <div className="card-body" style={{ padding:0 }}>
            {isLoading ? <Spinner /> : !rows.length ? (
              <EmptyState title="No documents found" message="No documents have been uploaded for this entity yet." />
            ) : (
              <table>
                <thead>
                  <tr><th>File Name</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th><th>Notes</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <FileText size={14} style={{ color: iconColor(doc.doc_type), flexShrink:0 }} />
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--gray-800)' }}>{doc.file_name}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={doc.doc_type} /></td>
                      <td className="text-muted" style={{ fontSize:12 }}>
                        {doc.file_size ? `${(doc.file_size/1024).toFixed(1)} KB` : '—'}
                      </td>
                      <td className="text-muted" style={{ fontSize:12 }}>{doc.uploaded_by_name||'—'}</td>
                      <td className="text-muted" style={{ fontSize:12 }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="text-muted" style={{ fontSize:12, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {doc.notes||'—'}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <a href={`${API_BASE}/${doc.file_path}`} target="_blank" rel="noreferrer"
                            className="btn-icon" title="Download"><Download size={14} /></a>
                          <button className="btn-icon" title="Delete" style={{ color:'var(--danger)' }}
                            onClick={() => { if (window.confirm(`Delete "${doc.file_name}"?`)) deleteMut.mutate(doc.id); }}>
                            <Trash2 size={14} />
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
      )}

      <DocUploadModal
        open={uploadModal} onClose={() => setUploadModal(false)}
        entityType={entityType} entityId={searched ? entityId : ''}
        entityLabel={searched ? `${entityType} / ${entityId.slice(0,8)}…` : ''}
      />
    </div>
  );
}
