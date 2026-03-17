import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProperty } from '../services/propertyService';
import { getUserProfile } from '../services/authService';
import { notifyOwnerContact, notifyOwnerBookingRequest } from '../utils/emailService';
import { createBookingRequest } from '../services/bookingService';
import { getOrCreateConversation } from '../services/messageService';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import PropertyGallery from '../components/PropertyGallery';
import type { Property, User } from '../types';

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment', house: 'House', studio: 'Studio',
  unit: 'Unit', garage: 'Garage', room: 'Room', commercial: 'Commercial',
};

type PanelMode = 'contact' | 'book';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, firebaseUser } = useAuth();
  const { t } = useLang();

  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactMsg, setContactMsg] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [booked, setBooked] = useState(false);
  const [panel, setPanel] = useState<PanelMode>('book');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!id) return;
    // Fetch without auth — public properties are readable by all
    getProperty(id).then(async p => {
      if (!p) { navigate('/'); return; }
      setProperty(p);
      try {
        const ownerData = await getUserProfile(p.ownerId);
        setOwner(ownerData);
      } catch { /* owner profile may need auth */ }
      setLoading(false);
    }).catch(() => { navigate('/'); });
  }, [id]);

  const handleContact = async () => {
    if (!owner || !userProfile || !property) return;
    setSending(true);
    try {
      await notifyOwnerContact(owner.email, owner.name, userProfile.name, property.title, contactMsg);
      setSent(true);
      setContactMsg('');
    } catch { /* silent */ }
    setSending(false);
  };

  const handleBook = async () => {
    if (!firebaseUser || !userProfile || !property) return;
    setSending(true);
    try {
      await createBookingRequest({
        propertyId: property.id,
        tenantId: userProfile.id,
        ownerId: property.ownerId,
        message: bookingMsg,
      });
      // Pre-create conversation thread so owner can reply immediately
      await getOrCreateConversation(
        property.id,
        property.title,
        property.ownerId,
        userProfile.id,
      );
      // Email notification to owner (fire-and-forget)
      if (owner) {
        notifyOwnerBookingRequest(
          owner.email,
          owner.name,
          userProfile.name,
          property.title,
          bookingMsg,
        );
      }
      setBooked(true);
      setBookingMsg('');
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!property) return null;

  const isAvailable = property.status === 'available';
  const displayType = (property as any).subcategory || (property as any).type || TYPE_LABELS[(property as any).propertyType] || '';
  const displayCategory = (property as any).category || '';

  // The action card content
  const ActionCard = (
    <div className="card" style={{ padding: 24, position: isMobile ? 'static' : 'sticky', top: 80 }}>
      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--teal)', fontWeight: 700 }}>
          ${property.price.toLocaleString()}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('perMonth')}</span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
        📍 {property.location}
      </div>

      {/* Status */}
      <div style={{ marginBottom: 16 }}>
        <span className={`badge ${isAvailable ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.8rem' }}>
          ● {isAvailable ? t('available') : t('occupied')}
        </span>
      </div>

      {isAvailable ? (
        <>
          {/* Panel toggle */}
          <div style={S.panelToggle}>
            <button style={{ ...S.panelBtn, ...(panel === 'book' ? S.panelBtnActive : {}) }} onClick={() => setPanel('book')}>
              📋 {t('bookProperty')}
            </button>
            <button style={{ ...S.panelBtn, ...(panel === 'contact' ? S.panelBtnActive : {}) }} onClick={() => setPanel('contact')}>
              ✉ {t('contactOwner')}
            </button>
          </div>

          {panel === 'book' ? (
            /* BOOKING PANEL */
            !firebaseUser ? (
              <div style={S.loginPrompt}>
                <div style={S.loginPromptIcon}>🏠</div>
                <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                  {t('loginToBook')}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Create an account or sign in to send a booking request for this property.
                </p>
                <Link to={`/login?redirect=/property/${property.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginBottom: 8 }}>
                  {t('signIn')}
                </Link>
                <Link to={`/register?redirect=/property/${property.id}`} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                  {t('getStarted')}
                </Link>
              </div>
            ) : booked ? (
              <div style={S.successBox}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✓</div>
                <div style={{ fontWeight: 600 }}>{t('bookingSuccess')}</div>
                <p style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.8 }}>The owner will review your request shortly.</p>
              </div>
            ) : (
              <>
                <textarea
                  className="form-input"
                  placeholder={t('bookingMessage')}
                  value={bookingMsg}
                  onChange={e => setBookingMsg(e.target.value)}
                  rows={4}
                  style={{ marginBottom: 12 }}
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleBook}
                  disabled={!bookingMsg.trim() || sending}
                >
                  {sending ? '...' : t('submitBooking')}
                </button>
              </>
            )
          ) : (
            /* CONTACT PANEL */
            !firebaseUser ? (
              <div style={S.loginPrompt}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Sign in to send a message to the owner.
                </p>
                <Link to={`/login?redirect=/property/${property.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                  {t('signIn')}
                </Link>
              </div>
            ) : sent ? (
              <div style={S.successBox}>{t('messageSent')}</div>
            ) : (
              <>
                <textarea
                  className="form-input"
                  placeholder="Write a message..."
                  value={contactMsg}
                  onChange={e => setContactMsg(e.target.value)}
                  rows={4}
                  style={{ marginBottom: 12 }}
                />
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleContact}
                  disabled={!contactMsg.trim() || sending}
                >
                  {sending ? '...' : t('sendMessage')}
                </button>
              </>
            )
          )}
        </>
      ) : (
        <div style={{ padding: '16px', background: 'var(--surface2)', borderRadius: 10, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          This property is currently occupied and not available for booking.
        </div>
      )}

      {/* Owner info */}
      {owner && (
        <div style={S.ownerRow}>
          <div style={S.ownerAvatar}>{owner.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{owner.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Property Owner</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        {t('back')}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 32, alignItems: 'start' }}>
        {/* LEFT */}
        <div>
          <PropertyGallery images={property.images} title={property.title} />

          <div style={{ marginTop: 24 }}>
            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {displayCategory && <span className="badge badge-gray">{displayCategory}</span>}
              {displayType && <span className="badge badge-green">{displayType}</span>}
              <span className={`badge ${isAvailable ? 'badge-green' : 'badge-amber'}`}>
                {isAvailable ? t('available') : t('occupied')}
              </span>
            </div>

            <h1 style={S.title}>{property.title}</h1>

            <div style={S.locationRow}>
              📍 {property.location}
            </div>

            {/* Price inline on mobile */}
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--teal)' }}>${property.price.toLocaleString()}</span>
                <span style={{ color: 'var(--text-muted)' }}>{t('perMonth')}</span>
              </div>
            )}

            <hr className="divider" />

            <h2 style={S.sectionTitle}>{t('about')}</h2>
            <p style={S.desc}>{property.description}</p>

            {property.amenities?.length > 0 && (
              <>
                <h2 style={{ ...S.sectionTitle, marginTop: 28 }}>{t('amenities')}</h2>
                <div style={S.amenitiesGrid}>
                  {property.amenities.map(a => (
                    <div key={a} style={S.amenityItem}>
                      <span style={{ color: 'var(--teal)' }}>✓</span> {a}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Action card below content on mobile */}
            {isMobile && <div style={{ marginTop: 32 }}>{ActionCard}</div>}
          </div>
        </div>

        {/* RIGHT sidebar — desktop only */}
        {!isMobile && <div>{ActionCard}</div>}
      </div>

      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div style={S.modalOverlay} onClick={() => setShowLoginPrompt(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 12 }}>🔑</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textAlign: 'center', marginBottom: 8 }}>Sign in to book</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, fontSize: '0.9rem' }}>
              Create a free account or sign in to send a booking request.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to={`/register?redirect=/property/${property.id}`} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                {t('getStarted')}
              </Link>
              <Link to={`/login?redirect=/property/${property.id}`} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                {t('signIn')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 10 },
  locationRow: { display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 14 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 10 },
  desc: { color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.97rem' },
  amenitiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 },
  amenityItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: 'var(--text-secondary)' },
  panelToggle: { display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 16 },
  panelBtn: { flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', transition: 'all 0.15s', whiteSpace: 'nowrap' },
  panelBtnActive: { background: '#fff', color: 'var(--teal)', fontWeight: 500, boxShadow: 'var(--shadow)' },
  loginPrompt: { background: 'var(--surface2)', borderRadius: 12, padding: 20, textAlign: 'center' },
  loginPromptIcon: { fontSize: '2rem', marginBottom: 8 },
  successBox: { background: 'var(--teal-light)', color: 'var(--teal-dark)', padding: '16px', borderRadius: 10, textAlign: 'center', fontWeight: 500 },
  ownerRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' },
  ownerAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
};
