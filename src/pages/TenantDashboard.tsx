import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTenantProperty } from '../services/propertyService';
import { getTenantContracts } from '../services/contractService';
import { getTenantRequests, createMaintenanceRequest } from '../services/maintenanceService';
import { useToast } from '../hooks/useToast';
import PropertyGallery from '../components/PropertyGallery';
import ContractViewer from '../components/ContractViewer';
import MaintenanceForm from '../components/MaintenanceForm';
import type { Property, Contract, MaintenanceRequest } from '../types';

type Tab = 'property' | 'contracts' | 'maintenance';

export default function TenantDashboard() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const [tab, setTab] = useState<Tab>('property');
  const [property, setProperty] = useState<Property | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    Promise.all([
      getTenantProperty(userProfile.id),
      getTenantContracts(userProfile.id),
      getTenantRequests(userProfile.id),
    ]).then(([prop, ctrs, reqs]) => {
      setProperty(prop);
      setContracts(ctrs);
      setRequests(reqs);
      setLoading(false);
    });
  }, [userProfile]);

  const handleSubmitRequest = async (data: Parameters<typeof createMaintenanceRequest>[0]) => {
    await createMaintenanceRequest(data);
    const updated = await getTenantRequests(userProfile!.id);
    setRequests(updated);
    show('Request submitted!');
  };

  if (!userProfile) return null;

  return (
    <div className="container page">
      <ToastContainer />
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">My Property</h1>
        <p className="page-subtitle">Welcome, {userProfile.name}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 12, padding: 4, marginBottom: 28, overflowX: 'auto' }}>
        {(['property','contracts','maintenance'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: tab === t ? '#fff' : 'transparent', cursor: 'pointer', fontSize: '0.88rem', color: tab === t ? 'var(--teal)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: tab === t ? 500 : 400, boxShadow: tab === t ? 'var(--shadow)' : 'none', whiteSpace: 'nowrap' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'property' ? (
        property ? (
          <div>
            <PropertyGallery images={property.images} title={property.title} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 24, alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', marginBottom: 8 }}>{property.title}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>📍 {property.location}</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{property.description}</p>
                {property.amenities?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, fontSize: '0.88rem' }}>Amenities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {property.amenities.map(a => <span key={a} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>✓ {a}</span>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Rent</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--teal)', marginTop: 4 }}>
                  ${property.price.toLocaleString()}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>/mo</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</div>
                <div style={{ fontWeight: 500, textTransform: 'capitalize', marginTop: 2, marginBottom: 12 }}>{property.propertyType}</div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setTab('maintenance')}>
                  Submit Maintenance Request
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--teal-mid)" strokeWidth="1.2" style={{ margin: '0 auto 16px' }}>
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
            </svg>
            <h3>No property assigned</h3>
            <p>Contact your property manager to get set up.</p>
          </div>
        )
      ) : tab === 'contracts' ? (
        contracts.length === 0
          ? <div className="empty-state"><h3>No contracts found</h3></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
              {contracts.map(c => <ContractViewer key={c.id} contract={c} />)}
            </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div className="card" style={{ padding: 24 }}>
            <MaintenanceForm propertyId={property?.id || ''} tenantId={userProfile.id} onSubmit={handleSubmitRequest} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 14 }}>My Requests</h2>
            {requests.length === 0
              ? <div className="empty-state" style={{ padding: '30px 0' }}><h3>No requests yet</h3></div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {requests.map(r => (
                    <div key={r.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{r.title}</div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <PriorityBadge priority={r.priority} />
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{r.description}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                        {r.resolvedAt && ` · Resolved ${new Date(r.resolvedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
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
