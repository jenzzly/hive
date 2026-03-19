import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, deleteUserDoc, updateUserProfile } from '../services/userService';
import { getAllProperties, deleteProperty, updateProperty, createProperty } from '../services/propertyService';
import { getAllPayments, updatePaymentStatus, deletePayment, updatePayment, createRentPayment } from '../services/paymentService';
import { getAllReimbursements, updateReimbursementStatus, deleteReimbursement, updateReimbursement, createReimbursementRequest } from '../services/reimbursementService';
import { getAllContracts, deleteContract, updateContract, createContract } from '../services/contractService';
import { getPlatformConfig, updatePlatformConfig, type PlatformConfig } from '../services/settingsService';
import { useToast } from '../hooks/useToast';
import { useLang } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/format';
import type { User, UserRole, Property, RentPayment, ReimbursementRequest, Contract, Currency, PropertyCategory, PropertyType, ContractStatus, ReimbursementStatus, PaymentStatus } from '../types';

type Tab = 'users' | 'properties' | 'payments' | 'reimbursements' | 'contracts' | 'settings';

const ROLES: UserRole[] = ['visitor', 'tenant', 'owner', 'admin', 'superAdmin'];
const ROLE_COLORS: Record<string, string> = {
  visitor: 'badge-gray', tenant: 'badge-blue',
  owner: 'badge-green', admin: 'badge-amber', superAdmin: 'badge-red',
};

function PayBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = { pending: ['#f59e0b', 'Pending'], verified: ['var(--teal)', 'Verified'], rejected: ['#ef4444', 'Rejected'] };
  const [color, label] = map[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.7rem', fontWeight: 600, color, background: color + '18', padding: '2px 8px', borderRadius: 12 }}>{label}</span>;
}

function ReimbBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = { pending: ['#f59e0b', 'Pending'], approved: ['#3b82f6', 'Approved'], paid: ['var(--teal)', 'Paid'], rejected: ['#ef4444', 'Rejected'] };
  const [color, label] = map[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.7rem', fontWeight: 600, color, background: color + '18', padding: '2px 8px', borderRadius: 12 }}>{label}</span>;
}

