import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { logoutUser } from '../services/authService';
import { subscribeToConversations } from '../services/messageService';
import type { Conversation } from '../types';
import {
  BrandLogo, HomeIcon, DashboardIcon, AnalyticsIcon, MessagesIcon,
  SettingsIcon, SignOutIcon, AdminIcon, SuperAdminIcon, RentIcon,
} from './Icons';

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
        padding: '5px 10px 5px 5px', borderRadius: 20,
        background: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.3)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
        {photoURL ? (
          <img src={photoURL} alt={name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.82rem', flexShrink: 0,
            border: '1.5px solid rgba(255,255,255,0.5)',
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {unreadMessages > 0 && (
          <span style={{ background: '#febb02', color: '#003580', fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px', borderRadius: 10 }}>
            {unreadMessages}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          minWidth: 200, zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--gray-50)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 1 }}>{role}</div>
          </div>

          {/* Messages — always shown for applicable roles */}
          <button onClick={() => { navigate('/messages'); setOpen(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '10px 16px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)',
            justifyContent: 'space-between',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessagesIcon size={15} color="#595959" />
              Messages
            </span>
            {unreadMessages > 0 && (
              <span style={{ background: '#febb02', color: '#003580', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>{unreadMessages}</span>
            )}
          </button>

          <button onClick={() => { navigate('/settings'); setOpen(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 16px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)',
            textAlign: 'left', fontFamily: 'var(--font-body)',
          }}>
            <SettingsIcon size={15} color="#595959" /> {t('settings')}
          </button>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 16px', background: 'none', borderTop: '1px solid var(--border)',
            cursor: 'pointer', fontSize: '0.88rem', color: '#cc0000',
            textAlign: 'left', fontFamily: 'var(--font-body)',
          }}>
            <SignOutIcon size={15} color="#cc0000" /> {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: '#003580',
    borderBottom: '1px solid #00265f',
    height: 'var(--nav-height)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    height: '100%', display: 'flex', alignItems: 'center',
    gap: 20,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: 'var(--font-body)', fontSize: '1.3rem',
    fontWeight: 800, color: '#fff', flexShrink: 0,
    letterSpacing: '-0.3px',
  },
  logoText: { color: '#fff' },
  centerLinks: { display: 'flex', alignItems: 'center', gap: 2, flex: 1 },
  link: {
    padding: '5px 11px', borderRadius: 20, fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.88)', fontWeight: 500,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
    border: '1px solid transparent',
  },
  linkActive: {
    color: '#fff', background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600,
  },
  rightSection: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginLeft: 'auto', flexShrink: 0,
  },
  rightLinks: { display: 'flex', alignItems: 'center', gap: 4 },
  rightLink: {
    padding: '5px 11px', borderRadius: 20, fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.88)', fontWeight: 500,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
    border: '1px solid transparent',
  },
  rightLinkActive: {
    color: '#fff', background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600,
  },
  burger: {
    display: 'flex', flexDirection: 'column', gap: 5,
    background: 'none', padding: 8, marginLeft: 8, cursor: 'pointer',
  },
  bar: {
    width: 22, height: 2, background: '#fff',
    borderRadius: 2, transition: 'all 0.25s', display: 'block',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    zIndex: 150,
  },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
    background: '#fff', zIndex: 200,
    boxShadow: '-4px 0 28px rgba(0,0,0,0.2)',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex', flexDirection: 'column', overflowY: 'auto',
  },
  drawerUser: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '20px 20px 16px',
    background: '#003580',
    borderBottom: '1px solid #00265f',
  },
  drawerAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1rem', flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.4)',
  },
  drawerLinks: { padding: '10px 12px', flex: 1 },
  drawerLink: {
    display: 'block', padding: '10px 12px', borderRadius: 6,
    fontSize: '0.92rem', color: 'var(--text-secondary)',
    transition: 'all 0.15s', marginBottom: 2,
  },
  drawerLinkActive: {
    color: 'var(--blue-700)', background: 'var(--blue-50)', fontWeight: 600,
  },
  drawerFooter: {
    padding: '14px 12px 20px',
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
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

  // Icon helper for nav labels
  const NavLabel = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{text}</span>
  );

  // Main nav links
  const mainLinks = () => {
    const r = userProfile?.role;
    if (r === 'superAdmin') return [
      { to: '/super-admin', label: <NavLabel icon={<SuperAdminIcon size={15} color="currentColor" />} text={t('superAdmin')} /> },
      { to: '/platform-analytics', label: <NavLabel icon={<AnalyticsIcon size={15} color="currentColor" />} text="Analytics" /> },
    ];
    if (r === 'admin') return [
      { to: '/admin', label: <NavLabel icon={<AdminIcon size={15} color="currentColor" />} text={t('admin')} /> },
      { to: '/dashboard', label: <NavLabel icon={<DashboardIcon size={15} color="currentColor" />} text={t('dashboard')} /> },
      { to: '/platform-analytics', label: <NavLabel icon={<AnalyticsIcon size={15} color="currentColor" />} text="Analytics" /> },
    ];
    if (r === 'owner') return [
      { to: '/dashboard', label: <NavLabel icon={<DashboardIcon size={15} color="currentColor" />} text={t('dashboard')} /> },
      { to: '/analytics', label: <NavLabel icon={<AnalyticsIcon size={15} color="currentColor" />} text="Analytics" /> },
    ];
    if (r === 'tenant') return [
      { to: '/my-rent', label: <NavLabel icon={<RentIcon size={15} color="currentColor" />} text="My Rent" /> },
      { to: '/tenant-analytics', label: <NavLabel icon={<AnalyticsIcon size={15} color="currentColor" />} text="Analytics" /> },
    ];
    return [];
  };

  const rightActionLinks = () => {
    // Messages moved to avatar dropdown — no separate right link needed
    return [];
  };

  const centerLinks = [...mainLinks().map(l => ({ ...l, unread: 0 }))];
  const rLinks = rightActionLinks().map(l => ({
    ...l,
    unread: (l as any).to === '/messages' ? unreadMessages : 0
  }));

  return (
    <>
      <nav style={S.nav}>
        <div style={S.inner}>
          {/* LEFT — Logo */}
          <Link to="/" style={S.logo}>
            <BrandLogo size={28} />
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
                  <Link to="/login" style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, color: '#fff', border: '1px solid rgba(255,255,255,0.5)', transition: 'all 0.15s', background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>{t('signIn')}</Link>
                  <Link to="/register" style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, color: '#003580', background: '#febb02', border: 'none', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='#e5a800'} onMouseLeave={e => e.currentTarget.style.background='#febb02'}>{t('getStarted')}</Link>
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
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{userProfile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', textTransform: 'capitalize', marginTop: 1 }}>{userProfile.role}</div>
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