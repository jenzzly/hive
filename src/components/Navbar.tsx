import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { logoutUser } from '../services/authService';
import { subscribeToConversations } from '../services/messageService';
import type { Conversation } from '../types';

export default function Navbar() {
  const { userProfile } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    const role = userProfile.role === 'owner' || userProfile.role === 'admin' || userProfile.role === 'superAdmin'
      ? 'owner' : 'tenant';
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

          {/* ── Logo ── */}
          <Link to="/" style={S.logo}>
            <TerrraLogo />
            <span style={S.logoText}>
              Terr<span style={{ color: 'var(--terra-500)' }}>ra</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          {!isMobile && (
            <div style={S.centerLinks}>
              {allLinks.map(l => (
                <Link key={l.to} to={l.to}
                  style={{ ...S.link, ...(isActive(l.to) ? S.linkActive : {}), display: 'flex', alignItems: 'center', gap: 5 }}>
                  {l.label}
                  {(l.unread ?? 0) > 0 && (
                    <span style={S.unreadDot}>{l.unread}</span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* ── Right section ── */}
          <div style={S.rightSection}>
            {!isMobile && (
              userProfile ? (
                <AvatarMenu
                  name={userProfile.name}
                  role={userProfile.role}
                  unreadMessages={unreadMessages}
                  onLogout={handleLogout}
                  t={t}
                />
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

      {/* ── Mobile overlay ── */}
      {isMobile && menuOpen && (
        <div style={S.overlay} onClick={() => setMenuOpen(false)} />
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && (
        <div ref={drawerRef} style={{ ...S.drawer, transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
          {userProfile && (
            <div style={S.drawerUser}>
              <div style={S.drawerAvatar}>{userProfile.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{userProfile.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{userProfile.role}</div>
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
                  <span style={S.unreadDot}>{l.unread}</span>
                )}
              </Link>
            ))}

            {userProfile && (
              <>
                <Link to="/messages"
                  style={{ ...S.drawerLink, ...(isActive('/messages') ? S.drawerLinkActive : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => setMenuOpen(false)}>
                  <span>Messages</span>
                  {unreadMessages > 0 && <span style={S.unreadDot}>{unreadMessages}</span>}
                </Link>
                <Link to="/settings"
                  style={{ ...S.drawerLink, ...(isActive('/settings') ? S.drawerLinkActive : {}) }}
                  onClick={() => setMenuOpen(false)}>
                  {t('settings')}
                </Link>
              </>
            )}
          </div>

          <div style={S.drawerFooter}>
            {userProfile ? (
              <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                style={{ width: '100%', padding: '12px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--error)', fontFamily: 'var(--font-body)', borderRadius: 10 }}>
                {t('signOut')}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>{t('signIn')}</Link>
                <Link to="/register" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>{t('getStarted')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Avatar dropdown ──────────────────────────────────────────────────── */
function AvatarMenu({ name, role, unreadMessages, onLogout, t }: {
  name: string;
  role: string;
  unreadMessages: number;
  onLogout: () => void;
  t: (k: any) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={S.avatar}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
        {unreadMessages > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -3, background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 700, padding: '1px 4px', borderRadius: 8, lineHeight: 1.4 }}>
            {unreadMessages}
          </span>
        )}
      </button>

      {open && (
        <div style={S.dropdown}>
          <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 1 }}>{role}</div>
          </div>
          <Link to="/messages" onClick={() => setOpen(false)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', fontSize: '0.88rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <span>Messages</span>
            {unreadMessages > 0 && <span style={S.unreadDot}>{unreadMessages}</span>}
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)}
            style={{ display: 'block', padding: '9px 16px', fontSize: '0.88rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {t('settings')}
          </Link>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button onClick={() => { setOpen(false); onLogout(); }}
              style={{ width: '100%', padding: '9px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--error)', fontFamily: 'var(--font-body)' }}>
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Terrra logo mark: three terrain elevation lines ──────────────────── */
export function TerrraLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground bar */}
      <rect x="4" y="23" width="24" height="2.5" rx="1.25" fill="#7A4A20" opacity="0.3" />
      {/* Outer peak — darkest */}
      <path d="M4 22 L16 10 L28 22" stroke="#7A4A20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Mid layer */}
      <path d="M7 22 L16 14 L25 22" stroke="#B06B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Inner peak — lightest */}
      <path d="M10 22 L16 17 L22 22" stroke="#D4884A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  nav: {
    position: 'sticky', top: 0, zIndex: 200,
    background: 'rgba(253,250,246,0.95)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid var(--sand-200, #EDD5A8)',
    height: 'var(--nav-height)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 20px',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center', gap: 16,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.45rem',
    fontWeight: 500,
    color: 'var(--terra-800)',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  },
  centerLinks: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 },
  rightSection: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  link: {
    padding: '6px 12px', borderRadius: 8,
    fontSize: '0.87rem', fontWeight: 400,
    color: 'var(--text-secondary)',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  linkActive: {
    color: 'var(--terra-700)',
    background: 'var(--terra-100)',
    fontWeight: 500,
  },
  unreadDot: {
    background: '#ef4444', color: '#fff',
    fontSize: '0.58rem', fontWeight: 700,
    padding: '1px 5px', borderRadius: 10,
  },
  avatar: {
    position: 'relative',
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--terra-600)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)',
    transition: 'background 0.15s',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 12, boxShadow: 'var(--shadow-lg)',
    padding: '4px 0', minWidth: 196, zIndex: 300,
  },
  burger: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 8, display: 'flex', flexDirection: 'column', gap: 5,
  },
  bar: {
    display: 'block', width: 22, height: 2,
    background: 'var(--terra-700)', borderRadius: 2,
    transition: 'transform 0.25s, opacity 0.2s',
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(28,18,9,0.45)',
    zIndex: 198, backdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed', top: 'var(--nav-height)', right: 0, bottom: 0,
    width: 'min(300px, 82vw)',
    background: '#fff', zIndex: 199,
    boxShadow: '-4px 0 40px rgba(28,18,9,0.14)',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex', flexDirection: 'column', padding: 20, gap: 8,
  },
  drawerUser: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
    padding: '12px 14px',
    background: 'var(--terra-50, #FDFAF6)',
    borderRadius: 12,
    border: '1px solid var(--border)',
  },
  drawerAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--terra-600)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: '1rem', flexShrink: 0,
  },
  drawerLinks: { flex: 1, overflowY: 'auto' as const },
  drawerLink: {
    display: 'block', padding: '12px 14px', borderRadius: 10,
    fontSize: '0.95rem', color: 'var(--text-secondary)',
    transition: 'background 0.15s', marginBottom: 2,
    textDecoration: 'none',
  },
  drawerLinkActive: {
    background: 'var(--terra-100)',
    color: 'var(--terra-700)',
    fontWeight: 500,
  },
  drawerFooter: { paddingTop: 16, borderTop: '1px solid var(--border)' },
};