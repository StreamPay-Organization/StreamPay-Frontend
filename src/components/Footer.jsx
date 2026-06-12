import './Footer.css';

/**
 * App footer with a short tagline and a mock-data disclaimer.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>💧 StreamPay · stream money by the second on Stellar</span>
        <span className="footer__note">
          Demo build · mock wallet &amp; data · © {year}
        </span>
      </div>
    </footer>
  );
}
