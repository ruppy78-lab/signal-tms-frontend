import React, { useState } from 'react';
import { driverApi } from './api';

export default function DriverLogin({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await driverApi.login(phone.replace(/\D/g, ''), pin);
      localStorage.setItem('driver_token', res.data.token);
      localStorage.setItem('driver_info', JSON.stringify(res.data.driver));
      onLogin(res.data.driver);
    } catch (err) {
      setError(err.message || 'Invalid phone or PIN');
    }
    setLoading(false);
  };

  const S = {
    page: { minHeight:'100vh',background:'#003865',display:'flex',alignItems:'center',justifyContent:'center',padding:20 },
    card: { background:'#fff',borderRadius:12,padding:32,width:'100%',maxWidth:380,boxShadow:'0 8px 40px rgba(0,0,0,0.3)' },
    logo: { textAlign:'center',marginBottom:24 },
    title: { fontSize:22,fontWeight:800,color:'#003865',margin:0 },
    sub: { fontSize:13,color:'#666',marginTop:4 },
    label: { display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:4,marginTop:16 },
    input: { width:'100%',padding:'12px 14px',border:'1px solid #d0d5dd',borderRadius:8,fontSize:16,boxSizing:'border-box',outline:'none' },
    btn: { width:'100%',padding:14,border:'none',borderRadius:8,background:'#003865',color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',marginTop:20 },
    err: { color:'#B71C1C',fontSize:13,marginTop:12,textAlign:'center' },
    help: { textAlign:'center',fontSize:12,color:'#888',marginTop:20 },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={{ fontSize:40 }}>🚛</div>
          <h1 style={S.title}>Signal Transportation</h1>
          <div style={S.sub}>Driver Portal</div>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={S.label}>Phone Number</label>
          <input style={S.input} type="tel" placeholder="778-663-5001" value={phone}
            onChange={e => setPhone(e.target.value)} autoComplete="tel" />
          <label style={S.label}>PIN</label>
          <input style={S.input} type="password" inputMode="numeric" placeholder="••••" maxLength={6}
            value={pin} onChange={e => setPin(e.target.value)} autoComplete="current-password" />
          {error && <div style={S.err}>{error}</div>}
          <button style={{...S.btn, opacity: loading ? 0.7 : 1}} disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={S.help}>Having trouble? Call: <b>778-663-5001</b></div>
      </div>
    </div>
  );
}
