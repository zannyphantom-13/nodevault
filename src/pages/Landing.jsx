import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TIER_DATA_NG, REGIONS, formatNaira, formatNairaCompact } from '../data/platform';
import RefundPolicyModal from '../components/RefundPolicyModal';
import ProtocolMechanicsModal from '../components/ProtocolMechanicsModal';
import './Landing.css';

// ── Bespoke Crypto / Blockchain SVG Icon Set ──────────────────────────────────
function IconStake() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="7" rx="2" />
      <rect x="2" y="14" width="20" height="7" rx="2" />
      <line x1="6" y1="6.5" x2="6.01" y2="6.5" strokeWidth="2.5" />
      <line x1="10" y1="6.5" x2="10.01" y2="6.5" strokeWidth="2.5" />
      <line x1="6" y1="17.5" x2="6.01" y2="17.5" strokeWidth="2.5" />
      <line x1="10" y1="17.5" x2="10.01" y2="17.5" strokeWidth="2.5" />
      <path d="M17 6.5h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" opacity="0.6" />
    </svg>
  );
}

function IconNetwork() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2.5" />
      <circle cx="20" cy="6" r="2.5" />
      <circle cx="4" cy="18" r="2.5" />
      <circle cx="20" cy="18" r="2.5" />
      <line x1="6.2" y1="7.5" x2="9.8" y2="10.2" />
      <line x1="17.8" y1="7.5" x2="14.2" y2="10.2" />
      <line x1="6.2" y1="16.5" x2="9.8" y2="13.8" />
      <line x1="17.8" y1="16.5" x2="14.2" y2="13.8" />
    </svg>
  );
}

function IconYield() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
      <rect x="3" y="19" width="3" height="2" rx="0.5" fill="currentColor" fillOpacity="0.4" />
      <rect x="9" y="15" width="3" height="6" rx="0.5" fill="currentColor" fillOpacity="0.4" />
      <rect x="15" y="11" width="3" height="10" rx="0.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
      <circle cx="12" cy="12" r="7" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  );
}

function IconHexagon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
    </svg>
  );
}

