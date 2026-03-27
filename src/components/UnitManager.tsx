import { useState, useEffect } from 'react';
import { getPropertyUnits, createUnit, updateUnit, deleteUnit } from '../services/unitService';
import { uploadMultiple } from '../utils/contentsUpload';
import { formatCurrency } from '../utils/format';
import type { Unit, Property, Currency, PropertyStatus } from '../types';

interface Props {
  property: Property;
  onClose: () => void;
}

export default function UnitManager({ property, onClose }: Props) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: property.currency || 'USD',
    status: 'available' as PropertyStatus,
    amenities: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    loadUnits();
  }, [property.id]);

  const loadUnits = async () => {
    setLoading(true);
    try {
      const data = await getPropertyUnits(property.id);
      setUnits(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let images: string[] = editingId ? (units.find(u => u.id === editingId)?.images ?? []) : [];
      if (imageFiles.length > 0) {
        images = await uploadMultiple(imageFiles, 'units');
      }

      const unitData = {
        propertyId: property.id,
        ownerId: property.ownerId,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        currency: form.currency as Currency,
        status: form.status,
        images,
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      };

      if (editingId) {
        await updateUnit(editingId, unitData);
      } else {
        await createUnit(unitData);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({
        title: '',
        description: '',
        price: '',
        currency: property.currency || 'USD',
        status: 'available',
        amenities: '',
      });
      setImageFiles([]);
      loadUnits();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setForm({
      title: unit.title,
      description: unit.description,
      price: String(unit.price),
      currency: unit.currency,
      status: unit.status,
      amenities: unit.amenities?.join(', ') || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this unit?')) return;
    await deleteUnit(id);
    loadUnits();
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <h2 style={S.title}>Manage Units: {property.title}</h2>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.content}>
          {!showForm && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowForm(true)}
              >
                + Add Unit
              </button>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  className="form-input" 
                  placeholder="Search units..." 
                  value={search} 
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ paddingLeft: 34, height: 42, minHeight: 42 }}
                />
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              </div>
            </div>
          )}

          {showForm && (
            <div style={S.formCard}>
              <h3>{editingId ? 'Edit Unit' : 'New Unit'}</h3>
              <form onSubmit={handleSave} style={S.form}>
                <div className="form-group">
                  <label className="form-label">Unit Title *</label>
                  <input 
                    className="form-input" 
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                    required 
                    placeholder="e.g. Apartment A1"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Price *</label>
                    <input 
                      className="form-input" 
                      type="number" 
                      value={form.price} 
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select 
                      className="form-input" 
                      value={form.currency} 
                      onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    >
                      <option value="USD">USD</option>
                      <option value="RWF">RWF</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-input" 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                    rows={3} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amenities (comma-separated)</label>
                  <input 
                    className="form-input" 
                    value={form.amenities} 
                    onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} 
                    placeholder="AC, Balcony, Private Bath..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Photos</label>
                  <input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files || []))} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Unit'}
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="spinner" />
          ) : (
            <div style={S.unitList}>
              {(() => {
                const filtered = units.filter(u => 
                  u.title.toLowerCase().includes(search.toLowerCase()) || 
                  u.description.toLowerCase().includes(search.toLowerCase())
                );
                const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

                if (filtered.length === 0) {
                  return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No units found.</p>;
                }

                return (
                  <>
                    {paginated.map(unit => {
                      const isExpanded = editingId === `view-${unit.id}`;
                      return (
                        <div key={unit.id} style={{ ...S.unitItem, flexDirection: 'column', alignItems: 'stretch' }}>
                          <div 
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setEditingId(isExpanded ? null : `view-${unit.id}`)}
                          >
                            <div style={{ display: 'flex', gap: 16 }}>
                              <img 
                                src={unit.images[0] || 'https://via.placeholder.com/100x100?text=No+Image'} 
                                alt={unit.title} 
                                style={S.unitThumb}
                              />
                              <div>
                                <div style={{ fontWeight: 600 }}>{unit.title}</div>
                                <div style={{ color: 'var(--teal)', fontWeight: 700 }}>
                                  {formatCurrency(unit.price, unit.currency)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {unit.status}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); handleEdit(unit); }}>Edit</button>
                              <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); handleDelete(unit.id); }}>Del</button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ marginTop: 12, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: '0.88rem' }}>
                              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Description</div>
                              <div style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>{unit.description || 'No description provided.'}</div>
                              
                              {unit.amenities && unit.amenities.length > 0 && (
                                <>
                                  <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Amenities</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {unit.amenities.map(a => (
                                      <span key={a} className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{a}</span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          disabled={page === 1} 
                          onClick={() => setPage(p => p - 1)}
                        >
                          Prev
                        </button>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Page {page} of {totalPages}
                        </span>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          disabled={page === totalPages} 
                          onClick={() => setPage(p => p + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600,
    maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  header: {
    padding: '16px 24px', borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: '1.2rem', margin: 0, color: 'var(--terra-900)' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' },
  content: { padding: 24, overflowY: 'auto', flex: 1 },
  formCard: { 
    background: 'var(--surface2)', padding: 20, borderRadius: 12, 
    marginBottom: 24, border: '1px solid var(--border)' 
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  unitList: { display: 'flex', flexDirection: 'column', gap: 12 },
  unitItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, border: '1px solid var(--border)', borderRadius: 10,
  },
  unitThumb: { width: 60, height: 60, borderRadius: 8, objectFit: 'cover' },
};
