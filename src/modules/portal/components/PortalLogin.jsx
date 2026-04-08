import React, { useState } from 'react';
import api from '../../../shared/services/api';

export default function PortalLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/portal/login', { email, password });
      onLogin(res.data);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1C2B3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 40, width: 380, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1C2B3A' }}>Signal Transportation</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Customer Portal</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D9E0', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D9E0', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px', background: '#4D82B8', color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{loading ? 'Logging in...' : 'Log In'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#9CA3AF' }}>
          Contact your carrier for portal access
        </div>
      </div>
    </div>
  );
}
