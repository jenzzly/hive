import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { logoutUser } from '../services/authService';
import { subscribeToConversations } from '../services/messageService';
import type { Conversation } from '../types';

function HexIcon() {
  return (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
      <path d="M14 0L28 8V24L14 32L0 24V8L14 0Z" fill="var(--teal)" />
      <path d="M14 6L22 11V21L14 26L6 21V11L14 6Z" fill="white" opacity="0.3" />
    </svg>
  );
}

function AvatarMenu({ name, role, photoURL, unreadMessages, onLogout, t }: {
  name: string; role: string; photoURL?: string; unreadMessages: number; onLogout: () => void; t: (k: any) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px 6px 6px', borderRadius: 24,
        background: open ? 'var(--surface2)' : 'transparent',
        border: '1.5px solid var(--border-strong)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
        {photoURL ? (
          <img src={photoURL} alt={name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--teal)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {unreadMessages > 0 && (
          <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>
            {unreadMessages}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: 'var(--shadow-lg)',
          minWidth: 180, zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{role}</div>
          </div>
          {unreadMessages > 0 && (
            <button onClick={() => { navigate('/messages'); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '11px 16px', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: '0.9rem',
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
            }}>
              <span>💬 Messages</span>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>{unreadMessages}</span>
            </button>
          )}
          <button onClick={() => { navigate('/settings'); setOpen(false); }} style={{
            display: 'block', width: '100%', padding: '11px 16px', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: '0.9rem',
            color: 'var(--text-primary)', textAlign: 'left', fontFamily: 'var(--font-body)',
          }}>
            ⚙️ {t('settings')}
          </button>
          <button onClick={onLogout} style={{
            display: 'block', width: '100%', padding: '11px 16px', background: 'none',
            borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.9rem',
            color: '#b91c1c', textAlign: 'left', fontFamily: 'var(--font-body)',
          }}>
            🚪 {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(247,253,251,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    height: 'var(--nav-height)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    height: '100%', display: 'flex', alignItems: 'center',
    gap: 24,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-primary)',
    flexShrink: 0,
  },
  logoText: { color: 'var(--teal-dark)' },
  centerLinks: {
    display: 'flex', alignItems: 'center', gap: 2, flex: 1,
  },
  link: {
    padding: '6px 12px', borderRadius: 8, fontSize: '0.9rem',
    color: 'var(--text-secondary)', fontWeight: 400,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  linkActive: {
    color: 'var(--teal)', background: 'var(--teal-light)',
    fontWeight: 600,
  },
  rightSection: {
    display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0,
  },
  rightLinks: {
    display: 'flex', alignItems: 'center', gap: 2,
  },
  rightLink: {
    padding: '6px 12px', borderRadius: 8, fontSize: '0.9rem',
    color: 'var(--text-secondary)', fontWeight: 400,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  rightLinkActive: {
    color: 'var(--teal)', background: 'var(--teal-light)',
    fontWeight: 600,
  },
  burger: {
    display: 'flex', flexDirection: 'column', gap: 5,
    background: 'none', padding: 8, marginLeft: 8, cursor: 'pointer',
  },
  bar: {
    width: 22, height: 2, background: 'var(--text-primary)',
    borderRadius: 2, transition: 'all 0.25s',
    display: 'block',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
    zIndex: 150, backdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
    background: '#fff', zIndex: 200,
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex', flexDirection: 'column', overflowY: 'auto',
  },
  drawerUser: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '24px 20px 16px',
    borderBottom: '1px solid var(--border)',
  },
  drawerAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--teal)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1rem', flexShrink: 0,
  },
  drawerLinks: { padding: '12px 12px', flex: 1 },
  drawerLink: {
    display: 'block', padding: '11px 12px', borderRadius: 8,
    fontSize: '0.95rem', color: 'var(--text-secondary)',
    transition: 'all 0.15s', marginBottom: 2,
  },
  drawerLinkActive: {
    color: 'var(--teal)', background: 'var(--teal-light)',
    fontWeight: 600,
  },
  drawerFooter: {
    padding: '16px 12px 20px',
    borderTop: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
};

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

  // Main nav links (left/center area)
  const mainLinks = () => {
    const r = userProfile?.role;
    if (r === 'superAdmin') return [
      { to: '/super-admin', label: '👑 ' + t('superAdmin') },
      { to: '/platform-analytics', label: '📊 Analytics' },
    ];
    if (r === 'admin') return [
      { to: '/admin', label: '🛡️ ' + t('admin') },
      { to: '/dashboard', label: '🏠 ' + t('dashboard') },
      { to: '/platform-analytics', label: '📊 Analytics' },
    ];
    if (r === 'owner') return [
      { to: '/dashboard', label: '🏠 ' + t('dashboard') },
      { to: '/analytics', label: '📊 Analytics' },
    ];
    if (r === 'tenant') return [
      { to: '/my-rent', label: '🏠 My Rent' },
      { to: '/maintenance', label: '🔧 ' + t('maintenance') },
    ];
    return [];
  };

  // Right-side quick action links for owner (contracts + properties)
  const rightActionLinks = () => {
    const r = userProfile?.role;
    if (r === 'owner' || r === 'tenant' || r === 'superAdmin') return [
      { to: '/messages', label: '📄 ' + t('messages') },
    ];
    return []
  };

  const centerLinks = [{ to: '/', label: '', unread: 0 }, ...mainLinks().map(l => ({ ...l, unread: 0 }))];
  const rLinks = rightActionLinks().map(l => ({
    ...l,
    unread: l.to === '/messages' ? unreadMessages : 0
  }));

  return (
    <>
      <nav style={S.nav}>
        <div style={S.inner}>
          {/* LEFT — Logo */}
          <Link to="/" style={S.logo}>
            <HexIcon />
            <span style={S.logoText}>TerraViser</span>
          </Link>

          {/* CENTER — Desktop nav */}
          {!isMobile && (
            <div style={S.rightSection}>
              {centerLinks.map(l => (
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

          {/* RIGHT — Contracts + Auth */}
          <div style={S.rightSection}>
            {!isMobile && rLinks.length > 0 && (
              <div style={S.rightLinks}>
                {rLinks.map(l => (
                  <Link key={l.to} to={l.to}
                    style={{ ...S.rightLink, ...(isActive(l.to) ? S.rightLinkActive : {}), display: 'flex', alignItems: 'center', gap: 5 }}>
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

            {!isMobile && (
              userProfile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AvatarMenu name={userProfile.name} role={userProfile.role} photoURL={userProfile.photoURL} unreadMessages={unreadMessages} onLogout={handleLogout} t={t} />
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
              {userProfile.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.name} style={{ ...S.drawerAvatar, objectFit: 'cover' }} />
              ) : (
                <div style={S.drawerAvatar}>{userProfile.name.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{userProfile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{userProfile.role}</div>
              </div>
            </div>
          )}

          <div style={S.drawerLinks}>
            {[...centerLinks, ...rLinks].map(l => (
              <Link key={l.to} to={l.to}
                style={{ ...S.drawerLink, ...(isActive(l.to) ? S.drawerLinkActive : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setMenuOpen(false)}>
                <span>{l.label}</span>
                {((l as any).unread ?? 0) > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                    {(l as any).unread}
                  </span>
                )}
              </Link>
            ))}
            {unreadMessages > 0 && (
              <Link to="/messages" style={{ ...S.drawerLink, ...(isActive('/messages') ? S.drawerLinkActive : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setMenuOpen(false)}>
                <span>💬 Messages</span>
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>{unreadMessages}</span>
              </Link>
            )}
          </div>

          <div style={S.drawerFooter}>
            {userProfile ? (
              <>
                <Link to="/settings" className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: '0.9rem' }} onClick={() => setMenuOpen(false)}>⚙️ {t('settings')}</Link>
                <button className="btn btn-danger" style={{ justifyContent: 'center', fontSize: '0.9rem' }} onClick={handleLogout}>🚪 {t('signOut')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>{t('signIn')}</Link>
                <Link to="/register" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>{t('getStarted')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}