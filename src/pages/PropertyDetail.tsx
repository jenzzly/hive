import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProperty } from '../services/propertyService';
import { getUserProfile } from '../services/authService';
// FIX: import from services/ (the single canonical email file), not utils/
import { notifyOwnerContact, notifyOwnerBookingRequest } from '../services/emailService';
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

  // Load property (public, no auth required)
  useEffect(() => {
    if (!id) return;
    getProperty(id).then(p => {
      if (!p) { navigate('/'); return; }
      setProperty(p);
      setLoading(false);
    }).catch(() => navigate('/'));
  }, [id]);

  // FIX: Load owner profile in a separate effect that re-runs whenever
  // firebaseUser changes. Previously this was nested inside the property
  // fetch and ran only once — if auth resolved after the property loaded
  // (very common on first paint), owner stayed null and emails were never sent.
  useEffect(() => {
    if (!property) return;
    getUserProfile(property.ownerId)
      .then(ownerData => setOwner(ownerData))
      .catch(() => setOwner(null));
  }, [property, firebaseUser]); // re-run when user signs in/out

  const handleContact = async () => {
    if (!owner || !userProfile || !property) return;
    setSending(true);
    try {
      await notifyOwnerContact(
        owner.email,
        owner.name,
        userProfile.name,
        property.title,
        contactMsg,
      );
      setSent(true);
      setContactMsg('');
    } catch (err) {
      console.error('Contact email failed:', err);
    }
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

  if (loading) return <div className="loading-center" > <div className="spinner" /> </div>;
  if (!property) return null;

  const isAvailable = property.status === 'available';
  const displayType = (property as any).subcategory || (property as any).type || TYPE_LABELS[(property as any).propertyType] || '';
  const displayCategory = (property as any).category || '';

  // The action card content
  const ActionCard = (
    <div className="card" style={{ padding: 24, position: isMobile ? 'static' : 'sticky', top: 80 }
    }>
      {/* Price */}
      < div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--teal)', fontWeight: 700 }}>
          ${property.price.toLocaleString()}
        </span>
        < span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> {t('perMonth')} </span>
      </div>
      < div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
        📍 {property.location}
      </div>

      {/* Status */}
      <div style={{ marginBottom: 16 }}>
        <span className={`badge ${isAvailable ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.8rem' }}>
          ● {isAvailable ? t('available') : t('occupied')}
        </span>
      </div>

      {
        isAvailable ? (
          <>
            {/* Panel toggle */}
            < div style={S.panelToggle} >
              <button style={{ ...S.panelBtn, ...(panel === 'book' ? S.panelBtnActive : {}) }} onClick={() => setPanel('book')
              }>
                📋 {t('bookProperty')}
              </button>
              < button style={{ ...S.panelBtn, ...(panel === 'contact' ? S.panelBtnActive : {}) }} onClick={() => setPanel('contact')}>
                ✉ {t('contactOwner')}
              </button>
            </div>

            {
              panel === 'book' ? (
                /* BOOKING PANEL */
                !firebaseUser ? (
                  <div style={S.loginPrompt} >
                    <div style={S.loginPromptIcon} >🏠</div>
                    < div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }
                    }>
                      {t('loginToBook')}
                    </div>
                    < p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Create an account or sign in to send a booking request for this property.
                    </p>
                    < Link to={`/login?redirect=/property/${property.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginBottom: 8 }}>
                      {t('signIn')}
                    </Link>
                    < Link to={`/register?redirect=/property/${property.id}`} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                      {t('getStarted')}
                    </Link>
                  </div>
                ) : booked ? (
                  <div style={S.successBox} >
                    <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✓</div>
                    < div style={{ fontWeight: 600 }}> {t('bookingSuccess')} </div>
                    < p style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.8 }}> The owner will review your request shortly.</p>
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
                    < button
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
                  <div style={S.loginPrompt} >
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Sign in to send a message to the owner.
                    </p>
                    < Link to={`/login?redirect=/property/${property.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                      {t('signIn')}
                    </Link>
                  </div>
                ) : sent ? (
                  <div style={S.successBox} > {t('messageSent')} </div>
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
                    < button
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
      {
        owner && (
          <div style={S.ownerRow}>
            <div style={S.ownerAvatar}> {owner.name.charAt(0).toUpperCase()} </div>
            < div >
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}> {owner.name} </div>
              < div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }
              }> Property Owner </div>
            </div>
          </div>
        )}
    </div>
  );

  return (
    <div className="container page" >
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        {t('back')}
      </button>

      < div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 28, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          {
            property.images?.length > 0 && (
              <PropertyGallery images={property.images} title={property.title} />
            )
          }

          <div className="card" style={{ padding: 28, marginTop: 20 }}>
            {(displayCategory || displayType) && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {displayCategory && <span className="badge badge-teal" > {displayCategory} </span>}
                {displayType && <span className="badge badge-outline" > {displayType} </span>}
              </div>
            )}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: 8 }}>
              {property.title}
            </h1>
            < p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              {property.description}
            </p>

            {
              property.amenities?.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 12 }}> {t('amenities')} </h3>
                  < div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }
                  }>
                    {
                      property.amenities.map(a => (
                        <span key={a} className="badge badge-outline" > {a} </span>
                      ))
                    }
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Right column — sticky action card */}
        {isMobile ? null : ActionCard}
      </div>

      {/* Mobile action card (bottom) */}
      {isMobile && <div style={{ marginTop: 20 }}> {ActionCard} </div>}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  panelToggle: {
    display: 'flex', gap: 4, marginBottom: 16,
    background: 'var(--surface2)', borderRadius: 10, padding: 4,
  },
  panelBtn: {
    flex: 1, padding: '8px 4px', border: 'none', borderRadius: 8,
    background: 'transparent', cursor: 'pointer', fontSize: '0.82rem',
    fontWeight: 500, color: 'var(--text-secondary)', transition: 'all 0.15s',
  },
  panelBtnActive: {
    background: 'var(--surface)', color: 'var(--text-primary)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  loginPrompt: {
    background: 'var(--surface2)', borderRadius: 10,
    padding: '20px 16px', textAlign: 'center',
  },
  loginPromptIcon: { fontSize: '2rem', marginBottom: 10 },
  successBox: {
    background: 'var(--teal-light)', borderRadius: 10, padding: '20px 16px',
    textAlign: 'center', color: 'var(--teal)', fontWeight: 600, fontSize: '0.92rem',
  },
  ownerRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)',
  },
  ownerAvatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'var(--teal-light)', color: 'var(--teal)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1rem',
  },
};