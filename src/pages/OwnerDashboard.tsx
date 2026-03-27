import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getOwnerProperties, createProperty, updateProperty, deleteProperty } from '../services/propertyService';
import { getOwnerContracts, createContract, deleteContract, updateContract } from '../services/contractService';
import { getOwnerRequests, updateMaintenanceRequest } from '../services/maintenanceService';
import { getOwnerBookings, updateBookingStatus, deleteBooking } from '../services/bookingService';
import { getOwnerPayments, updatePaymentStatus, updatePayment } from '../services/paymentService';
import { getOwnerReimbursements, updateReimbursementStatus } from '../services/reimbursementService';
import { getOrCreateConversation } from '../services/messageService';
import { getAllUsers, getUserById } from '../services/userService';
import { 
  notifyMaintenanceResolved, notifyEBMUpload, 
  notifyContractCreated, notifyNoticeFromOwner,
  notifyPropertyUpdated, notifyOwnerNoticeToTenant,
} from '../services/emailService';
import { uploadMultiple, uploadToCloudinary } from '../utils/cloudinaryUpload';
import { useToast } from '../hooks/useToast';
import ContractViewer from '../components/ContractViewer';
import PropertyTypeSelector from '../components/PropertyTypeSelector';
import PropertyMap from '../components/PropertyMap';
import UnitManager from '../components/UnitManager';
import MaintenanceForm from '../components/MaintenanceForm';
import type {
  Property, Contract, MaintenanceRequest, PropertyStatus,
  BookingRequest, RentPayment, ReimbursementRequest, PropertyCategory,
  Currency, User,
} from '../types';
import { formatCurrency } from '../utils/format';

type Tab = 'properties' | 'finance' | 'maintenance' | 'bookings' | 'contracts';
const CURRENCIES: Currency[] = ['USD', 'RWF'];

