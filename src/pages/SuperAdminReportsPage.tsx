import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlatformAnalytics, calcFee } from '../services/analyticsService';
import type { PlatformAnalytics } from '../services/analyticsService';
import { useToast } from '../hooks/useToast';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/format';
import { 
  AnalyticsIcon, WalletIcon, UsersIcon, 
  HomeIcon, ChartIcon, FileIcon, MailIcon, ClockIcon
} from '../components/Icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendEmail } from '../utils/emailService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SuperAdminReportsPage() {
  const { userProfile } = useAuth();
  const { show, ToastContainer } = useToast();
  const { settings: platformConfig, defaultCurrency } = useSettings();
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  
  // Auto Report State
  const [autoReportFreq, setAutoReportFreq] = useState<string>('none');
  const [savingSched, setSavingSched] = useState(false);

  const load = () => {
    setLoading(true);
    getPlatformAnalytics()
      .then(setData)
      .catch(err => {
        console.error('Reports load error:', err);
        setError('Failed to load data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error || !data) return <div className="container page"><div className="empty-state"><h3>{error || 'No data'}</h3></div></div>;

  const owners = data.users.filter(u => u.role === 'owner');
  const ownerProperties = selectedOwnerId === 'all' 
    ? data.properties 
    : data.properties.filter(p => p.ownerId === selectedOwnerId);

  // Filtered Data
  let filteredProps = ownerProperties;
  if (selectedPropertyId !== 'all') {
    filteredProps = filteredProps.filter(p => p.id === selectedPropertyId);
  }

  const filteredContracts = data.contracts.filter(c => 
    filteredProps.some(p => p.id === c.propertyId)
  );

  const activeContracts = filteredContracts.filter(c => c.status === 'active');
  const occupied = filteredProps.filter(p => p.status === 'occupied');
  
  const verifiedPayments = data.payments.filter(p => 
    p.status === 'verified' && 
    filteredProps.some(prop => prop.id === p.propertyId)
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Stats based on Verified Payments
  const grossMonthly = verifiedPayments
    .filter(p => p.month === currentMonth && (p.currency || 'USD') === defaultCurrency)
    .reduce((s, p) => s + p.amount, 0);

  const feesMonthly = verifiedPayments
    .filter(p => p.month === currentMonth && (p.currency || 'USD') === defaultCurrency)
    .reduce((s, p) => {
      const owner = data.users.find(u => u.id === p.ownerId);
      return s + calcFee(p.amount, data.serviceFee, owner?.platformFee);
    }, 0);

  const totalCollected = verifiedPayments
    .filter(p => (p.currency || 'USD') === defaultCurrency)
    .reduce((s, p) => s + p.amount, 0);

  const occupancyRate = filteredProps.length > 0 ? Math.round((occupied.length / filteredProps.length) * 100) : 0;

  // Projection logic
  const projection = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + i, 1);
    const dMonth = d.getFullYear() * 12 + d.getMonth();
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    
    const periodContracts = filteredContracts.filter(c => {
      if (c.status !== 'active') return false;
      if ((c.currency || 'USD') !== defaultCurrency) return false;
      if (!c.startDate || !c.endDate) return false;

      const s = new Date(c.startDate);
      const e = new Date(c.endDate);
      
      // Skip if invalid dates
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;

      const sMonth = s.getFullYear() * 12 + s.getMonth();
      const eMonth = e.getFullYear() * 12 + e.getMonth();
      return dMonth >= sMonth && dMonth <= eMonth;
    });

    const gross = periodContracts.reduce((sum, c) => sum + c.rentAmount, 0);
    const feeAmt = periodContracts.reduce((sum, c) => {
      const owner = data.users.find(u => u.id === c.ownerId);
      return sum + calcFee(c.rentAmount, data.serviceFee, owner?.platformFee);
    }, 0);
    return { label, gross, net: gross - feeAmt, fees: feeAmt };
  });

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = selectedPropertyId !== 'all' 
      ? `Property Report: ${data.properties.find(p => p.id === selectedPropertyId)?.title}`
      : selectedOwnerId !== 'all'
        ? `Owner Portfolio Report: ${data.users.find(u => u.id === selectedOwnerId)?.name}`
        : 'Platform Analytics Report';

    doc.setFontSize(20);
    doc.text('TerraViser Analytics Report', 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(title, 14, 38);

    // Summary Table
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Verified Revenue', formatCurrency(totalCollected, defaultCurrency)],
        ['Monthly Verified Revenue', formatCurrency(grossMonthly, defaultCurrency)],
        ['Platform Fees (Monthly)', formatCurrency(feesMonthly, defaultCurrency)],
        ['Net Monthly Payout', formatCurrency(grossMonthly - feesMonthly, defaultCurrency)],
        ['Occupancy Rate', `${occupancyRate}%`],
        ['Total Properties', filteredProps.length.toString()],
      ],
    });

    // 6-Month Projection
    doc.text('6-Month Income Projection', 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Month', 'Gross Revenue', 'Fees', 'Net Revenue']],
      body: projection.map(p => [
        p.label,
        formatCurrency(p.gross, defaultCurrency),
        formatCurrency(p.fees, defaultCurrency),
        formatCurrency(p.net, defaultCurrency)
      ]),
    });

    doc.save(`Report_${new Date().getTime()}.pdf`);
    show('Report downloaded successfully!');
  };

  const handleSendEmail = async () => {
    if (selectedOwnerId === 'all') {
      show('Please select a specific owner to send the report.', 'error');
      return;
    }
    const owner = data.users.find(u => u.id === selectedOwnerId);
    if (!owner || !owner.email) {
      show('Owner email not found.', 'error');
      return;
    }

    setSavingSched(true);
    try {
      const summary = `
        Verified Monthly: ${formatCurrency(grossMonthly, defaultCurrency)}
        Platform Fees: ${formatCurrency(feesMonthly, defaultCurrency)}
        Net Payout: ${formatCurrency(grossMonthly - feesMonthly, defaultCurrency)}
        Total Collected (All-time): ${formatCurrency(totalCollected, defaultCurrency)}
        Occupancy: ${occupancyRate}%
      `;

      await sendEmail({
        to_name: owner.name || 'Owner',
        to_email: owner.email,
        from_name: 'TerraViser Reports',
        subject: `Property Performance Report - ${new Date().toLocaleDateString()}`,
        message: `Hi ${owner.name || 'Owner'},\n\nHere is your property performance summary for ${new Date().toLocaleDateString()}:\n\n${summary}\n\nPlease log in to your dashboard to view the full details.\n\nBest regards,\nTerraViser Team`
      });
      show(`Report sent to ${owner.email}`);
    } catch (err: any) {
      console.error('Email error:', err);
      show(`Failed to send email: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingSched(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (selectedOwnerId === 'all') {
      show('Scheduling is only available for specific owners.', 'error');
      return;
    }
    setSavingSched(true);
    try {
      await updateDoc(doc(db, 'users', selectedOwnerId), {
        reportFrequency: autoReportFreq,
        reportUpdatedBy: userProfile?.id,
        reportUpdatedAt: new Date().toISOString()
      });
      show(`Auto-report set to ${autoReportFreq} for this owner.`);
    } catch (err) {
      show('Failed to save schedule.', 'error');
    } finally {
      setSavingSched(false);
    }
  };

  return (
    <div className="container page">
      <ToastContainer />
      
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AnalyticsIcon size={24} color="var(--teal)" />
              Analytics Reports
            </h1>
            <span className="badge badge-red">SuperAdmin</span>
          </div>
          <p className="page-subtitle">Generate, download, and automate property performance reports.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} style={{ gap: 8 }}>
            <FileIcon size={16} /> Download PDF
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSendEmail} 
            disabled={selectedOwnerId === 'all' || savingSched}
            style={{ gap: 8, background: 'var(--teal)' }}
          >
            <MailIcon size={16} /> Send to Owner
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ padding: 24, marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>Filter by Owner</label>
          <select 
            className="form-input" 
            value={selectedOwnerId} 
            onChange={e => { setSelectedOwnerId(e.target.value); setSelectedPropertyId('all'); }}
          >
            <option value="all">All Owners</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>Filter by Property</label>
          <select 
            className="form-input" 
            value={selectedPropertyId} 
            onChange={e => setSelectedPropertyId(e.target.value)}
          >
            <option value="all">All Properties</option>
            {ownerProperties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>Auto-Report Schedule</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select 
              className="form-input" 
              value={autoReportFreq} 
              onChange={e => setAutoReportFreq(e.target.value)}
              disabled={selectedOwnerId === 'all'}
            >
              <option value="none">Manual Only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleSaveSchedule}
              disabled={selectedOwnerId === 'all' || savingSched}
              title="Save Schedule"
            >
              <ClockIcon size={16} />
            </button>
          </div>
          {selectedOwnerId === 'all' && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Select an owner to enable scheduling.</p>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid-4" style={{ marginBottom: 32, gap: 16 }}>
        <KpiCard label="Total Collected" value={formatCurrency(totalCollected, defaultCurrency)} sub="Total verified payments" color="var(--teal)" icon={<WalletIcon size={20} color="var(--teal)" />} />
        <KpiCard label="Monthly Revenue" value={formatCurrency(grossMonthly, defaultCurrency)} sub={`${MONTHS[new Date().getMonth()]} verified`} color="#3b82f6" icon={<AnalyticsIcon size={20} color="#3b82f6" />} />
        <KpiCard label="Platform Fees" value={formatCurrency(feesMonthly, defaultCurrency)} sub="Monthly service revenue" color="#f59e0b" icon={<ChartIcon size={20} color="#f59e0b" />} />
        <KpiCard label="Occupancy" value={`${occupancyRate}%`} sub={`${occupied.length} / ${filteredProps.length} units`} color={occupancyRate >= 75 ? 'var(--teal)' : '#f59e0b'} icon={<HomeIcon size={20} color={occupancyRate >= 75 ? 'var(--teal)' : '#f59e0b'} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Projection Chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 24 }}>Income Projection (6 Months)</h3>
          
          {Math.max(...projection.map(p => p.gross)) === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No active contracts found for this period.
            </div>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 20 }}>
              {projection.map((m, i) => {
                const maxGross = Math.max(...projection.map(p => p.gross), 1);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ position: 'relative', height: 180, display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', height: `${(m.gross / maxGross) * 100}%`, background: 'var(--teal)', opacity: 0.15, borderRadius: '4px 4px 0 0' }} />
                      <div style={{ position: 'absolute', width: '100%', height: `${(m.net / maxGross) * 100}%`, background: 'var(--teal-dark)', borderRadius: '4px 4px 0 0' }} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>{m.label.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--teal)', opacity: 0.3 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--teal-dark)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Payout (after fees)</span>
            </div>
          </div>
        </div>

        {/* Property Breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 20 }}>Property Breakdown</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px 0' }}>Property</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredProps.map(p => {
                  const propPayments = verifiedPayments.filter(pay => pay.propertyId === p.id);
                  const totalPaid = propPayments.reduce((s, pay) => s + pay.amount, 0);
                  const lastPayment = propPayments.sort((a, b) => b.month.localeCompare(a.month))[0];
                  
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 0' }}>
                        <div style={{ fontWeight: 500 }}>{p.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.location}</div>
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'occupied' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        <div title="Total Verified Paid">{formatCurrency(totalPaid, p.currency || defaultCurrency)}</div>
                        {lastPayment && <div style={{ fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 400 }}>Last: {lastPayment.month}</div>}
                      </td>
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

function KpiCard({ label, value, sub, color, icon }: any) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function LegendDot({ color, label }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
