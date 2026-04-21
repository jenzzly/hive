import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllProperties } from '../services/propertyService';
import { getTenantContracts } from '../services/contractService';
import { getTenantPayments } from '../services/paymentService';
import { getTenantReimbursements } from '../services/reimbursementService';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/format';
import type { Property, Contract, RentPayment, ReimbursementRequest, Currency } from '../types';
import { 
  AnalyticsIcon, WalletIcon, 
  BackIcon, HomeIcon 
} from '../components/Icons';

function ProgressBar({ value, max, color = 'var(--teal)' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'var(--teal)' }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function TenantAnalyticsPage() {
  const { userProfile } = useAuth();
  const { defaultCurrency } = useSettings();

  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    (async () => {
      const [allProps, ctrs, pays, reimbs] = await Promise.all([
        getAllProperties(),
        getTenantContracts(userProfile.id),
        getTenantPayments(userProfile.id),
        getTenantReimbursements(userProfile.id),
      ]);
      setProperties(allProps.filter(p => p.tenantId === userProfile.id));
      setContracts(ctrs);
      setPayments(pays);
      setReimbursements(reimbs);
      setLoading(false);
    })();
  }, [userProfile]);

  if (!userProfile) return null;
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const verified = payments.filter(p => p.status === 'verified');
  const pending = payments.filter(p => p.status === 'pending');
  const rejected = payments.filter(p => p.status === 'rejected');

  const totalPaid = (cur: Currency) => verified.filter(p => p.currency === cur).reduce((s, p) => s + p.amount, 0);
  const totalPaidUSD = totalPaid('USD');
  const totalPaidRWF = totalPaid('RWF');

  const activeContract = contracts.find(c => c.status === 'active' || c.status === 'on_notice');
  const monthlyRent = activeContract?.rentAmount ?? 0;
  const rentCurrency: Currency = (activeContract?.currency as Currency) ?? 'USD';

  // Payment history by month (last 12 months)
  const monthlyHistory: { month: string; amount: number; status: string }[] = payments
    .filter(p => p.currency === rentCurrency)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12)
    .reverse();

  const maxMonthly = Math.max(...monthlyHistory.map(m => m.amount), monthlyRent, 1);

  // Reimbursement stats
  const reimbTotal = reimbursements.reduce((s, r) => s + r.amount, 0);
  const reimbPaid = reimbursements.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);

  // On-time estimate: verified payments with no rejected predecessor for the same month
  const onTimeCount = verified.length;

  return (
    <div className="container page">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AnalyticsIcon size={24} color="var(--blue-600)" />
          My Payment Analytics
        </h1>
        <p className="page-subtitle">Full financial overview of your rental history</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard icon={<WalletIcon size={24} color="var(--teal)" />} label="Payments Verified" value={String(onTimeCount)} sub={`${payments.length} total submissions`} color="var(--teal)" />
        <StatCard icon={<BackIcon size={24} color="#f59e0b" />} label="Awaiting Verification" value={String(pending.length)} color="#f59e0b" />
        <StatCard icon={<HomeIcon size={24} color="#ef4444" />} label="Rejected" value={String(rejected.length)} color="#ef4444" />
        <StatCard icon={<AnalyticsIcon size={24} color="#8b5cf6" />} label="Reimbursements" value={reimbursements.length > 0 ? formatCurrency(reimbPaid, defaultCurrency) : '—'} sub={`${reimbursements.length} request(s)`} color="#8b5cf6" />
      </div>

      {/* Total paid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
        {totalPaidUSD > 0 && (
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)', color: '#fff', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85, fontWeight: 600 }}>Total Verified Rent (USD)</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>{formatCurrency(totalPaidUSD, 'USD')}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 4 }}>across {verified.filter(p => p.currency === 'USD').length} payment(s)</div>
          </div>
        )}
        {totalPaidRWF > 0 && (
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85, fontWeight: 600 }}>Total Verified Rent (RWF)</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>{formatCurrency(totalPaidRWF, 'RWF')}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 4 }}>across {verified.filter(p => p.currency === 'RWF').length} payment(s)</div>
          </div>
        )}
        {totalPaidUSD === 0 && totalPaidRWF === 0 && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No verified payments yet.</div>
          </div>
        )}
      </div>

      {/* Current lease */}
      {activeContract && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 16 }}>🏠 Current Lease</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            {[
              { l: 'Monthly Rent', v: formatCurrency(monthlyRent, rentCurrency), color: 'var(--teal)' },
              { l: 'Deposit', v: formatCurrency(activeContract.depositAmount, rentCurrency), color: '#3b82f6' },
              { l: 'Lease Start', v: activeContract.startDate, color: 'var(--text-primary)' },
              { l: 'Lease End', v: activeContract.endDate, color: 'var(--text-primary)' },
              { l: 'Status', v: activeContract.status.replace('_', ' '), color: activeContract.status === 'on_notice' ? '#d97706' : 'var(--teal)' },
              { l: 'Late Fee', v: `${activeContract.lateFeePercent ?? 0}%`, color: '#ef4444' },
            ].map(({ l, v, color }) => (
              <div key={l} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{l}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color, marginTop: 4, textTransform: 'capitalize' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment bar chart (monthly history) */}
      {monthlyHistory.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 20 }}>📅 Payment History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {monthlyHistory.map(m => {
              const color = m.status === 'verified' ? 'var(--teal)' : m.status === 'pending' ? '#f59e0b' : '#ef4444';
              return (
                <div key={m.month} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{m.month}</div>
                  <ProgressBar value={m.amount} max={maxMonthly} color={color} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color }}>{formatCurrency(m.amount, rentCurrency)}</span>
                    <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 10, background: color + '18', color, fontWeight: 700 }}>
                      {m.status === 'verified' ? '✓' : m.status === 'pending' ? '…' : '✗'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {monthlyRent > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 4, background: 'var(--teal)', borderRadius: 2 }} />
              Monthly rent: {formatCurrency(monthlyRent, rentCurrency)}
            </div>
          )}
        </div>
      )}

      {/* Per-property breakdown */}
      {properties.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 16 }}>🏠 Per Property Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {properties.map(p => {
              const propPayments = payments.filter(pay => pay.propertyId === p.id);
              const cur: Currency = (p as any).currency ?? 'USD';
              const propVerified = propPayments.filter(pay => pay.status === 'verified').reduce((s, pay) => s + pay.amount, 0);
              const propPending = propPayments.filter(pay => pay.status === 'pending').length;
              return (
                <div key={p.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {p.location}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '1.05rem' }}>{formatCurrency(propVerified, cur)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>verified rent paid</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong>{propPayments.length}</strong> total payments</div>
                    {propPending > 0 && <div style={{ fontSize: '0.78rem', color: '#f59e0b' }}><strong>{propPending}</strong> pending</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reimbursements */}
      {reimbursements.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 16 }}>↩ Reimbursement Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { l: 'Total Claimed', v: formatCurrency(reimbTotal, defaultCurrency), color: '#8b5cf6' },
              { l: 'Total Paid Back', v: formatCurrency(reimbPaid, defaultCurrency), color: 'var(--teal)' },
              { l: 'Pending Requests', v: String(reimbursements.filter(r => r.status === 'pending').length), color: '#f59e0b' },
            ].map(({ l, v, color }) => (
              <div key={l} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{l}</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reimbursements.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--stone-50)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.title}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{r.description?.slice(0, 55)}{r.description?.length > 55 ? '…' : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.95rem' }}>{formatCurrency(r.amount, r.currency || 'USD')}</span>
                  <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                    background: r.status === 'paid' ? 'var(--teal-light)' : r.status === 'approved' ? '#dbeafe' : r.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    color: r.status === 'paid' ? 'var(--teal)' : r.status === 'approved' ? '#1d4ed8' : r.status === 'pending' ? '#92400e' : '#b91c1c',
                  }}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
