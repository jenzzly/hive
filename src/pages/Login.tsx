import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState<boolean>(false);
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
      <div style={S.card}>
        <HexLogo />
        <h1 style={S.title}>Welcome back</h1>
        <p style={S.sub}>Sign in to your Terra account</p>

        {error && (
          <div style={S.errorBox}>
            <span style={{ fontSize: '1rem' }}>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('email')}</label>
            <input
              className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
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
              <button type="button" onClick={() => setShowPwd((v: boolean) => !v)} style={S.eyeBtn}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 4 }}>
              <Link to="/forgot-password" style={{ ...S.link, fontSize: '0.85rem' }}>
                {t('forgotPassword')}
              </Link>
            </div>
          </div>
          <button
            type="submit" className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in...</>
              : t('signIn')
            }
          </button>
        </form>

        <p style={S.footer}>
          Don't have an account?{' '}
          <Link to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={S.link}>
            {t('getStarted')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function HexLogo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
        <path d="M14 0L28 8V24L14 32L0 24V8L14 0Z" fill="var(--teal)" />
        <path d="M14 6L22 11V21L14 26L6 21V11L14 6Z" fill="white" opacity="0.3" />
      </svg>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teal-deeper)' }}>Terra</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #04342C 0%, #0F6E56 100%)', padding: 24,
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '40px 36px',
    width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-primary)', textAlign: 'center', marginBottom: 6 },
  sub: { color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', marginBottom: 28 },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fee2e2', color: '#b91c1c',
    padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 4,
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0,
  },
  footer: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 20 },
  link: { color: 'var(--teal)', fontWeight: 500 },
};
