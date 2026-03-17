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
        <div className="grid-3">
          {filtered.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              showActions
              onDelete={handleDelete}
              onTogglePublic={handleTogglePublic}
            />
          ))}
        </div>
      )}
    </div>
  );
}
