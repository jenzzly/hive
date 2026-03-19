import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlatformAnalytics, savePlatformSettings, calcFee } from '../services/analyticsService';
import type { PlatformAnalytics } from '../services/analyticsService';
import type { PlatformSettings } from '../types';
import { useToast } from '../hooks/useToast';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/format';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildProjection(data: PlatformAnalytics, defaultCurrency: string, count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
    let gross = 0;
    let fees = 0;
    data.contracts.forEach(c => {
      if (c.status !== 'active') return;
      if (c.currency !== defaultCurrency) return;
      const s = new Date(c.startDate);
      const e = new Date(c.endDate);
      if (d >= s && d <= e) {
        gross += c.rentAmount;
        fees += calcFee(c.rentAmount, data.serviceFee);
      }
    });
    return { label, gross, fees, net: gross - fees };
  });
}

// ── Sub-components ────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</div>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function SectionCard({ title, sub, badge, children }: { title: string; sub?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)' }}>
      <div style={{ marginBottom: 20 }}>
        {badge && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '3px 9px', borderRadius: 20, display: 'inline-block', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            {badge}
          </span>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</div>
        {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 7, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function LegDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    occupied: { background: '#fef3c7', color: '#92400e' },
    available: { background: 'var(--teal-light)', color: 'var(--teal-dark)' },
    active: { background: '#eff6ff', color: '#1d4ed8' },
    expired: { background: '#f3f4f6', color: '#6b7280' },
  };
  return (
    <span style={{ ...(styles[status] ?? styles.available), fontSize: '0.68rem', fontWeight: 500, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export default function PlatformAnalyticsPage() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const { defaultCurrency } = useSettings();
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fee form state
  const [feeType, setFeeType] = useState<'percent' | 'fixed'>('percent');
  const [feePercent, setFeePercent] = useState('5');
  const [feeFixed, setFeeFixed] = useState('10');

  const load = () => {
    setLoading(true);
    getPlatformAnalytics()
      .then(d => {
        setData(d);
        if (d.serviceFee) {
          setFeeType(d.serviceFee.serviceFeeType);
          setFeePercent(String(d.serviceFee.serviceFeePercent));
          setFeeFixed(String(d.serviceFee.serviceFeeFixed));
        }
      })
      .catch(err => {
        console.error('Platform analytics error:', err);
        setError('Could not load platform analytics. Ensure Firestore rules allow admin/superAdmin full read.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      await savePlatformSettings({
        serviceFeeType: feeType,
        serviceFeePercent: Number(feePercent),
        serviceFeeFixed: Number(feeFixed),
        updatedBy: userProfile.id,
      });
      show('Platform fee updated! All income projections now reflect the new rate.');
      load();
    } catch (err: any) {
      show(err.message || 'Failed to save fee settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (error) return (
    <div className="container page">
      <div className="empty-state">
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
        <h3>Analytics unavailable</h3>
        <p style={{ marginTop: 8 }}>{error}</p>
        <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Deploy the latest <code>firestore.rules</code> to Firebase Console → Firestore → Rules.
        </p>
      </div>
    </div>
  );

  if (!data) return null;

  const { properties, contracts, totalUsers, serviceFee } = data;
  const activeContracts = contracts.filter(c => c.status === 'active');
  const occupied = properties.filter(p => p.status === 'occupied');
  const publicProps = properties.filter(p => p.isPublic && p.status === 'available');

  const grossMRR = activeContracts.filter(c => (c.currency || 'USD') === defaultCurrency).reduce((s, c) => s + c.rentAmount, 0);
  const feesMRR = activeContracts.filter(c => (c.currency || 'USD') === defaultCurrency).reduce((s, c) => s + calcFee(c.rentAmount, serviceFee), 0);
  const occupancyRate = properties.length > 0 ? Math.round((occupied.length / properties.length) * 100) : 0;

  const projection = buildProjection(data, defaultCurrency, 12);
  const maxGross = Math.max(...projection.map(m => m.gross), 1);
  const annualGross = projection.reduce((s, m) => s + m.gross, 0);
  const annualFees = projection.reduce((s, m) => s + m.fees, 0);
  const annualNet = projection.reduce((s, m) => s + m.net, 0);

  // Preview fee with current form values
  const previewFee: PlatformSettings = {
    serviceFeeType: feeType,
    serviceFeePercent: Number(feePercent),
    serviceFeeFixed: Number(feeFixed),
    updatedAt: '', updatedBy: '',
  };
  const previewMRR = activeContracts
    .filter(c => c.currency === defaultCurrency)
    .reduce((s, c) => s + calcFee(c.rentAmount, previewFee), 0);

  // Category breakdown
  const byCategory: Record<string, { count: number; gross: number; owners: Set<string> }> = {};
  properties.forEach(p => {
    const cat = p.category || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, gross: 0, owners: new Set() };
    byCategory[cat].count++;
    byCategory[cat].owners.add(p.ownerId);
    const c = activeContracts.find(ac => ac.propertyId === p.id && ac.currency === defaultCurrency);
    if (c) byCategory[cat].gross += c.rentAmount;
  });

  // Top properties by income
  const topProps = [...properties]
    .map(p => ({
      ...p,
      income: activeContracts.find(c => c.propertyId === p.id && c.currency === defaultCurrency)?.rentAmount ?? 0,
    }))
    .filter(p => p.income > 0)
    .sort((a, b) => b.income - a.income)
    .slice(0, 10);

  const feeLabel = serviceFee
    ? serviceFee.serviceFeeType === 'percent'
      ? `${serviceFee.serviceFeePercent}% of rent`
      : `${formatCurrency(serviceFee.serviceFeeFixed, defaultCurrency)} flat/mo`
    : 'Not set';

  return (
    <div className="container page">
      <ToastContainer />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 className="page-title">Platform Analytics</h1>
          <span className="badge badge-red">SuperAdmin</span>
        </div>
        <p className="page-subtitle">Platform-wide income, occupancy trends, and service fee management</p>
      </div>

      {/* KPI cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <KpiCard label="Platform MRR" value={formatCurrency(grossMRR, defaultCurrency)} sub={`${activeContracts.length} contracts`} color="var(--teal)" icon="💰" />
        <KpiCard label="Fee revenue / mo" value={formatCurrency(feesMRR, defaultCurrency)} sub={`Current: ${feeLabel}`} color="#7c3aed" icon="🏦" />
        <KpiCard label="Occupancy rate" value={`${occupancyRate}%`} sub={`${occupied.length} occupied · ${publicProps.length} public listings`} color={occupancyRate >= 75 ? 'var(--teal)' : '#f59e0b'} icon="🏠" />
        <KpiCard label="Total users" value={String(totalUsers)} sub={`${properties.length} properties on platform`} color="#1d4ed8" icon="👥" />
      </div>

      {/* Fee control + revenue preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>

        {/* Fee control */}
        <SectionCard title="Service Fee Control" sub="Set a platform-wide fee applied to all owner income calculations." badge="⚙ Platform Setting">
          {serviceFee && (
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: '1px solid #e9d5ff' }}>
              <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Currently active</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#7c3aed' }}>
                {serviceFee.serviceFeeType === 'percent' ? `${serviceFee.serviceFeePercent}% of rent` : `${formatCurrency(serviceFee.serviceFeeFixed, defaultCurrency)} flat / month`}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9f74da', marginTop: 4 }}>
                Collecting ~{formatCurrency(feesMRR, defaultCurrency)}/mo · ~{formatCurrency(feesMRR * 12, defaultCurrency)}/yr
              </div>
            </div>
          )}

          <form onSubmit={handleSaveFee} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Type toggle */}
            <div className="form-group">
              <label className="form-label">Fee type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['percent', 'fixed'] as const).map(ft => (
                  <button key={ft} type="button"
                    style={{
                      flex: 1, padding: '10px', border: `1.5px solid ${feeType === ft ? '#7c3aed' : 'var(--border-strong)'}`,
                      borderRadius: 8, background: feeType === ft ? '#f5f3ff' : '#fff',
                      color: feeType === ft ? '#7c3aed' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)',
                      fontWeight: feeType === ft ? 600 : 400, transition: 'all 0.15s',
                    }}
                    onClick={() => setFeeType(ft)}
                  >
                    {ft === 'percent' ? '% Percentage' : '$ Fixed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Value input */}
            {feeType === 'percent' ? (
              <div className="form-group">
                <label className="form-label">Percentage rate</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type="number" min="0" max="50" step="0.5"
                    value={feePercent} onChange={e => setFeePercent(e.target.value)}
                    style={{ paddingRight: 36 }} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>%</span>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Fixed amount per month</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type="number" min="0" step="1"
                    value={feeFixed} onChange={e => setFeeFixed(e.target.value)}
                    style={{ paddingLeft: 32 }} />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>$</span>
                </div>
              </div>
            )}

            {/* Live preview */}
            {activeContracts.length > 0 && (
              <div style={{ background: '#faf5ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Live preview with this fee</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Monthly revenue</div>
                    <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '1.1rem' }}>{formatCurrency(previewMRR, defaultCurrency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Annual revenue</div>
                    <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '1.1rem' }}>{formatCurrency(previewMRR * 12, defaultCurrency)}</div>
                  </div>
                </div>
                {feesMRR !== previewMRR && (
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: previewMRR > feesMRR ? '#059669' : '#dc2626' }}>
                    {previewMRR > feesMRR ? '▲' : '▼'} {formatCurrency(Math.abs(previewMRR - feesMRR), defaultCurrency)}/mo vs current
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={saving}
              style={{ justifyContent: 'center', background: '#7c3aed' }}>
              {saving ? 'Saving...' : '💾 Save & Apply to All Properties'}
            </button>
          </form>
        </SectionCard>

        {/* Fee revenue projection */}
        <SectionCard title="Fee Revenue Projection" sub="12-month platform fee collection forecast">
          {/* Mini bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflowX: 'auto', marginBottom: 12 }}>
            {projection.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: '1 0 36px' }}>
                <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 100 }}>
                  <div style={{
                    width: 11, background: 'var(--teal)', opacity: 0.55, borderRadius: '2px 2px 0 0',
                    height: `${maxGross > 0 ? Math.max((m.gross / maxGross) * 96, m.gross > 0 ? 3 : 0) : 0}px`,
                    transition: 'height 0.5s',
                  }} />
                  <div style={{
                    width: 11, background: '#7c3aed', opacity: 0.85, borderRadius: '2px 2px 0 0',
                    height: `${maxGross > 0 ? Math.max((m.fees / maxGross) * 96, m.fees > 0 ? 3 : 0) : 0}px`,
                    transition: 'height 0.5s',
                  }} />
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <LegDot color="var(--teal)" label="Gross rent" />
            <LegDot color="#7c3aed" label="Platform fee" />
          </div>

          {/* Summary tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Annual gross', value: `$${annualGross.toLocaleString()}`, color: 'var(--teal)' },
              { label: 'Annual fee revenue', value: `$${annualFees.toLocaleString()}`, color: '#7c3aed' },
              { label: 'Annual owner payouts', value: `$${annualNet.toLocaleString()}`, color: 'var(--text-secondary)' },
              { label: 'Avg monthly fee', value: `$${Math.round(annualFees / 12).toLocaleString()}`, color: '#7c3aed' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Category breakdown + top properties */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>

        {/* Category */}
        <SectionCard title="Properties by Category" sub="Count and gross income per category">
          {Object.keys(byCategory).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No properties yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(byCategory)
                .sort((a, b) => b[1].gross - a[1].gross)
                .map(([cat, info]) => (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cat}</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{info.count} props · {info.owners.size} owners</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--teal)' }}>{formatCurrency(info.gross, defaultCurrency)}/mo</span>
                      </div>
                    </div>
                    <MiniBar pct={(info.count / properties.length) * 100} color="var(--teal)" />
                  </div>
                ))}
            </div>
          )}
        </SectionCard>

        {/* Top properties */}
        <SectionCard title="Top Earning Properties" sub="Ranked by gross monthly rent">
          {topProps.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No properties yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProps.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: idx < 3 ? '#fef3c7' : 'var(--surface2)',
                    color: idx < 3 ? '#92400e' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {p.location}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--teal)' }}>{formatCurrency(p.income, defaultCurrency)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>fee: {formatCurrency(calcFee(p.income, serviceFee), defaultCurrency)}</div>
                    <StatusChip status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Full 12-month projection table */}
      <SectionCard title="12-Month Platform Projection" sub="Total rent collected, fee revenue, and owner payouts across all properties">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>
                {['Month', 'Total Rent Collected', 'Platform Fee Revenue', 'Owner Payouts'].map(h => (
                  <th key={h} style={TS.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projection.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 1 ? 'var(--surface2)' : '#fff' }}>
                  <td style={TS.td}>{m.label}</td>
                  <td style={{ ...TS.td, fontWeight: 600, color: 'var(--teal)' }}>
                    {m.gross > 0 ? formatCurrency(m.gross, defaultCurrency) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ ...TS.td, fontWeight: 600, color: '#7c3aed' }}>
                    {m.fees > 0 ? formatCurrency(m.fees, defaultCurrency) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ ...TS.td, color: 'var(--text-secondary)' }}>
                    {m.net > 0 ? formatCurrency(m.net, defaultCurrency) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--surface2)', borderTop: '2px solid var(--border-strong)' }}>
                <td style={{ ...TS.td, fontWeight: 700, color: 'var(--text-primary)' }}>Total</td>
                <td style={{ ...TS.td, fontWeight: 700, color: 'var(--teal)' }}>{formatCurrency(annualGross, defaultCurrency)}</td>
                <td style={{ ...TS.td, fontWeight: 700, color: '#7c3aed' }}>{formatCurrency(annualFees, defaultCurrency)}</td>
                <td style={{ ...TS.td, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(annualNet, defaultCurrency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

const TS: Record<string, React.CSSProperties> = {
  th: {
    padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem',
    fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.5px', background: 'var(--surface2)',
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  },
  td: { padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)', verticalAlign: 'middle' },
};