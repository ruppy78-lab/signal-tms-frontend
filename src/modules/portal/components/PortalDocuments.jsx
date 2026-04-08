import React, { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import { Spinner } from '../../../shared/components';
import { formatDate } from '../../../shared/utils/formatters';
import api from '../../../shared/services/api';

export default function PortalDocuments({ portalApi }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.get('/portal/documents')
      .then(r => setDocs(r.data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [portalApi]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B3A', marginBottom: 16 }}>Documents</h2>
      {docs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No documents found</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table className="tms-table">
            <thead><tr><th>Load #</th><th>Document Type</th><th>File</th><th>Date</th><th style={{ width: 80 }}>Download</th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.load_number || '—'}</td>
                  <td>{d.doc_type || 'Other'}</td>
                  <td><FileText size={11} style={{ marginRight: 4 }} />{d.file_name}</td>
                  <td>{formatDate(d.created_at)}</td>
                  <td>
                    <a href={`${api.defaults.baseURL.replace('/api', '')}${d.file_url}`} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4D82B8', textDecoration: 'none' }}>
                      <Download size={12} /> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
