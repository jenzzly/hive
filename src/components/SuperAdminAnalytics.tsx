import { useEffect, useState } from 'react';
import { getPlatformAnalytics, calcFee } from '../services/analyticsService';
import type { PlatformAnalytics } from '../services/analyticsService';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/format';
import type { Property, Contract, User } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SuperAdminAnalytics() {
  const { defaultCurrency } = useSettings();
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');

  useEffect(() => {
    getPlatformAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return null;

  const owners = data.users.filter((u: any) => u.role === 'owner');

  // Filter logic
  let filteredProps = data.properties;
  let filteredContracts = data.contracts;

  if (selectedOwnerId !== 'all') {
    filteredProps = data.properties.filter(p => p.ownerId === selectedOwnerId);
    filteredContracts = data.contracts.filter(c => c.ownerId === selectedOwnerId);
  }

  const verifiedPayments = data.payments.filter(p => 
    p.status === 'verified' && 
    (selectedOwnerId === 'all' || p.ownerId === selectedOwnerId)
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  // KPI calculations based on Verified Payments
  const grossMonthly = verifiedPayments
    .filter(p => p.month === currentMonth && p.currency === defaultCurrency)
    .reduce((s, p) => s + p.amount, 0);
  
  const totalFee = verifiedPayments
    .filter(p => p.month === currentMonth && p.currency === defaultCurrency)
    .reduce((sum, p) => {
      const owner = data.users.find(u => u.id === p.ownerId);
      return sum + calcFee(p.amount, data.serviceFee, owner?.platformFee);
    }, 0);

  const totalCollected = verifiedPayments
    .filter(p => p.currency === defaultCurrency)
    .reduce((s, p) => s + p.amount, 0);

  const netMonthly = grossMonthly - totalFee;
  const occupancyRate = filteredProps.length > 0 ? Math.round((occupied.length / filteredProps.length) * 100) : 0;

  // Monthly Projection
  const projection = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + i, 1);
    const dMonth = d.getFullYear() * 12 + d.getMonth();
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    
    const periodContracts = filteredContracts.filter(c => {
      if (c.status !== 'active') return false;
      if (c.currency !== defaultCurrency) return false;
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      const startMonth = start.getFullYear() * 12 + start.getMonth();
      const endMonth = end.getFullYear() * 12 + end.getMonth();
      return dMonth >= startMonth && dMonth <= endMonth;
    });

    const gross = periodContracts.reduce((sum, c) => sum + c.rentAmount, 0);
    const feeAmt = periodContracts.reduce((sum, c) => {
      const owner = data.users.find(u => u.id === c.ownerId);
      return sum + calcFee(c.rentAmount, data.serviceFee, owner?.platformFee);
    }, 0);
    return { label, gross, net: gross - feeAmt, feeAmt };
  });

  const maxVal = Math.max(...projection.map(m => m.gross), 1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Portfolio Analytics</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aggregate performance and owner-specific metrics.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Metric For:</label>
          <select 
            className="form-input" 
            style={{ minWidth: 200, height: 38 }}
            value={selectedOwnerId}
            onChange={e => setSelectedOwnerId(e.target.value)}
          >
            <option value="all">All Clients (Aggregate)</option>
            {owners.map((o: any) => (
              <option key={o.id} value={o.id}>{o.name} ({o.platformFee ?? 0}%)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 32, gap: 12 }}>
        <KpiCard label="Total Collected" value={formatCurrency(totalCollected, defaultCurrency)} sub="All-time verified" color="var(--teal)" />
        <KpiCard label="Gross Monthly" value={formatCurrency(grossMonthly, defaultCurrency)} sub="Current month verified" color="#3b82f6" />
        <KpiCard label="Fees Collected" value={formatCurrency(totalFee, defaultCurrency)} sub="Monthly platform revenue" color="#f59e0b" />
        <KpiCard label="Occupancy Rate" value={`${occupancyRate}%`} sub={`${occupied.length} / ${filteredProps.length} units`} color={occupancyRate >= 75 ? 'var(--teal)' : '#f59e0b'} />
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 20 }}>Income Projection (6 Months)</h3>
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            {projection.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
                <div style={{ position: 'relative', height: 160, display: 'flex', alignItems: 'flex-end' }}>
                   <div style={{ width: '100%', height: `${(m.gross / maxVal) * 100}%`, background: 'var(--teal)', opacity: 0.15, borderRadius: '4px 4px 0 0' }} />
                   <div style={{ position: 'absolute', width: '100%', height: `${(m.net / maxVal) * 100}%`, background: 'var(--teal-dark)', borderRadius: '4px 4px 0 0' }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>{m.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, justifyContent: 'center' }}>
            <LegendDot color="var(--teal-dark)" label="Net Projection" />
            <LegendDot color="rgba(29, 158, 117, 0.2)" label="Platform Fee Share" />
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 16 }}>Owner Distribution</h3>
          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ background: 'var(--surface2)' }}>
                <tr>
                  <th style={TH}>Client</th>
                  <th style={TH}>Units</th>
                  <th style={TH}>Net</th>
                </tr>
              </thead>
              <tbody>
                {owners.slice(0, 10).map((o: any) => {
                  const oProps = data.properties.filter(p => p.ownerId === o.id);
                  const oPayments = data.payments.filter(p => p.ownerId === o.id && p.status === 'verified' && p.currency === defaultCurrency);
                  const oGross = oPayments.reduce((s, p) => s + p.amount, 0);
                  const oFee = oPayments.reduce((s, p) => s + calcFee(p.amount, data.serviceFee, o.platformFee), 0);
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={TD}>{o.name}</td>
                      <td style={TD}>{oProps.length}</td>
                      <td style={{ ...TD, fontWeight: 600 }}>{formatCurrency(oGross - oFee, defaultCurrency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

const TH: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' };
const TD: React.CSSProperties = { padding: '10px 12px' };
