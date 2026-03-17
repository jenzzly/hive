import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllProperties } from '../services/propertyService';
import { getTenantContracts } from '../services/contractService';
import { getTenantRequests, createMaintenanceRequest } from '../services/maintenanceService';
import { getTenantPayments, createRentPayment } from '../services/paymentService';
import { getTenantReimbursements, createReimbursementRequest } from '../services/reimbursementService';
import { uploadToCloudinary, uploadMultiple } from '../utils/cloudinaryUpload';
import { useToast } from '../hooks/useToast';
import PropertyGallery from '../components/PropertyGallery';
import ContractViewer from '../components/ContractViewer';
import MaintenanceForm from '../components/MaintenanceForm';
import type { Property, Contract, MaintenanceRequest, RentPayment, ReimbursementRequest } from '../types';

type Tab = 'properties' | 'payments' | 'contracts' | 'maintenance' | 'reimbursements';

function PayStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:  ['#f59e0b', '⏳ Pending'],
    verified: ['var(--teal)', '✓ Verified'],
    rejected: ['#ef4444', '✗ Rejected'],
  };
  const [color, label] = map[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

function ReimbStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:  ['#f59e0b', '⏳ Pending'],
    approved: ['#3b82f6', '✓ Approved'],
    paid:     ['var(--teal)', '💸 Paid'],
    rejected: ['#ef4444', '✗ Rejected'],
  };
  const [color, label] = map[status] ?? ['#94a3b8', status];
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: color + '18', padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

