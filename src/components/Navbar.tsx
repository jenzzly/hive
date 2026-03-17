import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { logoutUser } from '../services/authService';
import { subscribeToConversations } from '../services/messageService';
import type { Conversation } from '../types';

export default function Navbar() {
  const { userProfile } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Real-time unread message count
  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'owner' && userProfile.role !== 'tenant' && userProfile.role !== 'admin' && userProfile.role !== 'superAdmin')) return;
    const role = userProfile.role === 'tenant' ? 'tenant' : 'owner';
    const unsub = subscribeToConversations(userProfile.id, role, (convs: Conversation[]) => {
      const total = convs.reduce((sum: number, c: Conversation) =>
        sum + (role === 'owner' ? c.unreadOwner : c.unreadTenant), 0);
      setUnreadMessages(total);
    });
    return unsub;
  }, [userProfile]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const roleLinks = () => {
    const r = userProfile?.role;
    if (r === 'superAdmin') return [
      { to: '/super-admin', label: t('superAdmin') },
      { to: '/dashboard', label: t('dashboard') },
      { to: '/platform-analytics', label: 'Analytics' },
    ];
    if (r === 'admin') return [
      { to: '/admin', label: t('admin') },
      { to: '/dashboard', label: t('dashboard') },
      { to: '/platform-analytics', label: 'Analytics' },
    ];
    if (r === 'owner') return [
      { to: '/dashboard', label: t('dashboard') },
      { to: '/analytics', label: 'Analytics' },
      { to: '/contracts', label: t('contracts') },
      { to: '/maintenance', label: t('maintenance') },
    ];
    if (r === 'tenant') return [
      { to: '/my-property', label: t('myProperty') },
      { to: '/contracts', label: t('contracts') },
      { to: '/maintenance', label: t('maintenance') },
    ];
    return [];
  };

  const allLinks = [{ to: '/', label: t('browse'), unread: 0 }, ...roleLinks()];

  return (
    <>
      <nav style={S.nav}>
        <div style={S.inner}>
          {/* LEFT — Logo */}
          <Link to="/" style={S.logo}>
            <HexIcon />
            <span style={S.logoText}>Hive</span>
          </Link>

          {/* CENTER — Desktop nav */}
          {!isMobile && (
            <div style={S.centerLinks}>
              {allLinks.map(l => (
                <Link key={l.to} to={l.to}
                  style={{ ...S.link, ...(isActive(l.to) ? S.linkActive : {}), display: 'flex', alignItems: 'center', gap: 5 }}>
                  {l.label}
                  {(l.unread ?? 0) > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>
                      {l.unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* RIGHT — Auth + Settings */}
          <div style={S.rightSection}>
            {!isMobile && (
              userProfile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AvatarMenu name={userProfile.name} role={userProfile.role} unreadMessages={unreadMessages} onLogout={handleLogout} t={t} />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to="/login" className="btn btn-ghost btn-sm">{t('signIn')}</Link>
                  <Link to="/register" className="btn btn-primary btn-sm">{t('getStarted')}</Link>
                </div>
              )
            )}

            {isMobile && (
              <button onClick={() => setMenuOpen(o => !o)} style={S.burger} aria-label="Menu">
                <span style={{ ...S.bar, transform: menuOpen ? 'rotate(45deg) translate(0,7px)' : 'none' }} />
                <span style={{ ...S.bar, opacity: menuOpen ? 0 : 1 }} />
                <span style={{ ...S.bar, transform: menuOpen ? 'rotate(-45deg) translate(0,-7px)' : 'none' }} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobile && menuOpen && <div style={S.overlay} onClick={() => setMenuOpen(false)} />}

      {isMobile && (
        <div ref={drawerRef} style={{ ...S.drawer, transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
          {userProfile && (
            <div style={S.drawerUser}>
              <div style={S.drawerAvatar}>{userProfile.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{userProfile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{userProfile.role}</div>
              </div>
            </div>
          )}

          <div style={S.drawerLinks}>
            {allLinks.map(l => (
              <Link key={l.to} to={l.to}
                style={{ ...S.drawerLink, ...(isActive(l.to) ? S.drawerLinkActive : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setMenuOpen(false)}>
                <span>{l.label}</span>
                {(l.unread ?? 0) > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                    {l.unread}
                  </span>
                )}
              </Link>
            ))}
            {userProfile && (
              <>
                <Link to="/messages"
                  style={{ ...S.drawerLink, ...(isActive('/messages') ? S.drawerLinkActive : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => setMenuOpen(false)}>
                  <span>✉ Messages</span>
                  {unreadMessages > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link to="/settings"
                  style={{ ...S.drawerLink, ...(isActive('/settings') ? S.drawerLinkActive : {}) }}
                  onClick={() => setMenuOpen(false)}>
                  ⚙ {t('settings')}
                </Link>
              </>
            )}
          </div>

          <div style={S.drawerFooter}>
            {userProfile ? (
              <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
                {t('signOut')}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/login" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>{t('signIn')}</Link>
                <Link to="/register" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>{t('getStarted')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AvatarMenu({ name, role, unreadMessages, onLogout, t }: { name: string; role: string; unreadMessages: number; onLogout: () => void; t: (k: any) => string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <div style={{ ...S.avatar, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        {name.charAt(0).toUpperCase()}
        {unreadMessages > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />
        )}
      </div>
      {open && (
        <div style={S.dropdown}>
          <div style={{ padding: '4px 16px 2px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{name}</div>
          <div style={{ padding: '0 16px 10px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 4px' }} />
          <Link to="/messages" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', fontSize: '0.88rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <span>✉ Messages</span>
            {unreadMessages > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>
                {unreadMessages}
              </span>
            )}
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)} style={{ display: 'block', padding: '8px 16px', fontSize: '0.88rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ⚙ {t('settings')}
          </Link>
          <button onClick={() => { setOpen(false); onLogout(); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', color: '#b91c1c', fontFamily: 'var(--font-body)' }}>
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

function HexIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 24,7.5 24,20.5 14,26 4,20.5 4,7.5" stroke="#1D9E75" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <polygon points="14,7 20,10.5 20,17.5 14,21 8,17.5 8,10.5" stroke="#1D9E75" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.5" />
      <polygon points="14,11 17,12.75 17,16.25 14,18 11,16.25 11,12.75" fill="#1D9E75" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: 'sticky', top: 0, zIndex: 200,
    background: 'rgba(247,253,251,0.94)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)', height: 'var(--nav-height)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 20px',
    height: '100%', display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center', gap: 16,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teal-deeper)', letterSpacing: '-0.5px' },
  centerLinks: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 },
  rightSection: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  link: { padding: '6px 12px', borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 400, transition: 'all 0.15s', whiteSpace: 'nowrap' },
  linkActive: { color: 'var(--teal)', background: 'var(--teal-light)', fontWeight: 500 },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, color: 'var(--text-secondary)', transition: 'all 0.15s', cursor: 'pointer', textDecoration: 'none' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  dropdown: { position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: '10px 0', minWidth: 190, zIndex: 300 },
  burger: { background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 },
  bar: { display: 'block', width: 22, height: 2, background: 'var(--text-primary)', borderRadius: 2, transition: 'transform 0.25s, opacity 0.2s' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 198, backdropFilter: 'blur(2px)' },
  drawer: { position: 'fixed', top: 'var(--nav-height)', right: 0, bottom: 0, width: 'min(300px, 82vw)', background: '#fff', zIndex: 199, boxShadow: '-4px 0 32px rgba(0,0,0,0.15)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column', padding: 20, gap: 8 },
  drawerUser: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 12 },
  drawerAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  drawerLink: { display: 'block', padding: '12px 14px', borderRadius: 10, fontSize: '0.95rem', color: 'var(--text-secondary)', transition: 'background 0.15s', marginBottom: 2 },
  drawerLinkActive: { background: 'var(--teal-light)', color: 'var(--teal)', fontWeight: 500 },
  drawerFooter: { paddingTop: 16, borderTop: '1px solid var(--border)' },
  drawerLinks: { flex: 1, overflowY: 'auto' as const },
};
