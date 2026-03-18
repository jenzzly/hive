import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTenantContracts, getOwnerContracts, deleteContract } from '../services/contractService';
import { getOwnerProperties } from '../services/propertyService';
import { getUserById } from '../services/userService';
import ContractViewer from '../components/ContractViewer';
import { useToast } from '../hooks/useToast';
import type { Contract, Property } from '../types';

interface TenantInfo {
  name: string;
  email: string;
  phone?: string;
}

export default function ContractsPage() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenantInfoMap, setTenantInfoMap] = useState<Record<string, TenantInfo>>({});
  const [loading, setLoading] = useState(true);
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'USD' | 'RWF'>('all');

  const load = async () => {
    if (!userProfile) return;
    setLoading(true);
    if (userProfile.role === 'tenant') {
      const ctrs = await getTenantContracts(userProfile.id);
      setContracts(ctrs);
    } else {
      const [ctrs, props] = await Promise.all([
        getOwnerContracts(userProfile.id),
        getOwnerProperties(userProfile.id),
      ]);
      setContracts(ctrs);
      setProperties(props);
      // Load tenant info for each contract
      const infoMap: Record<string, TenantInfo> = {};
      await Promise.all(ctrs.map(async c => {
        try {
          const u = await getUserById(c.tenantId);
          if (u) infoMap[c.tenantId] = { name: u.name, email: u.email, phone: (u as any).phone };
        } catch { /* ignore */ }
      }));
      setTenantInfoMap(infoMap);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    try {
      await deleteContract(id);
      show('Contract deleted.');
      await load();
    } catch (err: any) {
      show(err.message || 'Failed to delete', 'error');
    }
  };

  if (!userProfile) return null;

  const USD_RATE = 1300; // approximate RWF per USD
  const filteredContracts = contracts.filter(c => {
    if (currencyFilter === 'all') return true;
    const currency = (c as any).currency || 'USD';
    return currency === currencyFilter;
  });

  const formatMoney = (amount: number, currency = 'USD') => {
    if (currency === 'RWF') return `RWF ${amount.toLocaleString()}`;
    return `$${amount.toLocaleString()} USD`;
  };

  return (
    <div className="container page">
      <ToastContainer />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📄 Contracts</h1>
          <p className="page-subtitle">
            {userProfile.role === 'tenant' ? 'Your rental agreements' : 'All tenant contracts'}
          </p>
        </div>
        <div className="currency-filter">
          {(['all', 'USD', 'RWF'] as const).map(c => (
            <button key={c} className={currencyFilter === c ? 'active' : ''} onClick={() => setCurrencyFilter(c)}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filteredContracts.length === 0 ? (
        <div className="empty-state">
          <h3>No contracts found</h3>
          <p>{userProfile.role === 'owner' ? 'Create a contract from the Dashboard.' : 'No contracts have been assigned to you yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
          {filteredContracts.map(c => {
            const prop = properties.find(p => p.id === c.propertyId);
            const tenant = tenantInfoMap[c.tenantId];
            const currency = (c as any).currency || 'USD';
            const startDate = new Date(c.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const endDate = new Date(c.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const isActive = c.status === 'active';

            return (
              <div key={c.id} className="card" style={{ padding: 24 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 4 }}>
                      {prop?.title || 'Property'}
                    </div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                      ID: <span style={{ fontFamily: 'monospace' }}>{c.id.slice(0, 8)}…</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${isActive ? 'badge-green' : 'badge-gray'}`}>
                      {isActive ? '● Active' : 'Expired'}
                    </span>
                    <span className="badge badge-blue">{currency}</span>
                  </div>
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                  {/* Tenant info - only for owner */}
                  {userProfile.role !== 'tenant' && tenant && (
                    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Tenant</div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>👤 {tenant.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>✉️ {tenant.email}</div>
                      {tenant.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>📞 {tenant.phone}</div>}
                    </div>
                  )}

                  {/* Dates */}
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Duration</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 2 }}>📅 Start: <strong>{startDate}</strong></div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>📅 End: <strong>{endDate}</strong></div>
                  </div>

                  {/* Rent */}
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Monthly Rent</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teal)' }}>
                      {formatMoney(c.rentAmount, currency)}
                    </div>
                    {currency === 'USD' && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        ≈ RWF {(c.rentAmount * USD_RATE).toLocaleString()}
                      </div>
                    )}
                    {currency === 'RWF' && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        ≈ ${(c.rentAmount / USD_RATE).toFixed(0)} USD
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.contractDocumentURL && (
                    <a href={c.contractDocumentURL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                      📥 Download PDF
                    </a>
                  )}
                  {userProfile.role !== 'tenant' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}