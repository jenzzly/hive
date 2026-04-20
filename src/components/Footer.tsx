import { BrandLogo, MailIcon, PhoneIcon, BugIcon } from './Icons';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandLogo size={28} />
          <span style={{ fontWeight: 800, letterSpacing: '-0.3px' }}>TerraViser</span>
        </div>
        <div className="footer-contact">
          <a href="mailto:info@terraviser.com" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <MailIcon size={14} color="var(--blue-100)" />
            info@terraviser.com
          </a>
          <a href="tel:+250782388933" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <PhoneIcon size={14} color="var(--blue-100)" />
            +250 782 388 933
          </a>
        </div>
      </div>
      <div className="footer-inner" style={{ paddingTop: 0, marginTop: 8 }}>
        <div className="footer-links" style={{ display: 'flex', gap: 20, fontSize: '0.84rem', opacity: 0.8 }}>
          <a href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: 'inherit' }}>Terms of Service</a>
          <a
            href="mailto:info@terraviser.com?subject=Bug Report"
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fca5a5' }}
          >
            <BugIcon size={14} color="#fca5a5" />
            Report a bug
          </a>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} TerraViser. All rights reserved.
        </div>
      </div>
    </footer>
  );
}