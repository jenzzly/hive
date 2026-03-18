import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTenantContracts, getOwnerContracts } from '../services/contractService';
import { getOwnerProperties } from '../services/propertyService';
import { getAllUsers } from '../services/userService';
import ContractViewer from '../components/ContractViewer';
import type { Contract, Property, User } from '../types';

export default function ContractsPage() {
  const { userProfile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    if (!userProfile) return;
    (async () => {
      if (userProfile.role === 'tenant') {
        setContracts(await getTenantContracts(userProfile.id));
      } else {
        // owner / admin — load contracts, matching properties, and all tenants for name resolution
        const [ctrs, props, users] = await Promise.all([
          getOwnerContracts(userProfile.id),
          getOwnerProperties(userProfile.id),
          getAllUsers(),
        ]);
        setContracts(ctrs);
        setProperties(props);
        setTenants(users.filter(u => u.role === 'tenant'));
      }
      setLoading(false);
    })();
  }, [userProfile]);

  if (!userProfile) return null;

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);
  const active = contracts.filter(c => c.status === 'active').length;
  const expired = contracts.filter(c => c.status === 'expired').length;

  return (
    <div className="container page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Contracts</h1>
          <p className="page-subtitle">
            {userProfile.role === 'tenant' ? 'Your rental agreements' : 'All tenant contracts'}
          </p>
        </div>

        {/* Summary chips */}
        {contracts.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {active > 0 && (
              <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '5px 14px', borderRadius: 20, background: 'var(--sage-100)', color: 'var(--sage-700)', border: '1px solid var(--sage-200)' }}>
                {active} active
              </span>
            )}
            {expired > 0 && (
              <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '5px 14px', borderRadius: 20, background: 'var(--stone-100)', color: 'var(--stone-500)' }}>
                {expired} expired
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Filter tabs ── */}
      {contracts.length > 1 && (
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {(['all', 'active', 'expired'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '7px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontFamily: 'var(--font-body)',
                background: filter === f ? '#fff' : 'transparent',
                color: filter === f ? 'var(--terra-700)' : 'var(--text-secondary)',
                fontWeight: filter === f ? 600 : 400,
                boxShadow: filter === f ? 'var(--shadow)' : 'none',
                textTransform: 'capitalize',
              }}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--terra-300)" strokeWidth="1.2" style={{ margin: '0 auto 16px' }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3>{filter === 'all' ? 'No contracts yet' : `No ${filter} contracts`}</h3>
          <p style={{ marginTop: 6, fontSize: '0.88rem' }}>
            {userProfile.role === 'owner'
              ? 'Create a contract from your dashboard when a booking is approved.'
              : 'No contracts have been assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
          {filtered.map(c => {
            const prop = properties.find(p => p.id === c.propertyId);
            const tenant = tenants.find(u => u.id === c.tenantId);
            return (
              <ContractViewer
                key={c.id}
                contract={c}
                propertyTitle={prop?.title}
                tenantName={tenant?.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}