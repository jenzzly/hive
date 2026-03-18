import type { Contract, Currency } from '../types';

interface Props {
    contract: Contract;
    propertyTitle?: string;
    tenantName?: string;
}

function formatMoney(amount: number, currency: Currency = 'USD') {
    if (currency === 'RWF') return `${amount.toLocaleString()} RWF`;
    return `$${amount.toLocaleString()}`;
}

export default function ContractViewer({ contract, propertyTitle, tenantName }: Props) {
    const isActive = contract.status === 'active';
    const currency: Currency = (contract as any).currency ?? 'USD';

    const start = new Date(contract.startDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const end = new Date(contract.endDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div style={S.card}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <div style={S.title}>Rental Agreement</div>
                    {propertyTitle && <div style={S.subtitle}>{propertyTitle}</div>}
                </div>
                <span style={{
                    ...S.badge,
                    background: isActive ? 'var(--sage-100)' : 'var(--stone-100)',
                    color: isActive ? 'var(--sage-700)' : 'var(--stone-500)',
                    border: `1px solid ${isActive ? 'var(--sage-200)' : 'var(--stone-200)'}`,
                }}>
                    {isActive ? '● Active' : '○ Expired'}
                </span>
            </div>

            {/* Currency chip */}
            <div style={{ padding: '0 24px 16px' }}>
                <span style={{
                    fontSize: '0.72rem', fontWeight: 600, padding: '3px 12px', borderRadius: 20,
                    background: currency === 'RWF' ? 'var(--warn-light)' : 'var(--info-light)',
                    color: currency === 'RWF' ? 'var(--warn)' : 'var(--info)',
                    border: `1px solid ${currency === 'RWF' ? 'var(--warn-border)' : 'var(--info-border)'}`,
                }}>
                    {currency === 'RWF' ? '🇷🇼 Rwandan Franc (RWF)' : '🇺🇸 US Dollar (USD)'}
                </span>
            </div>

            <hr style={S.divider} />

            {/* Details grid */}
            <div style={S.grid}>
                <Detail label="Tenant" value={tenantName || contract.tenantId} />
                <Detail label="Monthly Rent" value={formatMoney(contract.rentAmount, currency)} highlight />
                <Detail label="Security Deposit" value={formatMoney((contract as any).depositAmount ?? 0, currency)} />
                <Detail label="Start Date" value={start} />
                <Detail label="End Date" value={end} />
                <Detail label="Contract ID" value={`#${contract.id.slice(-8).toUpperCase()}`} />
                <Detail label="Status" value={isActive ? 'Active' : 'Expired'} />
            </div>

            {/* Document download */}
            {contract.contractDocumentURL && (
                <div style={S.docRow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--terra-600)" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <a
                        href={contract.contractDocumentURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={S.docLink}
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
        <div style={S.detail}>
            <div style={S.detailLabel}>{label}</div>
            <div style={{
                ...S.detailValue,
                ...(highlight ? {
                    color: 'var(--terra-600)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                } : {}),
            }}>
                {value}
            </div>
        </div>
    );
}

const S: Record<string, React.CSSProperties> = {
    card: {
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '20px 24px 14px',
        gap: 12,
    },
    title: {
        fontFamily: 'var(--font-display)',
        fontSize: '1.3rem',
        fontWeight: 600,
        color: 'var(--terra-900)',
        letterSpacing: '-0.3px',
    },
    subtitle: {
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        marginTop: 3,
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: '0.75rem',
        fontWeight: 600,
        flexShrink: 0,
    },
    divider: {
        border: 'none',
        borderTop: '1px solid var(--border)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 0,
    },
    detail: {
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
    },
    detailLabel: {
        fontSize: '0.68rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.6px',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: '0.92rem',
        fontWeight: 500,
        color: 'var(--text-primary)',
    },
    docRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 24px',
        background: 'var(--stone-50)',
    },
    docLink: {
        color: 'var(--terra-600)',
        fontSize: '0.88rem',
        fontWeight: 500,
        textDecoration: 'none',
    },
};