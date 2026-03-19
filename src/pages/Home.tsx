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

  const applyFilters = () => {
    let res = [...all];
    if (filters.location)
      res = res.filter(p => p.location.toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.category)
      res = res.filter(p => (p as any).category === filters.category);
    if (filters.type)
      res = res.filter(p => (p as any).type === filters.type);
    if (filters.subcategory)
      res = res.filter(p => (p as any).subcategory === filters.subcategory);
    if (filters.minPrice > 0)
      res = res.filter(p => p.price >= filters.minPrice);
    if (filters.maxPrice > 0)
      res = res.filter(p => p.price <= filters.maxPrice);
    setFiltered(res);
    setPage(1);
    setShowFilters(false);
  };

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
    <div>
      {/* ── Hero ── */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <span style={S.badge}>{t('longTermRentals')}</span>
          <h1 style={S.heroTitle}>{t('heroTitle')}</h1>
          <p style={S.heroSub}>{t('heroSub')}</p>

          {/* Search bar */}
          <div style={S.searchRow}>
            <div style={S.searchBox}>
              <PinIcon />
              <input
                style={S.searchInput}
                placeholder={t('searchLocation')}
                value={filters.location}
                onChange={e => sf({ location: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
              {filters.location && (
                <button onClick={() => sf({ location: '' })} style={S.clearX}>✕</button>
              )}
            </div>
            <button className="btn btn-primary" onClick={applyFilters} style={{ borderRadius: 10, height: 46 }}>
              {t('search')}
            </button>
            <button
              onClick={() => setShowFilters(o => !o)}
              style={{ ...S.filterToggleBtn, ...(showFilters ? S.filterToggleBtnActive : {}) }}
            >
              <FilterIcon />
              {t('filters')}
              {hasFilters && <span style={S.filterDot} />}
            </button>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div style={S.filterPanel}>
              <div style={S.filterGrid}>
                {/* Category */}
                <div className="form-group">
                  <label className="form-label" style={S.filterLabel}>{t('category')}</label>
                  <select className="form-input" value={filters.category}
                    onChange={e => sf({ category: e.target.value, type: '', subcategory: '' })}>
                    <option value="">{t('anyCategory')}</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Type */}
                <div className="form-group">
                  <label className="form-label" style={S.filterLabel}>{t('type')}</label>
                  <select className="form-input" value={filters.type} disabled={!filters.category}
                    onChange={e => sf({ type: e.target.value, subcategory: '' })}>
                    <option value="">{t('anyType')}</option>
                    {types.map(t2 => <option key={t2} value={t2}>{t2}</option>)}
                  </select>
                </div>
                {/* Subcategory */}
                <div className="form-group">
                  <label className="form-label" style={S.filterLabel}>{t('subcategory')}</label>
                  <select className="form-input" value={filters.subcategory} disabled={!filters.type}
                    onChange={e => sf({ subcategory: e.target.value })}>
                    <option value="">{t('anySubcategory')}</option>
                    {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Min price */}
                <div className="form-group">
                  <label className="form-label" style={S.filterLabel}>{t('minPrice')}</label>
                  <input type="number" className="form-input" placeholder={`${getCurrencySymbol(defaultCurrency)}0`}
                    value={filters.minPrice || ''}
                    onChange={e => sf({ minPrice: Number(e.target.value) })} />
                </div>
                {/* Max price */}
                <div className="form-group">
                  <label className="form-label" style={S.filterLabel}>{t('maxPrice')}</label>
                  <input type="number" className="form-input" placeholder="Any"
                    value={filters.maxPrice || ''}
                    onChange={e => sf({ maxPrice: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={applyFilters}>{t('applyFilters')}</button>
                <button onClick={resetFilters} style={S.resetBtn}>{t('reset')}</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={S.statsStrip}>
        <div style={S.statsInner}>
          <StatPill icon="🏠" label="Apartments" count={all.filter(p => (p as any).type === 'Apartment').length} />
          <StatPill icon="🏡" label="Houses" count={all.filter(p => (p as any).type === 'House').length} />
          <StatPill icon="🏢" label="Commercial" count={all.filter(p => (p as any).category === 'Commercial').length} />
          <StatPill icon="📦" label="Storage" count={all.filter(p => (p as any).category === 'Storage / Utility').length} />
        </div>
      </div>

      {/* ── Listings ── */}
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={S.listingHeader}>
          <div>
            <h2 style={S.listingTitle}>{t('availableProperties')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
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
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏚</div>
            <h3>{t('noProperties')}</h3>
            <p style={{ marginTop: 8 }}>Try adjusting or clearing your filters</p>
            {hasFilters && (
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={resetFilters}>
                {t('clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid-3">
              {paginated.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
            
            {/* Pagination UI */}
            {totalPages > 1 && (
              <div style={S.paginationRow}>
                <button 
                  className="btn btn-ghost btn-sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  style={S.pageBtn}
                >
                  {t('prev') || 'Prev'}
                </button>
                <div style={S.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      style={{
                        ...S.pageNum,
                        ...(page === num ? S.pageNumActive : {})
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button 
                  className="btn btn-ghost btn-sm" 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  style={S.pageBtn}
                >
                  {t('next') || 'Next'}
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
      <span style={{ fontWeight: 500 }}>{count}</span>
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

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  hero: {
    background: 'linear-gradient(135deg, #04342C 0%, #085041 55%, #0F6E56 100%)',
    padding: 'clamp(52px, 9vw, 100px) 0 clamp(60px, 11vw, 116px)',
    overflow: 'hidden', position: 'relative',
  },
  heroInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  badge: {
    display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'var(--teal-mid)',
    fontSize: '0.72rem', fontWeight: 500, padding: '5px 14px', borderRadius: 20,
    marginBottom: 20, border: '1px solid rgba(159,225,203,0.2)',
    letterSpacing: '0.6px', textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem, 5.5vw, 3.8rem)',
    color: '#fff', lineHeight: 1.15, marginBottom: 16,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.62)', fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
    maxWidth: 500, marginBottom: 36, lineHeight: 1.7,
  },
  searchRow: { display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 700, alignItems: 'center' },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff', borderRadius: 10, padding: '0 14px',
    flex: 1, minWidth: 200, height: 46,
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  },
  searchInput: {
    border: 'none', outline: 'none', fontSize: '0.92rem',
    color: 'var(--text-primary)', width: '100%', background: 'transparent',
    fontFamily: 'var(--font-body)',
  },
  clearX: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 2px',
  },
  filterToggleBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 46, padding: '0 16px', borderRadius: 10, border: 'none',
    background: 'rgba(255,255,255,0.12)', color: '#fff',
    cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'var(--font-body)',
    position: 'relative', transition: 'background 0.15s',
  },
  filterToggleBtnActive: { background: 'rgba(255,255,255,0.22)' },
  filterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: '50%',
    background: '#4ade80',
  },
  filterPanel: {
    marginTop: 16, padding: '20px 20px 20px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)',
    maxWidth: 700,
  },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  filterLabel: { color: 'rgba(255,255,255,0.72)' },
  resetBtn: {
    background: 'rgba(255,255,255,0.1)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
    padding: '10px 18px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'var(--font-body)',
  },
  statsStrip: { background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 0' },
  statsInner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'wrap',
  },
  statPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 20,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  },
  listingHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 16, flexWrap: 'wrap', gap: 12,
  },
  listingTitle: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', color: 'var(--text-primary)',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 20,
    background: 'var(--teal-light)', color: 'var(--teal-dark)',
    fontSize: '0.78rem', fontWeight: 500,
  },
  chipX: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--teal)', fontSize: '0.7rem', padding: 0, lineHeight: 1,
  },
  paginationRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 40 },
  pageNumbers: { display: 'flex', gap: 8 },
  pageNum: {
    width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
    background: '#fff', color: 'var(--text-secondary)', fontSize: '0.9rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  pageNumActive: {
    background: 'var(--teal)', color: '#fff', borderColor: 'var(--teal)', fontWeight: 600,
  },
  pageBtn: { padding: '8px 16px', borderRadius: 8 },
};
