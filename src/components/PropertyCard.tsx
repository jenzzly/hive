import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/format';
import { WhatsAppIcon, FacebookIcon, CopyIcon, PinIcon } from './Icons';
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
  const displayType = (property as any).subcategory || (property as any).type || '';
  const displayCategory = (property as any).category || '';
  const isAvailable = property.status === 'available';
  const currency: Currency = (property as any).currency ?? 'USD';
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const url = `${window.location.origin}/property/${property.id}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${property.title} — Check out this property on TerraViser!`);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement('input');
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Description: truncate cleanly
  const desc = property.description?.trim() || '';
  const descShort = desc.length > 120 ? desc.slice(0, 118) + '…' : desc;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e7e7e7',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.13)' : '0 1px 4px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow 0.18s, transform 0.18s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image: fixed 220×180, never distorted ── */}
      <Link
        to={`/property/${property.id}`}
        style={{
          display: 'block',
          position: 'relative',
          width: 220,
          minWidth: 220,
          height: 180,
          flexShrink: 0,
          background: '#f0f0f0',
          overflow: 'hidden',
        }}
      >
        {image ? (
          <img
            src={image}
            alt={property.title}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              transition: 'transform 0.3s ease',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c8c8c8" strokeWidth="1">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V13h6v8" />
            </svg>
          </div>
        )}

        {/* Status pill */}
        <span style={{
          position: 'absolute', bottom: 8, left: 8,
          background: isAvailable ? '#008009' : '#e8a000',
          color: '#fff', fontSize: '0.65rem', fontWeight: 700,
          padding: '2px 8px', borderRadius: 3,
        }}>
          {isAvailable ? '● Available' : '● Occupied'}
        </span>
      </Link>

      {/* ── Body ── */}
      <div style={{
        flex: 1, padding: '16px 20px',
        display: 'flex', flexDirection: 'column',
        minWidth: 0, justifyContent: 'space-between',
      }}>
        {/* Top section */}
        <div>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {displayCategory && (
              <span style={{
                fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                background: '#eff6ff', color: '#0057b8',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {displayCategory}
              </span>
            )}
            {displayType && displayType !== displayCategory && (
              <span style={{
                fontSize: '0.67rem', fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                background: '#f5f5f5', color: '#595959', border: '1px solid #e7e7e7',
                textTransform: 'uppercase', letterSpacing: '0.4px',
              }}>
                {displayType}
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/property/${property.id}`} style={{
            fontSize: '1rem', fontWeight: 700, color: '#00224f',
            lineHeight: 1.3, textDecoration: 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', letterSpacing: '-0.1px',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0071c2')}
            onMouseLeave={e => (e.currentTarget.style.color = '#00224f')}
          >
            {property.title}
          </Link>

          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`}
            target="_blank" rel="noreferrer"
            style={{ 
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, marginBottom: 8,
              textDecoration: 'none', color: 'inherit'
            }}
            onClick={e => e.stopPropagation()}
          >
            <PinIcon size={12} color="#0071c2" />
            <span style={{ fontSize: '0.78rem', color: '#0071c2', fontWeight: 600 }}>
              {property.location}
            </span>
          </a>

          {/* Description */}
          {descShort && (
            <p style={{
              fontSize: '0.82rem', color: '#737373', lineHeight: 1.55,
              marginBottom: 10,
            }}>
              {descShort}
            </p>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {property.amenities.slice(0, 4).map(a => (
                <span key={a} style={{ fontSize: '0.73rem', color: '#008009', fontWeight: 600 }}>
                  ✓ {a}
                </span>
              ))}
              {property.amenities.length > 4 && (
                <span style={{ fontSize: '0.73rem', color: '#a0a0a0' }}>
                  +{property.amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Share row — always visible icons */}
        {!showActions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '0.72rem', color: '#a0a0a0', fontWeight: 500, marginRight: 2 }}>Share:</span>
            <a
              href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
              target="_blank" rel="noreferrer"
              title="Share on WhatsApp"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #e7e7e7', background: '#fff', transition: 'border-color 0.12s' }}
              onClick={e => e.stopPropagation()}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#25D366')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e7e7e7')}
            >
              <WhatsAppIcon size={15} />
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank" rel="noreferrer"
              title="Share on Facebook"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #e7e7e7', background: '#fff', transition: 'border-color 0.12s' }}
              onClick={e => e.stopPropagation()}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1877F2')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e7e7e7')}
            >
              <FacebookIcon size={15} />
            </a>
            <button
              onClick={handleCopy}
              title="Copy link"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6, border: '1px solid #e7e7e7',
                background: copied ? '#eff6ff' : '#fff', cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#0071c2')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = copied ? '#0071c2' : '#e7e7e7')}
            >
              <CopyIcon size={13} color={copied ? '#0071c2' : '#737373'} />
            </button>
            {copied && (
              <span style={{ fontSize: '0.72rem', color: '#0071c2', fontWeight: 600 }}>Copied!</span>
            )}
          </div>
        )}

        {/* Owner actions */}
        {showActions && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
            <Link to={`/property/${property.id}`} className="btn btn-ghost btn-sm">View</Link>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit?.(property)}>Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onTogglePublic?.(property)}>
              {property.isPublic ? 'Hide' : 'List'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete?.(property.id)}>Delete</button>
          </div>
        )}
      </div>

      {/* ── Right: price + CTA ── */}
      <div style={{
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', justifyContent: 'space-between',
        borderLeft: '1px solid #f0f0f0',
        minWidth: 155, flexShrink: 0,
        background: '#fafafa',
      }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {formatCurrency(property.price, currency)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#737373', marginTop: 1 }}>
            {t('perMonth')}
          </div>
        </div>

        {!showActions && (
          <Link
            to={`/property/${property.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '9px 14px', borderRadius: 4, fontSize: '0.86rem', fontWeight: 700,
              fontFamily: 'var(--font-body)', textDecoration: 'none',
              transition: 'background 0.15s', width: '100%', textAlign: 'center',
              ...(isAvailable
                ? { background: '#0071c2', color: '#fff', boxShadow: '0 1px 4px rgba(0,113,194,0.3)' }
                : { background: '#f0f0f0', color: '#a0a0a0', pointerEvents: 'none' }
              ),
            }}
            onMouseEnter={e => { if (isAvailable) e.currentTarget.style.background = '#005fa3'; }}
            onMouseLeave={e => { if (isAvailable) e.currentTarget.style.background = '#0071c2'; }}
          >
            {isAvailable ? t('bookProperty') : t('occupied')}
          </Link>
        )}
      </div>
    </div>
  );
}