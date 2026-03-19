import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import { useLang } from '../contexts/LanguageContext';

export default function ForgotPassword() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage(t('resetEmailSent'));
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <HexLogo />
        <h1 style={S.title}>{t('resetPassword')}</h1>
        <p style={S.sub}>Enter your email to receive a password reset link</p>

        {error && (
          <div style={S.errorBox}>
            <span style={{ fontSize: '1rem' }}>⚠</span> {error}
          </div>
        )}

        {message && (
          <div style={S.successBox}>
            <span style={{ fontSize: '1rem' }}>✓</span> {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('email')}</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending...
              </>
            ) : (
              t('sendResetLink')
            )}
          </button>
        </form>

        <p style={S.footer}>
          <Link to="/login" style={S.link}>
            {t('backToLogin')}
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
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #04342C 0%, #0F6E56 100%)',
    padding: 24,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    color: 'var(--text-primary)',
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontSize: '0.9rem',
    marginBottom: 28,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: '0.88rem',
    marginBottom: 16,
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#dcfce7',
    color: '#15803d',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: '0.88rem',
    marginBottom: 16,
  },
  footer: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 20 },
  link: { color: 'var(--teal)', fontWeight: 500 },
};
