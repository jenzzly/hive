import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getOwnerProperties, createProperty, updateProperty, deleteProperty } from '../services/propertyService';
import { getOwnerContracts, createContract } from '../services/contractService';
import { getOwnerRequests, updateMaintenanceRequest } from '../services/maintenanceService';
import { getOwnerBookings, updateBookingStatus } from '../services/bookingService';
import { getOwnerPayments, updatePaymentStatus } from '../services/paymentService';
import { getOwnerReimbursements, updateReimbursementStatus } from '../services/reimbursementService';
import { getOrCreateConversation } from '../services/messageService';
import { uploadMultiple, uploadToCloudinary } from '../utils/cloudinaryUpload';
import { useToast } from '../hooks/useToast';
import ContractViewer from '../components/ContractViewer';
import PropertyTypeSelector from '../components/PropertyTypeSelector';
import type {
  Property, Contract, MaintenanceRequest, PropertyStatus,
  BookingRequest, RentPayment, ReimbursementRequest, PropertyCategory,
} from '../types';

type Tab = 'properties' | 'finance' | 'maintenance' | 'bookings' | 'contracts';

const EMPTY_FORM = {
  title: '', description: '',
  category: '' as PropertyCategory,
  type: '', subcategory: '',
  price: '', location: '', amenities: '',
  status: 'available' as PropertyStatus, isPublic: true,
};

