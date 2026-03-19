import { useEffect, useState } from 'react';
import { getAllProperties, deleteProperty, updateProperty } from '../services/propertyService';
import { useToast } from '../hooks/useToast';
import PropertyCard from '../components/PropertyCard';
import type { Property } from '../types';

export default function AdminDashboard() {
  const { show, ToastContainer } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  useEffect(() => { setPage(1); }, [search]);

  const load = async () => {
    setLoading(true);
    const all = await getAllProperties();
    setProperties(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    await deleteProperty(id);
    show('Property deleted.');
    await load();
  };

  const handleTogglePublic = async (p: Property) => {
    await updateProperty(p.id, { isPublic: !p.isPublic });
    show(`Listing updated.`);
    await load();
  };

  const filtered = search
    ? properties.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()))
    : properties;

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function Pagination({ current, total, pageSize, onChange }: { current: number; total: number; pageSize: number; onChange: (p: number) => void }) {
    const pages = Math.ceil(total / pageSize);
    if (pages <= 1) return null;
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 40, justifyContent: 'center', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" disabled={current === 1} onClick={() => onChange(current - 1)}>Prev</button>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page {current} of {pages}</span>
        <button className="btn btn-ghost btn-sm" disabled={current === pages} onClick={() => onChange(current + 1)}>Next</button>
      </div>
    );
  }

  const stats = {
    total: properties.length,
    available: properties.filter(p => p.status === 'available').length,
    occupied: properties.filter(p => p.status === 'occupied').length,
    public: properties.filter(p => p.isPublic).length,
  };

  return (
    <div className="container page">
      <ToastContainer />
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Full platform overview</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Properties</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>{stats.available}</div><div className="stat-label">Available</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#f59e0b' }}>{stats.occupied}</div><div className="stat-label">Occupied</div></div>
        <div className="stat-card"><div className="stat-value">{stats.public}</div><div className="stat-label">Public Listings</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
          All Properties
        </h2>
        <input
          className="form-input"
          placeholder="Search by title or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280, fontSize: '0.88rem' }}
        />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><h3>No properties found</h3></div>
      ) : (
        /* Properties Grid */
        <div>
          <div className="grid-3">
            {paginated.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                showActions
                onDelete={handleDelete}
                onTogglePublic={handleTogglePublic}
              />
            ))}
          </div>
          <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
