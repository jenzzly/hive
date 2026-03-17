import { useState } from 'react';
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
      <div style={S.card}>
        <HexLogo />
        <h1 style={S.title}>Welcome back</h1>
        <p style={S.sub}>Sign in to your Hive account</p>

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
              <button type="button" onClick={() => setShowPwd(v => !v)} style={S.eyeBtn}>
                {showPwd ? '🙈' : '👁'}
              </button>
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
      <svg width="48" height="48" viewBox="0 0 28 28" fill="none" style={{ margin: '0 auto 8px' }}>
        <polygon points="14,2 24,7.5 24,20.5 14,26 4,20.5 4,7.5" stroke="#1D9E75" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <polygon points="14,7 20,10.5 20,17.5 14,21 8,17.5 8,10.5" stroke="#1D9E75" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.5" />
        <polygon points="14,11 17,12.75 17,16.25 14,18 11,16.25 11,12.75" fill="#1D9E75" />
      </svg>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teal-deeper)' }}>Hive</div>
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
