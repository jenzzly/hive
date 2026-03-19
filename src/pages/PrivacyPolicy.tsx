import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ paddingBlock: 80, maxWidth: 800, marginInline: 'auto' }}>
      <h1 className="page-title">Privacy Policy</h1>
      <p className="page-subtitle">Last Updated: March 19, 2026</p>
      
      <div className="card" style={{ marginTop: 40, padding: 40, lineHeight: '1.8' }}>
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, list a property, or communicate with other users. This may include your name, email address, phone number, and property details.</p>
        </section>

        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>2. How We Use Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, including to facilitate connections between property owners and tenants, and to process transactions.</p>
        </section>

        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>3. Information Sharing</h2>
          <p>We do not share your personal information with third parties except as described in this policy, such as when you consent to share information with another user to facilitate a rental agreement.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--slate-800)' }}>4. Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>
        </section>
      </div>
    </div>
  );
}
