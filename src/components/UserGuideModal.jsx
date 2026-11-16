import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TIER_DATA_NG,
  COIN_RATE_NGN,
  INSTITUTIONAL_YIELD_RATE,
  CHECKOUT_OPEX_RATE,
  CHECKOUT_GATEWAY_RATE,
  CHECKOUT_VAT_RATE,
  CHECKOUT_EMTL_NG,
  CHECKOUT_EMTL_THRESHOLD_NG,
  EARLY_EXIT_SCHEDULE,
  toNVT,
  formatNVT,
  formatNaira,
  formatProjected,
} from '../data/platform';
import {
  IconNodeCube,
  IconShieldNIBSS,
  IconLightningNVT,
  IconBinaryTree,
  IconBank,
  IconServer,
  IconCurrencyNVT,
  IconSliders,
  IconCheckCircle,
  IconXCircle,
  IconRefresh,
  IconArrowRight,
  IconLock,
} from './icons/IconSet';
import './UserGuideModal.css';

export default function UserGuideModal({ isOpen, onClose, onNavigateTab }) {
  const { sovereignRate } = useApp();
  const [activeTab, setActiveTab] = useState('staking'); // 'staking' | 'matrix' | 'mining' | 'nibss'

  // Tab 1: Simulator State
  const [selectedTierIdx, setSelectedTierIdx] = useState(4); // Default to Tier 5 (Echo, ₦16,000)
  const [optInReferral, setOptInReferral] = useState(false);
  const [isFirstNode, setIsFirstNode] = useState(true);
  const [simCurrency, setSimCurrency] = useState('NGN'); // 'NGN' | 'NVT'

  // Tab 2: Binary Matrix State
  const [simulatedNodes, setSimulatedNodes] = useState(14);
  const [cycleCompleted, setCycleCompleted] = useState(false);

  // Tab 3: Mining Demo State
  const [isSolving, setIsSolving] = useState(false);
  const [minedTokens, setMinedTokens] = useState(12.5000);
  const [lastHash, setLastHash] = useState('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
  const [solveProgress, setSolveProgress] = useState(0);

  // Tab 4: NIBSS Pipeline State
  const [tracingStep, setTracingStep] = useState(0);
  const [isTracing, setIsTracing] = useState(false);

  if (!isOpen) return null;

  const currentTier = TIER_DATA_NG[selectedTierIdx] || TIER_DATA_NG[0];
  const fee = currentTier.fee;

  // Checkout Math in Simulator
  const opexFee = fee * CHECKOUT_OPEX_RATE;
  const referralDeposit = 0; // No upfront deposit — affiliate rewards are NVT-based, paid by platform
  const gatewayMarkup = fee * CHECKOUT_GATEWAY_RATE;
  const vatAmount = (opexFee + gatewayMarkup) * CHECKOUT_VAT_RATE;
  const emtlLevy = fee >= CHECKOUT_EMTL_THRESHOLD_NG ? CHECKOUT_EMTL_NG : 0;
  const totalStakingCost = fee + opexFee + referralDeposit + gatewayMarkup + vatAmount + emtlLevy;

  // Yield & Floor Math
  const apyRate = (sovereignRate?.customerAPY || 12.7) / 100;
  const annualYield = fee * apyRate;
  const dailyYield = annualYield / 365;
  const capitalFloor100 = fee * 1.00;

  const formatSim = (amount) => {
    return formatProjected(amount, simCurrency);
  };

  // Mining Block Action
  const handleSolveBlock = () => {
    if (isSolving) return;
    setIsSolving(true);
    setSolveProgress(0);

    const interval = setInterval(() => {
      setSolveProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSolving(false);
          setMinedTokens((t) => t + 1.0000);
          const randomHash = '0000' + Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          setLastHash(randomHash);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // NIBSS Trace Action
  const handleRunTrace = () => {
    if (isTracing) return;
    setIsTracing(true);
    setTracingStep(1);

    setTimeout(() => setTracingStep(2), 1000);
    setTimeout(() => setTracingStep(3), 2000);
    setTimeout(() => {
      setTracingStep(4);
      setIsTracing(false);
    }, 3200);
  };

  const handleAddSubNode = () => {
    setSimulatedNodes((prev) => {
      const next = prev + 1;
      if (next >= 255) {
        setCycleCompleted(true);
        return 255;
      }
      return next;
    });
  };

  return (
    <div className="userguide-overlay" onClick={onClose}>
      <div className="userguide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="userguide-header">
          <div className="userguide-header-left">
            <div className="userguide-brand-icon">
              <IconSliders size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <span className="userguide-badge">NodeVault Enterprise Protocol</span>
              <h2 className="userguide-title">Interactive Protocol Simulator & Terminal Guide</h2>
            </div>
          </div>
          <button
            type="button"
            className="userguide-close-btn"
            onClick={onClose}
            aria-label="Close Guide"
          >
            <IconXCircle size={22} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="userguide-nav-tabs">
          <button
            type="button"
            className={`ug-tab-btn ${activeTab === 'staking' ? 'active' : ''}`}
            onClick={() => setActiveTab('staking')}
          >
            <IconNodeCube size={16} />
            <span>Staking Sim</span>
          </button>
          <button
            type="button"
            className={`ug-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <IconBinaryTree size={16} />
            <span>Affiliate Engine</span>
          </button>
          <button
            type="button"
            className={`ug-tab-btn ${activeTab === 'mining' ? 'active' : ''}`}
            onClick={() => setActiveTab('mining')}
          >
            <IconLightningNVT size={16} />
            <span>Mining Terminal</span>
          </button>
          <button
            type="button"
            className={`ug-tab-btn ${activeTab === 'nibss' ? 'active' : ''}`}
            onClick={() => setActiveTab('nibss')}
          >
            <IconShieldNIBSS size={16} />
            <span>NIBSS Rail</span>
          </button>
        </div>

        {/* Content Panels */}
        <div className="userguide-body">
          {/* TAB 1: STAKING & YIELD SIMULATOR */}
          {activeTab === 'staking' && (
            <div className="ug-sim-container">
              <div className="ug-sim-top-bar">
                <div className="ug-sim-tier-badge">
                  <span>Selected Node:</span>
                  <strong>{currentTier.name} (Tier {currentTier.id})</strong>
                </div>
                <div className="ug-currency-switch">
                  <button
                    type="button"
                    className={`ug-curr-btn ${simCurrency === 'NGN' ? 'active' : ''}`}
                    onClick={() => setSimCurrency('NGN')}
                  >
                    ₦ NGN
                  </button>
                  <button
                    type="button"
                    className={`ug-curr-btn ${simCurrency === 'NVT' ? 'active' : ''}`}
                    onClick={() => setSimCurrency('NVT')}
                  >
                    $NVT
                  </button>
                </div>
              </div>

              {/* Tier Slider */}
              <div className="ug-slider-group">
                <div className="ug-slider-header">
                  <span>Node Tier Level (1–15)</span>
                  <span className="ug-tier-price">{formatSim(fee)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="1"
                  value={selectedTierIdx}
                  onChange={(e) => setSelectedTierIdx(Number(e.target.value))}
                  className="ug-range-slider"
                />
                <div className="ug-slider-ticks">
                  <span>T01 (₦1K)</span>
                  <span>T05 (₦16K)</span>
                  <span>T10 (₦512K)</span>
                  <span>T15 (₦2.56M)</span>
                </div>
              </div>

              {/* Affiliate Program Opt-In Toggle */}
              <div className="ug-referral-toggle-box">
                <div className="ug-ref-toggle-header">
                  <label className="ug-toggle-label">
                    <input
                      type="checkbox"
                      checked={optInReferral}
                      onChange={(e) => setOptInReferral(e.target.checked)}
                    />
                    <span>Enroll in Affiliate & Referral Program (Optional)</span>
                  </label>
                  <span className="badge badge-cyan">
                    {optInReferral ? 'NVT Rewards Active' : 'Pure Staker'}
                  </span>
                </div>
                <p className="ug-ref-toggle-desc">
                  {optInReferral
                    ? 'Earn NVT tokens for every user you refer. Choose One-Time (15 NVT / ₦1k), Mainline (1 NVT/yr per ₦1k), or Downline (0.1 NVT/yr per ₦1k). Track is permanently locked at first stake.'
                    : 'Non-referral stakers pay no affiliate add-on. Pure independent validator staking. No NVT reward eligibility.'}
                </p>
              </div>

              {/* Simulation Result Cards */}
              <div className="ug-metrics-grid">
                <div className="ug-metric-card">
                  <span className="ug-card-label">Daily Distribution ({sovereignRate?.customerAPY || '12.7'}% APY)</span>
                  <strong className="ug-card-value text-cyan">{formatSim(dailyYield)}/day</strong>
                  <span className="ug-card-sub">{formatSim(annualYield)} / year</span>
                </div>
                <div className="ug-metric-card">
                  <span className="ug-card-label">100% Statutory Capital Return</span>
                  <strong className="ug-card-value text-green">{formatSim(capitalFloor100)}</strong>
                  <span className="ug-card-sub">Statutory Principal Protected</span>
                </div>
                <div className="ug-metric-card">
                  <span className="ug-card-label">Total Entry Checkout Cost</span>
                  <strong className="ug-card-value">{formatSim(totalStakingCost)}</strong>
                  <span className="ug-card-sub">Incl. 5% OPEX + {optInReferral ? 'NVT Rewards' : '0% Ref'}</span>
                </div>
              </div>

              {/* NIBSS Early Exit Graduated Schedule Breakdown */}
              <div className="ug-schedule-box">
                <div className="ug-schedule-title">
                  <IconShieldNIBSS size={15} color="var(--accent-green)" />
                  <span>NIBSS-Regulated Early Exit Liquidity Schedule</span>
                </div>
                <div className="ug-schedule-table">
                  {EARLY_EXIT_SCHEDULE.map((item, idx) => (
                    <div key={idx} className="ug-schedule-row">
                      <span className="ug-sched-label">{item.label}</span>
                      <span className="ug-sched-penalty">
                        {item.penaltyRate > 0 ? `-${(item.penaltyRate * 100).toFixed(0)}% Fee` : '0% Fee (Full Floor)'}
                      </span>
                      <span className="ug-sched-net text-green">
                        {formatSim(fee * item.effectiveFloorRate)} Net
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AFFILIATE REWARD ENGINE VISUALIZER */}
          {activeTab === 'matrix' && (
            <div className="ug-matrix-container">
              <div className="ug-matrix-stats">
                <div className="ug-mstat">
                  <span>Referred Validators</span>
                  <strong>{simulatedNodes} Active</strong>
                </div>
                <div className="ug-mstat">
                  <span>Simulated Volume</span>
                  <strong className="text-cyan">{formatNaira(simulatedNodes * fee)}</strong>
                </div>
                <div className="ug-mstat">
                  <span>Cycle Duration</span>
                  <strong className="text-green">364 Days</strong>
                </div>
              </div>

              {/* 3 Immutable Affiliate Tracks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(0, 229, 255, 0.06)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>Option 1: One-Time</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0.25rem 0' }}>15 NVT Points</div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                    ₦150 (15 points) per ₦1,000 staked. Instant 100% payout upon referred node confirmation.
                  </p>
                </div>
                <div style={{ background: 'rgba(0, 255, 148, 0.06)', border: '1px solid rgba(0, 255, 148, 0.25)', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#00ff94', fontWeight: 700, textTransform: 'uppercase' }}>Option 2: Mainline (1000% Cap)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0.25rem 0' }}>1.0 NVT / yr</div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                    0.1 NVT upfront + 0.9 NVT deferred at 364D. Max payout capped at 1000% of affiliate's own stake.
                  </p>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase' }}>Option 3: Downline (1200% Cap)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0.25rem 0' }}>0.1 NVT / yr</div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                    0.01 NVT upfront + 0.09 NVT deferred. Multi-tier network yield capped at 1200% of own stake.
                  </p>
                </div>
              </div>

              {/* Protocol Protection Rules */}
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <div>🛡️ <strong style={{ color: '#fff' }}>Active Node Gating:</strong> You must hold an active matching node tier to receive normal rates; if inactive, rates throttle to 0.1 NVT (mainline) and 0.01 NVT (downline).</div>
                <div>⚡ <strong style={{ color: '#fff' }}>Upfront Portion (10%):</strong> Permanent and paid immediately on confirmation. Never clawed back.</div>
                <div>⏳ <strong style={{ color: '#fff' }}>Deferred Portion (90%):</strong> Evaluated node-by-node at 364 days. Staking on day 363 still qualifies.</div>
              </div>

              <div className="ug-matrix-actions" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleAddSubNode}
                >
                  <IconBinaryTree size={16} />
                  <span>Simulate Referral Addition (+1 Node)</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSimulatedNodes(14); setCycleCompleted(false); }}
                >
                  <IconRefresh size={14} />
                  <span>Reset Simulation</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MINING TERMINAL DEMO */}
          {activeTab === 'mining' && (
            <div className="ug-mining-container">
              <div className="ug-mining-hud">
                <div className="ug-hud-item">
                  <span>Mined Tokens</span>
                  <strong className="text-cyan">{minedTokens.toFixed(4)} $NVT</strong>
                </div>
                <div className="ug-hud-item">
                  <span>Treasury Liquidity Parity</span>
                  <strong className="text-green">{formatNaira(minedTokens * COIN_RATE_NGN)}</strong>
                </div>
                <div className="ug-hud-item">
                  <span>Fixed Rate</span>
                  <strong>1 $NVT = ₦10.00 NGN</strong>
                </div>
              </div>

              <div className="ug-block-solver-box">
                <div className="ug-hash-display">
                  <span className="ug-hash-label">Latest Cryptographic Hash:</span>
                  <code className="ug-hash-code">{lastHash}</code>
                </div>

                {isSolving && (
                  <div className="ug-progress-wrap">
                    <div className="ug-progress-bar">
                      <div className="ug-progress-fill" style={{ width: `${solveProgress}%` }} />
                    </div>
                    <span className="ug-progress-text">Solving Proof-of-Yield Block... {solveProgress}%</span>
                  </div>
                )}

                <button
                  type="button"
                  className={`btn ${isSolving ? 'btn-secondary' : 'btn-primary'} btn-block ug-solve-btn`}
                  onClick={handleSolveBlock}
                  disabled={isSolving}
                >
                  <IconLightningNVT size={18} />
                  <span>{isSolving ? 'Verifying Block Consensus...' : 'Solve Block & Mine 1.0000 $NVT'}</span>
                </button>
              </div>

              <div className="ug-mining-explainer">
                <p>
                  <strong>Equal Fuel Pairing:</strong> 1 Compute Credit + 1 Power Unit = 1 $NVT Token mined directly to your ledger. Liquid cash settlement available at any time to your connected bank account.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: NIBSS SETTLEMENT PIPELINE TRACER */}
          {activeTab === 'nibss' && (
            <div className="ug-nibss-container">
              <div className="ug-nibss-header">
                <IconShieldNIBSS size={24} color="var(--accent-green)" />
                <div>
                  <h3 className="ug-pipeline-title">NIBSS Automated Direct Clearing Rail</h3>
                  <p className="ug-pipeline-sub">Automated institutional dispatch under Nigerian inter-bank clearing guidelines.</p>
                </div>
              </div>

              {/* 4-Stage Clearing Pipeline */}
              <div className="ug-pipeline-stages">
                <div className={`ug-pipe-card ${tracingStep >= 1 ? 'active' : ''}`}>
                  <div className="ug-pipe-num">1</div>
                  <div className="ug-pipe-meta">
                    <strong>Vault Settlement Desk</strong>
                    <span>3% Outbound OPEX + 7.5% VAT</span>
                  </div>
                </div>

                <div className="ug-pipe-arrow">
                  <IconArrowRight size={16} />
                </div>

                <div className={`ug-pipe-card ${tracingStep >= 2 ? 'active' : ''}`}>
                  <div className="ug-pipe-num">2</div>
                  <div className="ug-pipe-meta">
                    <strong>NIBSS Central Switch</strong>
                    <span>NIP Direct Inter-Bank Route</span>
                  </div>
                </div>

                <div className="ug-pipe-arrow">
                  <IconArrowRight size={16} />
                </div>

                <div className={`ug-pipe-card ${tracingStep >= 3 ? 'active' : ''}`}>
                  <div className="ug-pipe-num">3</div>
                  <div className="ug-pipe-meta">
                    <strong>CBN Statutory EMTL</strong>
                    <span>₦50 Stamp Levy on ≥₦10K</span>
                  </div>
                </div>

                <div className="ug-pipe-arrow">
                  <IconArrowRight size={16} />
                </div>

                <div className={`ug-pipe-card ${tracingStep >= 4 ? 'active done' : ''}`}>
                  <div className="ug-pipe-num">4</div>
                  <div className="ug-pipe-meta">
                    <strong>Commercial Bank NUBAN</strong>
                    <span>Instant Credit (OPay, GTB, Zenith)</span>
                  </div>
                </div>
              </div>

              <div className="ug-trace-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRunTrace}
                  disabled={isTracing}
                >
                  <IconRefresh size={16} />
                  <span>{isTracing ? 'Clearing via NIP Switch...' : 'Execute Live NIBSS Dispatch Trace'}</span>
                </button>
                {tracingStep === 4 && (
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <IconCheckCircle size={14} /> NIBSS Direct Credit Cleared Successfully
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="userguide-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close Simulator
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              if (onNavigateTab) onNavigateTab('dashboard');
            }}
          >
            <span>Launch Staking Terminal</span>
            <IconArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