// ── Animated Number Counter ──
function Counter({ end, prefix = '', suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const animate = (now) => {
          const elapsed  = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className="ticker">
      {prefix}{count.toLocaleString('en-NG')}{suffix}
    </span>
  );
}

// ── Hero Floating Node Card ──
function NodeCard({ tier, delay }) {
  return (
    <div className="hero-node-card" style={{ animationDelay: `${delay}s` }}>
      <div className="hero-node-dot" style={{ background: tier.color, boxShadow: `0 0 10px ${tier.color}` }} />
      <div>
        <div className="hero-node-name">{tier.name}</div>
        <div className="hero-node-fee">{formatNaira(tier.fee)}</div>
      </div>
      <div className="hero-node-apy">{(14 + tier.id * 0.3).toFixed(1)}% APY</div>
    </div>
  );
}

// ── Scroll Reveal Hook ──
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ── Protocol Flow Steps ──
const HOW_STEPS = [
  {
    step: '01',
    phase: 'STAKE INTAKE',
    tag: 'MIN ₦1,000',
    title: 'Stake Into a Genesis Pool',
    desc: 'Select your validator tier and stake capital into one of 15 Genesis Node Pools. Each staked node provisions its own dedicated bare-metal computing blade. Staking multiple nodes creates a multi-blade server cluster.',
    telemetry: 'Instant Activation · Dedicated Computing Systems',
    color: 'var(--accent-indigo)',
    Icon: IconStake,
  },
  {
    step: '02',
    phase: 'NETWORK EXPANSION',
    tag: 'UP TO 3.5X',
    title: 'Deploy Sub-Node Network',
    desc: 'Amplify validation velocity through binary sub-nodes. Referrals match strictly by node tier: e.g. a ₦16k Echo referral accelerates your Echo computing blade, ensuring reward outputs remain mathematically sound.',
    telemetry: 'Strict Same-Tier Alignment · Consensus Acceleration',
    color: 'var(--accent-cyan)',
    Icon: IconNetwork,
  },
  {
    step: '03',
    phase: 'YIELD SETTLEMENT',
    tag: 'MONTHLY POOL',
    title: 'Receive Yield Dividends',
    desc: 'Protocol yield dividends from sovereign institutional yield reserves and network activity are distributed systematically into your vault account.',
    telemetry: 'Automated Ledger Payouts · No Lockup Risk',
    color: 'var(--accent-green)',
    Icon: IconYield,
  },
  {
    step: '04',
    phase: 'STATUTORY RESERVE',
    tag: 'UP TO 70% NET',
    title: 'Capital Protection Guarantee',
    desc: 'Our automated solvency engine computes net unrecovered principal in real-time, backing your exit with up to 70% (Tier A) or 60% (Tier B) statutory refunds.',
    telemetry: 'Protected by Statutory Reserve Fund',
    color: 'var(--accent-amber)',
    Icon: IconShield,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const [howRef, howVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();

  // Modals state
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [refundPolicyModalOpen, setRefundPolicyModalOpen] = useState(false);

  // Multi-Node Staking Calculator State on Landing Page
  const [selectedCalcTiers, setSelectedCalcTiers] = useState([5]); // default: Tier 5 Echo Node (₦16,000)
  const [calcYieldDistributed, setCalcYieldDistributed] = useState(0);
  const [calcIsEOM, setCalcIsEOM] = useState(true);

  // Derived calculations for selected tiers
  const calcSelectedTiersList = TIER_DATA_NG.filter(t => selectedCalcTiers.includes(t.id));
  const calcTotalStake = calcSelectedTiersList.reduce((sum, t) => sum + t.fee, 0);

  // Tier A: Zero yield -> 70% of gross stake
  // Tier B: Yield < 60% of stake -> top up so (yield + refund) = 60% of stake
  // Tier C: Yield >= 60% -> 0
  let calcTier = 'A';
  let calcGross = 0;
  const threshold60 = calcTotalStake * 0.60;
  if (calcYieldDistributed <= 0) {
    calcTier = 'A';
    const rate = calcIsEOM ? 0.70 : 0.63; // 70% minus 10% early penalty
    calcGross = Math.round(calcTotalStake * rate);
  } else if (calcYieldDistributed < threshold60) {
    calcTier = 'B';
    const unrecoveredTo60 = Math.max(0, threshold60 - calcYieldDistributed);
    calcGross = Math.round(unrecoveredTo60);
  } else {
    calcTier = 'C';
    calcGross = 0;
  }

  const calcTax = Math.round(calcGross * 0.03);
  const calcNet = Math.max(0, calcGross - calcTax);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const smallTiers   = TIER_DATA_NG.filter(t => t.category === 'small');
  const premiumTiers = TIER_DATA_NG.filter(t => t.category === 'premium' || t.category === 'elite').slice(0, 4);
  const stats = REGIONS.NG.platformStats;

  return (
    <div className="landing">

      {/* ══════════════════════════════ HERO SECTION ══════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-grid-lines" aria-hidden="true" />
        <div className="hero-scan-line" aria-hidden="true" />

        <div className="container hero-content">
          <div className={`hero-left ${heroVisible ? 'visible' : ''}`}>
            <div className="badge badge-cyan hero-badge">
              <span className="pulse-dot" />
              Live Protocol · 18,742 Active Nodes · Block #4,192,804
            </div>

            <h1 className="hero-headline">
              Stake Into{' '}
              <span className="gradient-text">Institutional-Grade</span>
              <br />
              Yield Node Pools
            </h1>

            <p className="hero-desc">
              NodeVault connects your capital to verified Genesis Node Pools backed by institutional
              liquidity reserves. Choose your tier, stake once, earn Protocol Yield Dividends
              — with built-in Capital Protection Guarantees.
            </p>

            <div className="hero-actions">
              <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(135deg, #00e5ff, #6366f1)', color: '#000', fontWeight: 700 }}>
                <span>📊</span>
                Open Dashboard
              </Link>
              <Link to="/tiers" className="btn btn-secondary btn-lg">
                View All Tiers
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link to="/mining" className="btn btn-outline-cyan btn-lg">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Mine $NVT Free
              </Link>
            </div>

            {/* Trust row */}
            <div className="hero-trust">
              {[
                'Capital Protection Guarantee',
                'Institutional Yield Reserves',
                'Stake from ₦1,000',
              ].map(t => (
                <div key={t} className="trust-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className={`hero-right ${heroVisible ? 'visible' : ''}`}>
            <div className="hero-nodes-visual">
              <div className="hero-nodes-ring">
                <div className="hero-nodes-core">
                  <img src="/logo.svg" alt="NodeVault" width="44" height="44" style={{ marginBottom: 4 }} />
                  <span>NodeVault</span>
                </div>
              </div>
              {[TIER_DATA_NG[0], TIER_DATA_NG[4], TIER_DATA_NG[7], TIER_DATA_NG[11], TIER_DATA_NG[14]].map((tier, i) => (
                <NodeCard key={tier.id} tier={tier} delay={i * 0.18} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ STATS BAR ══════════════════════════════ */}
      <section className="stats-bar" ref={statsRef}>
        <div className="container stats-bar-inner">
          {[
            { label: 'Active Nodes',        color: 'var(--accent-indigo)', el: <Counter end={stats.totalNodes} /> },
            { label: 'Total Value Staked',  color: 'var(--accent-green)',  el: <>₦<Counter end={4820} suffix="M+" /></> },
            { label: 'Active Genesis Pools',color: 'var(--accent-amber)',  el: <Counter end={stats.activePools} /> },
            { label: 'Avg. Annual APY',     color: 'var(--accent-cyan)',   el: <Counter end={173} suffix="%" duration={1800} /> },
            { label: 'Protocol Graduates',  color: 'var(--accent-green)',  el: <Counter end={stats.graduates} /> },
          ].map(({ label, color, el }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className="stat-divider" />}
              <div className={`stat-item ${statsVisible ? 'stat-reveal' : ''}`} style={{ '--delay': `${i * 0.08}s` }}>
                <div className="stat-value" style={{ color }}>{el}</div>
                <div className="stat-label">{label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════ HOW IT WORKS (PROTOCOL FLOW) ══════════════════════════════ */}
      <section className="section how-section" ref={howRef}>
        <div className="container">
          <div className="section-header text-center">
            <p className="section-label">Protocol Architecture</p>
            <h2 className="section-title">How <span className="gradient-text">NodeVault</span> Works</h2>
            <p className="section-desc mx-auto" style={{ maxWidth: '640px' }}>
              Four deterministic stages power institutional yield generation, from Genesis Pool stake deployment to automated statutory capital refunds.
            </p>
          </div>

          <div className="how-steps">
            {HOW_STEPS.map(({ step, phase, tag, title, desc, telemetry, color, Icon }, i) => (
              <div
                key={step}
                className={`how-card ${howVisible ? 'how-card-visible' : ''}`}
                style={{ '--delay': `${i * 0.12}s`, '--step-color': color }}
              >
                {/* Precision corner brackets */}
                <span className="how-corner how-corner-tl" />
                <span className="how-corner how-corner-tr" />
                <span className="how-corner how-corner-bl" />
                <span className="how-corner how-corner-br" />

                {/* Top Header Row */}
                <div className="how-card-header">
                  <div className="how-phase-badge" style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                    <span className="how-phase-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    {phase}
                  </div>
                  <div className="how-step-num" style={{ color }}>
                    {step}
                  </div>
                </div>

                {/* Center Icon Ring with pulse effect */}
                <div className="how-icon-wrap" style={{ color }}>
                  <div className="how-icon-ring" style={{ borderColor: `${color}45`, background: `${color}14`, boxShadow: `0 0 20px ${color}1a` }}>
                    <Icon />
                  </div>
                  <span className="how-tag-pill">{tag}</span>
                </div>

                {/* Content */}
                <h3 className="how-title">{title}</h3>
                <p className="how-desc">{desc}</p>

                {/* Telemetry Footer */}
                <div className="how-telemetry">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>{telemetry}</span>
                </div>

                {/* Step Connector arrow for desktop (not on last) */}
                {i < HOW_STEPS.length - 1 && (
                  <div className="how-connector" aria-hidden="true">
                    <div className="how-connector-line" />
                    <div className="how-connector-arrow">▶</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setProtocolModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', border: '1px solid rgba(0, 229, 255, 0.35)', background: 'rgba(0, 229, 255, 0.06)' }}
            >
              <span>💡</span>
              <span>Get Clear Understanding: Deconstruct the 4 Protocol Stages & Capital Protection →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ ENTRY TIERS ══════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="section-header text-center">
            <p className="section-label">Entry-Level Staking</p>
            <h2 className="section-title">Start Small. <span className="gradient-text">Earn Big.</span></h2>
            <p className="section-desc mx-auto">
              Five accessible micro-investment tiers let anyone stake from just ₦1,000 — with the same Capital Protection Guarantee as our premium nodes.
            </p>
          </div>

          <div className="small-tiers-grid">
            {smallTiers.map((tier, i) => {
              const apy = (14 + tier.id * 0.3).toFixed(1);
              const pools = tier.maxPools;
              return (
                <div
                  key={tier.id}
                  className="small-tier-card stagger-in"
                  style={{ '--tier-color': tier.color, '--i': i }}
                  onClick={() => navigate('/tiers')}
                >
                  {/* Glow orb */}
                  <div className="stc-glow" style={{ background: tier.color }} />

                  {/* Top row: tier badge + live dot */}
                  <div className="stc-top">
                    <span className="stc-id" style={{ color: tier.color, borderColor: `${tier.color}45`, background: `${tier.color}14` }}>
                      T{String(tier.id).padStart(2,'0')}
                    </span>
                    <span className="stc-live">
                      <span className="pulse-dot" style={{ background: tier.color, boxShadow: `0 0 5px ${tier.color}` }} />
                      LIVE
                    </span>
                  </div>

                  {/* Node name */}
                  <div className="stc-name" style={{ color: tier.color }}>{tier.name}</div>

                  {/* Entry fee — large mono display */}
                  <div className="stc-fee">{formatNaira(tier.fee)}</div>
                  <div className="stc-fee-label">Stake Entry Fee</div>

                  {/* Stats grid: APY | Pools | Max Refund */}
                  <div className="stc-stats">
                    <div className="stc-stat">
                      <div className="stc-stat-val" style={{ color: 'var(--accent-green)' }}>{apy}%</div>
                      <div className="stc-stat-key">APY Est.</div>
                    </div>
                    <div className="stc-stat-sep" />
                    <div className="stc-stat">
                      <div className="stc-stat-val" style={{ color: 'var(--accent-cyan)' }}>{pools}</div>
                      <div className="stc-stat-key">Pools</div>
                    </div>
                    <div className="stc-stat-sep" />
                    <div className="stc-stat">
                      <div className="stc-stat-val">{formatNaira(tier.maxRefundTierA)}</div>
                      <div className="stc-stat-key">Max Refund</div>
                    </div>
                  </div>

                  {/* Protection badge row */}
                  <div className="stc-footer">
                    <span className="stc-protection">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      70% Capital Protected
                    </span>
                    <span className="stc-arrow" style={{ color: tier.color }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center" style={{ marginTop: '2rem' }}>
            <Link to="/tiers" className="btn btn-secondary">
              View All 15 Tiers
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ CAPITAL PROTECTION ENGINE ══════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="refund-preview-wrap">
            <div className="refund-preview-left">
              <p className="section-label">Capital Protection Engine</p>
              <h2 className="section-title">
                Your Capital is <span className="gradient-text">Always Protected</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.8 }}>
                NodeVault's refund eligibility engine calculates your net unrecovered principal
                in real-time. Your maximum protection is capped at 70% (Tier A) or 60% (Tier B), computed <em>after</em> deducting
                yield already distributed — ensuring protocol solvency and fairness.
              </p>

              <div className="refund-tiers-list">
                {[
                  { tier: 'A', label: 'Full Protection',    condition: 'Zero yield received',      pct: '70% (End of Month)',        color: 'var(--accent-green)' },
                  { tier: 'B', label: 'Partial Protection', condition: 'Yield < 60% of stake',     pct: 'Top up to 60% (After 6 months)', color: 'var(--accent-amber)' },
                  { tier: 'C', label: 'Disqualified',       condition: 'Yield ≥ 60% of stake',     pct: '₦0 (Cap reached)',          color: 'var(--accent-red)' },
                ].map(r => (
                  <div key={r.tier} className="refund-tier-row">
                    <div className="refund-tier-badge" style={{ color: r.color, borderColor: r.color }}>{r.tier}</div>
                    <div>
                      <div className="refund-tier-label" style={{ color: r.color }}>{r.label}</div>
                      <div className="refund-tier-condition">{r.condition} → <strong style={{ color: 'var(--text-primary)' }}>{r.pct}</strong></div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary">
                  Open Your Node
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRefundPolicyModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>📜</span>
                  <span>Read Full Policy (Plain English) →</span>
                </button>
              </div>
            </div>

            <div className="refund-preview-right">
              <div className="card refund-calc-card" style={{ maxWidth: '520px' }}>
                <div className="card-scan-line" />
                <div className="refund-calc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="badge badge-cyan">
                    <span className="pulse-dot" style={{ background: 'var(--accent-cyan)' }} />
                    Live Multi-Node Simulator
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {calcSelectedTiersList.length} {calcSelectedTiersList.length === 1 ? 'Node Selected' : 'Nodes in Portfolio'}
                  </span>
                </div>

                {/* Multi-Node Tier Selector & Presets */}
                <div style={{ padding: '0.85rem 1.25rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Configure Staked Nodes:
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedCalcTiers([5])}
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: selectedCalcTiers.length === 1 && selectedCalcTiers[0] === 5 ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)', color: selectedCalcTiers.length === 1 && selectedCalcTiers[0] === 5 ? '#00e5ff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        Single (16k)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCalcTiers([1, 3, 5])}
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: selectedCalcTiers.length === 3 && selectedCalcTiers.includes(1) && selectedCalcTiers.includes(3) && selectedCalcTiers.includes(5) ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)', color: selectedCalcTiers.length === 3 ? '#00e5ff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        Tri-Node (21k)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCalcTiers([1, 2, 3, 4, 5])}
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: selectedCalcTiers.length === 5 ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)', color: selectedCalcTiers.length === 5 ? '#00e5ff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        All 5 (31k)
                      </button>
                    </div>
                  </div>

                  {/* Individual Node Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {TIER_DATA_NG.slice(0, 5).map(t => {
                      const active = selectedCalcTiers.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (active && selectedCalcTiers.length > 1) {
                              setSelectedCalcTiers(selectedCalcTiers.filter(id => id !== t.id));
                            } else if (!active) {
                              setSelectedCalcTiers([...selectedCalcTiers, t.id]);
                            }
                          }}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            background: active ? `${t.color}25` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${active ? t.color : 'rgba(255,255,255,0.08)'}`,
                            color: active ? '#fff' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s'
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }} />
                          {t.name} ({formatNairaCompact(t.fee)})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="refund-calc-body">
                  <div className="refund-calc-row">
                    <span>Total Staked Capital</span>
                    <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{formatNaira(calcTotalStake)}</strong>
                  </div>

                  <div className="refund-calc-row" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span>Yield Distributed</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setCalcYieldDistributed(0)}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: calcYieldDistributed === 0 ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.05)', color: calcYieldDistributed === 0 ? '#00ff94' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        ₦0
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcYieldDistributed(Math.round(calcTotalStake * 0.25))}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: calcYieldDistributed > 0 && calcYieldDistributed < calcTotalStake * 0.5 ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcYieldDistributed(Math.round(calcTotalStake * 0.50))}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: calcYieldDistributed >= calcTotalStake * 0.5 && calcYieldDistributed < calcTotalStake * 0.6 ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        50%
                      </button>
                      <strong style={{ color: 'var(--accent-green)', marginLeft: '0.3rem' }}>{formatNaira(calcYieldDistributed)}</strong>
                    </div>
                  </div>

                  <div className="refund-calc-divider" />

                  <div className="refund-calc-row">
                    <span>Eligibility Status</span>
                    <span className={`badge ${calcTier === 'A' ? 'badge-green' : calcTier === 'B' ? 'badge-amber' : 'badge-red'}`}>
                      Tier {calcTier} {calcTier === 'A' ? '(70% Protection)' : calcTier === 'B' ? '(Top up to 60%)' : '(Cap Satisfied)'}
                    </span>
                  </div>

                  <div className="refund-calc-row">
                    <span>Gross Statutory Refund</span>
                    <strong>{formatNaira(calcGross)}</strong>
                  </div>

                  <div className="refund-calc-row">
                    <span>Statutory Outbound Tax (3%)</span>
                    <strong style={{ color: 'var(--accent-red)' }}>−{formatNaira(calcTax)}</strong>
                  </div>

                  <div className="refund-calc-total">
                    <span>Net Guaranteed Capital Return</span>
                    <strong className="gradient-text">{formatNaira(calcNet)}</strong>
                  </div>

                  {/* Multi-Node Per-Node Breakdown if > 1 node selected */}
                  {calcSelectedTiersList.length > 1 && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                        📊 Per-Node Guaranteed Floors:
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
                        {calcSelectedTiersList.map(n => {
                          const nodeGross = Math.round(n.fee * (calcTier === 'A' ? (calcIsEOM ? 0.70 : 0.63) : 0.60));
                          const nodeNet = Math.round(nodeGross * 0.97);
                          return (
                            <div key={n.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.5rem', borderRadius: 6, fontSize: '0.72rem' }}>
                              <span style={{ color: n.color, fontWeight: 700, display: 'block' }}>{n.name}</span>
                              <span style={{ color: '#00ff94' }}>{formatNaira(nodeNet)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setRefundPolicyModalOpen(true)}
                      style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      🛡️ Read Full Capital Protection Policy (Plain English) ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ PREMIUM NODES ══════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="section-header text-center">
            <p className="section-label">High-Yield Nodes</p>
            <h2 className="section-title">Premium <span className="gradient-text">Genesis Nodes</span></h2>
          </div>
          <div className="premium-tiers-row">
            {premiumTiers.map((tier, i) => (
              <div
                key={tier.id}
                className="premium-tier-card stagger-in"
                style={{ '--tier-color': tier.color, '--i': i }}
                onClick={() => navigate('/tiers')}
              >
                <div className="premium-tier-glow" style={{ background: tier.color }} />
                <div className="tier-accent-bar" style={{ background: tier.color }} />
                <div className="premium-tier-top">
                  <span className="badge" style={{ background: `${tier.color}18`, color: tier.color, borderColor: `${tier.color}38` }}>
                    T{String(tier.id).padStart(2,'0')}
                  </span>
                  {tier.category === 'elite' && <span className="badge badge-cyan">Cap Tier</span>}
                </div>
                <div className="premium-tier-name">{tier.name}</div>
                <div className="premium-tier-fee">{formatNaira(tier.fee)}</div>
                <div className="premium-tier-meta">
                  <div>Max Refund: <strong>{formatNaira(tier.maxRefundTierA)}</strong></div>
                  <div>APY: <strong style={{ color: 'var(--accent-green)' }}>{(14 + tier.id * 0.3).toFixed(1)}%</strong></div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center" style={{ marginTop: '2rem' }}>
            <Link to="/tiers" className="btn btn-primary btn-lg">
              Browse All Node Tiers
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ CTA BANNER ══════════════════════════════ */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-bg" />
            <div className="cta-bracket cta-bracket-tl" />
            <div className="cta-bracket cta-bracket-tr" />
            <div className="cta-bracket cta-bracket-bl" />
            <div className="cta-bracket cta-bracket-br" />
            <div className="cta-banner-content">
              <h2>Ready to Activate Your Node?</h2>
              <p>Join 18,742+ active stakers earning Protocol Yield Dividends from just ₦1,000.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-green btn-lg" onClick={() => navigate('/register')}>
                  <IconHexagon />
                  Stake Your Node Now
                </button>
                <Link to="/tiers" className="btn btn-secondary btn-lg">
                  Explore Tiers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ MODALS ════════ */}
      <RefundPolicyModal
        isOpen={refundPolicyModalOpen}
        onClose={() => setRefundPolicyModalOpen(false)}
      />
      <ProtocolMechanicsModal
        isOpen={protocolModalOpen}
        onClose={() => setProtocolModalOpen(false)}
      />
    </div>
  );
}
