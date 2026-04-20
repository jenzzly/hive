import { BrandLogo, MailIcon, PhoneIcon, BugIcon, FacebookIcon, TwitterIcon, InstagramIcon } from './Icons';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandLogo size={28} />
          <span style={{ fontWeight: 800, letterSpacing: '-0.3px' }}>TerraViser</span>
        </div>
        <div className="footer-contact" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="mailto:info@terraviser.com" style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#fff' }}>
              <MailIcon size={16} color="var(--blue-100)" />
              info@terraviser.com
            </a>
            <a href="tel:+250782388933" style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#fff' }}>
              <PhoneIcon size={16} color="var(--blue-100)" />
              +250 782 388 933
            </a>
          </div>
          <a
            href="mailto:info@terraviser.com?subject=Bug Report"
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fca5a5', fontSize: '0.85rem' }}
          >
            <BugIcon size={15} color="#fca5a5" />
            Report a bug / Support
          </a>
        </div>
      </div>

      <div className="footer-inner" style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="footer-links" style={{ display: 'flex', gap: 20, fontSize: '0.84rem', opacity: 0.8, flexWrap: 'wrap' }}>
          <a href="/about" style={{ color: 'inherit' }}>About Us</a>
          <a href="/work" style={{ color: 'inherit' }}>How it Works</a>
          <a href="/careers" style={{ color: 'inherit' }}>Careers</a>
          <a href="/partnership" style={{ color: 'inherit' }}>Partnership</a>
          <a href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: 'inherit' }}>Terms of Service</a>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookIcon size={20} /></a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><TwitterIcon size={20} /></a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon size={20} /></a>
        </div>

        <div className="footer-copy" style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          © {new Date().getFullYear()} TerraViser. All rights reserved.
        </div>
      </div>
    </footer>
  );
}