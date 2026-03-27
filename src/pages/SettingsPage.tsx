import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { updateUserProfile } from '../services/userService';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useToast } from '../hooks/useToast';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
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
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="page-header" style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>{t('userSettings')}</h1>
          <p className="page-subtitle" style={{ fontSize: '1.05rem' }}>Manage your profile, preferences, and security.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)', gap: 24, alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Profile & Account Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Profile Overview Card */}
            <div className="card" style={{ padding: 32, textAlign: 'center', background: 'linear-gradient(145deg, #ffffff 0%, var(--surface) 100%)' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt={userProfile.name} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: 'var(--shadow)' }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '2.5rem', border: '3px solid #fff', boxShadow: 'var(--shadow)' }}>
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button 
                  type="button"
                  style={S.editAvatarBtn}
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  disabled={savingProfile}
                  title="Change photo"
                >
                  📷
                </button>
                <input 
                  id="avatar-input" 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setSavingProfile(true);
                    try {
                      const url = await uploadToCloudinary(f, 'profiles');
                      await updateUserProfile(userProfile.id, { photoURL: url });
                      await refreshProfile();
                      show(t('profileUpdated'));
                    } catch (err: any) {
                      show(err.message || 'Failed', 'error');
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: 4 }}>{userProfile.name}</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{userProfile.email}</div>
              <div style={{ marginTop: 12 }}><span className="badge badge-green" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 12px' }}>{userProfile.role}</span></div>
            </div>

            {/* Account Info Card */}
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ ...S.sectionTitle, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🛡️</span> Account Information
              </h2>
              <div style={S.infoGrid}>
                <InfoRow label="User ID" value={userProfile.id} mono />
                <InfoRow label="Member Since" value={new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow label="Platform Role" value={userProfile.role} />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Edit Profile Card */}
            <div className="card" style={{ padding: 32 }}>
              <h2 style={{ ...S.sectionTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✏️</span> {t('profileInformation')}
              </h2>
              <form onSubmit={handleSaveProfile} style={S.form}>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">{t('name')}</label>
                    <input className="form-input" style={{ background: 'var(--surface2)' }} value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('location')}</label>
                    <input className="form-input" style={{ background: 'var(--surface2)' }} value={locationVal} onChange={e => setLocationVal(e.target.value)} placeholder="e.g. Kigali, Rwanda" />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label">{t('language')}</label>
                  <div style={S.langRow}>
                    {LANGUAGES.map(l => (
                      <button key={l.code} type="button" style={{ ...S.langBtn, ...(selectedLang === l.code ? S.langBtnActive : {}) }} onClick={() => setSelectedLang(l.code)}>
                        <span style={S.langFlag}>{l.code === 'en' ? '🇬🇧' : l.code === 'fr' ? '🇫🇷' : '🇷🇼'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.native}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label">Default Currency</label>
                  <div style={S.langRow}>
                    {['USD', 'RWF'].map(c => (
                      <button key={c} type="button" style={{ ...S.langBtn, ...(selectedCurrency === c ? S.langBtnActive : {}) }} onClick={() => setSelectedCurrency(c)}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c}</span>
                          <span style={{ fontSize: '0.75rem', opacity: selectedCurrency === c ? 0.9 : 0.6 }}>{c === 'USD' ? 'US Dollar' : 'Rwandan Franc'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 20, borderTop: '1px dashed var(--border)' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px 20px', fontSize: '1rem' }} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>

            {/* Security / Password Card */}
            <div className="card" style={{ padding: 32 }}>
              <h2 style={{ ...S.sectionTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔒</span> {t('changePassword')}
              </h2>
              <form onSubmit={handleChangePassword} style={S.form}>
                {pwdError && <div style={S.error}>{pwdError}</div>}
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input className="form-input" style={{ background: 'var(--surface2)' }} type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required placeholder="••••••••" />
                </div>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">{t('newPassword')}</label>
                    <input className="form-input" style={{ background: 'var(--surface2)' }} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required placeholder="Min 6 characters" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('confirmPassword')}</label>
                    <input className="form-input" style={{ background: 'var(--surface2)' }} type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required placeholder="Repeat password" />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '12px 20px', fontSize: '1rem' }} disabled={savingPwd}>
                    {savingPwd ? 'Updating...' : t('changePassword')}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--surface2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all', textAlign: 'right', textTransform: mono ? 'none' : 'capitalize' }}>{value}</span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  editAvatarBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 30, height: 30, borderRadius: '50%',
    background: '#fff', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    transition: 'transform 0.2s',
  },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  langRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 },
  langBtn: {
    padding: '12px 16px',
    border: '1.5px solid var(--border)', borderRadius: 12,
    background: '#fff', cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)',
    color: 'var(--text-secondary)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  langBtnActive: {
    border: '1.5px solid var(--teal)',
    background: 'var(--teal-light)', color: 'var(--teal-dark)',
    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)'
  },
  langFlag: { fontSize: '1.4rem' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 500 },
  infoGrid: { display: 'flex', flexDirection: 'column' },
};
