import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, deleteUserDoc, updateUserProfile } from '../services/userService';
import { getAllProperties, deleteProperty, updateProperty } from '../services/propertyService';
import { useToast } from '../hooks/useToast';
import { useLang } from '../contexts/LanguageContext';
import type { User, UserRole, Property } from '../types';

type Tab = 'users' | 'properties';

const ROLES: UserRole[] = ['visitor', 'tenant', 'owner', 'admin', 'superAdmin'];

const ROLE_COLORS: Record<string, string> = {
  visitor: 'badge-gray', tenant: 'badge-blue',
  owner: 'badge-green', admin: 'badge-amber', superAdmin: 'badge-red',
};

export default function SuperAdminDashboard() {
  const { show, ToastContainer } = useToast();
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const load = async () => {
    setLoading(true);
    const [u, p] = await Promise.all([getAllUsers(), getAllProperties()]);
    setUsers(u);
    setProperties(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role);
    show(`Role updated to ${role}`);
    await load();
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    await deleteUserDoc(user.id);
    show('User deleted.');
    await load();
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      await updateUserProfile(editingUser.id, { name: editName });
      show('User updated.');
      setEditingUser(null);
      await load();
    } catch (err: any) {
      show(err.message, 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    await deleteProperty(id);
    show('Property deleted.');
    await load();
  };

  const handleTogglePublic = async (p: Property) => {
    await updateProperty(p.id, { isPublic: !p.isPublic });
    show(p.isPublic ? 'Set to private.' : 'Listed publicly.');
    await load();
  };

  const handleToggleStatus = async (p: Property) => {
    const next = p.status === 'available' ? 'occupied' : 'available';
    await updateProperty(p.id, { status: next });
    show(`Status set to ${next}.`);
    await load();
  };

  const filteredUsers = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()))
    : users;

  const filteredProps = search
    ? properties.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()))
    : properties;

  const stats = {
    users: users.length,
    owners: users.filter(u => u.role === 'owner').length,
    tenants: users.filter(u => u.role === 'tenant').length,
    properties: properties.length,
  };

  return (
    <div className="container page">
      <ToastContainer />

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <h1 className="page-title">{t('superAdmin')}</h1>
          <span className="badge badge-red">Full Access</span>
        </div>
        <p className="page-subtitle">Manage all users, roles, and properties across the platform.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-value">{stats.users}</div><div className="stat-label">Total Users</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#1d4ed8' }}>{stats.tenants}</div><div className="stat-label">Tenants</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>{stats.owners}</div><div className="stat-label">Owners</div></div>
        <div className="stat-card"><div className="stat-value">{stats.properties}</div><div className="stat-label">Properties</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 12, padding: 4 }}>
          {(['users', 'properties'] as Tab[]).map(tabItem => (
            <button key={tabItem} onClick={() => { setTab(tabItem); setSearch(''); }}
              style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: tab === tabItem ? '#fff' : 'transparent', cursor: 'pointer', fontSize: '0.88rem', color: tab === tabItem ? 'var(--teal)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: tab === tabItem ? 500 : 400, boxShadow: tab === tabItem ? 'var(--shadow)' : 'none' }}>
              {tabItem.charAt(0).toUpperCase() + tabItem.slice(1)}
            </button>
          ))}
        </div>
        <input className="form-input" placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260, fontSize: '0.88rem' }} />
      </div>

      {/* Edit user modal */}
      {editingUser && (
        <div style={MS.overlay} onClick={() => setEditingUser(null)}>
          <div style={MS.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 20 }}>Edit User</h2>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Name</label>
              <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.8 }}>
              <div><strong>Email:</strong> {editingUser.email}</div>
              <div><strong>ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{editingUser.id}</span></div>
              <div><strong>Joined:</strong> {new Date(editingUser.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSaveUser} disabled={savingUser}>{savingUser ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'users' ? (
        filteredUsers.length === 0 ? (
          <div className="empty-state"><h3>No users found</h3></div>
        ) : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead>
                  <tr>{['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} style={MS.tr}>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={MS.avatar}>{user.name.charAt(0).toUpperCase()}</div>
                          <span style={{ fontWeight: 500, fontSize: '0.92rem' }}>{user.name}</span>
                        </div>
                      </td>
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
      ) : (
        filteredProps.length === 0 ? (
          <div className="empty-state"><h3>No properties found</h3></div>
        ) : (
          <div style={MS.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={MS.table}>
                <thead>
                  <tr>{['Property', 'Type', 'Location', 'Price', 'Status', 'Visibility', 'Actions'].map(h => <th key={h} style={MS.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredProps.map(p => (
                    <tr key={p.id} style={MS.tr}>
                      <td style={MS.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt="" style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 6 }} />
                            : <div style={{ width: 40, height: 30, borderRadius: 6, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</div>
                          }
                          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.title}</span>
                        </div>
                      </td>
                      <td style={MS.td}><span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{(p as any).subcategory || (p as any).type || (p as any).propertyType || '—'}</span></td>
                      <td style={MS.td}><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {p.location}</span></td>
                      <td style={MS.td}><span style={{ fontWeight: 600, color: 'var(--teal)', fontSize: '0.9rem' }}>${p.price.toLocaleString()}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mo</span></span></td>
                      <td style={MS.td}>
                        <button onClick={() => handleToggleStatus(p)} className={`badge ${p.status === 'available' ? 'badge-green' : 'badge-amber'}`} style={{ border: 'none', cursor: 'pointer' }}>
                          {p.status}
                        </button>
                      </td>
                      <td style={MS.td}>
                        <button onClick={() => handleTogglePublic(p)} className={`badge ${p.isPublic ? 'badge-blue' : 'badge-gray'}`} style={{ border: 'none', cursor: 'pointer' }}>
                          {p.isPublic ? '🔓 Public' : '🔒 Private'}
                        </button>
                      </td>
                      <td style={MS.td}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProperty(p.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

const MS: Record<string, React.CSSProperties> = {
  tableWrap: { borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: '#fff', boxShadow: 'var(--shadow)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 },
  roleSelect: { border: '1px solid var(--border-strong)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
};
