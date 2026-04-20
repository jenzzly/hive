import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { BrandLogo } from '../components/Icons';

// Eye open/closed SVG icons
function EyeIcon({ open }: { open: boolean }) {
  if (open) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      await refreshProfile();
      navigate(redirect, { replace: true });
    } catch (err: any) {
      const code = err.code || '';
      if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
        setError('Invalid email or password. Please try again.');
      } else if (code.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Left panel — branding */}
      <div style={S.leftPanel}>
        <div style={S.leftInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <BrandLogo size={36} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>TerraViser</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
            Find your perfect home in Rwanda
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1rem', lineHeight: 1.65, maxWidth: 340 }}>
            Join thousands of tenants and property owners on Rwanda's most trusted rental platform.
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Verified property listings',
              'Direct owner communication',
              'Secure reservation process',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#e8600a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={S.rightPanel}>
        <div style={S.card}>
          <h1 style={S.title}>Welcome back</h1>
          <p style={S.sub}>Sign in to your TerraViser account</p>

          {error && (
            <div style={S.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={S.eyeBtn}>
                  <EyeIcon open={showPwd} />
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <Link to="/forgot-password" style={S.link}>{t('forgotPassword')}</Link>
              </div>
            </div>

            <button type="submit" disabled={loading} style={S.submitBtn}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff' }} /> Signing in…</>
                : t('signIn')
              }
            </button>
          </form>

          <div style={S.divider}><span>New to TerraViser?</span></div>

          <Link
            to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            style={S.secondaryBtn}
          >
            {t('getStarted')} — it's free
          </Link>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'row',
  },
  leftPanel: {
    flex: '0 0 420px', background: 'linear-gradient(160deg, #002266 0%, #003580 50%, #00439c 100%)',
    display: 'flex', alignItems: 'center', padding: '48px 40px',
  },
  leftInner: { maxWidth: 360 },
  rightPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f2f2f2', padding: '40px 24px',
  },
  card: {
    background: '#fff', borderRadius: 8, padding: '40px 36px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid #e7e7e7',
  },
  title: {
    fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a',
    marginBottom: 6, letterSpacing: '-0.3px',
  },
  sub: { color: '#737373', fontSize: '0.88rem', marginBottom: 24 },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff0f0', color: '#cc0000',
    padding: '10px 14px', borderRadius: 6, fontSize: '0.85rem',
    marginBottom: 16, border: '1px solid #ffc2c2',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#a0a0a0', display: 'flex', alignItems: 'center', padding: 0,
  },
  submitBtn: {
    width: '100%', padding: '12px', borderRadius: 4, border: 'none',
    background: '#0071c2', color: '#fff', fontSize: '0.95rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.15s', marginTop: 4,
    boxShadow: '0 1px 4px rgba(0,113,194,0.35)',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: '#a0a0a0', fontSize: '0.8rem', margin: '20px 0',
    textAlign: 'center',
  },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '11px', borderRadius: 4,
    border: '1.5px solid #003580', color: '#003580',
    fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
    transition: 'all 0.15s', background: 'transparent',
    fontFamily: 'var(--font-body)',
  },
  link: { color: '#0071c2', fontWeight: 600, fontSize: '0.82rem' },
};
