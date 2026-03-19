import type { Contract } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  contract: Contract;
  propertyTitle?: string;
  tenantName?: string;
}

export default function ContractViewer({ contract, propertyTitle, tenantName }: Props) {
  const isActive = contract.status === 'active';
  const start = new Date(contract.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const end = new Date(contract.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>Rental Agreement</div>
          {propertyTitle && <div style={styles.headerSub}>{propertyTitle}</div>}
        </div>
        <span style={{ ...styles.badge, background: isActive ? 'var(--teal-light)' : '#f3f4f6', color: isActive ? 'var(--teal-dark)' : '#6b7280' }}>
          {isActive ? '● Active' : '○ Expired'}
        </span>
      </div>

      <hr style={styles.divider} />

      {/* Details grid */}
      <div style={styles.grid}>
        <Detail label="Tenant" value={tenantName || contract.tenantId} />
        <Detail label="Monthly Rent" value={formatCurrency(contract.rentAmount, contract.currency || 'USD')} highlight />
        <Detail label="Start Date" value={start} />
        <Detail label="End Date" value={end} />
        <Detail label="Contract ID" value={`#${contract.id.slice(-8).toUpperCase()}`} />
        <Detail label="Status" value={isActive ? 'Active' : 'Expired'} />
      </div>

      {/* Document */}
      {contract.contractDocumentURL && (
        <div style={styles.docRow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <a
            href={contract.contractDocumentURL}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={styles.docLink}
          >
            Download Contract Document
          </a>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={styles.detail}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={{ ...styles.detailValue, ...(highlight ? styles.detailHighlight : {}) }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    boxShadow: 'var(--shadow)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
  },
  headerSub: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: '0.78rem',
    fontWeight: 500,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border)',
    margin: '16px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
  },
  detail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  detailHighlight: {
    color: 'var(--teal)',
    fontSize: '1.15rem',
  },
  docRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: '12px 16px',
    background: 'var(--teal-light)',
    borderRadius: 10,
  },
  docLink: {
    color: 'var(--teal-dark)',
    fontWeight: 500,
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
};
