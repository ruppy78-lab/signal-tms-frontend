import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowRight, Plus } from 'lucide-react';
import { Button, Spinner, EmptyState } from '../../shared/components';
import { formatDate, formatCurrency } from '../../shared/utils/formatters';
import api from '../../shared/services/api';
import toast from 'react-hot-toast';
import NewQuoteModal from './components/NewQuoteModal';
import QuoteDetailModal from './components/QuoteDetailModal';

const STATUS_STYLES = {
  pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Pending' },
  reviewed: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'Reviewed' },
  approved: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Approved' },
  converted: { bg: '#D1FAE5', color: '#047857', border: '#6EE7B7', label: 'Converted' },
  declined: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Declined' },
};
const SOURCE_STYLES = {
  internal: { bg: '#F3F4F6', color: '#4B5563', label: 'INTERNAL' },
  portal: { bg: '#DBEAFE', color: '#1D4ED8', label: 'PORTAL' },
};

export default function QuotesModule() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [detailQuote, setDetailQuote] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, quote }

  const fetchQuotes = () => {
    setLoading(true);
    api.get('/portal/admin/quotes')
      .then(r => setQuotes(r.data || []))
      .catch(() => toast.error('Failed to load quotes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuotes(); }, []);

  // Close context menu on click anywhere or Escape
  const closeCtx = useCallback(() => setCtxMenu(null), []);
  useEffect(() => {
    if (!ctxMenu) return;
    const onKey = (e) => { if (e.key === 'Escape') closeCtx(); };
    document.addEventListener('click', closeCtx);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', closeCtx); document.removeEventListener('keydown', onKey); };
  }, [ctxMenu, closeCtx]);

  const handleContextMenu = (e, quote) => {
    e.preventDefault();
    // Keep menu on screen
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setCtxMenu({ x, y, quote });
  };

  const handleConvert = async (quote) => {
    if (quote.status === 'converted') { toast.error('Already converted'); return; }
    if (!window.confirm(`Convert ${quote.quote_number} to a new load?`)) return;
    setConverting(quote.id);
    try {
      const res = await api.post(`/portal/admin/quotes/${quote.id}/convert`);
      const data = res.data || res;
      toast.success(`Converted to ${data.load?.load_number || 'new load'}`);
      fetchQuotes();
    } catch (e) { toast.error(e.message || 'Convert failed'); }
    setConverting(null);
  };

  const badgeStyle = (s) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
    background: s.bg, color: s.color, border: `1px solid ${s.border || s.bg}`, whiteSpace: 'nowrap' });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quotes</div>
          <div className="page-subtitle">{quotes.length} quotes</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={RefreshCw} variant="secondary" onClick={fetchQuotes}>Refresh</Button>
          <Button icon={Plus} onClick={() => setShowNew(true)}>New Quote</Button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : quotes.length === 0 ? <EmptyState title="No quotes yet" message="Click New Quote to create one, or quotes from the Customer Portal will appear here." />
            : (
            <table className="tms-table">
              <thead><tr>
                <th>Quote #</th><th>Date</th><th>Customer</th><th>Source</th><th>From</th><th>To</th>
                <th>Equipment</th><th>Weight</th><th>Est. Rate</th><th>Status</th><th style={{ width: 100 }}>Actions</th>
              </tr></thead>
              <tbody>
                {quotes.map(q => {
                  const st = STATUS_STYLES[q.status] || STATUS_STYLES.pending;
                  const src = SOURCE_STYLES[q.source] || SOURCE_STYLES.internal;
                  return (
                    <tr key={q.id} onContextMenu={e => handleContextMenu(e, q)}
                      style={{ cursor: 'context-menu' }}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline dotted' }}
                          onClick={() => setDetailQuote(q)}>{q.quote_number || '—'}</span>
                      </td>
                      <td>{formatDate(q.created_at)}</td>
                      <td>{q.customer_name || '—'}</td>
                      <td><span style={badgeStyle(src)}>{src.label}</span></td>
                      <td>{q.origin_city}{q.origin_state ? `, ${q.origin_state}` : ''}</td>
                      <td>{q.dest_city}{q.dest_state ? `, ${q.dest_state}` : ''}</td>
                      <td>{q.equipment || 'Dry Van'}</td>
                      <td>{q.weight ? `${Number(q.weight).toLocaleString()} lb` : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{q.estimated_rate ? formatCurrency(q.estimated_rate) : '—'}</td>
                      <td>
                        <span style={badgeStyle(st)}>{st.label}</span>
                        {q.emailed_at && <span title={`Emailed ${q.emailed_to || ''}`} style={{ marginLeft: 4, fontSize: 11 }}>&#9993;</span>}
                        {q.converted_load_number && (
                          <a href={`/loads?load=${q.converted_load_number}`}
                            style={{ fontSize: 10, marginLeft: 4, color: '#047857', fontWeight: 600, textDecoration: 'none' }}>
                            {q.converted_load_number}
                          </a>
                        )}
                      </td>
                      <td>
                        {q.status !== 'converted' && (
                          <Button size="xs" icon={ArrowRight} onClick={() => handleConvert(q)}
                            loading={converting === q.id}>Convert</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <div style={{
          position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 9999,
          background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', padding: '4px 0', minWidth: 200,
        }} onClick={e => e.stopPropagation()}>
          <CtxItem label="View Quote Details" onClick={() => { setDetailQuote(ctxMenu.quote); setCtxMenu(null); }} />
          {ctxMenu.quote.status !== 'converted' && ctxMenu.quote.status !== 'declined' && (
            <CtxItem label="Convert to Load" onClick={() => { handleConvert(ctxMenu.quote); setCtxMenu(null); }} />
          )}
        </div>
      )}

      <NewQuoteModal open={showNew} onClose={() => setShowNew(false)} onCreated={fetchQuotes} />
      <QuoteDetailModal open={!!detailQuote} onClose={() => setDetailQuote(null)} quote={detailQuote} onConvert={handleConvert} onRefresh={fetchQuotes} />
    </div>
  );
}

function CtxItem({ label, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary, #f5f5f5)'}
       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {label}
    </div>
  );
}