// ── Currency toggle button pair ────────────────────────────────────────
function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {CURRENCIES.map(c => (
        <button key={c} type="button"
          onClick={() => onChange(c)}
          style={{
            flex: 1, padding: '11px 8px', border: `1.5px solid ${value === c ? 'var(--terra-500)' : 'var(--border-strong)'}`,
            borderRadius: 8, background: value === c ? 'var(--terra-100)' : '#fff',
            color: value === c ? 'var(--terra-700)' : 'var(--text-secondary)',
            fontWeight: value === c ? 600 : 400, cursor: 'pointer',
            fontSize: '0.9rem', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}>
          {c === 'USD' ? '$ USD' : 'RWF'}
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  title: '', description: '',
  category: '' as PropertyCategory,
  type: '', subcategory: '',
  price: '',
  currency: 'USD' as Currency,
  location: '', amenities: '',
  latitude: '', longitude: '',
  status: 'available' as PropertyStatus, isPublic: true,
};

// ── Badge helpers ───────────────────────────────────────────────────────
function BookingBadge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending: ['#f59e0b', 'Pending'], approved: ['var(--terra-600)', 'Approved'], rejected: ['#ef4444', 'Rejected'],
  };
  const [color, label] = m[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}
function PayBadge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending: ['#f59e0b', '⏳ Pending'], verified: ['var(--terra-600)', '✓ Verified'], rejected: ['#ef4444', '✗ Rejected'],
  };
  const [color, label] = m[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}
function ReimbBadge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending: ['#f59e0b', '⏳ Pending'], approved: ['#3b82f6', '✓ Approved'], paid: ['var(--terra-600)', '💸 Paid'], rejected: ['#ef4444', '✗ Rejected'],
  };
  const [color, label] = m[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = { 
    open: ['#ef4444', 'Open'],
    in_progress: ['#f59e0b', 'In Progress'],
    resolved: ['var(--terra-600)', 'Resolved'],
    closed: ['#94a3b8', 'Closed']
  };
  const [color, label] = m[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const m: Record<string, [string, string]> = { 
    low: ['#10b981', 'Low'],
    medium: ['#3b82f6', 'Medium'],
    high: ['#f59e0b', 'High'],
    urgent: ['#ef4444', 'Urgent']
  };
  const [color, label] = m[priority] ?? ['#94a3b8', priority];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

// ── Search & Pagination Helpers ──────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <input
        className="form-input"
        style={{ paddingLeft: 38, background: '#fff' }}
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
      {value && <button onClick={() => onChange('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✕</button>}
    </div>
  );
}

function Pagination({ current, total, pageSize, onChange }: { current: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
      <button className="btn btn-ghost btn-sm" disabled={current === 1} onClick={() => onChange(current - 1)}>Prev</button>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page {current} of {pages}</span>
      <button className="btn btn-ghost btn-sm" disabled={current === pages} onClick={() => onChange(current + 1)}>Next</button>
    </div>
  );
}

// ── Per-property finance card ───────────────────────────────────────────
function PropertyFinanceCard({
  property, contracts, payments, requests, reimbursements, tenants, onVerifyPayment, onReimbAction, onUpdateEBM,
}: {
  property: Property; contracts: Contract[]; payments: RentPayment[]; requests: MaintenanceRequest[];
  reimbursements: ReimbursementRequest[]; tenants: User[];
  onVerifyPayment: (id: string, s: 'verified' | 'rejected') => void;
  onReimbAction: (id: string, s: 'approved' | 'rejected' | 'paid') => void;
  onUpdateEBM: (id: string, file: File) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [uploadingEbm, setUploadingEbm] = useState<string | null>(null);
  const contract = contracts.find(c => c.propertyId === property.id && c.status === 'active');
  const cur: Currency = contract?.currency ?? (property as any).currency ?? 'USD';
  const propPayments = payments.filter(p => p.propertyId === property.id);
  const propReimbs = reimbursements.filter(r => r.propertyId === property.id);
  const propRepairs = requests.filter(r => r.propertyId === property.id && r.repairCost);
  const totalRent = propPayments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0);
  const totalRepairs = propRepairs.reduce((s, r) => s + (r.repairCost ?? 0), 0);
  const deposit = contract?.depositAmount ?? 0;
  const pendingCount = propPayments.filter(p => p.status === 'pending').length + propReimbs.filter(r => r.status === 'pending').length;
  const tenantName = tenants.find(u => u.id === property.tenantId)?.name;

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--terra-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🏠</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--terra-900)' }}>{property.title}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              📍 {property.location}{tenantName ? ` · ${tenantName}` : ''}
              <span style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: cur === 'RWF' ? 'var(--warn-light)' : 'var(--info-light)', color: cur === 'RWF' ? 'var(--warn)' : 'var(--info)' }}>{cur}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Rent Collected', val: formatCurrency(totalRent, cur), color: 'var(--terra-600)' },
            { label: 'Deposit', val: formatCurrency(deposit, cur), color: '#3b82f6' },
            { label: 'Repairs', val: formatCurrency(totalRepairs, cur), color: '#ef4444' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color, fontSize: '1rem' }}>{val}</div>
            </div>
          ))}
          {pendingCount > 0 && <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{pendingCount} pending</span>}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 20 }}>
          {contract ? (
            <div style={{ background: 'var(--stone-50)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
              {[
                { l: 'Monthly Rent', v: formatCurrency(contract.rentAmount, cur) },
                { l: 'Deposit', v: formatCurrency(contract.depositAmount, cur) },
                { l: 'Currency', v: contract.currency },
                { l: 'Start', v: contract.startDate },
                { l: 'End', v: contract.endDate },
                { l: 'Status', v: contract.status },
              ].map(({ l, v }) => (
                <div key={l}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{v}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>No active contract.</p>
          )}

          {/* Payments */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 10 }}>💳 Rent Payments</div>
            {propPayments.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>No payments yet.</p>
              : propPayments.map(pay => (
                <div key={pay.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', background: 'var(--stone-50)', borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{pay.month} — {formatCurrency(pay.amount, pay.currency)}</div>
                    {pay.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PayBadge status={pay.status} />
                    {pay.proofUrl && <a href={pay.proofUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--terra-600)' }}>📎 Proof</a>}
                    
                    {pay.ebmUrl ? (
                      <a href={pay.ebmUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>🏷️ EBM</a>
                    ) : (
                      pay.status === 'verified' && (
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                            disabled={uploadingEbm === pay.id}
                            onClick={() => document.getElementById(`ebm-input-${pay.id}`)?.click()}
                          >
                            {uploadingEbm === pay.id ? '...' : '+ EBM'}
                          </button>
                          <input 
                            id={`ebm-input-${pay.id}`}
                            type="file" 
                            hidden 
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setUploadingEbm(pay.id);
                                await onUpdateEBM(pay.id, f);
                                setUploadingEbm(null);
                              }
                            }} 
                          />
                        </div>
                      )
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

          {/* Repairs */}
          {propRepairs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 10 }}>🔧 Repair Costs</div>
              {propRepairs.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--stone-50)', borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.88rem' }}>{r.title}</span>
                  <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.88rem' }}>{formatCurrency(r.repairCost ?? 0, cur)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reimbursements */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 10 }}>↩ Reimbursement Requests</div>
            {propReimbs.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>No reimbursement requests.</p>
              : propReimbs.map(r => (
                <div key={r.id} style={{ background: 'var(--stone-50)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.title} — <span style={{ color: '#3b82f6' }}>{formatCurrency(r.amount, r.currency || 'USD')}</span></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
                    </div>
                    <ReimbBadge status={r.status} />
                  </div>
                  {r.receiptUrls && r.receiptUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {r.receiptUrls.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--terra-600)' }}>📎 Receipt {i + 1}</a>)}
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
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const { defaultCurrency } = useSettings();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [allTenants, setAllTenants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, currency: defaultCurrency });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [managingUnits, setManagingUnits] = useState<Property | null>(null);

  useEffect(() => { setPage(1); }, [tab, search]);

  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState({
    propertyId: '', tenantId: '', rentAmount: '', depositAmount: '',
    currency: defaultCurrency, startDate: '', endDate: '',
    lateFeePercent: '0', lateFeeGraceDays: '0'
  });

  useEffect(() => {
    if (defaultCurrency) {
      if (!editingId) setForm(prev => ({ ...prev, currency: defaultCurrency }));
      setContractForm(prev => ({ ...prev, currency: defaultCurrency }));
    }
  }, [defaultCurrency, editingId]);

  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);
  const [repairCostInput, setRepairCostInput] = useState('');
  const [timelineInput, setTimelineInput] = useState('');
  const [ownerCommentInput, setOwnerCommentInput] = useState('');
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRequest | null>(null);

  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);

  const load = async () => {
    if (!userProfile) return;
    setLoading(true);
    const props = await getOwnerProperties(userProfile.id);
    const [ctrs, reqs, bkgs, pays, reimbs, users] = await Promise.all([
      getOwnerContracts(userProfile.id),
      getOwnerRequests(props.map(p => p.id)),
      getOwnerBookings(userProfile.id),
      getOwnerPayments(userProfile.id),
      getOwnerReimbursements(userProfile.id),
      getAllUsers(),
    ]);
    setProperties(props);
    setContracts(ctrs);
    setRequests(reqs);
    setBookings(bkgs);
    setPayments(pays);
    setReimbursements(reimbs);
    setAllTenants(users.filter(u => u.role === 'tenant'));
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
        price: Number(form.price),
        currency: form.currency,
        location: form.location,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
        status: form.status, isPublic: form.isPublic,
        ownerId: userProfile.id, images,
      };
      if (editingId) { 
        await updateProperty(editingId, data); 
        show('Property updated!');
        // Notify tenant if one is assigned
        const existing = properties.find(p => p.id === editingId);
        if (existing?.tenantId) {
          const tenant = await getUserById(existing.tenantId).catch(() => null);
          if (tenant?.email) {
            notifyPropertyUpdated(tenant.email, tenant.name, userProfile.name, data.title, 'Please log in to see the latest details.');
          }
        }
      }
      else { await createProperty(data as any); show('Property created!'); }
      setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM, currency: defaultCurrency }); setImageFiles([]);
      await load();
    } catch (err: any) { show(err.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Property) => {
    setEditingId(p.id);
    setForm({
      title: p.title, description: p.description,
      category: p.category, type: p.type, subcategory: p.subcategory,
      price: String(p.price),
      currency: (p as any).currency ?? 'USD',
      location: p.location,
      latitude: p.latitude ? String(p.latitude) : '',
      longitude: p.longitude ? String(p.longitude) : '',
      amenities: p.amenities.join(', '),
      status: p.status, isPublic: p.isPublic,
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

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      let docUrl = (editingContractId ? contracts.find(c => c.id === editingContractId)?.contractDocumentURL : '') || '';
      if (contractFile) docUrl = await uploadToCloudinary(contractFile, 'contracts');

      const contractData = {
        propertyId: contractForm.propertyId,
        tenantId: contractForm.tenantId,
        ownerId: userProfile.id,
        rentAmount: Number(contractForm.rentAmount),
        depositAmount: Number(contractForm.depositAmount) || 0,
        currency: contractForm.currency,
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        contractDocumentURL: docUrl,
        lateFeePercent: Number(contractForm.lateFeePercent || 0),
        lateFeeGraceDays: Number(contractForm.lateFeeGraceDays || 0),
        status: 'active' as const,
      };

      if (editingContractId) {
        await updateContract(editingContractId, contractData);
        show('Contract updated.');
      } else {
        await createContract(contractData);
        await updateProperty(contractForm.propertyId, { tenantId: contractForm.tenantId, status: 'occupied', isPublic: false });
        show('Contract created! Property set to occupied & private.');
        
        // Notify Tenant
        const tenant = allTenants.find(u => u.id === contractData.tenantId);
        const prop = properties.find(p => p.id === contractData.propertyId);
        if (tenant?.email) {
          notifyContractCreated(tenant.email, tenant.name, prop?.title || 'Property');
        }
      }

      setShowContractForm(false);
      setEditingContractId(null);
      setContractForm({ 
        propertyId: '', tenantId: '', rentAmount: '', depositAmount: '', 
        currency: defaultCurrency, startDate: '', endDate: '',
        lateFeePercent: '0', lateFeeGraceDays: '0'
      });
      setContractFile(null);
      await load();
    } catch (err: any) { show(err.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleEditContract = (c: Contract) => {
    setEditingContractId(c.id);
    setContractForm({
      propertyId: c.propertyId,
      tenantId: c.tenantId,
      rentAmount: String(c.rentAmount),
      depositAmount: String(c.depositAmount || 0),
      currency: c.currency || defaultCurrency,
      startDate: c.startDate,
      endDate: c.endDate,
      lateFeePercent: String(c.lateFeePercent || 0),
      lateFeeGraceDays: String(c.lateFeeGraceDays || 0),
    });
    setShowContractForm(true);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingAction = async (booking: BookingRequest, status: 'approved' | 'rejected') => {
    await updateBookingStatus(booking.id, status);
    if (status === 'approved') {
      await updateProperty(booking.propertyId, { status: 'occupied', isPublic: false, tenantId: booking.tenantId });
      show('Booking approved! Property set to occupied and hidden from listings.');
    } else {
      show('Booking rejected.');
    }
    await load();
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Delete this booking request? This cannot be undone.')) return;
    try {
      await deleteBooking(id);
      show('Booking deleted.');
      await load();
    } catch (err: any) {
      show(err.message || 'Failed to delete', 'error');
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    try {
      await deleteContract(id);
      show('Contract deleted.');
      await load();
    } catch (err: any) {
      show(err.message || 'Failed to delete', 'error');
    }
  };

  const handleOpenChat = async (booking: BookingRequest) => {
    if (!userProfile) return;
    const prop = properties.find(p => p.id === booking.propertyId);
    await getOrCreateConversation(booking.propertyId, prop?.title || 'Property', userProfile.id, booking.tenantId);
    navigate('/messages');
  };

  const handleStatusUpdate = async (req: MaintenanceRequest, status: MaintenanceRequest['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolvedAt = new Date().toISOString();
      }
      await updateMaintenanceRequest(req.id, updateData);
      show(`Status updated to ${status.replace('_', ' ')}.`);
      
      // Notify Tenant if resolved or progress
      if (status === 'resolved' || status === 'in_progress' || status === 'closed') {
        const tenant = await getUserById(req.tenantId);
        if (tenant?.email) {
          notifyMaintenanceResolved(tenant.email, tenant.name, req.title);
        }
      }
      
      await load();
    } catch (err: any) {
      show('Failed to update status.', 'error');
    }
  };

  const handleSubmitMaintenance = async (data: any) => {
    try {
      await updateMaintenanceRequest(data.id, data);
      show('Request updated!');
      setEditingMaintenance(null);
      await load();
    } catch (err: any) {
      show('Failed to save request.', 'error');
    }
  };

  const handleSaveRepairCost = async (reqId: string) => {
    const cost = repairCostInput ? parseFloat(repairCostInput) : undefined;
    await updateMaintenanceRequest(reqId, { 
      repairCost: cost,
      timeline: timelineInput,
      ownerComment: ownerCommentInput
    });
    setEditingRepairId(null); 
    setRepairCostInput('');
    setTimelineInput('');
    setOwnerCommentInput('');
    show('Maintenance details saved.'); await load();
  };

  const handleVerifyPayment = async (id: string, status: 'verified' | 'rejected') => {
    await updatePaymentStatus(id, status);
    show(status === 'verified' ? 'Payment verified!' : 'Payment rejected.'); await load();
  };

  const handleUpdateEBM = async (paymentId: string, file: File) => {
    try {
      const url = await uploadToCloudinary(file);
      await updatePayment(paymentId, { ebmUrl: url });
      show('EBM receipt uploaded.');
      
      // Notify Tenant
      const pay = payments.find(p => p.id === paymentId);
      if (pay) {
        const tenant = allTenants.find(u => u.id === pay.tenantId);
        const prop = properties.find(p => p.id === pay.propertyId);
        if (tenant?.email) {
          notifyEBMUpload(tenant.email, tenant.name, prop?.title || 'Property');
        }
      }
      
      await load();
    } catch (err: any) {
      show(err.message || 'Failed to upload EBM.', 'error');
    }
  };

  const handleReimbAction = async (id: string, status: 'approved' | 'rejected' | 'paid') => {
    await updateReimbursementStatus(id, status);
    show(`Reimbursement ${status}.`); await load();
  };

  const openReqs = requests.filter(r => r.status === 'open').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const pendingReimbs = reimbursements.filter(r => r.status === 'pending').length;
  const totalRentUSD = payments.filter(p => p.status === 'verified' && p.currency === 'USD').reduce((s, p) => s + p.amount, 0);
  const totalRentRWF = payments.filter(p => p.status === 'verified' && p.currency === 'RWF').reduce((s, p) => s + p.amount, 0);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-subtitle">Owner : {userProfile.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowContractForm(true); setShowForm(false); }}>+ Contract</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setShowContractForm(false); setEditingId(null); setForm({ ...EMPTY_FORM, currency: defaultCurrency }); }}>+ Property</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 28, gap: 12 }}>
        <div className="stat-card"><div className="stat-value">{properties.length}</div><div className="stat-label">Properties</div></div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--terra-600)', fontSize: '1.2rem' }}>
            {totalRentUSD > 0 && <div>{formatCurrency(totalRentUSD, 'USD')}</div>}
            {totalRentRWF > 0 && <div>{formatCurrency(totalRentRWF, 'RWF')}</div>}
            {totalRentUSD === 0 && totalRentRWF === 0 && '—'}
          </div>
          <div className="stat-label">Rent Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#3b82f6' }}>{formatCurrency(totalDeposits, defaultCurrency)}</div>
          <div className="stat-label">Total Deposits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{formatCurrency(totalRepairs, defaultCurrency)}</div>
          <div className="stat-label">Repair Costs</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 12, padding: 4, marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ position: 'relative', padding: '10px 18px', borderRadius: 10, border: 'none', background: tab === t.key ? '#fff' : 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: tab === t.key ? 'var(--terra-700)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: tab === t.key ? 600 : 400, boxShadow: tab === t.key ? 'var(--shadow)' : 'none', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {t.label}
            {(t.badge ?? 0) > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '1px 4px', borderRadius: 8 }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, marginBottom: 6, color: 'var(--terra-900)' }}>
            {editingId ? 'Edit Property' : 'Add New Property'}
          </h2>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Location *</label><input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Type</label><PropertyTypeSelector category={form.category} type={form.type} subcategory={form.subcategory} onChange={(field: any, value: string) => setForm(f => ({ ...f, [field]: value }))} /></div>
            <div className="form-group"><label className="form-label">Listing Currency *</label><CurrencyToggle value={form.currency} onChange={c => setForm(f => ({ ...f, currency: c }))} /></div>
            <div className="form-group">
              <label className="form-label">Monthly Price ({form.currency}) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none', fontWeight: 500 }}>{form.currency === 'USD' ? '$' : 'RWF'}</span>
                <input className="form-input" type="number" style={{ paddingLeft: form.currency === 'USD' ? 26 : 44 }} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            
            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>📍 Map Preview</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {form.latitude && form.longitude ? '✓ Coordinates set' : 'Click the map or type an address to set location'}
                </span>
              </div>
              <PropertyMap 
                lat={form.latitude ? Number(form.latitude) : undefined} 
                lng={form.longitude ? Number(form.longitude) : undefined}
                locationName={form.location || undefined}
                isPicker={true} 
                onChange={(lat, lng) => setForm(f => ({ ...f, latitude: String(parseFloat(lat.toFixed(6))), longitude: String(parseFloat(lng.toFixed(6))) }))}
                height={260}
              />
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                  ⚙ Override with exact coordinates (optional)
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input className="form-input" type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="-1.9441" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input className="form-input" type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="30.0619" />
                  </div>
                </div>
              </details>
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Amenities (comma-separated)</label><input className="form-input" value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="WiFi, Parking, Pool..." /></div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PropertyStatus }))}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[true, false].map(v => (
                  <button key={String(v)} type="button"
                    style={{ flex: 1, padding: '10px 8px', border: `1.5px solid ${form.isPublic === v ? 'var(--terra-500)' : 'var(--border)'}`, borderRadius: 8, background: form.isPublic === v ? 'var(--terra-100)' : 'transparent', color: form.isPublic === v ? 'var(--terra-700)' : 'var(--text-secondary)', fontWeight: form.isPublic === v ? 600 : 400, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}
                    onClick={() => setForm(f => ({ ...f, isPublic: v }))}>
                    {v ? '🌐 Public' : '🔒 Private'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Photos</label><input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files || []))} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update Property' : 'Create Property'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showContractForm && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, marginBottom: 6, color: 'var(--terra-900)' }}>{editingContractId ? 'Edit Contract' : 'New Rental Contract'}</h2>
          <form onSubmit={handleSaveContract} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Property *</label>
              <select className="form-input" value={contractForm.propertyId} onChange={e => setContractForm(f => ({ ...f, propertyId: e.target.value }))} required>
                <option value="">Select property…</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tenant *</label>
              <select className="form-input" value={contractForm.tenantId} onChange={e => setContractForm(f => ({ ...f, tenantId: e.target.value }))} required>
                <option value="">Select tenant…</option>
                {allTenants.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Currency *</label><CurrencyToggle value={contractForm.currency as Currency} onChange={c => setContractForm(f => ({ ...f, currency: c }))} /></div>
            <div className="form-group">
              <label className="form-label">Rent Amount *</label>
              <input className="form-input" type="number" value={contractForm.rentAmount} onChange={e => setContractForm(f => ({ ...f, rentAmount: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Deposit Amount</label>
              <input className="form-input" type="number" value={contractForm.depositAmount} onChange={e => setContractForm(f => ({ ...f, depositAmount: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Late Fee (%)</label>
              <input type="number" className="form-input" value={contractForm.lateFeePercent} onChange={e => setContractForm(f => ({ ...f, lateFeePercent: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Grace Period (Days)</label>
              <input type="number" className="form-input" value={contractForm.lateFeeGraceDays} onChange={e => setContractForm(f => ({ ...f, lateFeeGraceDays: e.target.value }))} />
            </div>
            <div className="form-group"><label className="form-label">Start Date *</label><input className="form-input" type="date" value={contractForm.startDate} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">End Date *</label><input className="form-input" type="date" value={contractForm.endDate} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))} required /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Contract PDF</label><input type="file" accept=".pdf" onChange={e => setContractFile(e.target.files?.[0] ?? null)} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>Save Contract</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowContractForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'properties' ? (() => {
        const filtered = properties.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()));
        const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search properties..." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
              {paginated.map(p => (
                <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
                  {p.images?.[0] && <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
                  <div style={{ padding: 16 }}>
                    <div 
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', marginBottom: 3, cursor: 'pointer', color: 'var(--terra-900)' }}
                      onClick={() => navigate(`/property/${p.id}`)}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>📍 {p.location}</div>
                    {p.tenantId && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--teal-dark)', marginBottom: 10, fontWeight: 500 }}>
                        👤 Occupied by: {allTenants.find(u => u.id === p.tenantId)?.name || 'Unknown'}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span className={`badge ${p.status === 'available' ? 'badge-green' : 'badge-amber'}`}>{p.status}</span>
                      <span className="badge badge-teal">{formatCurrency(p.price, (p as any).currency || 'USD')}/mo</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => navigate(`/property/${p.id}`)}>👁️ View</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-primary btn-sm" style={{ padding: '6px 10px' }} onClick={() => setManagingUnits(p)}>Units</button>
                      {p.tenantId && (
                        <button 
                          className="btn btn-ghost btn-danger btn-sm" 
                          style={{ padding: '6px 10px' }} 
                          onClick={async () => {
                            if (!confirm('Give 15-day notice to tenant? Email will be sent.')) return;
                            const tenant = allTenants.find(u => u.id === p.tenantId);
                            if (tenant?.email && userProfile) {
                              notifyNoticeFromOwner(tenant.email, tenant.name, userProfile.name, p.title);
                              show('Notice sent to tenant.');
                            } else {
                              show('Tenant email not found.', 'error');
                            }
                          }}
                        >
                          📢 Notice
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px' }} onClick={() => handleDelete(p.id)}>Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        );
      })() : tab === 'finance' ? (() => {
        const filtered = properties.filter(p => 
          p.title.toLowerCase().includes(search.toLowerCase()) || 
          p.location.toLowerCase().includes(search.toLowerCase()) ||
          allTenants.find(u => u.id === p.tenantId)?.name?.toLowerCase().includes(search.toLowerCase())
        );
        const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <div>
            <SearchInput value={search} onChange={setSearch} placeholder="Filter properties or tenants..." />
            {paginated.length === 0 ? <div className="empty-state"><p>No properties found.</p></div> : paginated.map(p => (
              <PropertyFinanceCard key={p.id} property={p} contracts={contracts} payments={payments} requests={requests} reimbursements={reimbursements} tenants={allTenants} onVerifyPayment={handleVerifyPayment} onReimbAction={handleReimbAction} onUpdateEBM={handleUpdateEBM} />
            ))}
            <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        );
      })() : tab === 'bookings' ? (() => {
        const filtered = bookings.filter(b => {
          const prop = properties.find(p => p.id === b.propertyId);
          const tenant = allTenants.find(u => u.id === b.tenantId);
          return (
            prop?.title.toLowerCase().includes(search.toLowerCase()) ||
            tenant?.name.toLowerCase().includes(search.toLowerCase()) ||
            b.message.toLowerCase().includes(search.toLowerCase())
          );
        });
        const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search bookings by property or tenant..." />
            {paginated.length === 0 ? <div className="empty-state"><p>No booking requests found.</p></div> : paginated.map(b => (
              <div key={b.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--terra-900)', fontSize: '1.05rem' }}>{properties.find(p => p.id === b.propertyId)?.title || 'Unknown Property'}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      From: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{allTenants.find(u => u.id === b.tenantId)?.name || 'Unknown'}</span>
                    </div>
                    {b.message && <p style={{ fontSize: '0.85rem', marginTop: 8, fontStyle: 'italic', background: 'var(--stone-50)', padding: 10, borderRadius: 6 }}>"{b.message}"</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <BookingBadge status={b.status} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  {b.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => handleBookingAction(b, 'approved')}>Approve</button>}
                  {b.status === 'pending' && <button className="btn btn-danger btn-sm" onClick={() => handleBookingAction(b, 'rejected')}>Reject</button>}
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenChat(b)}>Message</button>
                  <button className="btn btn-ghost btn-danger btn-sm" onClick={() => handleDeleteBooking(b.id)}>Delete</button>
                </div>
              </div>
            ))}
            <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        );
      })() : tab === 'maintenance' ? (() => {
        const filtered = requests.filter(req => {
          const prop = properties.find(p => p.id === req.propertyId);
          const tenant = allTenants.find(u => u.id === req.tenantId);
          return (
            req.title.toLowerCase().includes(search.toLowerCase()) ||
            req.description.toLowerCase().includes(search.toLowerCase()) ||
            prop?.title.toLowerCase().includes(search.toLowerCase()) ||
            tenant?.name.toLowerCase().includes(search.toLowerCase())
          );
        });
        const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search maintenance by title, property or tenant..." />
            {editingMaintenance && (
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <MaintenanceForm
                  propertyId={editingMaintenance.propertyId}
                  tenantId={editingMaintenance.tenantId}
                  initialData={editingMaintenance}
                  onSubmit={handleSubmitMaintenance}
                  onCancel={() => setEditingMaintenance(null)}
                />
              </div>
            )}
            {paginated.length === 0 ? <div className="empty-state"><p>No maintenance requests found.</p></div> : paginated.map(req => {
              const prop = properties.find(p => p.id === req.propertyId);
              return (
                <div key={req.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--terra-900)', fontSize: '1.05rem' }}>{req.title}</div>
                      {prop && <div style={{ fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 500 }}>📍 {prop.title}</div>}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Requested by: {allTenants.find(u => u.id === req.tenantId)?.name || 'Unknown'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <PriorityBadge priority={req.priority} />
                        <StatusBadge status={req.status} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '14px 0' }}>{req.description}</p>

                  {req.images && req.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                      {req.images.map((img, i) => (
                        <img key={i} src={img} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 14, justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(req.status === 'open' || req.status === 'resolved') && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleStatusUpdate(req, req.status === 'resolved' ? 'open' : 'in_progress')}>
                          {req.status === 'resolved' ? 'Re-open' : 'Start Repair'}
                        </button>
                      )}
                      {req.status !== 'resolved' && req.status !== 'closed' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(req, 'resolved')}>Resolve</button>
                      )}
                      {req.status === 'resolved' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(req, 'closed')}>Close Ticket</button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setEditingMaintenance(req);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}>
                        Edit Details
                      </button>
                      {editingRepairId === req.id ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="form-input" style={{ width: 100 }} type="number" placeholder="Cost" value={repairCostInput} onChange={e => setRepairCostInput(e.target.value)} />
                          <button className="btn btn-primary btn-sm" onClick={() => handleSaveRepairCost(req.id)}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingRepairId(null)}>×</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRepairId(req.id); setRepairCostInput(String(req.repairCost || '')); }}>Set Cost</button>
                      )}
                    </div>
                    {req.repairCost && <div style={{ fontWeight: 600, color: 'var(--teal-dark)', fontSize: '0.9rem' }}>Cost: {formatCurrency(req.repairCost, defaultCurrency)}</div>}
                  </div>
                </div>
              );
            })}
            <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        );
      })() : (() => {
        const filtered = contracts.filter(c => {
          const prop = properties.find(p => p.id === c.propertyId);
          const tenant = allTenants.find(u => u.id === c.tenantId);
          return (
            prop?.title.toLowerCase().includes(search.toLowerCase()) ||
            tenant?.name.toLowerCase().includes(search.toLowerCase())
          );
        });
        const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search contracts..." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {paginated.length === 0 ? <div className="empty-state"><p>No contracts found.</p></div> : paginated.map(c => {
                const prop = properties.find(p => p.id === c.propertyId);
                return (
                  <div key={c.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{prop?.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Tenant: <strong>{allTenants.find(u => u.id === c.tenantId)?.name}</strong></div>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: c.status === 'active' ? 'var(--sage-100)' : c.status === 'on_notice' ? '#fef3c7' : '#f1f5f9',
                        color: c.status === 'active' ? 'var(--sage-700)' : c.status === 'on_notice' ? '#92400e' : '#64748b',
                      }}>{c.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Rent</div>
                        <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '0.95rem' }}>{formatCurrency(c.rentAmount, c.currency)}</div>
                      </div>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Period</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>{c.startDate} → {c.endDate}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEditContract(c)}>Edit</button>
                      {c.status === 'active' && (
                        <button className="btn btn-secondary btn-sm" onClick={async () => {
                          if (!confirm('Issue a 30-day move-out notice to the tenant? They will be notified by email.')) return;
                          try {
                            await updateContract(c.id, { status: 'on_notice', noticeDate: new Date().toISOString() });
                            const tenant = allTenants.find(u => u.id === c.tenantId);
                            if (tenant?.email && userProfile) {
                              notifyOwnerNoticeToTenant(tenant.email, tenant.name, userProfile.name, prop?.title || 'Property', 30);
                            }
                            show('Move-out notice issued and tenant notified.');
                            await load();
                          } catch { show('Failed to issue notice.', 'error'); }
                        }}>📢 Issue Notice</button>
                      )}
                      {c.status === 'on_notice' && (
                        <span style={{ fontSize: '0.75rem', color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                          📢 Notice since {c.noticeDate ? new Date(c.noticeDate).toLocaleDateString() : 'recently'}
                        </span>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteContract(c.id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        );
      })()
      }
      {managingUnits && <UnitManager property={managingUnits} onClose={() => setManagingUnits(null)} />} 
    </div>
  );
}