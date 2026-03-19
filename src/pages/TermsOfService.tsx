import React from 'react';

export default function TermsOfService() {
  return (
    <div className="container" style={{ paddingBlock: 80, maxWidth: 800, marginInline: 'auto' }}>
      <h1 className="page-title">Terms of Service</h1>
      <p className="page-subtitle">Last Updated: March 19, 2026</p>

      <div className="card" style={{ marginTop: 40, padding: 40, lineHeight: '1.8' }}>
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using Terrra (the 'Service'), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </section>

        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>2. Eligibility</h2>
          <p>You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you meet this age requirement.</p>
        </section>

        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>3. User Accounts</h2>
          <p>When you create an account, you are responsible for maintaining the confidentiality of your account password and are responsible for all activities that occur under your account.</p>
        </section>

        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>4. Property Listings</h2>
          <p>Property owners are solely responsible for the accuracy of their listings. Terrra does not guarantee the condition of any property or the suitability of any tenant or owner.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>5. Limitation of Liability</h2>
          <p>Terrra shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>
        </section>
      </div>
    </div>
  );
}
