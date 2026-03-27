import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/format';
import type { Property, Currency } from '../types';

interface Props {
  property: Property;
  showActions?: boolean;
  onEdit?: (p: Property) => void;
  onDelete?: (id: string) => void;
  onTogglePublic?: (p: Property) => void;
}

// ── Inline share dropdown ──────────────────────────────────────────────────
function ShareMenu({ propertyId, title }: { propertyId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const url = `${window.location.origin}/property/${propertyId}`;
  const text = encodeURIComponent(`${title} — Check out this property on Hive!`);
  const encodedUrl = encodeURIComponent(url);

  const shareOptions = [
    {
      label: 'Facebook',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'WhatsApp',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      href: `https://wa.me/?text=${text}%20${encodedUrl}`,
    },
  ];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        title="Share"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: 8,
          border: '1px solid var(--border)',
          background: open ? 'var(--surface2)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(6px)',
          cursor: 'pointer', transition: 'all 0.15s', color: 'var(--text-secondary)',
        }}
      >
        <ShareIcon />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', bottom: '110%', right: 0,
            background: '#fff', borderRadius: 12,
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            padding: 8, minWidth: 172, zIndex: 200,
            animation: 'shareMenuIn 0.15s ease',
          }}
          onClick={e => e.stopPropagation()}
        >
          <style>{`@keyframes shareMenuIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '2px 8px 6px', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Share property</p>

          {shareOptions.map(opt => (
            <a
              key={opt.label}
              href={opt.href}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
                fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {opt.icon}
              {opt.label}
            </a>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '8px 10px', borderRadius: 8, border: 'none',
              background: 'transparent', fontSize: '0.85rem', fontWeight: 500,
              color: copied ? 'var(--teal)' : 'var(--text-primary)',
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PropertyCard({ property, showActions, onEdit, onDelete, onTogglePublic }: Props) {
  const { t } = useLang();
  const image = property.images?.[0] ?? '';
  const displayType = (property as any).subcategory || (property as any).type || (property as any).propertyType || '';
  const isAvailable = property.status === 'available';
  const currency: Currency = (property as any).currency ?? 'USD';

  return (
    <div style={S.card}>
      {/* Image */}
      <Link to={`/property/${property.id}`} style={S.imgWrap}>
        {image
          ? <img src={image} alt={property.title} style={S.img} />
          : <div style={S.imgPlaceholder}><HouseIcon /></div>
        }
        {displayType && <div style={S.typePill}>{displayType}</div>}
        <div style={{ ...S.statusDot, background: isAvailable ? 'var(--sage-500)' : '#f59e0b' }} />

        {/* Share button floating on image */}
        {!showActions && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <ShareMenu propertyId={property.id} title={property.title} />
          </div>
        )}
      </Link>

      {/* Body */}
      <div style={S.body}>
        <div style={S.topRow}>
          <span style={S.locationText}>
            <PinIcon /> {property.location}
            {(property.latitude && property.longitude) && (
              <a 
                href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=16/${property.latitude}/${property.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: 4, color: 'var(--teal)', fontWeight: 600 }}
                onClick={(e) => e.stopPropagation()}
              >
                Map
              </a>
            )}
          </span>
          <span style={{
            ...S.statusBadge,
            background: isAvailable ? 'var(--sage-100)' : '#fef3c7',
            color: isAvailable ? 'var(--sage-700)' : '#92400e',
          }}>
            {isAvailable ? t('available') : t('occupied')}
          </span>
        </div>

        <Link to={`/property/${property.id}`} style={S.title}>
          {property.title}
        </Link>

        <div style={S.priceRow}>
          <span style={S.price}>{formatCurrency(property.price, currency)}</span>
          <span style={S.pricePer}>{t('perMonth')}</span>
        </div>

        {property.amenities?.length > 0 && (
          <div style={S.amenities}>
            {property.amenities.slice(0, 3).map(a => (
              <span key={a} style={S.amenityTag}>{a}</span>
            ))}
            {property.amenities.length > 3 && (
              <span style={S.amenityMore}>+{property.amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Bottom row: book button + share */}
        {!showActions && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
            <Link
              to={`/property/${property.id}`}
              style={{
                ...S.bookBtn,
                ...(isAvailable ? S.bookBtnActive : S.bookBtnDisabled),
                flex: 1,
              }}
            >
              {isAvailable ? t('bookProperty') : t('occupied')}
            </Link>
            <ShareMenu propertyId={property.id} title={property.title} />
          </div>
        )}

        {/* Owner actions */}
        {showActions && (
          <div style={S.actions}>
            <Link to={`/property/${property.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>👁️ View</Link>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit?.(property)}>Edit</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onTogglePublic?.(property)}
            >
              {property.isPublic ? 'Hide' : 'List'}
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete?.(property.id)}
            >
              Del
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function HouseIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--terra-300)" strokeWidth="1.2">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.18s, transform 0.18s',
  },
  imgWrap: {
    display: 'block',
    position: 'relative',
    height: 180,
    background: 'var(--terra-100)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  img: {
    width: '100%', height: '100%', objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  imgPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  typePill: {
    position: 'absolute', bottom: 10, left: 10,
    background: 'rgba(253,250,246,0.92)', backdropFilter: 'blur(6px)',
    color: 'var(--terra-700)', fontSize: '0.7rem', fontWeight: 600,
    padding: '3px 10px', borderRadius: 20,
    letterSpacing: '0.3px',
  },
  statusDot: {
    position: 'absolute', top: 10, right: 10,
    width: 10, height: 10, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.8)',
  },
  body: {
    padding: '14px 16px 16px',
    display: 'flex', flexDirection: 'column', gap: 8, flex: 1,
  },
  topRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: 6,
  },
  locationText: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: 150,
  },
  statusBadge: {
    fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px',
    borderRadius: 20, flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--terra-900)',
    letterSpacing: '-0.2px',
    lineHeight: 1.25,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textDecoration: 'none',
  },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 4 },
  price: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 600,
    color: 'var(--terra-600)',
  },
  pricePer: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  amenities: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  amenityTag: {
    fontSize: '0.68rem', padding: '2px 7px',
    background: 'var(--stone-50)', color: 'var(--text-secondary)',
    borderRadius: 6, border: '1px solid var(--border)',
  },
  amenityMore: { fontSize: '0.68rem', color: 'var(--text-muted)', padding: '2px 4px' },
  bookBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '9px 16px', borderRadius: 8, fontSize: '0.85rem',
    fontWeight: 500, fontFamily: 'var(--font-body)',
    textDecoration: 'none', transition: 'all 0.15s',
  },
  bookBtnActive: {
    background: 'var(--terra-600)', color: '#fff',
  },
  bookBtnDisabled: {
    background: 'var(--surface2)', color: 'var(--text-muted)',
    pointerEvents: 'none' as const,
  },
  actions: { display: 'flex', gap: 5, flexWrap: 'wrap' },
};