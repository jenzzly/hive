import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyResetCode, confirmNewPassword } from '../services/authService';
import { useToast } from '../hooks/useToast';

export default function AccountReset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or missing password reset code.');
      setVerifying(false);
      return;
    }

    const checkCode = async () => {
      try {
        const userEmail = await verifyResetCode(oobCode);
        setEmail(userEmail);
      } catch (err: any) {
        setError(err.message || 'The password reset link has expired or is invalid.');
      } finally {
        setVerifying(false);
      }
    };

    checkCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      show('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      show('Password must be at least 6 characters.', 'error');
      return;
    }
    if (!oobCode) return;

    setSubmitting(true);
    try {
      await confirmNewPassword(oobCode, newPassword);
      setSuccess(true);
      show('Password reset successful!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      show(err.message || 'Failed to reset password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div className="container page" style={{ maxWidth: 420, paddingTop: 100 }}>
      <ToastContainer />
      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 8, color: 'var(--terra-900)' }}>
          Reset Password
        </h1>
        
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>
              {error}
            </div>
            <Link to="/forgot-password" style={{ color: 'var(--terra-600)', fontSize: '0.9rem', fontWeight: 500 }}>
              Request a new link
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--terra-100)', color: 'var(--terra-700)', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>
              Your password has been successfully reset! Redirecting to login...
            </div>
            <Link to="/login" className="btn btn-primary w-full">Go to Login</Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 24 }}>
              Resetting password for <strong>{email}</strong>
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ marginTop: 8, width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
