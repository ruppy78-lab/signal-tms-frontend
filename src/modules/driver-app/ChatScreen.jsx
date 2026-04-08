import React, { useState, useEffect, useRef } from 'react';
import { driverApi } from './api';

export default function ChatScreen({ loadId, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMsgs = async () => {
    try {
      const res = await driverApi.getMessages(loadId);
      setMsgs(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 30000);
    return () => clearInterval(interval);
  }, [loadId]); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await driverApi.sendMessage(loadId, text.trim());
      setText('');
      await fetchMsgs();
    } catch { alert('Failed to send'); }
    setSending(false);
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100vh',background:'#F0F4F8' }}>
      {/* Header */}
      <div style={{ background:'#003865',color:'#fff',padding:'10px 16px',display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:18 }}>←</button>
        <span style={{ fontWeight:700 }}>💬 Chat — Dispatcher</span>
      </div>

      {/* Messages */}
      <div style={{ flex:1,overflowY:'auto',padding:16 }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display:'flex',justifyContent: m.sender_type==='driver' ? 'flex-end' : 'flex-start',marginBottom:8 }}>
            <div style={{
              maxWidth:'75%',padding:'10px 14px',borderRadius:12,fontSize:14,
              background: m.sender_type==='driver' ? '#003865' : '#fff',
              color: m.sender_type==='driver' ? '#fff' : '#333',
              border: m.sender_type==='driver' ? 'none' : '1px solid #e0e0e0',
            }}>
              <div>{m.message}</div>
              <div style={{ fontSize:10,marginTop:4,opacity:0.7 }}>
                {new Date(m.created_at).toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit'})}
                {m.sender_type==='driver' && m.read_at && ' ✓✓'}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:12,background:'#fff',borderTop:'1px solid #e0e0e0',display:'flex',gap:8,flexShrink:0 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key==='Enter' && send()}
          placeholder="Type message..." style={{ flex:1,padding:'10px 14px',border:'1px solid #d0d5dd',borderRadius:20,fontSize:14,outline:'none' }} />
        <button onClick={send} disabled={sending||!text.trim()}
          style={{ padding:'10px 16px',border:'none',borderRadius:20,background:'#003865',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer' }}>
          Send
        </button>
      </div>
    </div>
  );
}
