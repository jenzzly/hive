import { useEffect } from 'react';

const S: Record<string, React.CSSProperties> = {
  hero: {
    padding: '120px 24px 80px',
    background: 'linear-gradient(135deg, #003580 0%, #001f4d 100%)',
    color: '#fff',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 800,
    marginBottom: 16,
    letterSpacing: '-1.5px',
    maxWidth: 900,
    margin: '0 auto 16px',
  },
  heroSub: {
    fontSize: '1.25rem',
    opacity: 0.9,
    maxWidth: 700,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  section: {
    padding: '80px 24px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 40,
    marginTop: 48,
  },
  card: {
    padding: 32,
    borderRadius: 16,
    background: '#fff',
    boxShadow: 'var(--shadow)',
    transition: 'transform 0.2s, boxShadow 0.2s',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'var(--blue-50)',
    color: 'var(--blue-700)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    marginBottom: 20,
  },
  tag: {
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--blue-600)',
    marginBottom: 12,
    display: 'block',
  }
};

export default function Company() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: '#f8fbfc', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={S.hero}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={S.heroTitle}>Building Trust in Rwanda's Real Estate</h1>
          <p style={S.heroSub}>
            TerraViser is more than a rental platform. We are a technology-driven partner for tenants, owners, and property managers.
          </p>
        </div>
      </section>

      {/* About Us */}
      <section id="about" style={S.section}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <span style={S.tag}>About Us</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Redefining the rental experience.</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              Founded in Kigali, TerraViser was born from a simple observation: the rental market in Rwanda needed more transparency, digitalization, and trust.
            </p>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              We bridge the gap between properties and people by providing a managed ecosystem where contracts are digital, payments are verified, and communication is seamless. Our goal is to make renting a property as professional and stress-free as it should be.
            </p>
          </div>
          <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <img 
              src="/Users/janvier_byiringiro/.gemini/antigravity/brain/56007ac0-a407-4875-8a9f-47a2374ad765/company_hero_1776712901874.png" 
              alt="TerraViser Office" 
              style={{ width: '100%', display: 'block' }} 
            />
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section id="work" style={{ ...S.section, maxWidth: '100%', background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={S.tag}>How We Work</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>A Managed Ecosystem</h2>
          </div>
          <div style={S.grid}>
            <div style={S.card}>
              <div style={S.iconBox}>✓</div>
              <h3 style={{ marginBottom: 12 }}>Verified Listings</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>We don't just list properties; we verify them. Every property on TerraViser goes through a verification process to ensure it exists and matches the description.</p>
            </div>
            <div style={S.card}>
              <div style={S.iconBox}>📄</div>
              <h3 style={{ marginBottom: 12 }}>Smart Contracts</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>No more paper-work headache. Our digital contracts are tailored to Rwandan law and can be reviewed, signed, and stored right in your dashboard.</p>
            </div>
            <div style={S.card}>
              <div style={S.iconBox}>💳</div>
              <h3 style={{ marginBottom: 12 }}>Transparent Finance</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Track every payment and reimbursement. Our system provides automated rent receipts (EBM) and financial analytics for both owners and tenants.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Careers & Partnership */}
      <section id="careers" style={S.section}>
        <div style={S.grid}>
          <div style={{ padding: 40, borderRadius: 20, background: 'var(--blue-900)', color: '#fff' }}>
            <span style={{ ...S.tag, color: 'var(--blue-300)' }}>Careers</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>Join the Mission</h3>
            <p style={{ opacity: 0.8, marginBottom: 24, lineHeight: 1.6 }}>
              We are looking for passionate individuals in technology, real estate, and customer success to help us build the future of living in Rwanda.
            </p>
            <a href="mailto:careers@terraviser.com" className="btn" style={{ background: '#fff', color: 'var(--blue-900)', fontWeight: 700 }}>View Openings</a>
          </div>
          <div style={{ padding: 40, borderRadius: 20, background: '#fff', border: '1px solid var(--border)' }}>
            <span style={S.tag}>Partnership</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>Partner with Us</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Are you a developer, legal firm, or hardware provider? We collaborate with industry leaders to expand our ecosystem and value.
            </p>
            <a href="mailto:partners@terraviser.com" className="btn btn-primary">Let's Talk</a>
          </div>
        </div>
      </section>
    </div>
  );
}