export default function TenantDashboard() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();

  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected property for context
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Pay form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ month: '', amount: '', notes: '', propertyId: '' });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  // Reimbursement form
  const [showReimbForm, setShowReimbForm] = useState(false);
  const [reimbForm, setReimbForm] = useState({ title: '', description: '', amount: '', propertyId: '' });
  const [reimbFiles, setReimbFiles] = useState<File[]>([]);
  const [reimbLoading, setReimbLoading] = useState(false);

  const load = async () => {
    if (!userProfile) return;
    setLoading(true);
    // Get all properties where tenantId == this user
    const [allProps, ctrs, reqs, pays, reimbs] = await Promise.all([
      getAllProperties(),
      getTenantContracts(userProfile.id),
      getTenantRequests(userProfile.id),
      getTenantPayments(userProfile.id),
      getTenantReimbursements(userProfile.id),
    ]);
    // Filter to properties assigned to this tenant
    const myProps = allProps.filter(p => p.tenantId === userProfile.id);
    setProperties(myProps);
    setContracts(ctrs);
    setRequests(reqs);
    setPayments(pays);
    setReimbursements(reimbs);
    if (myProps.length > 0 && !selectedPropertyId) setSelectedPropertyId(myProps[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile]);

  const handleSubmitRequest = async (data: Parameters<typeof createMaintenanceRequest>[0]) => {
    await createMaintenanceRequest(data);
    const updated = await getTenantRequests(userProfile!.id);
    setRequests(updated);
    show('Request submitted!');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !proofFile) { show('Please attach a proof of payment file.', 'error'); return; }
    setPayLoading(true);
    try {
      const proofUrl = await uploadToCloudinary(proofFile, 'payments');
      const contract = contracts.find(c => c.propertyId === payForm.propertyId && c.status === 'active');
      await createRentPayment({
        propertyId: payForm.propertyId,
        contractId: contract?.id ?? '',
        tenantId: userProfile.id,
        ownerId: properties.find(p => p.id === payForm.propertyId)?.ownerId ?? '',
        month: payForm.month,
        amount: Number(payForm.amount),
        proofUrl,
        notes: payForm.notes,
        status: 'pending',
      });
      show('Payment submitted! Awaiting owner verification.');
      setShowPayForm(false);
      setPayForm({ month: '', amount: '', notes: '', propertyId: '' });
      setProofFile(null);
      await load();
    } catch (err: any) {
      show(err.message || 'Failed to submit payment', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  const handleSubmitReimb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setReimbLoading(true);
    try {
      const receiptUrls = reimbFiles.length > 0 ? await uploadMultiple(reimbFiles, 'receipts') : [];
      await createReimbursementRequest({
        propertyId: reimbForm.propertyId,
        tenantId: userProfile.id,
        ownerId: properties.find(p => p.id === reimbForm.propertyId)?.ownerId ?? '',
        title: reimbForm.title,
        description: reimbForm.description,
        amount: Number(reimbForm.amount),
        receiptUrls,
        status: 'pending',
      });
      show('Reimbursement request submitted!');
      setShowReimbForm(false);
      setReimbForm({ title: '', description: '', amount: '', propertyId: '' });
      setReimbFiles([]);
      await load();
    } catch (err: any) {
      show(err.message || 'Failed', 'error');
    } finally {
      setReimbLoading(false);
    }
  };

  if (!userProfile) return null;

  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const pendingReimbs = reimbursements.filter(r => r.status === 'pending').length;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'properties', label: '🏠 My Units' },
    { key: 'payments', label: '💳 Payments', badge: pendingPayments },
    { key: 'contracts', label: '📄 Contracts' },
    { key: 'maintenance', label: '🔧 Maintenance' },
    { key: 'reimbursements', label: '↩ Reimbursements', badge: pendingReimbs },
  ];

  return (
    <div className="container page">
      <ToastContainer />
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">Welcome, {userProfile.name}</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28, gap: 12 }}>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--teal)' }}>{properties.length}</div><div className="stat-label">Units Rented</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#3b82f6' }}>{contracts.filter(c => c.status === 'active').length}</div><div className="stat-label">Active Contracts</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: pendingPayments > 0 ? '#f59e0b' : 'var(--teal)' }}>{pendingPayments}</div><div className="stat-label">Payments Pending</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: pendingReimbs > 0 ? '#f59e0b' : 'var(--teal)' }}>{pendingReimbs}</div><div className="stat-label">Reimbursements</div></div>
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

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tab === 'properties' ? (
        properties.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--teal-mid)" strokeWidth="1.2" style={{ margin: '0 auto 16px' }}>
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
            </svg>
            <h3>No properties assigned</h3>
            <p>Your rented units will appear here once a contract is active.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {properties.map(p => {
              const contract = contracts.find(c => c.propertyId === p.id && c.status === 'active');
              const paid = payments.filter(pay => pay.propertyId === p.id && pay.status === 'verified').reduce((s, pay) => s + pay.amount, 0);
              return (
                <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
                  {p.images?.[0] && <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>📍 {p.location}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Monthly Rent</div>
                        <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '1rem' }}>${p.price.toLocaleString()}</div>
                      </div>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Deposit</div>
                        <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '1rem' }}>${(contract?.depositAmount ?? 0).toLocaleString()}</div>
                      </div>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Rent Paid</div>
                        <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '1rem' }}>${paid.toLocaleString()}</div>
                      </div>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Lease Ends</div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{contract?.endDate ?? '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => { setPayForm(f => ({ ...f, propertyId: p.id, amount: String(p.price) })); setShowPayForm(true); setTab('payments'); }}>
                        💳 Pay Rent
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setTab('maintenance'); setSelectedPropertyId(p.id); }}>
                        🔧 Maintenance
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === 'payments' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Rent Payments</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPayForm(s => !s)}>+ Submit Payment</button>
          </div>

          {showPayForm && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Submit Proof of Payment</h3>
              <form onSubmit={handleSubmitPayment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Property</label>
                  <select className="form-input" value={payForm.propertyId} onChange={e => setPayForm(f => ({ ...f, propertyId: e.target.value }))} required>
                    <option value="">Select unit...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Month Paying For</label>
                  <input type="month" className="form-input" value={payForm.month} onChange={e => setPayForm(f => ({ ...f, month: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Paid ($)</label>
                  <input type="number" className="form-input" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes (optional)</label>
                  <input className="form-input" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Transfer ref, bank, etc..." />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Proof of Payment * (screenshot, receipt, bank slip)</label>
                  <input type="file" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] ?? null)} required />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={payLoading}>{payLoading ? 'Uploading...' : 'Submit Payment'}</button>
                  <button className="btn btn-ghost" type="button" onClick={() => setShowPayForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {payments.length === 0 ? (
            <div className="empty-state"><h3>No payments yet</h3><p>Submit your first rent payment proof above.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map(pay => {
                const prop = properties.find(p => p.id === pay.propertyId);
                return (
                  <div key={pay.id} className="card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{pay.month} — ${pay.amount.toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prop?.title ?? pay.propertyId}</div>
                      {pay.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pay.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {pay.proofUrl && <a href={pay.proofUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--teal)' }}>📎 Receipt</a>}
                      <PayStatusBadge status={pay.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'contracts' ? (
        contracts.length === 0 ? (
          <div className="empty-state"><h3>No contracts yet</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {contracts.map(c => <ContractViewer key={c.id} contract={c} propertyTitle={properties.find(p => p.id === c.propertyId)?.title} />)}
          </div>
        )
      ) : tab === 'maintenance' ? (
        <div>
          {/* Property selector for maintenance */}
          {properties.length > 1 && (
            <div className="form-group" style={{ marginBottom: 16, maxWidth: 320 }}>
              <label className="form-label">Submit request for</label>
              <select className="form-input" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          {selectedPropertyId && (
            <MaintenanceForm
              propertyId={selectedPropertyId}
              tenantId={userProfile.id}
              onSubmit={handleSubmitRequest}
            />
          )}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 14 }}>Your Requests</h3>
            {requests.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No requests submitted yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.map(req => (
                  <div key={req.id} className="card" style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{req.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{properties.find(p => p.id === req.propertyId)?.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>{req.description}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span className={`badge badge-${req.status === 'open' ? 'amber' : req.status === 'in_progress' ? 'blue' : 'green'}`}>{req.status}</span>
                        <span className={`badge badge-${req.priority === 'urgent' ? 'red' : req.priority === 'high' ? 'amber' : 'gray'}`}>{req.priority}</span>
                      </div>
                    </div>
                    {req.repairCost && (
                      <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Repair cost logged: ${req.repairCost.toLocaleString()}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reimbursements tab */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Reimbursement Requests</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Request refund for maintenance or repairs you paid out of pocket.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowReimbForm(s => !s)}>+ New Request</button>
          </div>

          {showReimbForm && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Request Reimbursement</h3>
              <form onSubmit={handleSubmitReimb} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Property</label>
                  <select className="form-input" value={reimbForm.propertyId} onChange={e => setReimbForm(f => ({ ...f, propertyId: e.target.value }))} required>
                    <option value="">Select unit...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">What did you pay for?</label>
                  <input className="form-input" value={reimbForm.title} onChange={e => setReimbForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Plumber for leaking pipe" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input type="number" className="form-input" value={reimbForm.amount} onChange={e => setReimbForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={reimbForm.description} onChange={e => setReimbForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the repair and why you had to pay for it..." required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Receipts / Proof (photos or PDFs)</label>
                  <input type="file" multiple accept="image/*,.pdf" onChange={e => setReimbFiles(Array.from(e.target.files ?? []))} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={reimbLoading}>{reimbLoading ? 'Submitting...' : 'Submit Request'}</button>
                  <button className="btn btn-ghost" type="button" onClick={() => setShowReimbForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {reimbursements.length === 0 ? (
            <div className="empty-state"><h3>No reimbursement requests yet</h3><p>Submit a request when you've paid for repairs that should be covered by the owner.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reimbursements.map(r => {
                const prop = properties.find(p => p.id === r.propertyId);
                return (
                  <div key={r.id} className="card" style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{r.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{prop?.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                        {r.ownerNote && (
                          <div style={{ marginTop: 8, fontSize: '0.78rem', background: 'var(--surface2)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600 }}>Owner note:</span> {r.ownerNote}
                          </div>
                        )}
                        {r.receiptUrls?.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            {r.receiptUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>📎 Receipt {i + 1}</a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#3b82f6' }}>${r.amount.toLocaleString()}</div>
                        <ReimbStatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
