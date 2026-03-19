export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <svg width="22" height="22" viewBox="0 0 28 32" fill="none">
                        <path d="M14 0L28 8V24L14 32L0 24V8L14 0Z" fill="#1D9E75" opacity="0.9" />
                        <path d="M14 6L22 11V21L14 26L6 21V11L14 6Z" fill="white" opacity="0.3" />
                    </svg>
                    Terraviser
                </div>
                <div className="footer-contact">
                    <a href="mailto:info@terraviser.com">📧 info@terraviser.com</a>
                    <a href="tel:+250782388933">📞 +250 782 388 933</a>
                </div>
            </div>
            <div className="footer-inner" style={{ paddingTop: 0, marginTop: 8 }}>
                <div className="footer-links" style={{ display: 'flex', gap: 20, fontSize: '0.85rem', opacity: 0.8 }}>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/terms">Terms of Service</a>
                </div>
                <div className="footer-copy">
                    © {new Date().getFullYear()} Terraviser. All rights reserved.
                </div>
            </div>
        </footer>
    );
}