import type { Contract } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  contract: Contract;
  propertyTitle?: string;
  tenantName?: string;
}

export default function ContractViewer({ contract, propertyTitle, tenantName }: Props) {
  const isNotice = contract.status === 'on_notice';
  const start = new Date(contract.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const end = new Date(contract.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="card" style={{ padding: '20px 24px', border: isNotice ? '1.5px solid #fef3c7' : '1px solid var(--border)', background: isNotice ? '#fffaf0' : '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rental Agreement</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.2rem', color: 'var(--terra-900)', marginTop: 2 }}>{propertyTitle || 'Unknown Property'}</div>
        </div>
        <span className={`badge ${isNotice ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, padding: '4px 12px' }}>
          {isNotice ? '📢 On Notice' : '● ' + contract.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Detail label="Tenant" value={tenantName || contract.tenantId} icon="👤" />
        <Detail label="Monthly Rent" value={formatCurrency(contract.rentAmount, contract.currency || 'RWF')} highlight />
        <Detail label="Security Deposit" value={formatCurrency(contract.depositAmount || 0, contract.currency || 'USD')} />
        <Detail label="Notice Period" value={`${contract.noticePeriodDays || 15} days`} />
        <Detail label="Lease Duration" value={`${start} – ${end}`} />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contract ID: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>#{contract.id.slice(-8).toUpperCase()}</span></div>
        
        {contract.contractDocumentURL ? (
          <a href={contract.contractDocumentURL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--terra-600)', fontWeight: 600, textDecoration: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            View Document
          </a>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No document attached</span>
        )}
      </div>

      {isNotice && contract.noticeDate && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef3c7', borderRadius: 10, fontSize: '0.82rem', color: '#92400e', fontWeight: 600, textAlign: 'center', border: '1px solid #fde68a' }}>
          ⚠️ Notice period active. Exit Date: {new Date(new Date(contract.noticeDate).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, highlight, icon }: { label: string; value: string; highlight?: boolean; icon?: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: highlight ? '1.05rem' : '0.92rem', fontWeight: highlight ? 700 : 600, color: highlight ? 'var(--terra-600)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
        {value}
      </div>
    </div>
  );
}
