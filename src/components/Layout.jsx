import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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

  return (
    <div className="layout-content">
      {/* Animated background orbs */}
      <div className="layout-bg" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Logo */}
          <NavLink to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <img src="/logo.svg" alt="NodeVault Logo" width="28" height="28" />
            </div>
            <span className="navbar-logo-text">
              Node<span className="gradient-text">Vault</span>
            </span>
          </NavLink>

          {/* Desktop nav links */}
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
            <NavLink to="/tiers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Node Tiers
            </NavLink>
            <NavLink to="/mining" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--accent-cyan)' }}>
              Free Mining
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            {isLoggedIn && isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: '#FACC15', fontWeight: 700 }}>
                🛡️ Admin
              </NavLink>
            )}
          </div>

          {/* CTA Buttons & User Profile */}
          <div className="navbar-cta">
            {/* Interactive User Guide Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', borderColor: 'rgba(0, 229, 255, 0.35)', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
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
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span className="pulse-dot" style={{ background: '#00e5ff' }} />
                  <span className="navbar-username">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { logout(); navigate('/'); }}
                  style={{ marginLeft: 6 }}
                >
                  Exit
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <NavLink to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Create Account
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
          <NavLink to="/" end className="mobile-link" onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/tiers" className="mobile-link" onClick={() => setMenuOpen(false)}>Node Tiers</NavLink>
          <NavLink to="/mining" className="mobile-link" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent-cyan)' }}>Free Mining</NavLink>
          <NavLink to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
          {isLoggedIn ? (
            <>
              <NavLink to="/kyc" className="mobile-link" onClick={() => setMenuOpen(false)}>KYC Verification ({kycStatus})</NavLink>
              <NavLink to="/account" className="mobile-link" onClick={() => setMenuOpen(false)}>Payout Accounts & Profile</NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)} style={{ color: '#FACC15', fontWeight: 700 }}>
                  🛡️ Admin Panel
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 12 }}>
              <NavLink to="/login" className="btn btn-secondary" onClick={() => setMenuOpen(false)}>
                Sign In
              </NavLink>
              <NavLink to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                Create Account
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      <main className="page-enter">
        <Outlet />
      </main>

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
            © 2026 NodeVault Protocol. Institutional-grade yield staking infrastructure.
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
