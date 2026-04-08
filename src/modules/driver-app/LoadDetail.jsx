import React, { useState, useEffect, useCallback } from 'react';
import { driverApi } from './api';
import PODScreen from './PODScreen';
import ChatScreen from './ChatScreen';

export default function LoadDetail({ loadId, onBack }) {
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPOD, setShowPOD] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const fetch_ = useCallback(async () => {
    try {
      const res = await driverApi.loadDetail(loadId);
      setLoad(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [loadId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const doEvent = async (type, stopId) => {
    setActionLoading(type);
    try {
      await driverApi.addEvent(loadId, { event_type: type, stop_id: stopId });
      await fetch_();
    } catch (e) { alert(e.message); }
    setActionLoading('');
  };

  const navigate = (stop) => {
    const addr = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join('+').replace(/\s/g, '+');
    window.open(`https://maps.google.com/maps?daddr=${addr}`, '_blank');
  };

  if (showPOD) return <PODScreen load={load} onDone={() => { setShowPOD(false); fetch_(); }} onBack={() => setShowPOD(false)} />;
  if (showChat) return <ChatScreen loadId={loadId} onBack={() => setShowChat(false)} />;

  if (loading) return <div style={{ padding:40,textAlign:'center',color:'#666' }}>Loading...</div>;
  if (!load) return <div style={{ padding:40,textAlign:'center',color:'#B71C1C' }}>Load not found</div>;

  const stops = load.stops || [];
  const events = load.events || [];
  const docs = load.documents || [];

  const S = {
    header: { background:'#003865',color:'#fff',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10 },
    btn: { padding:'10px 16px',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',width:'100%',marginBottom:8 },
  };

  return (
    <div style={{ minHeight:'100vh',background:'#F0F4F8' }}>
      <div style={S.header}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <button onClick={onBack} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:18 }}>←</button>
          <span style={{ fontWeight:700 }}>{load.load_number}</span>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={() => setShowChat(true)} style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 10px',borderRadius:4,fontSize:12,cursor:'pointer' }}>💬</button>
          <button onClick={() => setShowDocs(!showDocs)} style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 10px',borderRadius:4,fontSize:12,cursor:'pointer' }}>📎</button>
        </div>
      </div>

      <div style={{ padding:16 }}>
        {/* Status bar */}
        <div style={{ display:'flex',justifyContent:'space-around',background:'#fff',borderRadius:8,padding:12,marginBottom:16,border:'1px solid #e0e0e0' }}>
          {['Pickup','En Route','Delivered'].map((s,i) => {
            const active = (i===0 && ['available','on_dock','at_pickup'].includes(load.status)) ||
              (i===1 && ['en_route','in_transit','dispatched'].includes(load.status)) ||
              (i===2 && load.status==='delivered');
            const done = (i===0 && !['available'].includes(load.status)) ||
              (i===1 && load.status==='delivered');
            return (
              <div key={s} style={{ textAlign:'center' }}>
                <div style={{ width:28,height:28,borderRadius:14,margin:'0 auto 4px',display:'flex',alignItems:'center',justifyContent:'center',
                  background: done ? '#2E7D32' : active ? '#0063A3' : '#ddd', color:'#fff',fontSize:14 }}>
                  {done ? '✓' : active ? '●' : '○'}
                </div>
                <div style={{ fontSize:11,color: done ? '#2E7D32' : active ? '#0063A3' : '#888', fontWeight:active?700:400 }}>{s}</div>
              </div>
            );
          })}
        </div>

        {/* Documents panel */}
        {showDocs && (
          <div style={{ background:'#fff',borderRadius:8,padding:14,marginBottom:16,border:'1px solid #e0e0e0' }}>
            <div style={{ fontWeight:700,fontSize:13,color:'#003865',marginBottom:8 }}>Documents ({docs.length})</div>
            {docs.length === 0 && <div style={{ fontSize:12,color:'#888' }}>No documents</div>}
            {docs.map(d => (
              <div key={d.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid #f0f0f0',fontSize:12 }}>
                <span>{d.doc_type}: {d.file_name}</span>
                <a href={`http://localhost:5000${d.file_url}`} target="_blank" rel="noreferrer" style={{ color:'#0063A3',fontSize:11 }}>View</a>
              </div>
            ))}
          </div>
        )}

        {/* Stops */}
        {stops.map((stop, idx) => (
          <div key={stop.id||idx} style={{ background:'#fff',borderRadius:8,padding:14,marginBottom:12,border:'1px solid #e0e0e0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
              <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,color:'#fff',
                background: stop.stop_type==='shipper'||stop.stop_type==='pickup' ? '#0063A3' : '#2E7D32' }}>
                STOP {idx+1} — {(stop.stop_type||'').toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize:15,fontWeight:700,color:'#003865',marginBottom:4 }}>📍 {stop.company_name||'—'}</div>
            <div style={{ fontSize:13,color:'#444',marginBottom:4 }}>{[stop.address,stop.city,stop.state,stop.zip].filter(Boolean).join(', ')}</div>
            {stop.date && <div style={{ fontSize:12,color:'#666' }}>Date: {new Date(stop.date).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}</div>}
            {(stop.time_from||stop.time_to) && <div style={{ fontSize:12,color:'#666' }}>Time: {stop.time_from||''} - {stop.time_to||''}</div>}
            {(stop.pieces||stop.weight||stop.pallets) && <div style={{ fontSize:12,color:'#666' }}>
              {stop.pallets ? stop.pallets+' pallets' : ''}{stop.pieces ? ' | '+stop.pieces+' pcs' : ''}{stop.weight ? ' | '+Number(stop.weight).toLocaleString()+'lb' : ''}
            </div>}
            {stop.po_number && <div style={{ fontSize:12,color:'#666' }}>PO#: {stop.po_number}</div>}
            {stop.notes && <div style={{ fontSize:12,color:'#92400E',marginTop:4 }}>⚠️ {stop.notes}</div>}

            <button onClick={() => navigate(stop)} style={{...S.btn, background:'#0063A3',color:'#fff',marginTop:10}}>
              🗺 Navigate
            </button>

            {/* Action buttons */}
            <div style={{ display:'flex',gap:8,marginTop:4 }}>
              <button onClick={() => doEvent('arrival', stop.id)} disabled={!!actionLoading}
                style={{...S.btn, background:'#FFF7ED',color:'#92400E',border:'1px solid #FDE68A',flex:1}}>
                ✅ Arrived
              </button>
              <button onClick={() => doEvent('departure', stop.id)} disabled={!!actionLoading}
                style={{...S.btn, background:'#F0F4F8',color:'#003865',border:'1px solid #d0d5dd',flex:1}}>
                🚀 Departed
              </button>
            </div>

            {(stop.stop_type==='shipper'||stop.stop_type==='pickup') && (
              <button onClick={() => doEvent('pickup_done', stop.id)} disabled={!!actionLoading}
                style={{...S.btn, background:'#0063A3',color:'#fff'}}>
                ✅ Pickup Complete
              </button>
            )}

            {(stop.stop_type==='consignee'||stop.stop_type==='delivery') && (
              <>
                <button onClick={() => setShowPOD(true)}
                  style={{...S.btn, background:'#2E7D32',color:'#fff'}}>
                  ✍ Get Signature & POD
                </button>
              </>
            )}
          </div>
        ))}

        {/* Photo + Note buttons */}
        <div style={{ display:'flex',gap:8,marginBottom:16 }}>
          <label style={{...S.btn, background:'#fff',color:'#003865',border:'1px solid #d0d5dd',textAlign:'center',flex:1,cursor:'pointer'}}>
            📷 Take Photo
            <input type="file" accept="image/*" capture="environment" hidden onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData(); fd.append('photo', file);
              try { await driverApi.uploadPhoto(loadId, fd); alert('Photo uploaded'); fetch_(); } catch { alert('Upload failed'); }
            }} />
          </label>
          <button onClick={() => { const n = prompt('Add note:'); if(n) doEvent('note', null); }}
            style={{...S.btn, background:'#fff',color:'#003865',border:'1px solid #d0d5dd',flex:1}}>
            📝 Add Note
          </button>
        </div>

        {/* Event history */}
        {events.length > 0 && (
          <div style={{ background:'#fff',borderRadius:8,padding:14,border:'1px solid #e0e0e0' }}>
            <div style={{ fontWeight:700,fontSize:13,color:'#003865',marginBottom:8 }}>Activity</div>
            {events.slice(0,10).map(ev => (
              <div key={ev.id} style={{ fontSize:12,color:'#555',padding:'4px 0',borderBottom:'1px solid #f5f5f5' }}>
                ● {ev.event_type.replace(/_/g,' ')} — {new Date(ev.event_time).toLocaleString()}
                {ev.notes && <span style={{ color:'#888' }}> — {ev.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
