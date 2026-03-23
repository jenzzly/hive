import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { updateUserProfile } from '../services/userService';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useToast } from '../hooks/useToast';
import type { Language } from '../types';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'rw', label: 'Kinyarwanda', native: 'Kinyarwanda' },
];

export default function SettingsPage() {
  const { userProfile, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useLang();
  const { show, ToastContainer } = useToast();

  const [name, setName] = useState(userProfile?.name || '');
  const [locationVal, setLocationVal] = useState(userProfile?.location || '');
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(userProfile?.currency || 'USD');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  if (!userProfile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserProfile(userProfile.id, { 
        name, 
        location: locationVal, 
        language: selectedLang,
        currency: selectedCurrency as any
      });
      setLanguage(selectedLang);
      await refreshProfile();
      show(t('profileUpdated'));
    } catch (err: any) {
      show(err.message || 'Failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (newPwd.length < 6) { setPwdError('Password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }
    setSavingPwd(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Not authenticated');
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      show(t('passwordUpdated'));
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : err.message || 'Failed to update password.';
      setPwdError(msg);
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="container page">
      <ToastContainer />
      <div style={{ maxWidth: 640 }}>
        <div className="page-header">
          <h1 className="page-title">{t('userSettings')}</h1>
          <p className="page-subtitle">Manage your profile, language and password.</p>
        </div>

        {/* Profile card */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={S.cardHeader}>
            <div style={S.bigAvatar}>{userProfile.name.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{userProfile.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{userProfile.email}</div>
              <span className="badge badge-green" style={{ marginTop: 6, textTransform: 'capitalize' }}>{userProfile.role}</span>
            </div>
          </div>

          <hr className="divider" />

          <h2 style={S.sectionTitle}>Profile Information</h2>
          <form onSubmit={handleSaveProfile} style={S.form}>
            <div className="form-group">
              <label className="form-label">{t('name')}</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t('location')}</label>
              <input
                className="form-input"
                value={locationVal}
                onChange={e => setLocationVal(e.target.value)}
                placeholder="e.g. Kigali, Rwanda"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('language')}</label>
              <div style={S.langRow}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    type="button"
                    style={{ ...S.langBtn, ...(selectedLang === l.code ? S.langBtnActive : {}) }}
                    onClick={() => setSelectedLang(l.code)}
                  >
                    <span style={S.langFlag}>{l.code === 'en' ? '🇬🇧' : l.code === 'fr' ? '🇫🇷' : '🇷🇼'}</span>
                    <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{l.native}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <div style={S.langRow}>
                {['USD', 'RWF'].map(c => (
                  <button
                    key={c}
                    type="button"
                    style={{ ...S.langBtn, ...(selectedCurrency === c ? S.langBtnActive : {}) }}
                    onClick={() => setSelectedCurrency(c)}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c}</span>
                    <span style={{ fontSize: '0.82rem', opacity: 0.7 }}>{c === 'USD' ? 'US Dollar' : 'Rwandan Franc'}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : t('saveChanges')}
            </button>
          </form>
        </div>

        {/* Password card */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={S.sectionTitle}>{t('changePassword')}</h2>
          <form onSubmit={handleChangePassword} style={S.form}>
            {pwdError && <div style={S.error}>{pwdError}</div>}
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('newPassword')}</label>
              <input className="form-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('confirmPassword')}</label>
              <input className="form-input" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required placeholder="Repeat new password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPwd}>
              {savingPwd ? 'Updating...' : t('changePassword')}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={S.sectionTitle}>Account Info</h2>
          <div style={S.infoGrid}>
            <InfoRow label="User ID" value={userProfile.id} mono />
            <InfoRow label="Email" value={userProfile.email} />
            <InfoRow label="Role" value={userProfile.role} />
            <InfoRow label="Member since" value={new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all', textAlign: 'right', textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  cardHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 },
  bigAvatar: {
    width: 60, height: 60, borderRadius: '50%',
    background: 'var(--teal)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1.5rem', flexShrink: 0,
  },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  langRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  langBtn: {
    flex: 1, minWidth: 120, padding: '12px 14px',
    border: '1.5px solid var(--border-strong)', borderRadius: 10,
    background: '#fff', cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)',
    color: 'var(--text-secondary)', transition: 'all 0.15s',
  },
  langBtnActive: {
    border: '1.5px solid var(--teal)',
    background: 'var(--teal-light)', color: 'var(--teal-dark)',
  },
  langFlag: { fontSize: '1.2rem' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem' },
  infoGrid: { display: 'flex', flexDirection: 'column' },
};
