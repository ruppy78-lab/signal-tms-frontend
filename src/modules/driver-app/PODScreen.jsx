import React, { useRef, useState, useEffect } from 'react';
import { driverApi } from './api';

export default function PODScreen({ load, onDone, onBack }) {
  const canvasRef = useRef(null);
  const [signing, setSigning] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#003865';
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setSigning(true);
    const ctx = canvasRef.current.getContext('2d');
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (e) => {
    if (!signing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const endDraw = () => setSigning(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = async () => {
    if (!firstName) { alert('Signer name required'); return; }
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const fd = new FormData();
      fd.append('signature', blob, 'signature.png');
      fd.append('signer_name', firstName);
      fd.append('signer_last_name', lastName);
      fd.append('notes', notes);
      await driverApi.savePOD(load.id, fd);
      alert('POD saved successfully!');
      onDone();
    } catch (e) { alert(e.message || 'Failed to save POD'); }
    setSaving(false);
  };

  const stops = load?.stops || [];
  const delivery = stops.find(s => s.stop_type === 'consignee' || s.stop_type === 'delivery') || {};

  const S = {
    header: { background:'#003865',color:'#fff',padding:'10px 16px',display:'flex',alignItems:'center',gap:10 },
    section: { padding:16 },
    label: { fontSize:12,fontWeight:600,color:'#555',marginBottom:4,display:'block' },
    input: { width:'100%',padding:'10px 12px',border:'1px solid #d0d5dd',borderRadius:8,fontSize:15,boxSizing:'border-box' },
    btn: { padding:'14px 20px',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer',width:'100%' },
  };

  return (
    <div style={{ minHeight:'100vh',background:'#F0F4F8' }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:18 }}>←</button>
        <span style={{ fontWeight:700 }}>Proof of Delivery — {load?.load_number}</span>
      </div>

      <div style={S.section}>
        {/* Delivery info */}
        <div style={{ background:'#fff',borderRadius:8,padding:14,marginBottom:16,border:'1px solid #e0e0e0' }}>
          <div style={{ fontSize:13,color:'#666' }}>Delivered to:</div>
          <div style={{ fontSize:16,fontWeight:700,color:'#003865' }}>{delivery.company_name || load?.dest_name || '—'}</div>
          <div style={{ fontSize:13,color:'#444' }}>{[delivery.address,delivery.city,delivery.state,delivery.zip].filter(Boolean).join(', ')}</div>
          <div style={{ fontSize:12,color:'#666',marginTop:4 }}>
            {load?.total_pallets ? load.total_pallets+' pallets' : ''}{load?.total_weight ? ' | '+Number(load.total_weight).toLocaleString()+'lb' : ''}
          </div>
        </div>

        <div style={{ fontSize:13,color:'#333',marginBottom:12,fontStyle:'italic' }}>
          "The above goods have been received in good condition."
        </div>

        {/* Signature canvas */}
        <div style={{ background:'#fff',borderRadius:8,border:'2px solid #003865',marginBottom:12,position:'relative' }}>
          <canvas ref={canvasRef}
            style={{ width:'100%',height:180,touchAction:'none',cursor:'crosshair' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
          <button onClick={clearCanvas} style={{ position:'absolute',bottom:6,right:6,background:'#f0f0f0',border:'1px solid #ccc',borderRadius:4,padding:'4px 10px',fontSize:11,cursor:'pointer' }}>Clear</button>
        </div>

        <label style={S.label}>Signer First Name *</label>
        <input style={{...S.input, marginBottom:10}} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />

        <label style={S.label}>Signer Last Name</label>
        <input style={{...S.input, marginBottom:10}} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />

        <label style={S.label}>Notes (optional)</label>
        <textarea style={{...S.input, minHeight:60, marginBottom:16}} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." />

        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onBack} style={{...S.btn, background:'#fff',color:'#003865',border:'1px solid #d0d5dd',flex:1}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{...S.btn, background:'#2E7D32',color:'#fff',flex:2,opacity:saving?0.7:1}}>
            {saving ? 'Saving...' : 'Save POD ✅'}
          </button>
        </div>
      </div>
    </div>
  );
}
