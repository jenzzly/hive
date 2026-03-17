import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import type { Property } from '../types';

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

  return (
    <div style={S.card}>
      {/* Image */}
      <Link to={`/property/${property.id}`} style={S.imgWrap}>
        {image
          ? <img src={image} alt={property.title} style={S.img} />
          : <div style={S.imgPlaceholder}><HouseIcon /></div>
        }
        {displayType && <div style={S.typePill}>{displayType}</div>}
        <div style={{ ...S.statusDot, background: isAvailable ? '#1D9E75' : '#f59e0b' }} />
      </Link>

      {/* Body */}
      <div style={S.body}>
        <div style={S.topRow}>
          <span style={S.locationText}>
            <PinIcon /> {property.location}
          </span>
          <span style={{ ...S.statusBadge, background: isAvailable ? 'var(--teal-light)' : '#fef3c7', color: isAvailable ? 'var(--teal-dark)' : '#92400e' }}>
            {isAvailable ? t('available') : t('occupied')}
          </span>
        </div>

        <Link to={`/property/${property.id}`} style={S.title}>
          {property.title}
        </Link>

        <div style={S.priceRow}>
          <span style={S.price}>${property.price.toLocaleString()}</span>
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
              style={{ fontSize: '0.75rem' }}
            >
              {property.isPublic ? '🔓 Public' : '🔒 Private'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete?.(property.id)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

function HouseIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--teal-mid)" strokeWidth="1.2">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  imgWrap: {
    position: 'relative', display: 'block',
    aspectRatio: '16/10', overflow: 'hidden',
    background: 'var(--surface2)',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  typePill: {
    position: 'absolute', top: 10, left: 10,
    background: 'rgba(4,52,44,0.78)', color: '#fff',
    fontSize: '0.7rem', fontWeight: 500, padding: '3px 9px',
    borderRadius: 20, backdropFilter: 'blur(4px)',
  },
  statusDot: {
    position: 'absolute', top: 10, right: 10,
    width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff',
  },
  body: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  locationText: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: '0.78rem', color: 'var(--text-muted)',
  },
  statusBadge: {
    fontSize: '0.68rem', fontWeight: 500, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: '1.05rem',
    color: 'var(--text-primary)', lineHeight: 1.3, textDecoration: 'none',
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 },
  price: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--teal)' },
  pricePer: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  amenities: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  amenityTag: {
    fontSize: '0.68rem', padding: '2px 7px',
    background: 'var(--surface2)', color: 'var(--text-secondary)',
    borderRadius: 6, border: '1px solid var(--border)',
  },
  amenityMore: { fontSize: '0.68rem', color: 'var(--text-muted)', padding: '2px 4px' },
  bookBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '9px 16px', borderRadius: 8, fontSize: '0.85rem',
    fontWeight: 500, fontFamily: 'var(--font-body)',
    textDecoration: 'none', marginTop: 4, transition: 'all 0.15s',
  },
  bookBtnActive: {
    background: 'var(--teal)', color: '#fff',
  },
  bookBtnDisabled: {
    background: 'var(--surface2)', color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  actions: { display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' },
};
