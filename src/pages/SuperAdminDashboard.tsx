import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, deleteUserDoc, updateUserProfile } from '../services/userService';
import { getAllProperties, deleteProperty, updateProperty } from '../services/propertyService';
import { getAllPayments, updatePaymentStatus } from '../services/paymentService';
import { getAllReimbursements, updateReimbursementStatus } from '../services/reimbursementService';
import { useToast } from '../hooks/useToast';
import { useLang } from '../contexts/LanguageContext';
import type { User, UserRole, Property, RentPayment, ReimbursementRequest } from '../types';

type Tab = 'users' | 'properties' | 'payments' | 'reimbursements';

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
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const load = async () => {
    setLoading(true);
    const [u, p, pays, reimbs] = await Promise.all([
      getAllUsers(), getAllProperties(), getAllPayments(), getAllReimbursements(),
    ]);
    setUsers(u); setProperties(p); setPayments(pays); setReimbursements(reimbs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role); show(`Role → ${role}`); await load();
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete "${user.name}"?`)) return;
    await deleteUserDoc(user.id); show('User deleted.'); await load();
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try { await updateUserProfile(editingUser.id, { name: editName }); show('Updated.'); setEditingUser(null); await load(); }
    catch (err: any) { show(err.message, 'error'); }
    finally { setSavingUser(false); }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Delete property?')) return;
    await deleteProperty(id); show('Deleted.'); await load();
  };

  const handleTogglePublic = async (p: Property) => {
    await updateProperty(p.id, { isPublic: !p.isPublic });
    show(p.isPublic ? 'Set private.' : 'Listed publicly.'); await load();
  };

  const handleToggleStatus = async (p: Property) => {
    const next = p.status === 'available' ? 'occupied' : 'available';
    await updateProperty(p.id, { status: next }); show(`Status → ${next}.`); await load();
  };

  const handleVerifyPayment = async (id: string, status: 'verified' | 'rejected') => {
    await updatePaymentStatus(id, status); show(`Payment ${status}.`); await load();
  };

  const handleReimbAction = async (id: string, status: 'approved' | 'rejected' | 'paid') => {
    await updateReimbursementStatus(id, status); show(`Reimbursement ${status}.`); await load();
  };

  const filteredUsers = search ? users.filter(u => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())) : users;
  const filteredProps = search ? properties.filter(p => `${p.title} ${p.location}`.toLowerCase().includes(search.toLowerCase())) : properties;

  const stats = {
    users: users.length,
    owners: users.filter(u => u.role === 'owner').length,
    tenants: users.filter(u => u.role === 'tenant').length,
    properties: properties.length,
    pendingPay: payments.filter(p => p.status === 'pending').length,
    pendingReimb: reimbursements.filter(r => r.status === 'pending').length,
  };

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'users', label: '👥 Users' },
    { key: 'properties', label: '🏠 Properties' },
    { key: 'payments', label: '💳 Payments', badge: stats.pendingPay },
    { key: 'reimbursements', label: '↩ Reimbursements', badge: stats.pendingReimb },
  ];

  return (
    <div className="container page">
      <ToastContainer />

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <h1 className="page-title">{t('superAdmin')}</h1>
          <span className="badge badge-red">Full Access</span>
        </div>
        <p className="page-subtitle">Manage all users, properties, payments, and reimbursements.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28, gap: 12 }}>
        <div className="stat-card"><div className="stat-value">{stats.users}</div><div className="stat-label">Total Users</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#1d4ed8' }}>{stats.tenants}</div><div className="stat-label">Tenants</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>{stats.owners}</div><div className="stat-label">Owners</div></div>
        <div className="stat-card"><div className="stat-value">{stats.properties}</div><div className="stat-label">Properties</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: stats.pendingPay > 0 ? '#f59e0b' : 'var(--teal)' }}>{stats.pendingPay}</div><div className="stat-label">Pending Payments</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: stats.pendingReimb > 0 ? '#f59e0b' : 'var(--teal)' }}>{stats.pendingReimb}</div><div className="stat-label">Pending Reimbursements</div></div>
      </div>

      {/* Edit user modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: 28, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Edit User</h3>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleSaveUser} disabled={savingUser}>{savingUser ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
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
        {(tab === 'users' || tab === 'properties') && (
          <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'users' ? (
        filteredUsers.length === 0 ? <div className="empty-state"><h3>No users found</h3></div> : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead><tr>{['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredUsers.map(user => (
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
                      <td style={MS.td}><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(user.createdAt).toLocaleDateString()}</span></td>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingUser(user); setEditName(user.name); }}>Edit</button>
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
        filteredProps.length === 0 ? <div className="empty-state"><h3>No properties found</h3></div> : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead><tr>{['Property', 'Location', 'Status', 'Visibility', 'Owner', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredProps.map(p => (
                    <tr key={p.id} style={MS.tr}>
                      <td style={MS.td}><span style={{ fontWeight: 500 }}>{p.title}</span></td>
                      <td style={MS.td}><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.location}</span></td>
                      <td style={MS.td}><span className={`badge ${p.status === 'available' ? 'badge-green' : 'badge-amber'}`}>{p.status}</span></td>
                      <td style={MS.td}><span className={`badge ${p.isPublic ? 'badge-blue' : 'badge-gray'}`}>{p.isPublic ? 'Public' : 'Private'}</span></td>
                      <td style={MS.td}><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.ownerId.slice(0, 8)}…</span></td>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleTogglePublic(p)}>{p.isPublic ? 'Hide' : 'Show'}</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleToggleStatus(p)}>Toggle Status</button>
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
        payments.length === 0 ? <div className="empty-state"><h3>No payments yet</h3></div> : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead><tr>{['Tenant', 'Property', 'Month', 'Amount', 'Status', 'Proof', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id} style={MS.tr}>
                      <td style={MS.td}><span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{pay.tenantId.slice(0, 8)}…</span></td>
                      <td style={MS.td}><span style={{ fontSize: '0.85rem' }}>{properties.find(p => p.id === pay.propertyId)?.title ?? pay.propertyId.slice(0, 8)}</span></td>
                      <td style={MS.td}><span style={{ fontWeight: 500 }}>{pay.month}</span></td>
                      <td style={MS.td}><span style={{ fontWeight: 600, color: 'var(--teal)' }}>${pay.amount.toLocaleString()}</span></td>
                      <td style={MS.td}><PayBadge status={pay.status} /></td>
                      <td style={MS.td}>{pay.proofUrl ? <a href={pay.proofUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--teal)' }}>📎 View</a> : '—'}</td>
                      <td style={MS.td}>
                        {pay.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleVerifyPayment(pay.id, 'verified')}>Verify</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleVerifyPayment(pay.id, 'rejected')}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Reimbursements */
        reimbursements.length === 0 ? <div className="empty-state"><h3>No reimbursement requests yet</h3></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reimbursements.map(r => (
              <div key={r.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {properties.find(p => p.id === r.propertyId)?.title} · Tenant: {users.find(u => u.id === r.tenantId)?.name ?? r.tenantId.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                    {r.receiptUrls?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {r.receiptUrls.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>📎 Receipt {i + 1}</a>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#3b82f6' }}>${r.amount.toLocaleString()}</div>
                    <ReimbBadge status={r.status} />
                  </div>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleReimbAction(r.id, 'approved')}>Approve</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleReimbAction(r.id, 'paid')}>Mark Paid</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReimbAction(r.id, 'rejected')}>Reject</button>
                  </div>
                )}
                {r.status === 'approved' && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => handleReimbAction(r.id, 'paid')}>Mark as Paid</button>
                )}
              </div>
            ))}
          </div>
        )
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
};
