import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOwnerAnalytics, calcFee, calcNet } from '../services/analyticsService';
import type { OwnerAnalytics } from '../services/analyticsService';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/format';
import type { Property, Contract } from '../types';

// ─── tiny bar component ───────────────────────────────────────────────
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ─── month helpers ────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthlyProjection(contracts: Contract[], fee: OwnerAnalytics['serviceFee'], defaultCurrency: string, months = 12) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const periodContracts = contracts.filter(c => {
      if (c.status !== 'active') return false;
      if (c.currency !== defaultCurrency) return false;
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return d >= start && d <= end;
    });
    const gross = periodContracts.reduce((sum, c) => sum + c.rentAmount, 0);
    const feeAmt = periodContracts.reduce((sum, c) => sum + calcFee(c.rentAmount, fee), 0);
    return { label, gross, net: gross - feeAmt, feeAmt, net2: gross - feeAmt };
  });
}

export default function OwnerAnalyticsPage() {
  const { userProfile } = useAuth();
  const { defaultCurrency } = useSettings();
  const [data, setData] = useState<OwnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    getOwnerAnalytics(userProfile.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [userProfile]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return null;

  const { properties, contracts, serviceFee } = data;

  const occupied = properties.filter(p => p.status === 'occupied');
  const available = properties.filter(p => p.status === 'available');
  const activeContracts = contracts.filter(c => c.status === 'active');

  const grossMonthly = activeContracts.filter(c => c.currency === defaultCurrency).reduce((s, c) => s + c.rentAmount, 0);
  const totalFee = activeContracts.filter(c => c.currency === defaultCurrency).reduce((s, c) => s + calcFee(c.rentAmount, serviceFee), 0);
  const netMonthly = grossMonthly - totalFee;
  const occupancyRate = properties.length > 0 ? Math.round((occupied.length / properties.length) * 100) : 0;

  const projection = buildMonthlyProjection(contracts, serviceFee, defaultCurrency, 12);
  const maxGross = Math.max(...projection.map(m => m.gross), 1);

  // Category breakdown
  const byCategory: Record<string, { count: number; income: number }> = {};
  properties.forEach(p => {
    const cat = p.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, income: 0 };
    byCategory[cat].count++;
    const c = activeContracts.find(c => c.propertyId === p.id && c.currency === defaultCurrency);
    if (c) byCategory[cat].income += c.rentAmount;
  });

  const feeLabel = serviceFee
    ? serviceFee.serviceFeeType === 'percent'
      ? `${serviceFee.serviceFeePercent}% platform fee`
      : `${formatCurrency(serviceFee.serviceFeeFixed, defaultCurrency)} flat fee/mo`
    : 'No platform fee set';

  return (
    <div className="container page">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Income projections and portfolio performance</p>
      </div>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <KpiCard label="Gross / month" value={formatCurrency(grossMonthly, defaultCurrency)} sub={`${defaultCurrency} contracts`} color="var(--teal)" />
        <KpiCard label="Platform fee" value={formatCurrency(-totalFee, defaultCurrency)} sub={feeLabel} color="#f59e0b" />
        <KpiCard label="Net / month" value={formatCurrency(netMonthly, defaultCurrency)} sub="After platform fee" color="#1d4ed8" />
        <KpiCard label="Occupancy" value={`${occupancyRate}%`} sub={`${occupied.length} / ${properties.length} properties`} color={occupancyRate >= 75 ? 'var(--teal)' : '#f59e0b'} />
      </div>

      {/* Annual projection */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardTitle}>12-Month Income Projection</div>
            <div style={S.cardSub}>Based on active contracts and their end dates</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <LegendDot color="var(--teal)" label="Gross" />
            <LegendDot color="#1d4ed8" label="Net (after fee)" />
          </div>
        </div>

        {activeContracts.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <h3>No active contracts</h3>
            <p>Create contracts to see income projections.</p>
          </div>
        ) : (
          <div style={S.chartArea}>
            {projection.map((m, i) => (
              <div key={i} style={S.barGroup}>
                <div style={S.barLabels}>
                  <span style={S.barValue}>{m.gross > 0 ? `${getCurrencySymbol(defaultCurrency)}${(m.gross / 1000).toFixed(1)}k` : '—'}</span>
                </div>
                <div style={S.bars}>
                  {/* Gross bar */}
                  <div style={{ ...S.barFill, height: `${maxGross > 0 ? (m.gross / maxGross) * 100 : 0}%`, background: 'var(--teal)', opacity: 0.85 }} />
                  {/* Net bar */}
                  <div style={{ ...S.barFill, height: `${maxGross > 0 ? (m.net2 / maxGross) * 100 : 0}%`, background: '#1d4ed8', opacity: 0.7 }} />
                </div>
                <div style={S.barLabel}>{m.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Projection table */}
        {activeContracts.length > 0 && (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Month', 'Gross Income', 'Platform Fee', 'Net Income'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projection.slice(0, 6).map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={S.td}>{m.label}</td>
                    <td style={{ ...S.td, color: 'var(--teal)', fontWeight: 600 }}>{formatCurrency(m.gross, defaultCurrency)}</td>
                    <td style={{ ...S.td, color: '#f59e0b' }}>-{formatCurrency(m.feeAmt, defaultCurrency)}</td>
                    <td style={{ ...S.td, color: '#1d4ed8', fontWeight: 600 }}>{formatCurrency(m.net2, defaultCurrency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Portfolio breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <div style={S.cardTitle}>Portfolio by Category</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(byCategory).map(([cat, info]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cat}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {info.count} propert{info.count !== 1 ? 'ies' : 'y'} · {formatCurrency(info.income, defaultCurrency)}/mo
                  </span>
                </div>
                <Bar value={info.count} max={properties.length} color="var(--teal)" />
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No properties yet.</p>
            )}
          </div>
        </div>

        {/* Property performance */}
        <div className="card" style={{ padding: 24 }}>
          <div style={S.cardTitle}>Property Performance</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {properties.map(p => {
              const contract = activeContracts.find(c => c.propertyId === p.id && c.currency === defaultCurrency);
              const gross = contract?.rentAmount ?? 0;
              const fee = calcFee(gross, serviceFee);
              const net = gross - fee;
              return (
                <div key={p.id} style={S.propRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.subcategory || p.type} · {p.location}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {gross > 0 ? (
                      <>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--teal)' }}>{formatCurrency(net, defaultCurrency)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>net/mo</div>
                      </>
                    ) : (
                      <span className="badge badge-gray">No contract</span>
                    )}
                    <span className={`badge ${p.status === 'occupied' ? 'badge-amber' : 'badge-green'}`} style={{ marginTop: 4 }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {properties.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No properties yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Annual summary */}
      {activeContracts.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <div style={S.cardTitle}>Annual Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 16 }}>
            <SummaryItem label="12-mo Gross" value={formatCurrency(projection.reduce((s, m) => s + m.gross, 0), defaultCurrency)} />
            <SummaryItem label="12-mo Platform Fees" value={`-${formatCurrency(projection.reduce((s, m) => s + m.feeAmt, 0), defaultCurrency)}`} neg />
            <SummaryItem label="12-mo Net" value={formatCurrency(projection.reduce((s, m) => s + m.net2, 0), defaultCurrency)} highlight />
            <SummaryItem label="Avg monthly net" value={formatCurrency(Math.round(projection.reduce((s, m) => s + m.net2, 0) / 12), defaultCurrency)} />
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function SummaryItem({ label, value, neg, highlight }: { label: string; value: string; neg?: boolean; highlight?: boolean }) {
  return (
    <div style={{ padding: '16px', background: 'var(--surface2)', borderRadius: 10 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: highlight ? '#1d4ed8' : neg ? '#f59e0b' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' },
  cardSub: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 },
  chartArea: {
    display: 'flex', alignItems: 'flex-end', gap: 6,
    height: 180, overflowX: 'auto', paddingBottom: 4,
  },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: '1 0 48px', minWidth: 0 },
  barLabels: { fontSize: '0.65rem', color: 'var(--text-muted)', height: 16, display: 'flex', alignItems: 'center' },
  barValue: { fontSize: '0.62rem', color: 'var(--text-muted)' },
  bars: { display: 'flex', gap: 2, alignItems: 'flex-end', height: 140, width: '100%' },
  barFill: { flex: 1, borderRadius: '3px 3px 0 0', transition: 'height 0.6s ease', minHeight: 2 },
  barLabel: { fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' },
  tableWrap: { overflowX: 'auto', marginTop: 20, border: '1px solid var(--border)', borderRadius: 10 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)' },
  propRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' },
};