export default function SuperAdminDashboard() {
  const { show, ToastContainer } = useToast();
  const { t } = useLang();
  const { settings: platformConfig, refreshSettings } = useSettings();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProperty, setEditingProperty] = useState<Partial<Property> | null>(null);
  const [editingPayment, setEditingPayment] = useState<Partial<RentPayment> | null>(null);
  const [editingReimb, setEditingReimb] = useState<Partial<ReimbursementRequest> | null>(null);
  const [editingContract, setEditingContract] = useState<Partial<Contract> | null>(null);

  const [saving, setSaving] = useState(false);

  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    setLoadErrors([]);
    const errors: string[] = [];

    try {
      const results = await Promise.allSettled([
        getAllUsers(),
        getAllProperties(),
        getAllPayments(),
        getAllReimbursements(),
        getAllContracts(),
        getPlatformConfig()
      ]);

      if (results[0].status === 'fulfilled') setUsers(results[0].value);
      else { console.error('Users load fail:', results[0].reason); errors.push('Users: ' + (results[0].reason?.message || 'Permission denied')); }

      if (results[1].status === 'fulfilled') setProperties(results[1].value);
      else { console.error('Props load fail:', results[1].reason); errors.push('Properties: ' + (results[1].reason?.message || 'Permission denied')); }

      if (results[2].status === 'fulfilled') setPayments(results[2].value);
      else { console.error('Payments load fail:', results[2].reason); errors.push('Payments: ' + (results[2].reason?.message || 'Permission denied')); }

      if (results[3].status === 'fulfilled') setReimbursements(results[3].value);
      else { console.error('Reimbs load fail:', results[3].reason); errors.push('Reimbursements: ' + (results[3].reason?.message || 'Permission denied')); }

      if (results[4].status === 'fulfilled') setContracts(results[4].value);
      else { console.error('Contracts load fail:', results[4].reason); errors.push('Contracts: ' + (results[4].reason?.message || 'Permission denied')); }

      await refreshSettings();

      setLoadErrors(errors);
      if (errors.length > 0) {
        show(`Loaded with ${errors.length} error(s). Check UI details.`, 'error');
      }
    } catch (err: any) {
      console.error('SuperAdmin load overall error:', err);
      show('Failed to initiate dashboard load.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role); show(`Role → ${role}`); await load();
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete "${user.name}"?`)) return;
    await deleteUserDoc(user.id); show('User deleted.'); await load();
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUserProfile(editingUser.id, { name: editingUser.name });
      show('Updated.');
      setEditingUser(null);
      await load();
    } catch (err: any) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Delete property?')) return;
    await deleteProperty(id); show('Deleted.'); await load();
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setSaving(true);
    try {
      if (editingProperty.id) {
        await updateProperty(editingProperty.id, editingProperty);
        show('Property updated');
      } else {
        await createProperty(editingProperty as any);
        show('Property created');
      }
      setEditingProperty(null);
      await load();
    } catch (err: any) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setSaving(true);
    try {
      if (editingPayment.id) {
        await updatePayment(editingPayment.id, editingPayment);
        show('Payment updated');
      } else {
        await createRentPayment(editingPayment as any);
        show('Payment record created');
      }
      setEditingPayment(null);
      await load();
    } catch (err: any) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveReimb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReimb) return;
    setSaving(true);
    try {
      if (editingReimb.id) {
        await updateReimbursement(editingReimb.id, editingReimb);
        show('Reimbursement updated');
      } else {
        await createReimbursementRequest(editingReimb as any);
        show('Reimbursement request created');
      }
      setEditingReimb(null);
      await load();
    } catch (err: any) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    setSaving(true);
    try {
      if (editingContract.id) {
        await updateContract(editingContract.id, editingContract);
        show('Contract updated');
      } else {
        await createContract(editingContract as any);
        show('Contract created');
      }
      setEditingContract(null);
      await load();
    } catch (err: any) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Delete payment?')) return;
    await deletePayment(id); show('Deleted.'); await load();
  };

  const handleDeleteReimb = async (id: string) => {
    if (!confirm('Delete reimbursement?')) return;
    await deleteReimbursement(id); show('Deleted.'); await load();
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Delete contract?')) return;
    await deleteContract(id); show('Deleted.'); await load();
  };

  const handleUpdateCurrency = async (cur: Currency) => {
    try {
      await updatePlatformConfig({ defaultCurrency: cur });
      await refreshSettings();
      show(`Default currency set to ${cur}`);
    } catch (err: any) {
      show('Failed to update currency', 'error');
    }
  };

  const filter = (list: any[], keys: string[]) => {
    if (!search) return list;
    return list.filter((item: any) =>
      keys.some((key: string) => String(item[key] || '').toLowerCase().includes(search.toLowerCase()))
    );
  };

  const stats = {
    users: users.length,
    properties: properties.length,
    pendingPay: payments.filter((p: RentPayment) => p.status === 'pending').length,
    pendingReimb: reimbursements.filter((r: ReimbursementRequest) => r.status === 'pending').length,
    activeContracts: contracts.filter((c: Contract) => c.status === 'active').length,
  };

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'users', label: '👥 Users' },
    { key: 'properties', label: '🏠 Properties' },
    { key: 'payments', label: '💳 Payments', badge: stats.pendingPay },
    { key: 'reimbursements', label: '↩ Reimbursements', badge: stats.pendingReimb },
    { key: 'contracts', label: '📜 Contracts' },
    { key: 'settings', label: '⚙ Settings' },
  ];

  return (
    <div className="container page">
      <ToastContainer />

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <h1 className="page-title">{t('superAdmin')}</h1>
          <span className="badge badge-red">Full Access</span>
        </div>
        <p className="page-subtitle">Platform-wide management and settings.</p>
      </div>

      {loadErrors.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <h4 style={{ color: '#991b1b', marginBottom: 8, fontSize: '0.9rem' }}>⚠️ Data Loading Issues</h4>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: '#b91c1c' }}>
            {loadErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
          <p style={{ marginTop: 12, fontSize: '0.8rem', color: '#7f1d1d' }}>
            Ensure your user role is set to <strong>superAdmin</strong> in Firestore and all required collections exist.
          </p>
        </div>
      )}

      <div className="grid-5" style={{ marginBottom: 28, gap: 12 }}>
        <div className="stat-card"><div className="stat-value">{stats.users}</div><div className="stat-label">Total Users</div></div>
        <div className="stat-card"><div className="stat-value">{stats.properties}</div><div className="stat-label">Properties</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: stats.pendingPay > 0 ? '#f59e0b' : 'var(--teal)' }}>{stats.pendingPay}</div><div className="stat-label">Pending Pay</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: stats.pendingReimb > 0 ? '#f59e0b' : 'var(--teal)' }}>{stats.pendingReimb}</div><div className="stat-label">Pending Reimb</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>{stats.activeContracts}</div><div className="stat-label">Active Contracts</div></div>
      </div>

      {/* MODALS */}
      {editingUser && (
        <div style={MS.modalOverlay}>
          <form onSubmit={handleSaveUser} className="card" style={MS.modalCard}>
            <h3>Edit User</h3>
            <div className="form-group"><label className="form-label">Name</label>
              <input className="form-input" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingProperty && (
        <div style={MS.modalOverlay}>
          <form onSubmit={handleSaveProperty} className="card" style={{ ...MS.modalCard, maxWidth: 500 }}>
            <h3>{editingProperty.id ? 'Edit Property' : 'New Property'}</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group"><label className="form-label">Title</label>
                <input className="form-input" required value={editingProperty.title || ''} onChange={e => setEditingProperty({ ...editingProperty, title: e.target.value })} />
              </div>
              <div className="form-group"><label className="form-label">Price</label>
                <input className="form-input" type="number" required value={editingProperty.price || 0} onChange={e => setEditingProperty({ ...editingProperty, price: Number(e.target.value) })} />
              </div>
              <div className="form-group"><label className="form-label">Location</label>
                <input className="form-input" required value={editingProperty.location || ''} onChange={e => setEditingProperty({ ...editingProperty, location: e.target.value })} />
              </div>
              <div className="form-group"><label className="form-label">Owner ID</label>
                <input className="form-input" required value={editingProperty.ownerId || ''} onChange={e => setEditingProperty({ ...editingProperty, ownerId: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingProperty(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingPayment && (
        <div style={MS.modalOverlay}>
          <form onSubmit={handleSavePayment} className="card" style={MS.modalCard}>
            <h3>{editingPayment.id ? 'Edit Payment' : 'New Payment'}</h3>
            <div className="form-group"><label className="form-label">Amount</label>
              <input type="number" className="form-input" required value={editingPayment.amount || 0} onChange={e => setEditingPayment({ ...editingPayment, amount: Number(e.target.value) })} />
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input" value={editingPayment.status} onChange={e => setEditingPayment({ ...editingPayment, status: e.target.value as PaymentStatus })}>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingPayment(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingContract && (
        <div style={MS.modalOverlay}>
          <form onSubmit={handleSaveContract} className="card" style={{ ...MS.modalCard, maxWidth: 500 }}>
            <h3>{editingContract.id ? 'Edit Contract' : 'New Contract'}</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group"><label className="form-label">Rent Amount</label>
                <input type="number" className="form-input" required value={editingContract.rentAmount || 0} onChange={e => setEditingContract({ ...editingContract, rentAmount: Number(e.target.value) })} />
              </div>
              <div className="form-group"><label className="form-label">Property ID</label>
                <input className="form-input" required value={editingContract.propertyId || ''} onChange={e => setEditingContract({ ...editingContract, propertyId: e.target.value })} />
              </div>
              <div className="form-group"><label className="form-label">Tenant ID</label>
                <input className="form-input" required value={editingContract.tenantId || ''} onChange={e => setEditingContract({ ...editingContract, tenantId: e.target.value })} />
              </div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-input" value={editingContract.status} onChange={e => setEditingContract({ ...editingContract, status: e.target.value as ContractStatus })}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingContract(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 12, padding: 4, overflowX: 'auto' }}>
          {TABS.map(tabItem => (
            <button key={tabItem.key} onClick={() => { setTab(tabItem.key); setSearch(''); }}
              style={{ position: 'relative', padding: '8px 16px', borderRadius: 9, border: 'none', background: tab === tabItem.key ? '#fff' : 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: tab === tabItem.key ? 'var(--teal)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: tab === tabItem.key ? 600 : 400, boxShadow: tab === tabItem.key ? 'var(--shadow)' : 'none', whiteSpace: 'nowrap' }}>
              {tabItem.label}
              {(tabItem.badge ?? 0) > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 4, background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '1px 4px', borderRadius: 8 }}>{tabItem.badge}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {tab !== 'settings' && (
            <input className="form-input" style={{ maxWidth: 220 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          )}
          {tab === 'properties' && <button className="btn btn-primary btn-sm" onClick={() => setEditingProperty({ category: 'Residential', type: 'Apartment', status: 'available', isPublic: true, currency: platformConfig?.defaultCurrency || 'USD', images: [], amenities: [] })}>+ Property</button>}
          {tab === 'payments' && <button className="btn btn-primary btn-sm" onClick={() => setEditingPayment({ status: 'pending', currency: platformConfig?.defaultCurrency || 'USD' })}>+ Payment</button>}
          {tab === 'contracts' && <button className="btn btn-primary btn-sm" onClick={() => setEditingContract({ status: 'active', currency: platformConfig?.defaultCurrency || 'USD' })}>+ Contract</button>}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'users' ? (
        filter(users, ['name', 'email', 'role']).length === 0 ? <div className="empty-state"><h3>No users found</h3></div> : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead><tr>{['User', 'Email', 'Role', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filter(users, ['name', 'email', 'role']).map(user => (
                    <tr key={user.id} style={MS.tr}>
                      <td style={MS.td}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={MS.avatar}>{user.name.charAt(0).toUpperCase()}</div><span style={{ fontWeight: 500 }}>{user.name}</span></div></td>
                      <td style={MS.td}><span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{user.email}</span></td>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value as UserRole)} style={MS.roleSelect}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <span className={`badge ${ROLE_COLORS[user.role] || 'badge-gray'}`}>{user.role}</span>
                        </div>
                      </td>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingUser(user); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : tab === 'properties' ? (
        filter(properties, ['title', 'location']).length === 0 ? <div className="empty-state"><h3>No properties found</h3></div> : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead><tr>{['Property', 'Price', 'Status', 'Owner', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filter(properties, ['title', 'location']).map(p => (
                    <tr key={p.id} style={MS.tr}>
                      <td style={MS.td}><div style={{ fontWeight: 500 }}>{p.title}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.location}</div></td>
                      <td style={MS.td}><span style={{ fontWeight: 600 }}>{formatCurrency(p.price, p.currency)}</span></td>
                      <td style={MS.td}><span className={`badge ${p.status === 'available' ? 'badge-green' : 'badge-amber'}`}>{p.status}</span></td>
                      <td style={MS.td}><span style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{p.ownerId.slice(0, 8)}…</span></td>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingProperty(p)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProperty(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : tab === 'payments' ? (
        filter(payments, ['month', 'status']).length === 0 ? <div className="empty-state"><h3>No payments found</h3></div> : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead><tr>{['Property', 'Month', 'Amount', 'Status', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filter(payments, ['month', 'status', 'propertyId', 'tenantId']).map(pay => (
                    <tr key={pay.id} style={MS.tr}>
                      <td style={MS.td}><span style={{ fontSize: '0.85rem' }}>{properties.find(p => p.id === pay.propertyId)?.title ?? pay.propertyId.slice(0, 8)}</span></td>
                      <td style={MS.td}><span style={{ fontWeight: 500 }}>{pay.month}</span></td>
                      <td style={MS.td}><span style={{ fontWeight: 600, color: 'var(--teal)' }}>{formatCurrency(pay.amount, pay.currency || 'RWF')}</span></td>
                      <td style={MS.td}><PayBadge status={pay.status} /></td>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingPayment(pay)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePayment(pay.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : tab === 'reimbursements' ? (
        filter(reimbursements, ['title', 'status']).length === 0 ? <div className="empty-state"><h3>No reimbursements found</h3></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filter(reimbursements, ['title', 'status', 'description']).map(r => (
              <div key={r.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#3b82f6' }}>{formatCurrency(r.amount, r.currency || 'USD')}</div>
                    <ReimbBadge status={r.status} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingReimb(r)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReimb(r.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'contracts' ? (
        filter(contracts, ['status', 'propertyId', 'tenantId']).length === 0 ? <div className="empty-state"><h3>No contracts found</h3></div> : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead><tr>{['Property', 'Tenant', 'Rent', 'Status', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filter(contracts, ['status', 'propertyId', 'tenantId']).map(c => (
                    <tr key={c.id} style={MS.tr}>
                      <td style={MS.td}><span style={{ fontSize: '0.85rem' }}>{properties.find(p => p.id === c.propertyId)?.title ?? c.propertyId.slice(0, 8)}</span></td>
                      <td style={MS.td}><span style={{ fontSize: '0.85rem' }}>{users.find(u => u.id === c.tenantId)?.name ?? c.tenantId.slice(0, 8)}</span></td>
                      <td style={MS.td}><span style={{ fontWeight: 600 }}>{formatCurrency(c.rentAmount, c.currency)}</span></td>
                      <td style={MS.td}><span className={`badge ${c.status === 'active' ? 'badge-blue' : 'badge-gray'}`}>{c.status}</span></td>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingContract(c)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteContract(c.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Settings Tab */
        <div className="card" style={{ padding: 32, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 20 }}>Platform Global Settings</h3>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label" style={{ fontSize: '1rem', marginBottom: 12 }}>Default Platform Currency</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>This setting controls the default currency for new properties and payments.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: platformConfig?.defaultCurrency === 'USD' ? 600 : 400 }}>
                <input type="radio" name="currency" checked={platformConfig?.defaultCurrency === 'USD'} onChange={() => handleUpdateCurrency('USD')} /> USD ($)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: platformConfig?.defaultCurrency === 'RWF' ? 600 : 400 }}>
                <input type="radio" name="currency" checked={platformConfig?.defaultCurrency === 'RWF'} onChange={() => handleUpdateCurrency('RWF')} /> RWF (FRW)
              </label>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Last updated: {platformConfig?.updatedAt ? new Date(platformConfig.updatedAt.toDate?.() || platformConfig.updatedAt).toLocaleString() : 'Never'}
          </div>
        </div>
      )}
    </div>
  );
}

const MS: Record<string, React.CSSProperties> = {
  tableWrap: { background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: 'var(--teal-light)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 },
  roleSelect: { padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.82rem', background: '#fff', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
};
