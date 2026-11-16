import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatNaira, formatNairaCompact, isTierAvailable, calculateCheckout, getServerSpecs } from '../data/platform';
import {
  IconNodeCube,
  IconShieldNIBSS,
  IconLightningNVT,
  IconBinaryTree,
  IconBank,
  IconKYC,
  IconCheckCircle,
  IconXCircle,
  IconLock,
  IconArrowRight,
  IconCurrencyNVT,
} from '../components/icons/IconSet';
import { notificationService } from '../services/notifications';
import './Tiers.css';

function IconReceipt() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-indigo)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function Tiers() {
  const {
    tierData,
    region,
    user,
    setSelectedTier,
    dbBank,
    dbKYC,
    dbTransactions,
    updateUserProfile,
    formatProjectedValue,
    projectionMode,
    sovereignRate,
  } = useApp();
  const navigate = useNavigate();
  const [hoveredTier, setHoveredTier] = useState(null);
  const [filter, setFilter] = useState('small');
  const [searchQuery, setSearchQuery] = useState('');

  // Derive per-tier staking state from user profile
  const stakedTierIds = Array.isArray(user?.stakedTierIds) ? user.stakedTierIds : [];
  const isFirstNodeRegistration = stakedTierIds.length === 0;

  // Gatekeeper & Staking Modal State
  const [gateModal, setGateModal] = useState(null); // { type: 'auth' | 'bank' | 'kyc' | 'already_staked', tier }
  const [checkoutTier, setCheckoutTier] = useState(null);
  const [optInReferral, setOptInReferral] = useState(Boolean(user?.affiliateTrack));
  const [selectedAffiliateTrack, setSelectedAffiliateTrack] = useState(user?.affiliateTrack || 'mainline');
  const [hasBank, setHasBank] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [agreedTax, setAgreedTax] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('paystack');

  useEffect(() => {
    if (user?.id) {
      dbBank.getAccounts(user.id).then(accs => {
        setHasBank(Boolean(accs && accs.length > 0));
      });
    } else {
      setHasBank(false);
    }
  }, [user, dbBank]);

  const fmt = (val) => formatProjectedValue(val);
  const fmtCompact = (val) => formatProjectedValue(val, true);

  const categories = [
    { key: 'small',   label: '🔥 Entry Nodes',     code: 'T01–T05' },
    { key: 'mid',     label: '⚡ Core Validators', code: 'T06–T08' },
    { key: 'premium', label: '💎 High-Yield',      code: 'T09–T12' },
    { key: 'elite',   label: '👑 Genesis Cap',     code: 'T13–T15' },
    { key: 'all',     label: 'All Nodes',          code: '15 Tiers' },
  ];

  const filtered = tierData.filter(t => {
    const matchesCategory = filter === 'all' ? true : t.category === filter;
    const matchesSearch   = searchQuery.trim() === ''
      ? true
      : t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(t.fee).includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // ══════════════════════════════════════════════════════
  // STAKING GATEKEEPER CHECK
  // ══════════════════════════════════════════════════════
  const handleSelect = (tier) => {
    if (!isTierAvailable(tier.id)) return;

    // Gate 1: Must have an account
    if (!user) {
      setGateModal({ type: 'auth', tier });
      return;
    }

    // Gate 2: Must submit bank account details first
    if (!hasBank) {
      setGateModal({ type: 'bank', tier });
      return;
    }

    // Gate 3: Must be KYC verified
    if (user.kycStatus !== 'verified') {
      setGateModal({ type: 'kyc', tier });
      return;
    }

    // Gate 4: Cannot stake again in a tier that already has an ACTIVE node
    // (Only allowed to re-stake AFTER graduating from that tier)
    if (stakedTierIds.includes(tier.id)) {
      setGateModal({ type: 'already_staked', tier });
      return;
    }

    // All gates cleared -> Proceed to Staking Checkout
    setSelectedTier(tier);
    setCheckoutTier(tier);
  };

  const handleConfirmStake = async () => {
    if (!agreedTax || !checkoutTier) return;
    if (!user) {
      setGateModal({ type: 'auth', tier: checkoutTier });
      return;
    }
    setIsStaking(true);

    try {
      const checkoutCalc = calculateCheckout(
        checkoutTier.fee,
        region?.code || 'NG',
        isFirstNodeRegistration,
        optInReferral
      );
      
      const isOnline = selectedGateway !== 'direct_bank';
      const txStatus = isOnline ? 'success' : 'pending_verification';

      // 1. Record transaction in database (also marks tier as active in stakedTierIds)
      await dbTransactions.recordTransaction(user.id, {
        tierId: checkoutTier.id,
        type: 'staking',
        grossAmount: checkoutTier.fee,
        gatewayFee: checkoutCalc.gatewayMarkup,
        opexFee: checkoutCalc.opexFee,
        vatFee: checkoutCalc.vatAmount,
        emtlLevy: checkoutCalc.emtlLevy,
        netAmount: checkoutCalc.totalUserPays,
        gateway: selectedGateway,
        reference: 'NV-STK-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        status: txStatus,
      });

      // 2. Update user profile: add this tier to stakedTierIds, update active tier display
      const nextStakedTierIds = [...new Set([...(user.stakedTierIds || []), checkoutTier.id])];
      const highestTierId = Math.max(Number(user.tierId || 0), checkoutTier.id);
      const activeTierDef = (region?.tiers || []).find(t => t.id === highestTierId) || checkoutTier;
      const specs = getServerSpecs(highestTierId);
      const newTotalStaked = Number(user.entryFee || 0) + checkoutTier.fee;

      const profileUpdates = {
        tier: activeTierDef,
        tierId: highestTierId,
        tierName: activeTierDef.name,
        entryFee: newTotalStaked,
        serverModel: specs.model,
        stakedTierIds: nextStakedTierIds,
      };

      if (optInReferral && !user?.affiliateTrack) {
        profileUpdates.affiliateTrack = selectedAffiliateTrack;
      }

      updateUserProfile(profileUpdates);

      // 3. Dispatch in-app notification
      notificationService.pushNotification(user.id, {
        title: isOnline ? '⚡ Genesis Node Activated' : '⏳ Direct Bank Transfer Submitted',
        message: isOnline
          ? `Your stake of ${fmt(checkoutTier.fee)} on ${checkoutTier.name} has been processed via ${selectedGateway.toUpperCase()}. Node validation is live!`
          : `Your transfer of ${fmt(checkoutCalc.totalUserPays)} has been logged. Interbank confirmation takes 15–30 minutes before node activation.`,
        type: 'stake',
        actionUrl: '/dashboard',
      });

      setIsStaking(false);
      setCheckoutTier(null);
      navigate('/dashboard');
    } catch (err) {
      console.error('Staking error:', err);
      alert('Staking transaction failed: ' + (err.message || 'Please try again.'));
      setIsStaking(false);
    }
  };

  const checkoutCalc = checkoutTier
    ? calculateCheckout(checkoutTier.fee, region?.code || 'NG', isFirstNodeRegistration, optInReferral)
    : null;

  return (
    <div className="tiers-page">
      {/* Header */}
      <section className="tiers-hero">
        <div className="container">
          <div className="badge badge-cyan" style={{ marginBottom: '1rem' }}>
            <span className="pulse-dot" style={{ background: 'var(--accent-cyan)' }} />
            GENESIS NODE LAUNCHPAD · 15 PROTOCOL TIERS
          </div>
          <h1 className="tiers-hero-title">
            Explore & Stake <span className="gradient-text-cyan">Validator</span> <span className="gradient-text">Nodes</span>
          </h1>
          <p className="tiers-hero-desc">
            Stake into high-yield bare-metal validator pools. Earn <strong>{sovereignRate?.customerAPY || '12.7'}% Sovereign APY</strong> backed 
            by sovereign Treasury Bill reserves, with <strong>100% Statutory Principal Protection</strong> under Federal NIBSS Policy.
          </p>

          {/* Search & Discovery Bar (only.meme launchpad style) */}
          <div className="tiers-search-wrap">
            <div className="tiers-search-input-box">
              <span className="tiers-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search node name, ticker (e.g. $MICRO), or fee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tiers-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tiers-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="tiers-filter">
            {categories.map(cat => {
              const count = cat.key === 'all'
                ? tierData.length
                : tierData.filter(t => t.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  className={`tiers-filter-btn ${filter === cat.key ? 'active' : ''}`}
                  onClick={() => setFilter(cat.key)}
                >
                  <span>{cat.label}</span>
                  <span className="tiers-filter-count">{count}</span>
                  {cat.key !== 'small' && cat.key !== 'all' && (
                    <span className="tiers-filter-lock">
                      <IconLock size={11} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier Grid */}
      <section className="section" style={{ paddingTop: '1.5rem' }}>
        <div className="container">
          {/* Locked category banner */}
          {filter !== 'small' && filter !== 'all' && (
            <div className="tiers-locked-banner">
              <div className="tiers-locked-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconLock size={26} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  {categories.find(c => c.key === filter)?.label} — Progressive Activation
                </h3>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  These institutional pools unlock progressively as Starter Nodes achieve protocol matrix completion.
                </p>
                <button className="btn btn-secondary" style={{ marginTop: '0.85rem', fontSize: '0.85rem' }}
                  onClick={() => setFilter('small')}>
                  ← View Live Starter Nodes
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <h3>No matching validator nodes</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query or category filter.</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={() => { setSearchQuery(''); setFilter('all'); }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="tiers-grid">
              {filtered.map(tier => {
                const isHovered     = hoveredTier === tier.id;
                const isSingle      = tier.singleGroup;
                const available     = isTierAvailable(tier.id);
                const isActiveStake = available && stakedTierIds.includes(tier.id);
                const fillPercent   = available ? Math.min(95, 65 + tier.id * 5) : 0;

                return (
                  <div
                    key={tier.id}
                    className={`tier-card card ${isHovered ? 'hovered' : ''} ${!available ? 'tier-card-locked' : ''} ${isActiveStake ? 'tier-card-active' : ''}`}
                    onMouseEnter={() => setHoveredTier(tier.id)}
                    onMouseLeave={() => setHoveredTier(null)}
                    style={{
                      '--card-glow': tier.color,
                      borderColor: isActiveStake
                        ? `${tier.color}90`
                        : isHovered
                          ? 'rgba(0, 229, 255, 0.45)'
                          : undefined,
                    }}
                  >
                    {/* Lock overlay for tiers 6–15 */}
                    {!available && (
                      <div className="tier-lock-overlay">
                        <div className="tier-lock-badge">
                          <IconLock size={14} />
                          <span>Locked for Launch</span>
                        </div>
                        <p className="tier-lock-subtext">Progressive protocol activation</p>
                      </div>
                    )}

                    {/* Active Node Ribbon */}
                    {isActiveStake && (
                      <div className="tier-active-ribbon" style={{ background: `linear-gradient(90deg, ${tier.color}35, transparent)`, borderBottom: `1px solid ${tier.color}50` }}>
                        <span className="pulse-dot" style={{ background: tier.color, boxShadow: `0 0 8px ${tier.color}` }} />
                        <span style={{ color: tier.color, fontWeight: 700, fontSize: '0.72rem' }}>
                          Active Node — In Cycle
                        </span>
                      </div>
                    )}

                    {/* Card Top: Avatar, Ticker & Rank */}
                    <div className="tier-card-header" style={isActiveStake ? { marginTop: '1.8rem' } : {}}>
                      <div className="tier-avatar-group">
                        <div className="tier-avatar-chip" style={{ background: `${tier.color}20`, borderColor: `${tier.color}45`, color: tier.color }}>
                          {tier.id <= 5 ? '⚡' : tier.id <= 8 ? '🔥' : '💎'}
                        </div>
                        <div>
                          <div className="tier-ticker-symbol" style={{ color: 'var(--accent-cyan)' }}>
                            $NVT-{tier.name.split(' ')[0].toUpperCase()}
                          </div>
                          <div className="tier-card-name">{tier.name}</div>
                        </div>
                      </div>

                      <div className="tier-card-badges">
                        <span className="badge" style={{ background: `${tier.color}20`, color: available ? tier.color : '#888', borderColor: `${tier.color}40` }}>
                          {tier.label}
                        </span>
                        {isSingle && <span className="badge badge-cyan">Single Pool</span>}
                        {tier.category === 'elite' && <span className="badge badge-cyan">Cap Tier</span>}
                      </div>
                    </div>

                    {/* Bonding / Pool Fill Progress */}
                    <div className="tier-bonding-box">
                      <div className="tier-bonding-header">
                        <span>Pool Capacity</span>
                        <strong style={{ color: available ? 'var(--accent-cyan)' : '#888' }}>
                          {available ? `${fillPercent}% Filled` : '0% (Locked)'}
                        </strong>
                      </div>
                      <div className="tier-bonding-track">
                        <div
                          className="tier-bonding-fill"
                          style={{
                            width: `${fillPercent}%`,
                            background: available ? 'linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan), var(--accent-green))' : '#334155'
                          }}
                        />
                      </div>
                      <div className="tier-bonding-sub">
                        <span>{isSingle ? '1 Global Pool' : `${tier.maxPools} Parallel Pools`}</span>
                        <span>{available ? 'Live Validation' : 'Standby'}</span>
                      </div>
                    </div>

                    {/* Fee Display */}
                    <div className="tier-fee-display">
                      <span className="tier-fee-label">Staking Entry</span>
                      <span className="tier-card-fee" style={{ color: available ? tier.color : '#666' }}>
                        {fmt(tier.fee)}
                      </span>
                    </div>

                    {/* 2x2 Metric Grid */}
                    <div className="tier-card-stats">
                      <div className="tier-stat">
                        <span className="tier-stat-label">Sovereign APY</span>
                        <span className="tier-stat-value" style={{ color: available ? 'var(--accent-green)' : '#666' }}>
                          {sovereignRate?.customerAPY || '12.7'}%
                        </span>
                      </div>
                      <div className="tier-stat">
                        <span className="tier-stat-label">Max Refund (Floor)</span>
                        <span className="tier-stat-value">{fmt(tier.maxRefundTierA)}</span>
                      </div>
                      <div className="tier-stat">
                        <span className="tier-stat-label">Capital Regulation</span>
                        <span className="tier-stat-value" style={{ color: 'var(--accent-green)' }}>
                          100% Principal Return
                        </span>
                      </div>
                      <div className="tier-stat">
                        <span className="tier-stat-label">Affiliate Rights</span>
                        <span className="tier-stat-value" style={{ color: available ? 'var(--accent-cyan)' : '#666' }}>
                          15 NVT / 1 NVT
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    {isActiveStake ? (
                      <button
                        className="btn btn-secondary tier-card-cta"
                        disabled
                        style={{ opacity: 0.75, cursor: 'not-allowed', borderColor: `${tier.color}50`, color: tier.color }}
                      >
                        ✓ Active Node — Cycle Running
                      </button>
                    ) : (
                      <button
                        className={`btn ${available ? 'btn-primary' : 'btn-secondary'} tier-card-cta`}
                        onClick={() => handleSelect(tier)}
                        disabled={!available}
                        style={!available ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                      >
                        {!available ? 'Locked' : `Stake ${fmt(tier.fee)} ⚡`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3-Column Note Grid */}
          <div className="tiers-note-grid" style={{ marginTop: '3.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.75rem' }}><IconShieldNIBSS size={24} color="var(--accent-green)" /></div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>100% Statutory Principal Protection</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                100% of your staking principal is returned upon scheduled maturity under statutory Federal Government and NIBSS settlement policy. Early exit is supported with graduated discount penalties.
              </p>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.75rem' }}><IconReceipt /></div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Transparent Fee Architecture</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Itemized receipts show Staking Principal, 5% OPEX, 3% Gateway, and 7.5% VAT on fees only. ₦50 CBN EMTL on transfers ≥ ₦10,000.
              </p>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.75rem' }}><IconCalendar /></div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Disbursement Window</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Standard payout window opens 25th–28th monthly, paid 30th/31st. Withdrawals &gt; ₦2.5M require compliance audit clearance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* GATEKEEPER MODAL (AUTH, BANK, OR KYC REQUIRED)       */}
      {/* ══════════════════════════════════════════════════════ */}
      {gateModal && (
        <div className="email-modal-overlay" onClick={() => setGateModal(null)}>
          <div className="email-modal-card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              
              {/* Type 4: Already Staked in this Tier */}
              {gateModal.type === 'already_staked' && (
                <>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Active Node Already Running</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    You already have an active <strong style={{ color: '#fff' }}>{gateModal.tier.name}</strong> node ({fmt(gateModal.tier.fee)}) currently running in its validation cycle.
                  </p>
                  <div style={{
                    background: 'rgba(0,229,255,0.07)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>Protocol Rule — One Active Node Per Tier</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                      Each account can hold <strong style={{ color: '#fff' }}>one active stake per tier</strong> at a time.
                      Yield and interest remain accessible in your dashboard throughout the 364-day cycle. Once a cycle completes or you unbundle, this tier is eligible for re-staking.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                    <button className="btn btn-primary btn-full" onClick={() => { setGateModal(null); navigate('/dashboard'); }}>
                      View Active Node in Dashboard →
                    </button>
                    <button className="btn btn-secondary btn-full" onClick={() => setGateModal(null)}>
                      Browse Other Tiers
                    </button>
                  </div>
                </>
              )}

              {/* Type 1: Auth Required */}
              {gateModal.type === 'auth' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><IconUser /></div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Account Required to Stake</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    You have to first create an account before you are permitted to stake on <strong style={{ color: '#fff' }}>{gateModal.tier.name}</strong>. Create an account now to start your validator setup.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary btn-full" onClick={() => { setGateModal(null); navigate('/login'); }}>
                      Sign In
                    </button>
                    <button className="btn btn-primary btn-full" onClick={() => { setGateModal(null); navigate('/register'); }}>
                      Create Account →
                    </button>
                  </div>
                </>
              )}

              {/* Type 2: Bank Required */}
              {gateModal.type === 'bank' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <IconBank size={36} color="var(--accent-cyan)" />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Payout Account Required</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    You are required to submit your bank account details so the protocol can determine where monthly yield dividends and capital refunds are disbursed.
                  </p>
                  <button className="btn btn-primary btn-full" onClick={() => { setGateModal(null); navigate('/account'); }}>
                    Submit Verified Bank Account →
                  </button>
                </>
              )}

              {/* Type 3: KYC Required */}
              {gateModal.type === 'kyc' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <IconKYC size={36} color="var(--accent-green)" />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>KYC Verification Required</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    In compliance with statutory AML directives, KYC verification must be completed before you are allowed to stake on a node. Once submitted, your validator account is approved for staking.
                  </p>
                  <button className="btn btn-primary btn-full" onClick={() => { setGateModal(null); navigate('/kyc'); }}>
                    Start Instant KYC Verification →
                  </button>
                  <button
                    className="btn btn-secondary btn-full"
                    style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                    onClick={async () => {
                      if (user?.id) {
                        await dbKYC.simulateApproval(user.id, 'verified');
                        updateUserProfile({ kycStatus: 'verified' });
                        const tier = gateModal.tier;
                        setGateModal(null);
                        setSelectedTier(tier);
                        setCheckoutTier(tier);
                      }
                    }}
                  >
                    ⚡ Fast-Track KYC Verification (Instant Pass)
                  </button>
                </>
              )}

              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1.25rem', cursor: 'pointer' }}
                onClick={() => setGateModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STAKING CHECKOUT MODAL (WHEN ALL GATES ARE CLEARED)   */}
      {/* ══════════════════════════════════════════════════════ */}
      {checkoutTier && checkoutCalc && (
        <div className="email-modal-overlay" onClick={() => setCheckoutTier(null)}>
          <div className="email-modal-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Stake on {checkoutTier.name}</h2>
                  <span style={{ fontSize: '0.8rem', color: '#00ff94' }}>✓ Operator Verified · Bank Destination Linked</span>
                </div>
                <button
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                  onClick={() => setCheckoutTier(null)}
                >
                  ✕
                </button>
              </div>

              {/* First-Time Referral Program Opt-In & Locked Track Selection */}
              {isFirstNodeRegistration && !user?.affiliateTrack && (
                <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={optInReferral}
                      onChange={(e) => setOptInReferral(e.target.checked)}
                      style={{ marginTop: '0.2rem', accentColor: 'var(--accent-cyan)', width: 16, height: 16 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                        Join Referral & Affiliate Program (Optional)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.45, marginTop: '0.2rem' }}>
                        Join the Affiliate & Referral Program to earn NVT rewards on each user you refer. Select your reward track below (permanently locked). Leave unchecked for pure independent validator staking.
                      </div>
                    </div>
                  </label>

                  {optInReferral && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          🔒 Select Your Affiliate Reward Track (Permanently Locked):
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                        {/* Option 1: One-Time */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          background: selectedAffiliateTrack === 'one-time' ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${selectedAffiliateTrack === 'one-time' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 8,
                          padding: '0.6rem 0.75rem',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="affiliateTrack"
                            value="one-time"
                            checked={selectedAffiliateTrack === 'one-time'}
                            onChange={() => setSelectedAffiliateTrack('one-time')}
                            style={{ marginTop: 2, accentColor: 'var(--accent-cyan)' }}
                          />
                          <div style={{ fontSize: '0.78rem' }}>
                            <strong style={{ color: '#fff' }}>Option 1: One-Time Instant Payout</strong>
                            <div style={{ color: '#94a3b8', marginTop: 2 }}>
                              <span style={{ color: '#00ff94', fontWeight: 700 }}>15 NVT points</span> (₦150) per ₦1,000 staked by referred user. Paid immediately upon stake confirmation.
                            </div>
                          </div>
                        </label>

                        {/* Option 2: Mainline */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          background: selectedAffiliateTrack === 'mainline' ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${selectedAffiliateTrack === 'mainline' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 8,
                          padding: '0.6rem 0.75rem',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="affiliateTrack"
                            value="mainline"
                            checked={selectedAffiliateTrack === 'mainline'}
                            onChange={() => setSelectedAffiliateTrack('mainline')}
                            style={{ marginTop: 2, accentColor: 'var(--accent-cyan)' }}
                          />
                          <div style={{ fontSize: '0.78rem' }}>
                            <strong style={{ color: '#fff' }}>Option 2: Mainline Recurring (1000% Cap)</strong>
                            <div style={{ color: '#94a3b8', marginTop: 2 }}>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>1 NVT / year</span> per ₦1,000 staked (0.1 NVT upfront + 0.9 NVT deferred at 364D cycle). Max 1000% of your own stake.
                            </div>
                          </div>
                        </label>

                        {/* Option 3: Downline */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          background: selectedAffiliateTrack === 'downline' ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${selectedAffiliateTrack === 'downline' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 8,
                          padding: '0.6rem 0.75rem',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="affiliateTrack"
                            value="downline"
                            checked={selectedAffiliateTrack === 'downline'}
                            onChange={() => setSelectedAffiliateTrack('downline')}
                            style={{ marginTop: 2, accentColor: 'var(--accent-cyan)' }}
                          />
                          <div style={{ fontSize: '0.78rem' }}>
                            <strong style={{ color: '#fff' }}>Option 3: Downline Multi-Tier (1200% Cap)</strong>
                            <div style={{ color: '#94a3b8', marginTop: 2 }}>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>0.1 NVT / year</span> per ₦1,000 across network (0.01 NVT upfront + 0.09 NVT deferred at 364D cycle). Max 1200% of your own stake.
                            </div>
                          </div>
                        </label>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#facc15', marginTop: '0.45rem', lineHeight: 1.4 }}>
                        ⚠️ <em>Note:</em> Selection is permanent. Upfront (10%) is permanent and never clawed back. Deferred (90%) pays at 364 days if referred node stayed active.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Already enrolled user notice */}
              {user?.affiliateTrack && (
                <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: 10, padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.78rem' }}>
                  <span style={{ color: '#00ff94', fontWeight: 700 }}>✓ Enrolled Affiliate:</span> Locked to <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{user.affiliateTrack}</strong> reward track.
                </div>
              )}

              {/* Itemized receipt */}
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.88rem' }}>
                  <span>Staking Principal</span>
                  <strong style={{ color: checkoutTier.color }}>{fmt(checkoutTier.fee)}</strong>
                </div>
                {checkoutCalc.referralReserve > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                    <span>Affiliate Program Enrollment</span>
                    <span>Included (NVT Rewards)</span>
                  </div>
                ) : isFirstNodeRegistration ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.82rem', color: '#64748b' }}>
                    <span>Affiliate Program</span>
                    <span>Not Enrolled</span>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <span>5% Platform OPEX</span>
                  <span>{fmt(checkoutCalc.opexFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <span>3% Gateway Markup</span>
                  <span>{fmt(checkoutCalc.gatewayMarkup)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <span>7.5% VAT on service fees</span>
                  <span>{fmt(checkoutCalc.vatAmount)}</span>
                </div>
                {checkoutCalc.emtlLevy > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <span>CBN Transfer Levy (EMTL)</span>
                    <span>{fmt(checkoutCalc.emtlLevy)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700 }}>
                  <span>Total Charged</span>
                  <span className="gradient-text">{fmt(checkoutCalc.totalUserPays)}</span>
                </div>
              </div>

              {/* Gateway Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                    Select Payment Method:
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#00ff94', fontWeight: 600 }}>
                    ⚡ 4 Instant Online Gateways
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {/* Paystack */}
                  <button
                    type="button"
                    style={{
                      background: selectedGateway === 'paystack' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedGateway === 'paystack' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      color: selectedGateway === 'paystack' ? '#fff' : '#94a3b8',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => setSelectedGateway('paystack')}
                  >
                    <div style={{ fontWeight: 700, color: selectedGateway === 'paystack' ? '#00e5ff' : '#fff' }}>💳 Paystack</div>
                    <div style={{ fontSize: '0.72rem', color: '#00ff94' }}>⚡ Instant Activation</div>
                  </button>

                  {/* Monnify */}
                  <button
                    type="button"
                    style={{
                      background: selectedGateway === 'monnify' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedGateway === 'monnify' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      color: selectedGateway === 'monnify' ? '#fff' : '#94a3b8',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => setSelectedGateway('monnify')}
                  >
                    <div style={{ fontWeight: 700, color: selectedGateway === 'monnify' ? '#00e5ff' : '#fff' }}>⚡ Monnify</div>
                    <div style={{ fontSize: '0.72rem', color: '#00ff94' }}>⚡ Instant Virtual Acc</div>
                  </button>

                  {/* Kuda Bank */}
                  <button
                    type="button"
                    style={{
                      background: selectedGateway === 'kuda' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedGateway === 'kuda' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      color: selectedGateway === 'kuda' ? '#fff' : '#94a3b8',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => setSelectedGateway('kuda')}
                  >
                    <div style={{ fontWeight: 700, color: selectedGateway === 'kuda' ? '#00e5ff' : '#fff' }}>🟣 Kuda Bank</div>
                    <div style={{ fontSize: '0.72rem', color: '#00ff94' }}>⚡ Instant Kuda Pay</div>
                  </button>

                  {/* Flutterwave */}
                  <button
                    type="button"
                    style={{
                      background: selectedGateway === 'flutterwave' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedGateway === 'flutterwave' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      color: selectedGateway === 'flutterwave' ? '#fff' : '#94a3b8',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => setSelectedGateway('flutterwave')}
                  >
                    <div style={{ fontWeight: 700, color: selectedGateway === 'flutterwave' ? '#00e5ff' : '#fff' }}>🦋 Flutterwave</div>
                    <div style={{ fontSize: '0.72rem', color: '#00ff94' }}>⚡ Instant Multi-Pay</div>
                  </button>
                </div>

                {/* Direct Bank Transfer Option */}
                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: selectedGateway === 'bank_transfer' ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedGateway === 'bank_transfer' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: selectedGateway === 'bank_transfer' ? '#fff' : '#94a3b8',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setSelectedGateway('bank_transfer')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🏦</span>
                    <div>
                      <strong style={{ color: selectedGateway === 'bank_transfer' ? '#facc15' : '#fff' }}>Direct Bank Transfer / NIBSS</strong>
                      <div style={{ fontSize: '0.72rem', color: '#facc15' }}>⏳ Requires Manual Confirmation (15–30 mins)</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.45rem', borderRadius: 4 }}>
                    Manual
                  </span>
                </button>

                {/* Direct Bank Transfer Warning Notice & Details */}
                {selectedGateway === 'bank_transfer' && (
                  <div style={{ marginTop: '0.75rem', background: 'rgba(250, 204, 21, 0.08)', border: '1px solid rgba(250, 204, 21, 0.35)', borderRadius: 10, padding: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                      <div style={{ fontSize: '0.8rem', color: '#fef08a', lineHeight: 1.5 }}>
                        <strong>Direct Bank Transfer Takes Longer:</strong> Direct interbank transfers require manual matching and NIBSS network clearance (takes 15–30 minutes). Online payments (Paystack, Monnify, Kuda, Flutterwave) activate your node <em>immediately</em>.
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '0.65rem 0.75rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#94a3b8' }}>Treasury Bank:</span>
                        <strong style={{ color: '#fff' }}>Providus Bank</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#94a3b8' }}>Account Number:</span>
                        <strong style={{ color: '#00e5ff', fontFamily: 'monospace' }}>0124892019</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#94a3b8' }}>Account Name:</span>
                        <strong style={{ color: '#fff' }}>NODEVAULT PROTOCOL TREASURY</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Reference Narration:</span>
                        <strong style={{ color: '#facc15', fontFamily: 'monospace' }}>NV-{user?.referralCode || 'STK'}-{checkoutTier.id}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Statutory consent */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                <input
                  type="checkbox"
                  checked={agreedTax}
                  onChange={e => setAgreedTax(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#00ff94' }}
                />
                <span>I confirm node activation. I understand that capital refunds are subject to statutory protocol guidelines and individual tax compliance.</span>
              </label>

              <button
                type="button"
                className="btn btn-primary btn-full"
                disabled={!agreedTax || isStaking}
                onClick={handleConfirmStake}
              >
                {isStaking 
                  ? 'Processing Node Activation…' 
                  : selectedGateway === 'bank_transfer'
                    ? `I Have Transferred ${fmt(checkoutCalc.totalUserPays)} → Submit Transfer`
                    : `Pay ${fmt(checkoutCalc.totalUserPays)} & Activate Instantly ⚡`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