// ── Status badges ───────────────────────────────────────────────────────
function BookingBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:  ['#f59e0b', 'Pending'],
    approved: ['var(--teal)', 'Approved'],
    rejected: ['#ef4444', 'Rejected'],
  };
  const [color, label] = map[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

function PayBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:  ['#f59e0b', '⏳ Pending'],
    verified: ['var(--teal)', '✓ Verified'],
    rejected: ['#ef4444', '✗ Rejected'],
  };
  const [color, label] = map[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

function ReimbBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:  ['#f59e0b', '⏳ Pending'],
    approved: ['#3b82f6', '✓ Approved'],
    paid:     ['var(--teal)', '💸 Paid'],
    rejected: ['#ef4444', '✗ Rejected'],
  };
  const [color, label] = map[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

// ── Finance card for a single property ─────────────────────────────────
function PropertyFinanceCard({
  property, contracts, payments, requests, reimbursements, onVerifyPayment, onReimbAction,
}: {
  property: Property;
  contracts: Contract[];
  payments: RentPayment[];
  requests: MaintenanceRequest[];
  reimbursements: ReimbursementRequest[];
  onVerifyPayment: (id: string, status: 'verified' | 'rejected') => void;
  onReimbAction: (id: string, status: 'approved' | 'rejected' | 'paid', note?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const contract = contracts.find(c => c.propertyId === property.id && c.status === 'active');
  const propPayments = payments.filter(p => p.propertyId === property.id);
  const propReimbs = reimbursements.filter(r => r.propertyId === property.id);
  const propRepairs = requests.filter(r => r.propertyId === property.id && r.repairCost);

  const totalRentCollected = propPayments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0);
  const totalRepairs = propRepairs.reduce((s, r) => s + (r.repairCost ?? 0), 0);
  const deposit = contract?.depositAmount ?? 0;
  const pendingPayments = propPayments.filter(p => p.status === 'pending').length;
  const pendingReimbs = propReimbs.filter(r => r.status === 'pending').length;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏠</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>{property.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {property.location}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Rent Collected</div>
            <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '1.05rem' }}>${totalRentCollected.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Deposit</div>
            <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '1.05rem' }}>${deposit.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Repairs</div>
            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.05rem' }}>${totalRepairs.toLocaleString()}</div>
          </div>
          {(pendingPayments > 0 || pendingReimbs > 0) && (
            <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {pendingPayments + pendingReimbs} pending
            </span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
          {/* Contract info */}
          {contract ? (
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div><div style={S.label}>Monthly Rent</div><div style={S.val}>${contract.rentAmount.toLocaleString()}</div></div>
              <div><div style={S.label}>Deposit</div><div style={S.val}>${(contract.depositAmount ?? 0).toLocaleString()}</div></div>
              <div><div style={S.label}>Lease Start</div><div style={S.val}>{contract.startDate}</div></div>
              <div><div style={S.label}>Lease End</div><div style={S.val}>{contract.endDate}</div></div>
              <div><div style={S.label}>Status</div><div style={S.val}><span className={`badge ${contract.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{contract.status}</span></div></div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>No active contract for this property.</div>
          )}

          {/* Rent payments */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 10, color: 'var(--text-primary)' }}>💳 Rent Payments</div>
            {propPayments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>No payments submitted yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {propPayments.map(pay => (
                  <div key={pay.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{pay.month} — ${pay.amount.toLocaleString()}</div>
                      {pay.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PayBadge status={pay.status} />
                      {pay.proofUrl && (
                        <a href={pay.proofUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>📎 Receipt</a>
                      )}
                      {pay.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => onVerifyPayment(pay.id, 'verified')}>Verify</button>
                          <button className="btn btn-danger btn-sm" onClick={() => onVerifyPayment(pay.id, 'rejected')}>Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Repairs */}
          {propRepairs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 10, color: 'var(--text-primary)' }}>🔧 Repair Costs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {propRepairs.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.88rem' }}>{r.title}</span>
                    <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.88rem' }}>${(r.repairCost ?? 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reimbursement requests */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 10, color: 'var(--text-primary)' }}>↩ Reimbursement Requests</div>
            {propReimbs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>No reimbursement requests.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {propReimbs.map(r => (
                  <div key={r.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{r.title} — <span style={{ color: '#3b82f6' }}>${r.amount.toLocaleString()}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
                      </div>
                      <ReimbBadge status={r.status} />
                    </div>
                    {r.receiptUrls?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {r.receiptUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>📎 Receipt {i + 1}</a>
                        ))}
                      </div>
                    )}
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => onReimbAction(r.id, 'approved')}>Approve</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => onReimbAction(r.id, 'paid')}>Mark Paid</button>
                        <button className="btn btn-danger btn-sm" onClick={() => onReimbAction(r.id, 'rejected')}>Reject</button>
                      </div>
                    )}
                    {r.status === 'approved' && (
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => onReimbAction(r.id, 'paid')}>Mark as Paid</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Property form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // Contract form
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState({ propertyId: '', tenantId: '', rentAmount: '', depositAmount: '', startDate: '', endDate: '' });
  const [contractFile, setContractFile] = useState<File | null>(null);

  // Repair cost editing
  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);
  const [repairCostInput, setRepairCostInput] = useState('');

  const load = async () => {
    if (!userProfile) return;
    setLoading(true);
    const [props, ctrs, reqs, bkgs, pays, reimbs] = await Promise.all([
      getOwnerProperties(userProfile.id),
      getOwnerContracts(userProfile.id),
      getOwnerRequests((await getOwnerProperties(userProfile.id)).map(p => p.id)),
      getOwnerBookings(userProfile.id),
      getOwnerPayments(userProfile.id),
      getOwnerReimbursements(userProfile.id),
    ]);
    setProperties(props);
    setContracts(ctrs);
    setRequests(reqs);
    setBookings(bkgs);
    setPayments(pays);
    setReimbursements(reimbs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      let images: string[] = editingId ? (properties.find(p => p.id === editingId)?.images ?? []) : [];
      if (imageFiles.length > 0) images = await uploadMultiple(imageFiles, 'properties');
      const data = {
        title: form.title, description: form.description,
        category: form.category, type: form.type as any, subcategory: form.subcategory,
        price: Number(form.price), location: form.location,
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
        status: form.status, isPublic: form.isPublic,
        ownerId: userProfile.id, images,
      };
      if (editingId) { await updateProperty(editingId, data); show('Property updated!'); }
      else { await createProperty(data as any); show('Property created!'); }
      setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); setImageFiles([]);
      await load();
    } catch (err: any) { show(err.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Property) => {
    setEditingId(p.id);
    setForm({
      title: p.title, description: p.description,
      category: p.category, type: p.type, subcategory: p.subcategory,
      price: String(p.price), location: p.location,
      amenities: p.amenities.join(', '), status: p.status, isPublic: p.isPublic,
    });
    setShowForm(true); setShowContractForm(false);
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
      await createContract({
        propertyId: contractForm.propertyId,
        tenantId: contractForm.tenantId,
        ownerId: userProfile.id,
        rentAmount: Number(contractForm.rentAmount),
        depositAmount: Number(contractForm.depositAmount) || 0,
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        contractDocumentURL: docUrl,
        status: 'active',
      });
      await updateProperty(contractForm.propertyId, {
        tenantId: contractForm.tenantId,
        status: 'occupied',
        isPublic: false,      // hide from public listings once occupied
      });
      show('Contract created! Property set to occupied & private.');
      setShowContractForm(false);
      setContractForm({ propertyId: '', tenantId: '', rentAmount: '', depositAmount: '', startDate: '', endDate: '' });
      setContractFile(null);
      await load();
    } catch (err: any) { show(err.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  // ── Booking approval: set property to occupied + private ──────────────
  const handleBookingAction = async (booking: BookingRequest, status: 'approved' | 'rejected') => {
    await updateBookingStatus(booking.id, status);
    if (status === 'approved') {
      await updateProperty(booking.propertyId, {
        status: 'occupied',
        isPublic: false,
        tenantId: booking.tenantId,
      });
      show('Booking approved! Property is now occupied and hidden from listings.');
    } else {
      show('Booking rejected.');
    }
    await load();
  };

  const handleOpenChat = async (booking: BookingRequest) => {
    if (!userProfile) return;
    const prop = properties.find(p => p.id === booking.propertyId);
    await getOrCreateConversation(booking.propertyId, prop?.title || 'Property', userProfile.id, booking.tenantId);
    navigate('/messages');
  };

  const handleStatusUpdate = async (req: MaintenanceRequest, status: MaintenanceRequest['status']) => {
    await updateMaintenanceRequest(req.id, { status }); show('Status updated.'); await load();
  };

  const handleSaveRepairCost = async (reqId: string) => {
    const cost = parseFloat(repairCostInput);
    if (isNaN(cost)) return;
    await updateMaintenanceRequest(reqId, { repairCost: cost });
    setEditingRepairId(null); setRepairCostInput('');
    show('Repair cost saved.'); await load();
  };

  const handleVerifyPayment = async (id: string, status: 'verified' | 'rejected') => {
    await updatePaymentStatus(id, status);
    show(status === 'verified' ? 'Payment verified!' : 'Payment rejected.'); await load();
  };

  const handleReimbAction = async (id: string, status: 'approved' | 'rejected' | 'paid', note?: string) => {
    await updateReimbursementStatus(id, status, note);
    show(`Reimbursement ${status}.`); await load();
  };

  const openReqs = requests.filter(r => r.status === 'open').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const pendingReimbs = reimbursements.filter(r => r.status === 'pending').length;
  const totalRentCollected = payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0);
  const totalDeposits = contracts.reduce((s, c) => s + (c.depositAmount ?? 0), 0);
  const totalRepairs = requests.filter(r => r.repairCost).reduce((s, r) => s + (r.repairCost ?? 0), 0);

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'properties', label: '🏠 Properties' },
    { key: 'finance', label: '💰 Finance', badge: pendingPayments + pendingReimbs },
    { key: 'bookings', label: '📋 Bookings', badge: pendingBookings },
    { key: 'maintenance', label: '🔧 Maintenance', badge: openReqs },
    { key: 'contracts', label: '📄 Contracts' },
  ];

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
      <div className="grid-4" style={{ marginBottom: 28, gap: 12 }}>
        <div className="stat-card"><div className="stat-value">{properties.length}</div><div className="stat-label">Properties</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>${totalRentCollected.toLocaleString()}</div><div className="stat-label">Rent Collected</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#3b82f6' }}>${totalDeposits.toLocaleString()}</div><div className="stat-label">Total Deposits</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#ef4444' }}>${totalRepairs.toLocaleString()}</div><div className="stat-label">Repair Costs</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 12, padding: 4, marginBottom: 28, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ position: 'relative', padding: '8px 16px', borderRadius: 9, border: 'none', background: tab === t.key ? '#fff' : 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: tab === t.key ? 'var(--teal)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: tab === t.key ? 600 : 400, boxShadow: tab === t.key ? 'var(--shadow)' : 'none', whiteSpace: 'nowrap' }}>
            {t.label}
            {(t.badge ?? 0) > 0 && (
              <span style={{ position: 'absolute', top: 3, right: 4, background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '1px 4px', borderRadius: 8 }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Property form */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 20 }}>{editingId ? 'Edit Property' : 'Add Property'}</h2>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Location *</label><input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Type</label><PropertyTypeSelector category={form.category} type={form.type} subcategory={form.subcategory} onChange={(field, value) => setForm(f => ({ ...f, [field]: value }))} /></div>
            <div className="form-group"><label className="form-label">Monthly Price ($)</label><input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Amenities (comma-separated)</label><input className="form-input" value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="WiFi, Parking, Pool..." /></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PropertyStatus }))}><option value="available">Available</option><option value="occupied">Occupied</option></select></div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[true, false].map(v => (
                  <button key={String(v)} type="button"
                    style={{ flex: 1, padding: '10px 8px', border: `1.5px solid ${form.isPublic === v ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 8, background: form.isPublic === v ? 'var(--teal-light)' : 'transparent', color: form.isPublic === v ? 'var(--teal)' : 'var(--text-secondary)', fontWeight: form.isPublic === v ? 600 : 400, cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => setForm(f => ({ ...f, isPublic: v }))}>
                    {v ? '🌐 Public' : '🔒 Private'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Photos</label><input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files || []))} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Contract form */}
      {showContractForm && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 20 }}>New Contract</h2>
          <form onSubmit={handleCreateContract} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="form-group"><label className="form-label">Property</label>
              <select className="form-input" value={contractForm.propertyId} onChange={e => setContractForm(f => ({ ...f, propertyId: e.target.value }))} required>
                <option value="">Select property...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Tenant ID</label><input className="form-input" value={contractForm.tenantId} onChange={e => setContractForm(f => ({ ...f, tenantId: e.target.value }))} placeholder="Firebase UID..." required /></div>
            <div className="form-group"><label className="form-label">Monthly Rent ($)</label><input className="form-input" type="number" value={contractForm.rentAmount} onChange={e => setContractForm(f => ({ ...f, rentAmount: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Deposit ($)</label><input className="form-input" type="number" value={contractForm.depositAmount} onChange={e => setContractForm(f => ({ ...f, depositAmount: e.target.value }))} placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={contractForm.startDate} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={contractForm.endDate} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))} required /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Contract Document (optional)</label><input type="file" accept=".pdf,image/*" onChange={e => setContractFile(e.target.files?.[0] ?? null)} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Contract'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowContractForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'properties' ? (
        properties.length === 0 ? (
          <div className="empty-state"><h3>No properties yet</h3><p>Add your first property to get started.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {properties.map(p => (
              <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
                {p.images?.[0] && <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>📍 {p.location}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className={`badge ${p.status === 'available' ? 'badge-green' : 'badge-amber'}`}>{p.status}</span>
                    <span className={`badge ${p.isPublic ? 'badge-blue' : 'badge-gray'}`}>{p.isPublic ? '🌐 Public' : '🔒 Private'}</span>
                    <span className="badge badge-teal">${p.price.toLocaleString()}/mo</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePublic(p)}>{p.isPublic ? 'Make Private' : 'Make Public'}</button>
                    <button className="btn btn-ghost btn-sm" onClick={async () => { await updateProperty(p.id, { status: p.status === 'available' ? 'occupied' : 'available' }); await load(); }}>Toggle Status</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'finance' ? (
        <div>
          {/* Finance summary bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>${totalRentCollected.toLocaleString()}</div><div className="stat-label">Total Rent Collected</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: '#3b82f6' }}>${totalDeposits.toLocaleString()}</div><div className="stat-label">Deposits Held</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: '#ef4444' }}>${totalRepairs.toLocaleString()}</div><div className="stat-label">Repair Spend</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: pendingPayments > 0 ? '#f59e0b' : 'var(--teal)' }}>{pendingPayments}</div><div className="stat-label">Payments to Verify</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: pendingReimbs > 0 ? '#f59e0b' : 'var(--teal)' }}>{pendingReimbs}</div><div className="stat-label">Pending Reimbursements</div></div>
          </div>
          {properties.length === 0 ? (
            <div className="empty-state"><h3>No properties yet</h3></div>
          ) : (
            properties.map(p => (
              <PropertyFinanceCard
                key={p.id}
                property={p}
                contracts={contracts}
                payments={payments}
                requests={requests}
                reimbursements={reimbursements}
                onVerifyPayment={handleVerifyPayment}
                onReimbAction={handleReimbAction}
              />
            ))
          )}
        </div>
      ) : tab === 'bookings' ? (
        bookings.length === 0 ? (
          <div className="empty-state"><h3>No booking requests yet</h3><p>Booking requests from tenants will appear here.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bookings.map(b => (
              <div key={b.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{properties.find(p => p.id === b.propertyId)?.title || 'Unknown Property'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleDateString()}</div>
                  </div>
                  <BookingBadge status={b.status} />
                </div>
                {b.message && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>TENANT MESSAGE</span>
                    "{b.message}"
                  </div>
                )}
                {b.status === 'pending' && (
                  <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#92400e', marginBottom: 12 }}>
                    ⚠️ Approving will set this property to <strong>occupied + private</strong> and assign the tenant.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.status === 'pending' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => handleBookingAction(b, 'approved')}>✓ Approve & Occupy</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleBookingAction(b, 'rejected')}>✗ Reject</button>
                    </>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenChat(b)}>💬 Message Tenant</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'maintenance' ? (
        requests.length === 0 ? (
          <div className="empty-state"><h3>No maintenance requests</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.map(req => (
              <div key={req.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{req.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{properties.find(p => p.id === req.propertyId)?.title}</div>
                  </div>
                  <span className={`badge badge-${req.priority === 'urgent' ? 'red' : req.priority === 'high' ? 'amber' : 'gray'}`}>{req.priority}</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{req.description}</p>

                {/* Repair cost entry */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Repair cost:</span>
                  {editingRepairId === req.id ? (
                    <>
                      <input type="number" className="form-input" style={{ width: 100, padding: '4px 8px', fontSize: '0.85rem' }} value={repairCostInput} onChange={e => setRepairCostInput(e.target.value)} placeholder="0.00" />
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveRepairCost(req.id)}>Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingRepairId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600, color: req.repairCost ? '#ef4444' : 'var(--text-muted)' }}>
                        {req.repairCost ? `$${req.repairCost.toLocaleString()}` : 'Not set'}
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRepairId(req.id); setRepairCostInput(String(req.repairCost ?? '')); }}>Edit</button>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {req.status !== 'in_progress' && <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(req, 'in_progress')}>In Progress</button>}
                  {req.status !== 'resolved' && <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(req, 'resolved')}>Resolve</button>}
                  <span className={`badge badge-${req.status === 'open' ? 'amber' : req.status === 'in_progress' ? 'blue' : 'green'}`}>{req.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        contracts.length === 0 ? (
          <div className="empty-state"><h3>No contracts yet</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {contracts.map(c => <ContractViewer key={c.id} contract={c} propertyTitle={properties.find(p => p.id === c.propertyId)?.title} />)}
          </div>
        )
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  label: { fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 },
  val: { fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' },
};
