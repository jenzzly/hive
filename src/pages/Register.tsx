import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { useLang } from '../contexts/LanguageContext';
import type { UserRole } from '../types';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<UserRole>('tenant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await registerUser(email, password, name, role);
      navigate(redirect, { replace: true });
    } catch (err: any) {
      const code = err.code || '';
      if (code.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <HexLogo />
        <h1 style={S.title}>Create your account</h1>
        <p style={S.sub}>Join Hive — find or manage properties</p>

        {error && (
          <div style={S.errorBox}><span>⚠</span> {error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('name')}</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('email')}</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters" required
                style={{ paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={S.eyeBtn}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div style={S.roleRow}>
              {([
                { role: 'tenant' as UserRole, emoji: '🏠', label: 'Tenant', desc: 'Looking to rent' },
                { role: 'owner' as UserRole, emoji: '🔑', label: 'Property Owner', desc: 'Listing properties' },
              ]).map(opt => (
                <button
                  key={opt.role} type="button"
                  style={{ ...S.roleBtn, ...(role === opt.role ? S.roleBtnActive : {}) }}
                  onClick={() => setRole(opt.role)}
                >
                  <span style={{ fontSize: '1.4rem' }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 1 }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit" className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account...</>
              : 'Create account'
            }
          </button>
        </form>

        <p style={S.footer}>
          Already have an account?{' '}
          <Link to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={S.link}>
            {t('signIn')}
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
    background: '#fff', borderRadius: 20, padding: '36px 32px',
    width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: 'var(--text-primary)', textAlign: 'center', marginBottom: 6 },
  sub: { color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.88rem', marginBottom: 28 },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fee2e2', color: '#b91c1c',
    padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 4,
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0,
  },
  roleRow: { display: 'flex', gap: 10 },
  roleBtn: {
    flex: 1, padding: '12px 10px',
    border: '1.5px solid var(--border-strong)', borderRadius: 10,
    background: '#fff', cursor: 'pointer',
    fontFamily: 'var(--font-body)', color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', gap: 10,
    transition: 'all 0.15s', textAlign: 'left',
  },
  roleBtnActive: {
    border: '1.5px solid var(--teal)', background: 'var(--teal-light)', color: 'var(--teal-dark)',
  },
  footer: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 20 },
  link: { color: 'var(--teal)', fontWeight: 500 },
};
