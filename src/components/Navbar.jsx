import { NavLink, Link } from 'react-router-dom';
import WalletButton from './WalletButton.jsx';
import './Navbar.css';

/**
 * Top navigation bar with brand, primary links and the wallet button.
 */
export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo" role="img" aria-label="StreamPay logo">
            💧
          </span>
          StreamPay
        </Link>

        <nav className="navbar__links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/create">Create Stream</NavLink>
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}
