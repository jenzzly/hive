import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getOwnerProperties, createProperty, updateProperty, deleteProperty } from '../services/propertyService';
import { getOwnerContracts, createContract } from '../services/contractService';
import { getOwnerRequests, updateMaintenanceRequest } from '../services/maintenanceService';
import { getOwnerBookings, updateBookingStatus } from '../services/bookingService';
import { getOrCreateConversation } from '../services/messageService';
import { getUserById } from '../services/userService';
import { uploadMultiple, uploadToCloudinary } from '../utils/cloudinaryUpload';
import { useToast } from '../hooks/useToast';
import PropertyCard from '../components/PropertyCard';
import ContractViewer from '../components/ContractViewer';
import type { Property, Contract, MaintenanceRequest, PropertyType, PropertyStatus, BookingRequest } from '../types';
import PropertyTypeSelector from '../components/PropertyTypeSelector';
import type { PropertyCategory } from '../types';

type Tab = 'properties' | 'contracts' | 'maintenance' | 'bookings';

const EMPTY_FORM = {
  title: '', description: '',
  category: '' as PropertyCategory,
  type: '', subcategory: '',
  price: '', location: '', amenities: '',
  status: 'available' as PropertyStatus, isPublic: true,
};

export default function OwnerDashboard() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState({ propertyId: '', tenantId: '', rentAmount: '', startDate: '', endDate: '' });
  const [contractFile, setContractFile] = useState<File | null>(null);

  const load = async () => {
    if (!userProfile) return;
    setLoading(true);
    const [props, ctrs, bkgs] = await Promise.all([
      getOwnerProperties(userProfile.id),
      getOwnerContracts(userProfile.id),
      getOwnerBookings(userProfile.id),
    ]);
    setProperties(props);
    setContracts(ctrs);
    setBookings(bkgs);
    if (props.length) {
      const reqs = await getOwnerRequests(props.map(p => p.id));
      setRequests(reqs);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      let imageUrls: string[] = editingId ? (properties.find(p => p.id === editingId)?.images || []) : [];
      if (imageFiles.length) imageUrls = await uploadMultiple(imageFiles, 'properties');
      const data = {
        title: form.title, description: form.description,
        category: form.category,
        type: form.type,
        subcategory: form.subcategory,
        price: Number(form.price), location: form.location,
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
        status: form.status, isPublic: form.isPublic, images: imageUrls, ownerId: userProfile.id,
      };
      if (editingId) { await updateProperty(editingId, data); show('Property updated!'); }
      else { await createProperty(data as any); show('Property created!'); }
      setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); setImageFiles([]);
      await load();
    } catch (err: any) { show(err.message || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Property) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      category: p.category,
      type: p.type,
      subcategory: p.subcategory,
      price: String(p.price),
      location: p.location,
      amenities: p.amenities?.join(', ') || '',
      status: p.status,
      isPublic: p.isPublic
    });
    setShowForm(true); setShowContractForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    await deleteProperty(id); show('Deleted.'); await load();
  };

  const handleTogglePublic = async (p: Property) => {
    await updateProperty(p.id, { isPublic: !p.isPublic });
    show(p.isPublic ? 'Set to private.' : 'Listed publicly.'); await load();
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      let docUrl = '';
      if (contractFile) docUrl = await uploadToCloudinary(contractFile, 'contracts');
      await createContract({ propertyId: contractForm.propertyId, tenantId: contractForm.tenantId, ownerId: userProfile.id, rentAmount: Number(contractForm.rentAmount), startDate: contractForm.startDate, endDate: contractForm.endDate, contractDocumentURL: docUrl, status: 'active' });
      await updateProperty(contractForm.propertyId, { tenantId: contractForm.tenantId, status: 'occupied' });
      show('Contract created!'); setShowContractForm(false);
      setContractForm({ propertyId: '', tenantId: '', rentAmount: '', startDate: '', endDate: '' }); setContractFile(null);
      await load();
    } catch (err: any) { show(err.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (req: MaintenanceRequest, status: MaintenanceRequest['status']) => {
    await updateMaintenanceRequest(req.id, { status }); show('Status updated.'); await load();
  };

  const handleBookingAction = async (booking: BookingRequest, status: 'approved' | 'rejected') => {
    await updateBookingStatus(booking.id, status);
    show(status === 'approved' ? 'Booking approved!' : 'Booking rejected.');
    await load();
  };

  const handleOpenChat = async (booking: BookingRequest) => {
    if (!userProfile) return;
    const prop = properties.find(p => p.id === booking.propertyId);
    const convId = await getOrCreateConversation(
      booking.propertyId,
      prop?.title || 'Property',
      userProfile.id,
      booking.tenantId,
    );
    navigate('/messages');
  };

  const openReqs = requests.filter(r => r.status === 'open').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  if (!userProfile) return null;

  return (
    <div className="container page">
      <ToastContainer />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome, {userProfile.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowContractForm(true); setShowForm(false); }}>+ Contract</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setShowContractForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }}>+ Property</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-value">{properties.length}</div><div className="stat-label">Total</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>{properties.filter(p => p.status === 'available').length}</div><div className="stat-label">Available</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#f59e0b' }}>{properties.filter(p => p.status === 'occupied').length}</div><div className="stat-label">Occupied</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: openReqs > 0 ? '#ef4444' : 'var(--teal)' }}>{openReqs}</div><div className="stat-label">Open Requests</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: pendingBookings > 0 ? '#f59e0b' : 'var(--teal)' }}>{pendingBookings}</div><div className="stat-label">Pending Bookings</div></div>
      </div>

      {/* Property Form */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 20 }}>{editingId ? 'Edit Property' : 'Add Property'}</h2>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <PropertyTypeSelector
                category={form.category}
                type={form.type}
                subcategory={form.subcategory}
                onChange={(field, value) => {
                  setForm(f => ({ ...f, [field]: value }));
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Price ($)</label>
              <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Amenities (comma-separated)</label>
              <input className="form-input" value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="WiFi, Parking, Pool..." />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PropertyStatus }))}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[true, false].map(v => (
                  <button key={String(v)} type="button"
                    style={{ flex: 1, padding: '10px 8px', border: `1.5px solid ${form.isPublic === v ? 'var(--teal)' : 'var(--border-strong)'}`, borderRadius: 8, background: form.isPublic === v ? 'var(--teal-light)' : '#fff', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)', color: form.isPublic === v ? 'var(--teal-dark)' : 'var(--text-secondary)', fontWeight: form.isPublic === v ? 500 : 400 }}
                    onClick={() => setForm(f => ({ ...f, isPublic: v }))}>
                    {v ? '🔓 Public' : '🔒 Private'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Images</label>
              <input type="file" multiple accept="image/*" className="form-input" onChange={e => setImageFiles(Array.from(e.target.files || []))} style={{ padding: '8px 14px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Contract Form */}
      {showContractForm && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 20 }}>Create Contract</h2>
          <form onSubmit={handleCreateContract} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Property</label>
              <select className="form-input" value={contractForm.propertyId} onChange={e => setContractForm(f => ({ ...f, propertyId: e.target.value }))} required>
                <option value="">Select property</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tenant ID</label>
              <input className="form-input" value={contractForm.tenantId} onChange={e => setContractForm(f => ({ ...f, tenantId: e.target.value }))} placeholder="Tenant's user ID" required />
            </div>
            <div className="form-group">
              <label className="form-label">Rent ($)</label>
              <input type="number" className="form-input" value={contractForm.rentAmount} onChange={e => setContractForm(f => ({ ...f, rentAmount: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={contractForm.startDate} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={contractForm.endDate} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contract PDF (optional)</label>
              <input type="file" accept="application/pdf" className="form-input" onChange={e => setContractFile(e.target.files?.[0] || null)} style={{ padding: '8px 14px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Contract'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowContractForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 12, padding: 4, marginBottom: 24, width: '100%', overflowX: 'auto' }}>
        {(['properties', 'contracts', 'maintenance', 'bookings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: tab === t ? '#fff' : 'transparent', cursor: 'pointer', fontSize: '0.88rem', color: tab === t ? 'var(--teal)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: tab === t ? 500 : 400, boxShadow: tab === t ? 'var(--shadow)' : 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'maintenance' && openReqs > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>{openReqs}</span>
            )}
            {t === 'bookings' && pendingBookings > 0 && (
              <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>{pendingBookings}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'properties' ? (
        properties.length === 0
          ? <div className="empty-state"><h3>No properties yet</h3><p>Click "+ Property" to get started.</p></div>
          : <div className="grid-3">{properties.map(p => <PropertyCard key={p.id} property={p} showActions onEdit={handleEdit} onDelete={handleDelete} onTogglePublic={handleTogglePublic} />)}</div>
      ) : tab === 'contracts' ? (
        contracts.length === 0
          ? <div className="empty-state"><h3>No contracts yet</h3></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{contracts.map(c => <ContractViewer key={c.id} contract={c} propertyTitle={properties.find(p => p.id === c.propertyId)?.title} />)}</div>
      ) : tab === 'bookings' ? (
        bookings.length === 0
          ? <div className="empty-state"><h3>No booking requests yet</h3><p>When tenants request to book your properties, they will appear here.</p></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bookings.map(b => (
              <div key={b.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                      {properties.find(p => p.id === b.propertyId)?.title || 'Unknown Property'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Tenant ID: <span style={{ fontFamily: 'monospace' }}>{b.tenantId}</span> · {new Date(b.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
                {b.message && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>MESSAGE FROM TENANT</span>
                    "{b.message}"
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.status === 'pending' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => handleBookingAction(b, 'approved')}>✓ Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleBookingAction(b, 'rejected')}>✗ Reject</button>
                    </>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenChat(b)}>💬 Message Tenant</button>
                </div>
              </div>
            ))}
          </div>
      ) : (
        requests.length === 0
          ? <div className="empty-state"><h3>No maintenance requests</h3></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map(r => (
              <div key={r.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{r.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{properties.find(p => p.id === r.propertyId)?.title} · {new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <PriorityBadge priority={r.priority} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{r.description}</p>
                {r.status !== 'resolved' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {r.status === 'open' && <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(r, 'in_progress')}>In Progress</button>}
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(r, 'resolved')}>Resolve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = { low: 'badge-green', medium: 'badge-blue', high: 'badge-amber', urgent: 'badge-red' };
  return <span className={`badge ${map[priority] || 'badge-gray'}`}>{priority}</span>;
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { open: 'badge-red', in_progress: 'badge-amber', resolved: 'badge-green' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status.replace('_', ' ')}</span>;
}
function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { pending: 'badge-amber', approved: 'badge-green', rejected: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{status}</span>;
}
