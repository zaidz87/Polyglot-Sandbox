import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function Navbar({ onLogin, onSignup }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: '64px',
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #7effa0, #5b8fff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#0a0a0f',
        }}>⬡</div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
          Polyglot<span style={{ color: '#7effa0' }}>Sandbox</span>
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isAuthenticated ? (
          <>
            <span style={{ fontSize: 13, color: '#7a7a9a', marginRight: 4 }}>{user?.email}</span>
            <button className="btn-primary" onClick={() => navigate('/editor')} style={{ padding: '8px 18px', fontSize: 13 }}>
              Open Editor
            </button>
            <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 13 }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={onLogin}>Log In</button>
            <button className="btn-primary" onClick={onSignup} style={{ padding: '9px 20px', fontSize: 14 }}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
