import { useState, useEffect } from 'react';
import { getPublicProperties } from '../services/propertyService';
import { useLang } from '../contexts/LanguageContext';
import { getCategories, getTypes, getSubcategories } from '../utils/propertyTaxonomy';
import PropertyCard from '../components/PropertyCard';
import { useSettings } from '../contexts/SettingsContext';
import { getCurrencySymbol } from '../utils/format';
import type { Property } from '../types';

interface Filters {
  location: string;
  category: string;
  type: string;
  subcategory: string;
  minPrice: number;
  maxPrice: number;
}

const EMPTY_FILTERS: Filters = {
  location: '', category: '', type: '', subcategory: '', minPrice: 0, maxPrice: 0,
};

export default function Home() {
  const { t } = useLang();
  const { defaultCurrency } = useSettings();
  const [all, setAll] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    getPublicProperties()
      .then(data => {
        const sorted = [...data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAll(sorted);
        setFiltered(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let res = [...all];

    // Global Search (Location, Title, Description)
    if (filters.location) {
      const q = filters.location.toLowerCase();
      res = res.filter(p => 
        p.location.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (filters.category)
      res = res.filter(p => (p as any).category === filters.category);
    
    if (filters.type)
      res = res.filter(p => (p as any).type === filters.type);
    
    if (filters.subcategory)
      res = res.filter(p => (p as any).subcategory === filters.subcategory);

    if (filters.minPrice > 0 || filters.maxPrice > 0) {
      res = res.filter(p => {
        // Convert property price to filter currency (defaultCurrency)
        let priceInFilterCurrency = p.price;
        if (p.currency !== defaultCurrency) {
          if (p.currency === 'USD' && defaultCurrency === 'RWF') {
            priceInFilterCurrency = p.price * 1300;
          } else if (p.currency === 'RWF' && defaultCurrency === 'USD') {
            priceInFilterCurrency = p.price / 1300;
          }
        }
        
        if (filters.minPrice > 0 && priceInFilterCurrency < filters.minPrice) return false;
        if (filters.maxPrice > 0 && priceInFilterCurrency > filters.maxPrice) return false;
        return true;
      });
    }

    setFiltered(res);
    setPage(1);
  }, [filters, all, defaultCurrency]);

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setFiltered(all);
    setPage(1);
  };

  const sf = (patch: Partial<Filters>) => setFilters(f => ({ ...f, ...patch }));
  const hasFilters = Object.values(filters).some(v => v !== '' && v !== 0);

  const categories = getCategories();
  const types = getTypes(filters.category);
  const subcategories = getSubcategories(filters.category, filters.type);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div style={{ background: '#f2f2f2', minHeight: '100vh' }}>

      {/* ── Hero / Search ───────────────────────────────────────────── */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.heroTitle}>{t('heroTitle')}</h1>
          <p style={S.heroSub}>{t('heroSub')}</p>

          {/* Search bar — booking.com style */}
          <div style={S.searchCard}>
            <div className="owner-content-row" style={S.searchRow}>
              <div style={S.searchField}>
                <span style={S.searchIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071c2" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <input
                  style={S.searchInput}
                  placeholder={t('searchLocation') || 'Where are you going?'}
                  value={filters.location}
                  onChange={e => sf({ location: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && setShowFilters(false)}
                />
                {filters.location && (
                  <button onClick={() => sf({ location: '' })} style={S.clearX}>✕</button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
                <button
                  onClick={() => setShowFilters(o => !o)}
                  style={{ ...S.filtersBtn, ...(showFilters ? S.filtersBtnActive : {}), flex: 1 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                  </svg>
                  {t('filters')}
                  {hasFilters && <span style={S.filterDot} />}
                </button>

                <button onClick={() => setShowFilters(false)} style={{ ...S.searchBtn, flex: 1 }}>
                  {t('search')}
                </button>
              </div>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div style={S.filterPanel}>
                <div style={S.filterGrid}>
                  <div className="form-group">
                    <label className="form-label">{t('category')}</label>
                    <select className="form-input" value={filters.category}
                      onChange={e => sf({ category: e.target.value, type: '', subcategory: '' })}>
                      <option value="">{t('anyCategory')}</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('type')}</label>
                    <select className="form-input" value={filters.type} disabled={!filters.category}
                      onChange={e => sf({ type: e.target.value, subcategory: '' })}>
                      <option value="">{t('anyType')}</option>
                      {types.map(t2 => <option key={t2} value={t2}>{t2}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('subcategory')}</label>
                    <select className="form-input" value={filters.subcategory} disabled={!filters.type}
                      onChange={e => sf({ subcategory: e.target.value })}>
                      <option value="">{t('anySubcategory')}</option>
                      {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('minPrice')}</label>
                    <input type="number" className="form-input" placeholder={`${getCurrencySymbol(defaultCurrency)}0`}
                      value={filters.minPrice || ''}
                      onChange={e => sf({ minPrice: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('maxPrice')}</label>
                    <input type="number" className="form-input" placeholder="Any"
                      value={filters.maxPrice || ''}
                      onChange={e => sf({ maxPrice: Number(e.target.value) })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-primary" style={{ borderRadius: 4 }} onClick={() => setShowFilters(false)}>{t('done') || 'Done'}</button>
                  <button onClick={resetFilters} style={S.resetBtn}>{t('reset')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <div style={S.statsStrip}>
        <div style={S.statsInner}>
          <StatPill icon="🏠" label="Apartments" count={all.filter(p => (p as any).type === 'Apartment').length} />
          <StatPill icon="🏡" label="Houses" count={all.filter(p => (p as any).type === 'House').length} />
          <StatPill icon="🏢" label="Commercial" count={all.filter(p => (p as any).category === 'Commercial').length} />
          <StatPill icon="📦" label="Storage" count={all.filter(p => (p as any).category === 'Storage / Utility').length} />
        </div>
      </div>

      {/* ── Listings ────────────────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>

        {/* Header row */}
        <div style={S.listingHeader}>
          <div>
            <h2 style={S.listingTitle}>{t('availableProperties')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 3 }}>
              {filtered.length} {filtered.length === 1 ? t('propertyFound') : t('propertiesFound')}
            </p>
          </div>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              ✕ {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div style={S.chips}>
            {filters.category && <Chip label={filters.category} onRemove={() => sf({ category: '', type: '', subcategory: '' })} />}
            {filters.type && <Chip label={filters.type} onRemove={() => sf({ type: '', subcategory: '' })} />}
            {filters.subcategory && <Chip label={filters.subcategory} onRemove={() => sf({ subcategory: '' })} />}
            {filters.location && <Chip label={`📍 ${filters.location}`} onRemove={() => sf({ location: '' })} />}
            {filters.minPrice > 0 && <Chip label={`Min ${getCurrencySymbol(defaultCurrency)}${filters.minPrice}`} onRemove={() => sf({ minPrice: 0 })} />}
            {filters.maxPrice > 0 && <Chip label={`Max ${getCurrencySymbol(defaultCurrency)}${filters.maxPrice}`} onRemove={() => sf({ maxPrice: 0 })} />}
          </div>
        )}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏚</div>
            <h3>{t('noProperties')}</h3>
            <p style={{ marginTop: 8, fontSize: '0.9rem' }}>Try adjusting or clearing your filters</p>
            {hasFilters && (
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={resetFilters}>
                {t('clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Booking.com uses a stacked list layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paginated.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>

            {totalPages > 1 && (
              <div style={S.paginationRow}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}>
                  ‹ {t('prev') || 'Previous'}
                </button>
                <div style={S.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                    <button key={num} onClick={() => setPage(num)}
                      style={{ ...S.pageNum, ...(page === num ? S.pageNumActive : {}) }}>
                      {num}
                    </button>
                  ))}
                </div>
                <button className="btn btn-ghost btn-sm" disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}>
                  {t('next') || 'Next'} ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatPill({ icon, label, count }: { icon: string; label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div style={S.statPill}>
      <span>{icon}</span>
      <span style={{ fontWeight: 700, color: 'var(--blue-700)' }}>{count}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{label}</span>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={S.chip}>
      {label}
      <button onClick={onRemove} style={S.chipX}>✕</button>
    </span>
  );
}

const S: Record<string, React.CSSProperties> = {
  /* ── Hero ─────────────────────────────────────────────────────── */
  hero: {
    background: 'linear-gradient(180deg, #003580 0%, #0057b8 100%)',
    padding: 'clamp(36px, 6vw, 72px) 0 clamp(56px, 9vw, 96px)',
  },
  heroInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  heroTitle: {
    color: '#fff',
    fontSize: 'clamp(1.6rem, 4.5vw, 2.8rem)',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: 10,
    letterSpacing: '-0.4px',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 'clamp(0.88rem, 1.6vw, 1rem)',
    marginBottom: 28,
    maxWidth: 560,
    lineHeight: 1.6,
  },

  /* ── Search card ──────────────────────────────────────────────── */
  searchCard: {
    background: '#fff',
    borderRadius: 8,
    padding: 8,
    boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
    maxWidth: 900,
    border: '2px solid #febb02',
  },
  searchRow: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  searchField: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff', flex: 1, minWidth: 200,
    padding: '0 12px',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    height: 46,
  },
  searchIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  searchInput: {
    border: 'none', outline: 'none', fontSize: '0.95rem',
    color: 'var(--text-primary)', width: '100%',
    background: 'transparent', fontFamily: 'var(--font-body)',
    fontWeight: 500,
  },
  clearX: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 2px', lineHeight: 1,
  },
  filtersBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 46, padding: '0 16px', borderRadius: 4,
    border: '1px solid #d4d4d4', background: '#fff',
    color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: '0.88rem', fontFamily: 'var(--font-body)',
    fontWeight: 600, position: 'relative', transition: 'all 0.15s',
  },
  filtersBtnActive: { borderColor: '#0071c2', color: '#0071c2', background: '#eff6ff' },
  filterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: '50%', background: '#008009',
  },
  searchBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    height: 46, padding: '0 24px', borderRadius: 4,
    background: '#0071c2', color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 700,
    fontFamily: 'var(--font-body)',
    transition: 'background 0.15s',
    boxShadow: '0 1px 4px rgba(0,113,194,0.3)',
  },
  filterPanel: {
    borderTop: '1px solid #e7e7e7',
    marginTop: 8,
    paddingTop: 16,
    paddingLeft: 4,
    paddingRight: 4,
  },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  resetBtn: {
    background: 'transparent', color: 'var(--text-secondary)',
    border: '1px solid #d4d4d4', borderRadius: 4,
    padding: '10px 18px', cursor: 'pointer',
    fontSize: '0.9rem', fontFamily: 'var(--font-body)', fontWeight: 600,
  },

  /* ── Stats strip ──────────────────────────────────────────────── */
  statsStrip: {
    background: '#fff',
    borderBottom: '1px solid #e7e7e7',
    padding: '10px 0',
  },
  statsInner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'wrap',
  },
  statPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 14px', borderRadius: 20,
    background: 'var(--gray-50)', border: '1px solid #e7e7e7',
    fontSize: '0.84rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  },

  /* ── Listings ─────────────────────────────────────────────────── */
  listingHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 16,
    flexWrap: 'wrap', gap: 8,
  },
  listingTitle: {
    fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.2px',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 4,
    background: 'var(--blue-50)', color: 'var(--blue-700)',
    fontSize: '0.78rem', fontWeight: 600,
    border: '1px solid var(--blue-100)',
  },
  chipX: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--blue-500)', fontSize: '0.7rem', padding: 0, lineHeight: 1,
  },

  /* ── Pagination ───────────────────────────────────────────────── */
  paginationRow: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'center', gap: 12, marginTop: 36,
  },
  pageNumbers: { display: 'flex', gap: 6 },
  pageNum: {
    width: 36, height: 36, borderRadius: 4,
    border: '1px solid #d4d4d4', background: '#fff',
    color: 'var(--text-secondary)', fontSize: '0.9rem',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.12s', fontFamily: 'var(--font-body)', fontWeight: 600,
  },
  pageNumActive: {
    background: 'var(--blue-800)', color: '#fff',
    borderColor: 'var(--blue-800)', fontWeight: 700,
  },
};
