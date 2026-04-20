import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { useLang } from '../contexts/LanguageContext';
import { BrandLogo } from '../components/Icons';
import type { UserRole } from '../types';

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

  const roles = [
    {
      role: 'tenant' as UserRole,
      label: 'Tenant',
      desc: 'Looking to rent a property',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V13h6v8" />
        </svg>
      ),
    },
    {
      role: 'owner' as UserRole,
      label: 'Property Owner',
      desc: 'Listing properties for rent',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <div style={S.page}>
      {/* Left branding panel */}
      <div style={S.leftPanel}>
        <div style={S.leftInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <BrandLogo size={36} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>TerraViser</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.3rem, 2.8vw, 1.8rem)', fontWeight: 800, lineHeight: 1.3, marginBottom: 14 }}>
            Start your journey today
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '0.92rem', lineHeight: 1.7 }}>
            Whether you're a tenant looking for a home or an owner managing properties, TerraViser has you covered.
          </p>
          <div style={{ marginTop: 36, padding: '20px 24px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ color: '#febb02', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              Why TerraViser?
            </div>
            {['No hidden fees', 'Direct landlord contact', 'Verified listings only'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.82)', fontSize: '0.86rem', marginBottom: 8 }}>
                <span style={{ color: '#e8600a', fontWeight: 700 }}>→</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={S.rightPanel}>
        <div style={S.card}>
          <h1 style={S.title}>Create your account</h1>
          <p style={S.sub}>Join TerraViser — find or manage properties</p>

          {error && (
            <div style={S.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required
                  style={{ paddingRight: 44 }}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={S.eyeBtn}>
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div className="form-group">
              <label className="form-label">I am a…</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {roles.map(opt => (
                  <button
                    key={opt.role} type="button"
                    onClick={() => setRole(opt.role)}
                    style={{
                      flex: 1, padding: '12px 10px', borderRadius: 6, cursor: 'pointer',
                      fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'all 0.15s', textAlign: 'left', border: '1.5px solid',
                      borderColor: role === opt.role ? '#003580' : '#d4d4d4',
                      background: role === opt.role ? '#eff6ff' : '#fff',
                      color: role === opt.role ? '#003580' : '#595959',
                    }}
                  >
                    <span style={{ color: role === opt.role ? '#003580' : '#a0a0a0', flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 1 }}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} style={S.submitBtn}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff' }} /> Creating account…</>
                : 'Create account'
              }
            </button>
          </form>

          <div style={S.dividerRow}><div style={S.dividerLine} /><span style={S.dividerText}>Already have an account?</span><div style={S.dividerLine} /></div>

          <Link
            to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            style={S.secondaryBtn}
          >
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'row' },
  leftPanel: {
    flex: '0 0 400px', background: 'linear-gradient(160deg, #002266 0%, #003580 55%, #00439c 100%)',
    display: 'flex', alignItems: 'center', padding: '48px 40px',
  },
  leftInner: { maxWidth: 340 },
  rightPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f2f2f2', padding: '40px 24px',
  },
  card: {
    background: '#fff', borderRadius: 8, padding: '36px 32px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid #e7e7e7',
  },
  title: { fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a', marginBottom: 5, letterSpacing: '-0.3px' },
  sub: { color: '#737373', fontSize: '0.85rem', marginBottom: 22 },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff0f0', color: '#cc0000',
    padding: '10px 14px', borderRadius: 6, fontSize: '0.85rem',
    marginBottom: 14, border: '1px solid #ffc2c2',
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
  dividerRow: { display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' },
  dividerLine: { flex: 1, height: 1, background: '#e7e7e7' },
  dividerText: { color: '#a0a0a0', fontSize: '0.78rem', whiteSpace: 'nowrap' },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '11px', borderRadius: 4,
    border: '1.5px solid #003580', color: '#003580',
    fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
    transition: 'all 0.15s', background: 'transparent',
    fontFamily: 'var(--font-body)',
  },
};
