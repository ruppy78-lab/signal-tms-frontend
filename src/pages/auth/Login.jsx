import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else setError(res.message);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '40px 36px',
        width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>Signal TMS</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label required">Email</label>
            <input name="email" type="email" className="form-input"
              value={form.email} onChange={handle} placeholder="you@company.com" required autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label required">Password</label>
            <input name="password" type="password" className="form-input"
              value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
