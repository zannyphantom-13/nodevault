import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { REGIONS, TIER_DATA_NG, TIER_DATA_US, formatCurrency } from '../data/platform';
import './RegionSelect.css';

const NG_HIGHLIGHTS = [
  { icon: '📊', label: '15 Node Tiers',         sub: '₦1,000 → ₦2,560,000' },
  { icon: '🛡️', label: 'Capital Protection',     sub: 'Up to 70% guaranteed' },
  { icon: '💰', label: 'Protocol Yield',     sub: '15–20% p.a.' },
  { icon: '👥', label: '5 Small Entry Tiers',    sub: 'Start from just ₦1,000' },
];

const US_HIGHLIGHTS = [
  { icon: '📊', label: '15 Node Tiers',           sub: '$1 → $2,560' },
  { icon: '🛡️', label: 'Capital Protection',     sub: 'Up to 70% guaranteed' },
  { icon: '💰', label: 'Protocol Yield',          sub: '15–20% p.a.' },
  { icon: '🛡️', label: 'Single Group (Tier 9+)',  sub: 'Nexus → Genesis: 1 global pool' },
];

export default function RegionSelect() {
  const { selectRegion } = useApp();
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selecting, setSelecting]         = useState(null);

  const handleSelect = (code) => {
    setSelecting(code);
    setTimeout(() => selectRegion(code), 600);
  };

  const ngTop3 = TIER_DATA_NG.filter(t => t.category === 'small').slice(0, 3);
  const usTop3 = TIER_DATA_US.filter(t => t.category === 'small').slice(0, 3);

  return (
    <div className="region-page">
      {/* Background orbs */}
      <div className="layout-bg" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="region-content">
        {/* Logo */}
        <div className="region-logo">
          <div className="region-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="url(#rsGrad)"/>
              <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.95)"/>
              <defs>
                <linearGradient id="rsGrad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#00e5ff"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="region-logo-text">Node<span className="gradient-text">Vault</span></span>
        </div>

        {/* Header */}
        <div className="region-header">
          <div className="badge badge-cyan" style={{ marginBottom: '1rem' }}>
            <span className="pulse-dot" />
            Select Your Region to Continue
          </div>
          <h1 className="region-title">
            Choose Your <span className="gradient-text">Market</span>
          </h1>
          <p className="region-subtitle">
            NodeVault operates two separate staking protocols — one optimized for the
            Nigerian market and one for US-based participants. Select yours to see your
            personalized tier structure and yield rates.
          </p>
        </div>

        {/* Region cards */}
        <div className="region-cards">

          {/* ── Nigeria Card ── */}
          <button
            className={`region-card ${hoveredRegion === 'NG' ? 'hovered' : ''} ${selecting === 'NG' ? 'selecting' : ''}`}
            onMouseEnter={() => setHoveredRegion('NG')}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleSelect('NG')}
            id="region-ng"
          >
            <div className="region-card-glow region-card-glow-ng" />

            <div className="region-card-top">
              <span className="region-flag">🇳🇬</span>
              <div className="region-card-badge badge badge-green">Nigerian Market</div>
            </div>

            <h2 className="region-card-name">Nigeria Protocol</h2>
            <p className="region-card-currency">Nigerian Naira · <strong>₦</strong></p>

            <div className="region-card-highlights">
              {NG_HIGHLIGHTS.map((h, i) => (
                <div key={i} className="region-highlight-row">
                  <span className="region-highlight-icon">{h.icon}</span>
                  <div>
                    <div className="region-highlight-label">{h.label}</div>
                    <div className="region-highlight-sub">{h.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="region-card-tier-preview">
              <div className="region-tier-preview-label">Sample Entry Tiers</div>
              <div className="region-tier-pills">
                {ngTop3.map(t => (
                  <div key={t.id} className="region-tier-pill" style={{ borderColor: t.color, color: t.color }}>
                    <span style={{ background: t.color }} className="tier-pill-dot" />
                    {t.name} · ₦{t.fee.toLocaleString('en-NG')}
                  </div>
                ))}
                <div className="region-tier-pill region-tier-pill-more">+12 more tiers →</div>
              </div>
            </div>

            <div className="region-card-cta">
              {selecting === 'NG' ? (
                <div className="region-selecting-anim">
                  <div className="region-selecting-dots">
                    <span /><span /><span />
                  </div>
                  Entering Nigeria Protocol…
                </div>
              ) : (
                <>Enter Nigeria Protocol <span className="region-arrow">→</span></>
              )}
            </div>
          </button>

          {/* Divider */}
          <div className="region-divider">
            <div className="region-divider-line" />
            <span className="region-divider-text">OR</span>
            <div className="region-divider-line" />
          </div>

          {/* ── US Card ── */}
          <button
            className={`region-card ${hoveredRegion === 'US' ? 'hovered' : ''} ${selecting === 'US' ? 'selecting' : ''}`}
            onMouseEnter={() => setHoveredRegion('US')}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleSelect('US')}
            id="region-us"
          >
            <div className="region-card-glow region-card-glow-us" />

            <div className="region-card-top">
              <span className="region-flag">🇺🇸</span>
              <div className="region-card-badge badge badge-cyan">US Market</div>
            </div>

            <h2 className="region-card-name">United States Protocol</h2>
            <p className="region-card-currency">US Dollar · <strong>$</strong></p>

            <div className="region-card-highlights">
              {US_HIGHLIGHTS.map((h, i) => (
                <div key={i} className="region-highlight-row">
                  <span className="region-highlight-icon">{h.icon}</span>
                  <div>
                    <div className="region-highlight-label">{h.label}</div>
                    <div className="region-highlight-sub">{h.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="region-card-tier-preview">
              <div className="region-tier-preview-label">Sample Entry Tiers</div>
              <div className="region-tier-pills">
                {usTop3.map(t => (
                  <div key={t.id} className="region-tier-pill" style={{ borderColor: t.color, color: t.color }}>
                    <span style={{ background: t.color }} className="tier-pill-dot" />
                    {t.name} · ${t.fee}
                  </div>
                ))}
                <div className="region-tier-pill region-tier-pill-more">+12 more tiers →</div>
              </div>
            </div>

            <div className="region-card-cta">
              {selecting === 'US' ? (
                <div className="region-selecting-anim">
                  <div className="region-selecting-dots">
                    <span /><span /><span />
                  </div>
                  Entering US Protocol…
                </div>
              ) : (
                <>Enter US Protocol <span className="region-arrow">→</span></>
              )}
            </div>
          </button>
        </div>

        {/* Protocol note */}
        <div className="region-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Both protocols share the same Capital Protection Guarantee, 12% outbound fee engine, and
          Institutional Yield Reserve structure. Only the currency, tier count, and fee amounts differ.
          You can switch your region at any time from Settings.
        </div>
      </div>
    </div>
  );
}
