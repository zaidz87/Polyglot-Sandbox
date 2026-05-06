import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';

const LANGS = [
  { label: 'Python',   icon: '🐍' },
  { label: 'Node.js',  icon: '⬡' },
  { label: 'Java',     icon: '☕' },
  { label: 'Go',       icon: '🐹' },
  { label: 'C++',      icon: '⚙️' },
];

const FEATURES = [
  { icon: '🔒', color: '#7effa0', bg: 'rgba(126,255,160,0.08)', title: 'Isolated Execution', desc: 'Every run spins up a fresh Docker container with zero network access, preventing any data leakage or lateral movement.' },
  { icon: '🌐', color: '#5b8fff', bg: 'rgba(91,143,255,0.08)',  title: '5 Languages',       desc: 'Python, Node.js, Java, Go, and C++ — all running in pre-built Alpine images with non-root security hardening.' },
  { icon: '⚡', color: '#ff6b9d', bg: 'rgba(255,107,157,0.08)', title: 'Rate Limited',       desc: 'Redis-powered atomic counters enforce 10 requests/minute per IP, protecting the infrastructure from abuse.' },
  { icon: '🔑', color: '#7effa0', bg: 'rgba(126,255,160,0.08)', title: 'JWT Secured',        desc: 'Register and log in with bcrypt-hashed passwords. Every execution request is authenticated via signed Bearer tokens.' },
];

const STEPS = [
  { num: '01', color: '#7effa0', bg: 'rgba(126,255,160,0.1)', title: 'Write Code',   desc: 'Choose your language and write code in the Monaco-powered editor with full syntax highlighting.' },
  { num: '02', color: '#5b8fff', bg: 'rgba(91,143,255,0.1)',  title: 'Click Run',    desc: 'Hit the glowing Run button. Your code is sent securely to the API with your JWT Bearer token.' },
  { num: '03', color: '#ff6b9d', bg: 'rgba(255,107,157,0.1)', title: 'See Output',   desc: 'Docker executes your code in an isolated sandbox and streams the result back in under a second.' },
];

export default function Home() {
  const [modal, setModal] = useState<null | 'login' | 'signup'>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handlePlayground = () => {
    if (isAuthenticated) navigate('/editor');
    else setModal('signup');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar onLogin={() => setModal('login')} onSignup={() => setModal('signup')} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-grid-bg" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '100px 24px 80px',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(91,143,255,0.12) 0%, transparent 70%), radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: 'auto, 28px 28px',
      }}>
        {/* Badge */}
        <div style={{ marginBottom: 32 }}>
          <span className="pulse-badge">
            <span className="dot" />
            ⚡ Open Source · Free Forever
          </span>
        </div>

        {/* Hero heading */}
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 24, maxWidth: 900 }}>
          <span className="text-green">Code.</span>{' '}
          <span className="text-blue">Run.</span>{' '}
          <span className="text-pink">Anywhere.</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#7a7a9a', maxWidth: 540, lineHeight: 1.65, marginBottom: 40 }}>
          A containerized code execution engine. Write Python, Node.js, Java, Go, or C++ — and run it safely inside isolated Docker sandboxes in milliseconds.
        </p>

        {/* Language tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 44 }}>
          {LANGS.map(l => (
            <span key={l.label} className="lang-pill">
              {l.icon} {l.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button className="btn-primary" onClick={handlePlayground} style={{ fontSize: 16, padding: '15px 36px' }}>
          Open Playground →
        </button>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            BUILT FOR SECURITY
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
            Enterprise-grade sandboxing
          </h2>
          <p style={{ color: '#7a7a9a', marginTop: 12, fontSize: 16 }}>
            Every layer of the stack is designed to safely execute untrusted code.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: '#7a7a9a', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 100px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              HOW IT WORKS
            </p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
              From code to output in three steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, position: 'relative' }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div className="step-number" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40`, fontFamily: 'var(--mono)', fontSize: 14 }}>
                  {s.num}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: '#7a7a9a', fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 20,
                    left: `calc(${(i + 1) * 33.33}% - 20px)`,
                    color: '#333', fontSize: 20, display: 'none',
                  }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div style={{ textAlign: 'center', marginTop: 64 }}>
            <button className="btn-primary" onClick={handlePlayground} style={{ fontSize: 16, padding: '14px 36px' }}>
              {isAuthenticated ? 'Go to Editor →' : 'Get Started Free →'}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ padding: '28px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>⬡ Polyglot<span style={{ color: '#7effa0' }}>Sandbox</span></span>
        <span style={{ color: '#4a4a6a', fontSize: 13 }}>Built with TypeScript · Express · Docker · Redis · React</span>
      </footer>

      {/* ── AUTH MODAL ───────────────────────────────────────── */}
      {modal && <AuthModal initialTab={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
