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
      </Link>

      {/* Body */}
      <div style={S.body}>
        <div style={S.topRow}>
          <span style={S.locationText}>
            <PinIcon /> {property.location}
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

        {/* Book button — shown to all visitors */}
        {!showActions && (
          <Link
            to={`/property/${property.id}`}
            style={{
              ...S.bookBtn,
              ...(isAvailable ? S.bookBtnActive : S.bookBtnDisabled),
            }}
          >
            {isAvailable ? t('bookProperty') : t('occupied')}
          </Link>
        )}

        {/* Owner actions */}
        {showActions && (
          <div style={S.actions}>
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
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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