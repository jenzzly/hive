import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTenantRequests, getOwnerRequests, updateMaintenanceRequest, createMaintenanceRequest } from '../services/maintenanceService';
import { getTenantProperty, getOwnerProperties } from '../services/propertyService';
import { useToast } from '../hooks/useToast';
import MaintenanceForm from '../components/MaintenanceForm';
import type { MaintenanceRequest, Property } from '../types';

export default function MaintenancePage() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    if (!userProfile) return;
    if (userProfile.role === 'tenant') {
      const [reqs, prop] = await Promise.all([
        getTenantRequests(userProfile.id),
        getTenantProperty(userProfile.id),
      ]);
      setRequests(reqs);
      setProperty(prop);
    } else {
      const props = await getOwnerProperties(userProfile.id);
      setProperties(props);
      const reqs = await getOwnerRequests(props.map(p => p.id));
      setRequests(reqs);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile]);

  const handleSubmit = async (data: Parameters<typeof createMaintenanceRequest>[0]) => {
    await createMaintenanceRequest(data);
    show('Request submitted!');
    await load();
  };

  const handleStatus = async (req: MaintenanceRequest, status: MaintenanceRequest['status']) => {
    await updateMaintenanceRequest(req.id, { status });
    show(`Marked as ${status.replace('_', ' ')}`);
    await load();
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  if (!userProfile) return null;

  return (
    <div className="container page">
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">Maintenance</h1>
        <p className="page-subtitle">{userProfile.role === 'tenant' ? 'Submit and track maintenance requests' : 'Review and manage maintenance requests'}</p>
      </div>

      <div style={styles.layout}>
        {/* Form for tenants */}
        {userProfile.role === 'tenant' && (
          <div className="card" style={{ padding: 24 }}>
            <MaintenanceForm
              propertyId={property?.id || ''}
              tenantId={userProfile.id}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {/* Requests list */}
        <div style={{ flex: 1 }}>
          <div style={styles.filterRow}>
            <h2 style={styles.listTitle}>
              {userProfile.role === 'tenant' ? 'My Requests' : 'All Requests'}
              <span style={styles.count}>{filtered.length}</span>
            </h2>
            <div style={styles.filters}>
              {['all','open','in_progress','resolved'].map(f => (
                <button
                  key={f}
                  style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><h3>No requests found</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(r => {
                const prop = properties.find(p => p.id === r.propertyId);
                return (
                  <div key={r.id} className="card" style={{ padding: 20 }}>
                    <div style={styles.reqTop}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.reqTitle}>{r.title}</div>
                        {prop && <div style={styles.reqProp}>{prop.title}</div>}
                        <div style={styles.reqDate}>{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <PriorityBadge priority={r.priority} />
                        <StatusBadge status={r.status} />
                      </div>
                    </div>

                    <p style={styles.reqDesc}>{r.description}</p>

                    {r.images?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {r.images.map((img, i) => (
                          <img key={i} src={img} alt="" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 6 }} />
                        ))}
                      </div>
                    )}

                    {userProfile.role !== 'tenant' && r.status !== 'resolved' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        {r.status === 'open' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(r, 'in_progress')}>
                            Mark In Progress
                          </button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => handleStatus(r, 'resolved')}>
                          Mark Resolved
                        </button>
                      </div>
                    )}

                    {r.status === 'resolved' && r.resolvedAt && (
                      <div style={styles.resolvedNote}>
                        ✓ Resolved on {new Date(r.resolvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
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

const styles: Record<string, React.CSSProperties> = {
  layout: { display: 'flex', gap: 32, alignItems: 'flex-start' },
  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  listTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 },
  count: { background: 'var(--teal-light)', color: 'var(--teal-dark)', fontSize: '0.78rem', padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-body)', fontWeight: 500 },
  filters: { display: 'flex', gap: 4 },
  filterBtn: { padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', textTransform: 'capitalize' },
  filterActive: { background: 'var(--teal-light)', color: 'var(--teal-dark)', fontWeight: 500 },
  reqTop: { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  reqTitle: { fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' },
  reqProp: { fontSize: '0.8rem', color: 'var(--teal)', marginTop: 2 },
  reqDate: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 },
  reqDesc: { color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 },
  resolvedNote: { marginTop: 10, fontSize: '0.82rem', color: 'var(--teal-dark)', background: 'var(--teal-light)', padding: '6px 12px', borderRadius: 6 },
};
