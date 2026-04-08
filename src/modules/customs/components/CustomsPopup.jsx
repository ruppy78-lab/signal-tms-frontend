import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../shared/services/api';
import toast from 'react-hot-toast';

export default function CustomsPopup({ loadId, loadNumber, customsType, pieces: initialPieces, onClose }) {
  const [pieces, setPieces] = useState(initialPieces || 0);
  const [eta, setEta] = useState('');
  const [broker, setBroker] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [loadDocs, setLoadDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // Draggable
  const [pos, setPos] = useState({ x: Math.max(0, (window.innerWidth - 900) / 2), y: Math.max(0, (window.innerHeight - 600) / 2) });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // PAPS/PARS calculations
  const loadDigits = (loadNumber || '').replace(/\D/g, '');
  const scac = customsType === 'PAPS' ? 'SGNI' : '7BAU';
  const proNumber = customsType === 'PAPS' ? loadDigits : `7BAU${loadDigits}`;
  // Identifier uses SCAC + digits only (not the full proNumber, to avoid double 7BAU for PARS)
  const displayIdentifier = `${customsType} ${scac}${loadDigits}`;
  const systemIdentifier = `${customsType}${scac}${loadDigits}`;
  const port = customsType === 'PAPS' ? '3004' : '0813';
  const border = 'Pacific Highway';

  useEffect(() => {
    api.get('/customs/brokers').then(r => {
      const list = r.data || [];
      setBrokers(list);
      const def = list.find(b => b.is_default) || list[0];
      if (def) setBroker(def);
    }).catch(() => {});

    api.get('/documents', { params: { entity_type: 'load', entity_id: loadId } })
      .then(r => {
        const docs = r.data;
        if (Array.isArray(docs)) setLoadDocs(docs);
        else if (docs?.rows) setLoadDocs(docs.rows);
        else setLoadDocs([]);
      })
      .catch(() => setLoadDocs([]));

    api.get('/customs/history', { params: { load_id: loadId } })
      .then(r => setHistory(r.data || []))
      .catch(() => setHistory([]));
  }, [loadId]);

  // Dragging
  const onHeaderMouseDown = useCallback((e) => {
    if (['BUTTON', 'INPUT', 'SELECT'].includes(e.target.tagName)) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => { if (!isDragging.current) return; setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }); };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const docList = Array.isArray(loadDocs) ? loadDocs : [];
  const bolDoc = docList.find(d => ['bol', 'bill of lading'].includes((d.doc_type || '').toLowerCase()));
  const customsDocs = docList.filter(d => ['customs docs', 'customs', 'customs document', 'paps', 'pars', 'commercial invoice', 'packing list'].includes((d.doc_type || '').toLowerCase()));

  const fetchPdfBlob = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${api.defaults.baseURL}/customs/loads/${loadId}/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ pieces: Number(pieces), eta, identifier: systemIdentifier, display_identifier: displayIdentifier, scac, pro_number: proNumber, customs_type: customsType, port, border })
    });
    if (!res.ok) {
      let msg = 'PDF generation failed';
      try { const err = await res.json(); msg = err.message || msg; } catch {}
      throw new Error(msg);
    }
    return res.blob();
  };

  const handleDownload = async () => {
    if (!loadId) { toast.error('Save load first before generating customs PDF'); return; }
    if (!eta) { toast.error('Please enter ETA time'); return; }
    if (!pieces || Number(pieces) <= 0) { toast.error('Please enter piece count'); return; }
    setDownloading(true);
    try {
      const blob = await fetchPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customsType}_${scac}${loadDigits}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Delay removal so the browser actually starts the download
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      toast.success('PDF downloaded');
    } catch (e) {
      console.error('[Customs Download]', e);
      toast.error(e.message || 'PDF failed');
    }
    setDownloading(false);
  };

  const handleReview = async () => {
    if (!loadId) { toast.error('Save load first before generating customs PDF'); return; }
    if (!eta) { toast.error('Please enter ETA time'); return; }
    if (!pieces || Number(pieces) <= 0) { toast.error('Please enter piece count'); return; }
    // Open the new tab synchronously (still in user gesture context) to avoid popup blocker
    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      toast.error('Popup blocked — please allow popups for this site');
      return;
    }
    previewWindow.document.write('<title>Generating PDF…</title><p style="font-family:sans-serif;padding:24px">Generating PDF…</p>');
    setReviewing(true);
    try {
      const blob = await fetchPdfBlob();
      const url = URL.createObjectURL(blob);
      previewWindow.location.href = url;
      // Revoke after 60s so the tab has time to load
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      console.error('[Customs Review]', e);
      previewWindow.close();
      toast.error(e.message || 'Preview failed');
    }
    setReviewing(false);
  };

  const handleSend = async () => {
    if (!eta) { toast.error('Please enter ETA time'); return; }
    if (!broker) { toast.error('Please select a broker'); return; }
    if (!pieces || Number(pieces) <= 0) { toast.error('Please enter piece count'); return; }
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${api.defaults.baseURL}/customs/loads/${loadId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ broker_id: broker.id, broker_email: broker.email, pieces: Number(pieces), eta, identifier: systemIdentifier, display_identifier: displayIdentifier, scac, pro_number: proNumber, customs_type: customsType, port, border })
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Send failed'); }
      toast.success(`Sent to ${broker.email}`);
      api.get('/customs/history', { params: { load_id: loadId } }).then(r => setHistory(r.data || [])).catch(() => {});
    } catch (e) { toast.error(e.message || 'Send failed'); }
    setSending(false);
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, width: 900, height: 580, zIndex: 9000, background: '#fff', borderRadius: 8, border: '1px solid #ccd6e0', boxShadow: '0 8px 40px rgba(0,0,56,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 700, resize: 'both' }}
      onClick={stop} onMouseDown={stop}>

      {/* HEADER */}
      <div onMouseDown={onHeaderMouseDown} style={{ background: '#003865', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'move', userSelect: 'none', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          🌎 {customsType} — {loadNumber}
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>{displayIdentifier}</span>
        </span>
        <button onMouseDown={stop} onClick={(e) => { stop(e); onClose(); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — Cover Sheet Preview */}
        <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #e0e0e0', padding: 16, overflowY: 'auto', background: '#f8fafc' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#003865', marginBottom: 8, textTransform: 'uppercase' }}>Cover Sheet Preview</div>
          <div style={{ background: '#fff', border: '1px solid #ccd6e0', borderRadius: 6, padding: 12, textAlign: 'center' }}>
            <div style={{ background: '#003865', color: '#fff', padding: '6px 8px', marginBottom: 8, borderRadius: 4, fontSize: 10, fontWeight: 700 }}>SIGNAL TRANSPORTATION LTD</div>
            <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>PLEASE PROCESS THIS</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#003865', lineHeight: 1, marginBottom: 8 }}>{customsType}</div>
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: '#666' }}>CROSSING AT</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#003865' }}>{border}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#003865' }}>PORT {port}</div>
            </div>
            <div style={{ background: '#e8f0fe', borderRadius: 4, padding: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#003865' }}>{displayIdentifier}</div>
              {eta && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>ETA: {eta}</div>}
              <div style={{ fontSize: 11, color: '#444' }}>PIECES: {pieces || 0}</div>
            </div>
          </div>
        </div>

        {/* RIGHT — Details */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Shipment Info */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#003865', textTransform: 'uppercase', marginBottom: 6 }}>Shipment Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
              <div><span style={{ color: '#666' }}>Type:</span> <strong>{customsType}</strong></div>
              <div><span style={{ color: '#666' }}>SCAC:</span> <strong>{scac}</strong></div>
              <div><span style={{ color: '#666' }}>PRO#:</span> <strong>{proNumber}</strong></div>
              <div><span style={{ color: '#666' }}>Port:</span> <strong>{port}</strong></div>
              <div><span style={{ color: '#666' }}>Border:</span> <strong>{border}</strong></div>
              <div><span style={{ color: '#666' }}>ID:</span> <strong style={{ fontFamily: 'monospace' }}>{displayIdentifier}</strong></div>
            </div>
          </div>

          {/* Pieces + ETA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Pieces / Pallets *</label>
              <input className="form-input" type="number" value={pieces} onChange={e => setPieces(e.target.value)} min="1" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>ETA at Border *</label>
              <input className="form-input" type="time" value={eta} onChange={e => setEta(e.target.value)} />
            </div>
          </div>

          {/* Broker */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 3 }}>Customs Broker</label>
            <select className="form-input" value={broker?.id || ''} onChange={e => { const b = brokers.find(x => x.id === e.target.value); setBroker(b); }}>
              <option value="">— Select Broker —</option>
              {brokers.map(b => <option key={b.id} value={b.id}>{b.name}{b.is_default ? ' ⭐' : ''}{b.email ? ` — ${b.email}` : ''}</option>)}
            </select>
          </div>

          {/* Documents */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#003865', textTransform: 'uppercase', marginBottom: 6 }}>Documents to Combine</div>
            <DocRow ok label="1. Cover Sheet (auto-generated)" />
            <DocRow ok label="2. BOL (auto-generated from load data)" />
            {customsDocs.length === 0
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12, color: '#94A3B8' }}><CheckCircle size={14} color="#94A3B8" /><span>No customs docs uploaded — optional</span></div>
              : customsDocs.map((d, i) => <DocRow key={d.id} ok label={`${i + 3}. ${d.doc_type || 'Document'} — ${d.file_name}`} />)}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #e0e0e0' }}>
            <button className="btn btn-secondary" onClick={handleReview} disabled={reviewing} style={{ flex: 1 }}>
              {reviewing ? 'Loading...' : '👁 Review'}
            </button>
            <button className="btn btn-secondary" onClick={handleDownload} disabled={downloading} style={{ flex: 1 }}>
              {downloading ? 'Generating...' : '⬇ Download'}
            </button>
            <button className="btn btn-primary" onClick={handleSend} disabled={sending || !broker} style={{ flex: 1 }}>
              {sending ? 'Sending...' : '✉ Send'}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#003865', textTransform: 'uppercase', marginBottom: 6 }}>Sent History</div>
              {history.map(h => (
                <div key={h.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #eee', fontSize: 11 }}>
                  <span style={{ color: '#888' }}>{h.created_at ? new Date(h.created_at).toLocaleDateString() : ''}</span>
                  <span style={{ fontWeight: 700, color: h.type === 'PAPS' ? '#003865' : '#2E7D32', padding: '1px 6px', borderRadius: 8, background: h.type === 'PAPS' ? '#E3F2FD' : '#E8F5E9', fontSize: 10 }}>{h.type}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{h.type} {h.scac}{h.pro_number}</span>
                  <span style={{ color: '#666' }}>{h.broker_email || ''}</span>
                  <span style={{ color: '#2E7D32', marginLeft: 'auto' }}>Sent</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocRow({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12 }}>
      {ok ? <CheckCircle size={14} color="#2E7D32" /> : <AlertCircle size={14} color="#92400E" />}
      <span style={{ color: ok ? '#1a1a1a' : '#92400E' }}>{label}</span>
    </div>
  );
}
