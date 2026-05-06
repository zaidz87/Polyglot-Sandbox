import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  initialTab?: 'login' | 'signup';
  onClose: () => void;
}

export default function AuthModal({ initialTab = 'login', onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { login } = useAuth();

  const reset = () => { setEmail(''); setPassword(''); setError(''); setSuccess(''); };

  const switchTab = (t: 'login' | 'signup') => { setTab(t); reset(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (tab === 'login') {
        const { data } = await axios.post('/auth/login', { email, password });
        login(data.token, data.email);
        onClose();
      } else {
        await axios.post('/auth/register', { email, password });
        setSuccess('Account created! Logging you in...');
        const { data } = await axios.post('/auth/login', { email, password });
        login(data.token, data.email);
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: '#7a7a9a',
          cursor: 'pointer', fontSize: 20, lineHeight: 1,
        }}>×</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
            {(['login', 'signup'] as const).map(t => (
              <button key={t} onClick={() => switchTab(t)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14,
                transition: 'background 0.2s, color 0.2s',
                background: tab === t ? '#1a1a28' : 'transparent',
                color: tab === t ? '#e8e8f0' : '#7a7a9a',
              }}>
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ color: '#7a7a9a', fontSize: 14, marginTop: 4 }}>
            {tab === 'login' ? 'Sign in to access the editor' : 'Start running code in seconds'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#a0a0c0' }}>
              Email
            </label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#a0a0c0' }}>
              Password
            </label>
            <input className="form-input" type="password" placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff6b9d' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(126,255,160,0.1)', border: '1px solid rgba(126,255,160,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#7effa0' }}>
              {success}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#7a7a9a', marginTop: 20 }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
            style={{ background: 'none', border: 'none', color: '#7effa0', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {tab === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
