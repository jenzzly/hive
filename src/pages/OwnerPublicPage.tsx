import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserBySlug } from '../services/userService';
import { getOwnerPublicProperties } from '../services/propertyService';
import type { User, Property, OwnerTemplate } from '../types';
import { formatCurrency } from '../utils/format';
import {
  WhatsAppIcon, FacebookIcon, CopyIcon,
  PinIcon, HomeIcon, WalletIcon
} from '../components/Icons';

export default function OwnerPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [owner, setOwner] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    console.log('Fetching owner for slug:', slug);
    (async () => {
      try {
        const u = await getUserBySlug(slug.toLowerCase());
        console.log('Owner found:', u);
        if (u) {
          setOwner(u);
          const props = await getOwnerPublicProperties(u.id);
          console.log('Properties found:', props.length);
          setProperties(props);
        } else {
          console.log('No owner found with this slug in Firestore.');
        }
      } catch (err) {
        console.error('Error fetching owner data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (!owner) {
    return (
      <div className="container page" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: 20 }}>404</h1>
        <p>This profile does not exist.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Back to Home</Link>
      </div>
    );
  }

  if (!owner.ownerSettings || !owner.ownerSettings.enabled) {
    return (
      <div className="container page" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: 20 }}>🔒 Private</h1>
        <p>This property page is currently private.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>If you are the owner, please enable it in your dashboard settings.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Back to Home</Link>
      </div>
    );
  }

  const { ownerSettings } = owner;
  const template: OwnerTemplate = ownerSettings.template || 'both';
  const themeColor = ownerSettings.primaryColor || (template === 'commercial' ? '#0f172a' : template === 'residential' ? '#059669' : '#3b82f6');
  const fontBody = ownerSettings.fontFamily || 'var(--font-body)';

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(`Check out my properties on Terra: ${ownerSettings.displayName}`);
  const shareUrl = encodeURIComponent(window.location.href);

  // Template Styles
  const isComm = template === 'commercial';
  const isResi = template === 'residential';

  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      minHeight: '100vh',
      background: isComm ? '#f8fafc' : isResi ? '#fffaf5' : '#f9fafb',
      fontFamily: fontBody,
      color: isComm ? '#1e293b' : '#374151',
    },
    header: {
      height: 350,
      background: ownerSettings.headerImage ? `url(${ownerSettings.headerImage}) center/cover` : `linear-gradient(135deg, ${themeColor}ee, ${themeColor}aa)`,
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    profileBox: {
      width: '100%',
      maxWidth: 1000,
      padding: '0 24px',
      transform: 'translateY(50%)',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 24,
    },
    avatar: {
      width: 160,
      height: 160,
      borderRadius: isComm ? 12 : 99,
      background: '#fff',
      border: `4px solid #fff`,
      boxShadow: 'var(--shadow-lg)',
      objectFit: 'cover',
      flexShrink: 0,
    },
    info: {
      paddingBottom: 16,
      flex: 1,
    },
    displayName: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#fff',
      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
      marginBottom: 8,
    },
    bio: {
      fontSize: '1rem',
      color: isComm ? '#64748b' : '#6b7280',
      lineHeight: 1.6,
      maxWidth: 600,
      marginTop: 80,
    },
    content: {
      maxWidth: 1000,
      margin: '120px auto 100px',
      padding: '0 24px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 24,
      marginTop: 40,
    },
    card: {
      background: '#fff',
      borderRadius: isComm ? 4 : 20,
      overflow: 'hidden',
      border: isComm ? '1px solid #e2e8f0' : 'none',
      boxShadow: isComm ? 'none' : '0 10px 25px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    },
    cardImg: {
      width: '100%',
      height: 200,
      objectFit: 'cover',
    },
    cardBody: {
      padding: 20,
    },
    price: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: themeColor,
      marginBottom: 8,
    },
    title: {
      fontSize: '1.1rem',
      fontWeight: 600,
      marginBottom: 8,
      color: isComm ? '#0f172a' : '#111827',
    },
    loc: {
      fontSize: '0.85rem',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    },
    socials: {
      display: 'flex',
      gap: 12,
      marginTop: 24,
    },
    socialBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: 10,
      background: '#fff',
      border: '1px solid #e2e8f0',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Header with Overlay */}
      <div style={styles.header}>
        <div className="owner-header-box" style={styles.profileBox}>
          {ownerSettings.profileImage ? (
            <img src={ownerSettings.profileImage} style={styles.avatar} alt={ownerSettings.displayName} />
          ) : (
            <div style={{ ...styles.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: themeColor }}>
              {ownerSettings.displayName.charAt(0)}
            </div>
          )}
          <div className="owner-header-info" style={styles.info}>
            <h1 style={styles.displayName}>{ownerSettings.displayName}</h1>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', backdropFilter: 'blur(5px)' }}>
                {properties.length} Properties
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', backdropFilter: 'blur(5px)' }}>
                {isComm ? '🏢 Commercial Expert' : isResi ? '🏡 Residential Specialist' : '🏘️ Real Estate Partner'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div className="owner-content-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={styles.bio}>
            <p>{ownerSettings.bio || `Welcome to my property collection. I specialize in ${template} real estate in ${owner.location || 'the city'}.`}</p>

            <div className="owner-socials" style={styles.socials}>
              {ownerSettings.socialLinks?.whatsapp && (
                <a href={`https://wa.me/${ownerSettings.socialLinks.whatsapp}`} target="_blank" rel="noreferrer" style={styles.socialBtn}>
                  <WhatsAppIcon size={20} />
                </a>
              )}
              {ownerSettings.socialLinks?.facebook && (
                <a href={ownerSettings.socialLinks.facebook} target="_blank" rel="noreferrer" style={styles.socialBtn}>
                  <FacebookIcon size={20} />
                </a>
              )}
              <button onClick={handleCopy} style={{ ...styles.socialBtn, border: copied ? `1px solid ${themeColor}` : '1px solid #e2e8f0' }}>
                <CopyIcon size={18} color={copied ? themeColor : '#64748b'} />
              </button>
              {copied && <span style={{ fontSize: '0.8rem', color: themeColor, alignSelf: 'center' }}>Link copied!</span>}
            </div>
          </div>

          <div className="owner-cta" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to={`/messages?ownerId=${owner.id}`} className="btn btn-primary" style={{ background: themeColor, color: '#fff', border: 'none' }}>
              Send Message
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>Featured Listings</h2>
          <div style={{ height: 4, width: 60, background: themeColor, borderRadius: 2, marginBottom: 40 }}></div>

          {properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--surface2)', borderRadius: 20 }}>
              <HomeIcon size={48} color="#cbd5e1" />
              <p style={{ marginTop: 12, color: '#64748b' }}>No public listings at the moment.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {properties.map(p => (
                <Link to={`/property/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div style={styles.card}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-10px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = isComm ? 'none' : '0 10px 25px rgba(0,0,0,0.05)';
                    }}
                  >
                    <img src={p.images[0] || 'https://via.placeholder.com/400x250'} style={styles.cardImg} alt={p.title} />
                    <div style={styles.cardBody}>
                      <div style={styles.price}>{formatCurrency(p.price, p.currency)}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}> / mo</span></div>
                      <div style={styles.title}>{p.title}</div>
                      <div style={styles.loc}>
                        <PinIcon size={14} color={themeColor} />
                        {p.location}
                      </div>
                      <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>{p.category}</span>
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>{p.type}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '60px 24px', borderTop: '1px solid #e2e8f0', textAlign: 'center', background: isComm ? '#fff' : 'transparent' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: themeColor, marginBottom: 8 }}>Terra</div>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>© 2026 {ownerSettings.displayName} · Powered by Terra Managed Real Estate</p>
      </div>
    </div>
  );
}
