import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NotificationCenter from './NotificationCenter';
import UserGuideModal from './UserGuideModal';
import {
  IconNodeCube,
  IconShieldNIBSS,
  IconLightningNVT,
  IconCompass,
  IconDashboard,
  IconSliders,
  IconWhatsApp,
  IconTelegram,
  IconCurrencyNVT,
  IconArrowRight,
  IconBank,
  IconBinaryTree,
  IconServer,
  IconKYC,
} from './icons/IconSet';
import './Navbar.css';

export default function Layout() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const {
    isLoggedIn,
    user,
    logout,
    projectionMode,
    toggleProjection,
    formatProjectedValue,
    sovereignRate,
  } = useApp();
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
            <span className="ticker-item"><strong className="ticker-cyan">{sovereignRate?.customerAPY || '12.7'}%</strong> SOVEREIGN APY (CBN 364D BENCHMARK)</span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">STATUTORY POLICY: <strong className="ticker-green">100% PRINCIPAL DISBURSEMENT</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">AFFILIATE PROGRAM: <strong className="ticker-cyan">15 NVT ONE-TIME · 1 NVT/YR MAINLINE · 0.1 NVT/YR DOWNLINE</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">SETTLEMENT: <strong className="ticker-indigo">INSTANT NIBSS CLEARING (₦ NGN)</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">PARITY: <strong className="ticker-cyan">1 $NVT = ₦10.00 NGN (1 POINT = 1 NVT)</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item"><span className="pulse-dot" /> <strong>MAINNET ONLINE</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item"><strong className="ticker-cyan">{sovereignRate?.customerAPY || '12.7'}%</strong> SOVEREIGN APY (CBN 364D BENCHMARK)</span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">STATUTORY POLICY: <strong className="ticker-green">100% PRINCIPAL DISBURSEMENT</strong></span>
            <span className="ticker-sep">/</span>
            <span className="ticker-item">MAX YEARLY CAP: <strong className="ticker-cyan">1000% MAINLINE · 1200% DOWNLINE</strong></span>
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
        <div className="navbar-inner">
          {/* Logo & Brand */}
          <div className="navbar-brand-group">
            <NavLink to="/" className="navbar-logo">
              <div className="navbar-logo-icon">
                <IconNodeCube size={22} color="var(--accent-cyan)" />
              </div>
              <div className="navbar-logo-wrap">
                <span className="navbar-logo-text">
                  NODE<span className="gradient-text-cyan">VAULT</span>
                </span>
              </div>
            </NavLink>
          </div>

          {/* Desktop nav links */}
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <IconCompass size={14} />
              <span>Explore</span>
            </NavLink>
            <NavLink to="/tiers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <IconNodeCube size={14} />
              <span>Tiers</span>
              <span className="nav-tag-badge">15</span>
            </NavLink>
            <NavLink to="/mining" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <IconLightningNVT size={14} />
              <span>Mining</span>
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <IconDashboard size={14} />
              <span>Dashboard</span>
            </NavLink>
            {isLoggedIn && isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                <IconShieldNIBSS size={14} />
                <span>Admin</span>
              </NavLink>
            )}
          </div>

          {/* CTA Buttons & User Profile */}
          <div className="navbar-cta">
            {/* $NVT Dual Projection Engine Switcher */}
            <button
              type="button"
              className={`nav-projection-toggle ${projectionMode === 'NVT' ? 'active-nvt' : ''}`}
              onClick={toggleProjection}
              title={`Switch Currency Projection: Currently ${projectionMode === 'NVT' ? '$NVT (₦10/coin)' : '₦ NGN Live'}`}
            >
              <IconCurrencyNVT size={13} />
              <span className="projection-label">{projectionMode === 'NVT' ? '$NVT' : '₦ NGN'}</span>
            </button>

            {/* Official Community Action Icons */}
            <div className="navbar-community-group">
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-community-icon-btn nav-wa-btn"
                title="WhatsApp Support & Community"
                aria-label="WhatsApp"
              >
                <IconWhatsApp size={14} />
              </a>
              <a
                href="https://t.me/NodeVaultBot"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-community-icon-btn nav-tg-btn"
                title="NodeVault Telegram Bot"
                aria-label="Telegram Bot"
              >
                <IconTelegram size={14} />
              </a>
            </div>

            {/* Interactive Platform Simulator Button */}
            <button
              type="button"
              className="nav-btn-sim"
              onClick={() => setShowUserGuide(true)}
              title="Interactive Platform Simulator & Staking Calculator"
            >
              <IconSliders size={13} color="var(--accent-cyan)" />
              <span className="sim-text">Simulator</span>
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
                    <span className="navbar-balance">{formatProjectedValue(userBalance)}</span>
                  </div>
                </Link>
                <button
                  className="nav-exit-btn"
                  onClick={() => { logout(); navigate('/'); }}
                  title="Sign Out"
                >
                  Exit
                </button>
              </div>
            ) : (
              <div className="nav-auth-actions">
                <NavLink to="/login" className="nav-btn-ghost">
                  Sign In
                </NavLink>
                <NavLink to="/register" className="nav-btn-launch">
                  <span>Launch App</span>
                  <IconArrowRight size={12} />
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
              <span>NIBSS Cleared ({sovereignRate?.customerAPY || '12.7'}% APY)</span>
            </div>
            <button
              type="button"
              className={`nav-projection-toggle ${projectionMode === 'NVT' ? 'active-nvt' : ''}`}
              onClick={toggleProjection}
              style={{ fontSize: '0.7rem' }}
            >
              <IconCurrencyNVT size={13} />
              <span>{projectionMode === 'NVT' ? '$NVT' : '₦ NGN'}</span>
            </button>
          </div>

          <NavLink to="/" end className="mobile-link" onClick={() => setMenuOpen(false)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconCompass size={18} /> Explore
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Mainnet</span>
          </NavLink>
          <NavLink to="/tiers" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconNodeCube size={18} /> Node Tiers (15)
            </span>
            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{sovereignRate?.customerAPY || '12.7'}% APY</span>
          </NavLink>
          <NavLink to="/mining" className="mobile-link" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent-cyan)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconLightningNVT size={18} /> Mining Terminal
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Live</span>
          </NavLink>
          <NavLink to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconDashboard size={18} /> Dashboard
            </span>
          </NavLink>
          <button
            type="button"
            className="mobile-link"
            style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => { setMenuOpen(false); setShowUserGuide(true); }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)' }}>
              <IconSliders size={18} /> Node Simulator & Guide
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Interactive</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', padding: '0 0.5rem' }}>
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-community-btn nav-wa-btn"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <IconWhatsApp size={16} /> WhatsApp
            </a>
            <a
              href="https://t.me/NodeVaultBot"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-community-btn nav-tg-btn"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <IconTelegram size={16} /> Telegram
            </a>
          </div>

          {isLoggedIn ? (
            <>
              <NavLink to="/kyc" className="mobile-link" onClick={() => setMenuOpen(false)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconKYC size={18} /> KYC Verification
                </span>
                <span className={`badge ${kycStatus === 'verified' ? 'badge-green' : 'badge-cyan'}`}>{kycStatus}</span>
              </NavLink>
              <NavLink to="/account" className="mobile-link" onClick={() => setMenuOpen(false)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconBank size={18} /> Payout Accounts
                </span>
                <span className="navbar-balance">{formatProjectedValue(userBalance)}</span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconShieldNIBSS size={18} /> Admin Panel
                  </span>
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
                Launch Terminal
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      <main className="page-enter">
        <Outlet />
      </main>

      {/* Comprehensive 4-Column Crypto Launchpad Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            {/* Column 1: Brand & NIBSS Regulation */}
            <div className="footer-brand-col">
              <div className="footer-brand-header">
                <div className="footer-brand-logo">
                  <IconNodeCube size={22} color="var(--accent-cyan)" />
                </div>
                <span className="footer-brand-name">
                  NODE<span className="gradient-text-cyan">VAULT</span>
                </span>
              </div>
              <p className="footer-brand-tagline">
                Institutional-grade sovereign validator node infrastructure. Operating under strict Nigerian inter-bank standards with automated NIBSS clearing and 100% statutory capital protection.
              </p>
              <div className="footer-nibss-badge">
                <IconShieldNIBSS size={16} />
                <span>NIBSS Regulatory Clearing Rail</span>
              </div>
            </div>

            {/* Column 2: Validator Ecosystem */}
            <div className="footer-col">
              <h4 className="footer-col-title">
                <IconServer size={14} color="var(--accent-cyan)" />
                <span>Validator Rail</span>
              </h4>
              <ul className="footer-nav-list">
                <li><Link to="/tiers" className="footer-nav-link">15 Enterprise Node Tiers</Link></li>
                <li><Link to="/mining" className="footer-nav-link">Cryptographic Mining Terminal</Link></li>
                <li><Link to="/dashboard" className="footer-nav-link">Validator Telemetry HUD</Link></li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowUserGuide(true)}
                    className="footer-nav-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Interactive Node Simulator
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Regulation & Settlement */}
            <div className="footer-col">
              <h4 className="footer-col-title">
                <IconShieldNIBSS size={14} color="var(--accent-green)" />
                <span>Compliance & Rails</span>
              </h4>
              <ul className="footer-nav-list">
                <li><Link to="/kyc" className="footer-nav-link">AML / Tier-2 KYC Protocol</Link></li>
                <li><Link to="/account" className="footer-nav-link">NUBAN Banking & Payouts</Link></li>
                <li><span className="footer-nav-link" style={{ opacity: 0.85 }}>100% Statutory Capital Return</span></li>
                <li><span className="footer-nav-link" style={{ opacity: 0.85 }}>CBN EMTL Statutory Stamp</span></li>
              </ul>
            </div>

            {/* Column 4: Official Community & Bots */}
            <div className="footer-col">
              <h4 className="footer-col-title">
                <IconLightningNVT size={14} color="var(--accent-cyan)" />
                <span>Official Channels</span>
              </h4>
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-community-card"
              >
                <div className="footer-community-meta">
                  <span className="footer-community-name" style={{ color: '#25D366' }}>WhatsApp Desk</span>
                  <span className="footer-community-status">Direct VIP Support & Clearing</span>
                </div>
                <IconArrowRight size={16} color="#25D366" />
              </a>

              <a
                href="https://t.me/NodeVaultBot"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-community-card"
              >
                <div className="footer-community-meta">
                  <span className="footer-community-name" style={{ color: '#38BDF8' }}>Telegram Bot</span>
                  <span className="footer-community-status">@NodeVaultBot · Live Yield Alerts</span>
                </div>
                <IconArrowRight size={16} color="#38BDF8" />
              </a>
            </div>
          </div>

          {/* Sub-Footer Ribbon */}
          <div className="footer-ribbon">
            <div className="footer-ribbon-left">
              <span>© 2026 NodeVault Protocol Ltd. All rights reserved.</span>
              <span className="footer-parity-pill">
                Parity: <strong>1 $NVT = ₦10.00 NGN</strong>
              </span>
            </div>
            <div className="footer-ribbon-right">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-green)' }}>
                <span className="pulse-dot" /> NIBSS Inter-Bank Instant Rail Online
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Single Interactive Platform User Guide & Node Simulator Modal */}
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
