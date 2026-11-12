import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../data/platform';
import NotificationCenter from './NotificationCenter';
import UserGuideModal from './UserGuideModal';
import './Navbar.css';

export default function Layout() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const { isLoggedIn, user, logout }  = useApp();
  const location                      = useLocation();
  const navigate                      = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const kycStatus = user?.kycStatus || 'unverified';
  const isAdmin   = user?.role === 'admin' || user?.email?.includes('admin');
  const userBalance = user?.walletBalance || 0;

  return (
    <div className="layout-content">
      {/* Top Live Protocol Ticker Bar (only.meme launchpad style) */}
      <div className="protocol-ticker-strip">
        <div className="ticker-inner">
          <div className="ticker-track">
            <span className="ticker-item"><span className="pulse-dot" /> <strong>MAINNET ONLINE</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item"><strong className="ticker-cyan">12.0%</strong> SOVEREIGN APY</span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">CAPITAL PROTECTION: <strong className="ticker-green">70% GUARANTEE</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">REFERRAL REWARDS: <strong className="ticker-cyan">15% DIRECT OR 1% MAINLINE</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">SETTLEMENT: <strong className="ticker-indigo">INSTANT NIBSS & PAYSTACK (₦ NGN)</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item"><span className="pulse-dot" /> <strong>MAINNET ONLINE</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item"><strong className="ticker-cyan">12.0%</strong> SOVEREIGN APY</span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">CAPITAL PROTECTION: <strong className="ticker-green">70% GUARANTEE</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">DOWNLINE POOL: <strong className="ticker-cyan">0.1% MAX 7 LEVELS</strong></span>
          </div>
        </div>
      </div>

      {/* Ambient background glow layers */}
      <div className="layout-bg" aria-hidden="true">
        <div className="bg-glow-orb bg-glow-1" />
        <div className="bg-glow-orb bg-glow-2" />
        <div className="bg-glow-orb bg-glow-3" />
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Logo & Protocol Badge */}
          <div className="navbar-brand-group">
            <NavLink to="/" className="navbar-logo">
              <div className="navbar-logo-icon">
                <img src="/logo.svg" alt="NodeVault Logo" width="26" height="26" />
              </div>
              <div className="navbar-logo-wrap">
                <span className="navbar-logo-text">
                  NODE<span className="gradient-text-cyan">VAULT</span>
                </span>
                <span className="navbar-badge-tag">V2.4</span>
              </div>
            </NavLink>

            <div className="nav-protocol-pill" title="Native NGN Settlement Engine">
              <span className="flag-icon">🇳🇬</span>
              <span className="protocol-label">NGN NATIVE</span>
              <span className="pulse-dot" />
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Explore
            </NavLink>
            <NavLink to="/tiers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-tag-badge">15 TIERS</span> Node Tiers
            </NavLink>
            <NavLink to="/mining" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Mining Terminal ⚡
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            {isLoggedIn && isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                🛡️ Admin
              </NavLink>
            )}
          </div>

          {/* CTA Buttons & User Profile */}
          <div className="navbar-cta">
            {/* Interactive User Guide Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm nav-guide-btn"
              onClick={() => setShowUserGuide(true)}
              title="Interactive Platform Guide & Walkthrough"
            >
              <span>📖</span> Guide
            </button>

            {/* Notification Bell */}
            {isLoggedIn && <NotificationCenter />}

            {isLoggedIn ? (
              <div className="navbar-user">
                <Link
                  to="/account"
                  className="nav-user-pill"
                  title="View Payout Accounts & KYC"
                >
                  <span className={`user-status-dot ${kycStatus === 'verified' ? 'verified' : ''}`} />
                  <div className="nav-user-info">
                    <span className="navbar-username">{user?.name?.split(' ')[0]}</span>
                    <span className="navbar-balance">₦{Number(userBalance || 0).toLocaleString('en-NG')}</span>
                  </div>
                </Link>
                <button
                  className="btn btn-secondary btn-sm nav-exit-btn"
                  onClick={() => { logout(); navigate('/'); }}
                >
                  Exit
                </button>
              </div>
            ) : (
              <div className="nav-auth-actions">
                <NavLink to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </NavLink>
                <NavLink to="/register" className="btn btn-sm btn-launch-terminal">
                  Launch Terminal ⚡
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-protocol-status">
            <div className="mobile-network-indicator">
              <span className="pulse-dot" />
              <span>NGN Mainnet Protocol (12.0% APY)</span>
            </div>
            <span className="badge badge-cyan">₦ NGN Live</span>
          </div>

          <NavLink to="/" end className="mobile-link" onClick={() => setMenuOpen(false)}>
            <span>Explore</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Home</span>
          </NavLink>
          <NavLink to="/tiers" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <span>Node Tiers (15)</span>
            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>12% APY</span>
          </NavLink>
          <NavLink to="/mining" className="mobile-link" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent-cyan)' }}>
            <span>Mining Terminal</span>
            <span>⚡</span>
          </NavLink>
          <NavLink to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <span>Dashboard</span>
          </NavLink>
          {isLoggedIn ? (
            <>
              <NavLink to="/kyc" className="mobile-link" onClick={() => setMenuOpen(false)}>
                <span>KYC Verification</span>
                <span className={`badge ${kycStatus === 'verified' ? 'badge-green' : 'badge-cyan'}`}>{kycStatus}</span>
              </NavLink>
              <NavLink to="/account" className="mobile-link" onClick={() => setMenuOpen(false)}>
                <span>Payout Accounts & Profile</span>
                <span className="navbar-balance">₦{Number(userBalance || 0).toLocaleString('en-NG')}</span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  <span>🛡️ Admin Panel</span>
                </NavLink>
              )}
              <button
                className="btn btn-secondary"
                style={{ marginTop: 8 }}
                onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: 12 }}>
              <NavLink to="/login" className="btn btn-secondary" onClick={() => setMenuOpen(false)}>
                Sign In
              </NavLink>
              <NavLink to="/register" className="btn btn-launch-terminal" onClick={() => setMenuOpen(false)}>
                Launch Terminal ⚡
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      <main className="page-enter">
        <Outlet />
      </main>

      {/* Interactive Platform User Guide Modal */}
      {showUserGuide && (
        <UserGuideModal onClose={() => setShowUserGuide(false)} />
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="navbar-logo-icon" style={{ width: 28, height: 28 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="url(#footerGrad)"/>
                <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.9)"/>
                <defs>
                  <linearGradient id="footerGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#00e5ff"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="footer-brand-text">NodeVault</span>
          </div>
          <p className="footer-copy">
            © 2026 NodeVault Protocol. Institutional-grade yield staking infrastructure. 100% Native NGN Settlement.
          </p>
          <div className="footer-links">
            <Link to="/kyc" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>AML / KYC</Link>
            <span>•</span>
            <Link to="/account" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Banking & EMTL</Link>
            <span>•</span>
          </div>
        </div>
      </footer>

      {/* Interactive Platform User Guide Modal */}
      <UserGuideModal
        isOpen={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        onNavigateTab={(tabKey) => {
          navigate('/dashboard');
        }}
      />
    </div>
  );
}
