import React, { useState } from 'react';
import './ProtocolMechanicsModal.css';

export default function ProtocolMechanicsModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const stages = [
    {
      num: '01',
      phase: 'STAKE INTAKE',
      tag: 'FROM ₦1,000',
      title: 'Genesis Node Stake & Dedicated Computing Blades',
      color: 'var(--accent-indigo)',
      icon: '⚡',
      plainEnglish:
        'You choose an investment tier starting as low as ₦1,000 across 15 Genesis Node Pools. Each staked node provisions its own dedicated, isolated bare-metal computing system (server blade) with independent hashrate, diagnostics, and settlement ledger. Staking multiple tiers deploys a multi-blade server cluster.',
      keyMechanics: [
        { label: 'Isolated Computing Blades', desc: 'Each node operates its own distinct hardware computing matrix rather than sharing pooled cycles.' },
        { label: 'Multi-Blade Architecture', desc: 'Staking into multiple Genesis Pools (e.g. Alpha ₦4,000 + Echo ₦16,000) spins up distinct server blades running concurrent block verification.' },
        { label: 'Deterministic Allocation', desc: 'Your stake is assigned to an immutable Genesis validator ID backed by institutional statutory reserves.' },
      ],
      proTip: '💡 Holding multiple tiers lets you validate multiple blocks concurrently on independent blade systems and diversify your yield stream.',
    },
    {
      num: '02',
      phase: 'NETWORK EXPANSION',
      tag: '2 DIRECT & 255 CYCLE',
      title: 'Sub-Node Binary Matrix & Strict Same-Node Alignment',
      color: 'var(--accent-cyan)',
      icon: '🌐',
      plainEnglish:
        'Each validator matrix has exactly two direct slots (Left and Right). To maintain cryptographic fairness and prevent cross-pool accounting discrepancies, a referral only accelerates your network if you actively hold that same node tier. If you refer a ₦16,000 Echo Node, it only credits your Echo blade. Unmatched referrals are held safely in escrow until you activate that node tier.',
      keyMechanics: [
        { label: 'Strict Same-Node Alignment', desc: 'Referrals strictly match your active node tiers. A ₦16,000 entry only counts toward your Echo matrix, preventing reward output errors.' },
        { label: 'Hashrate Multiplier (+5% / matching node)', desc: 'Each matching sub-node deployed boosts your corresponding blade speed by +5% computational velocity.' },
        { label: 'Binary Spillover Matrix (255 Nodes)', desc: 'Direct slots are limited to 2. Subsequent matching referrals spill over downstream to accelerate your team toward the 255 graduation cycle.' },
      ],
      proTip: '💡 Check your Unmatched Entries Queue to see pending downstream referrals and activate missing tiers to instantly unlock held velocity boosts.',
    },
    {
      num: '03',
      phase: 'YIELD SETTLEMENT',
      tag: 'MONTHLY POOLS & $NVT',
      title: 'Block Verification & Instant Liquidity',
      color: 'var(--accent-green)',
      icon: '⛏️',
      plainEnglish:
        'Your active node runs cryptographic block verification cycles. Each completed block mints verified $NVT protocol tokens. Our automated Token Liquidity Desk purchases those tokens back at a fixed rate of ₦18.00 per token into your spendable Cash Balance, which you can withdraw to your Nigerian bank anytime.',
      keyMechanics: [
        { label: '1:1 Fuel Mechanics', desc: '1 Block requires 1 Compute Credit + 1 Power Unit to mint 1 verified $NVT token.' },
        { label: 'Fixed Treasury Parity', desc: 'Tokens have guaranteed floor liquidity of ₦18.00 NGN ($0.012 USD) supported by protocol liquidity pools.' },
        { label: 'Local Banking Payouts', desc: 'Zero crypto friction. Request withdrawals directly into any verified Nigerian bank account (GTB, Zenith, OPay, etc.).' },
      ],
      proTip: '💡 You can use earned monthly yield dividends to auto-top-up your server fuel units for continuous, compounding block rewards.',
    },
    {
      num: '04',
      phase: 'STATUTORY RESERVE',
      tag: 'UP TO 70% NET',
      title: 'Capital Protection Guarantee',
      color: 'var(--accent-amber)',
      icon: '🛡️',
      plainEnglish:
        'NodeVault eliminates the fear of total capital loss. If at any time you wish to exit before recovering your investment, our automated solvency engine refunds up to 70% of your unrecovered principal directly back to your bank account from segregated statutory reserve funds.',
      keyMechanics: [
        { label: 'Tier A Full Protection (70%)', desc: 'If you received zero yield dividends, the protocol guarantees a 70% gross refund at the end of the month.' },
        { label: 'Tier B Partial Protection (60%)', desc: 'If you received partial yield, the protocol tops you up so total distributions equal at least 60% of your principal.' },
        { label: 'Per-Node Protection', desc: 'Every staked node maintains its own independent warranty. Staking 3 nodes gives you 3 independent safety nets.' },
      ],
      proTip: '💡 Standard end-of-month (EOM) requests receive 100% of their statutory refund without any early exit penalties.',
    },
  ];

  const current = stages[currentStep];

  return (
    <div className="protocol-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="protocol-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="protocol-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              🏛️
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                Transparent Protocol Rulebook
              </div>
              <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                How NodeVault Works (Plain English Architecture)
              </h3>
            </div>
          </div>
          <button className="refund-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* 4-Step Nav Tabs */}
        <div className="protocol-step-nav">
          {stages.map((st, i) => (
            <button
              key={st.num}
              className={`protocol-step-btn ${currentStep === i ? 'active' : ''}`}
              onClick={() => setCurrentStep(i)}
            >
              <span className="protocol-step-badge" style={{ color: st.color }}>
                Stage {st.num}
              </span>
              <div className="protocol-step-title-small">
                {st.phase}
              </div>
            </button>
          ))}
        </div>

        {/* Stage Content */}
        <div className="protocol-modal-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: current.color, fontWeight: 700, letterSpacing: '0.04em' }}>
                Stage {current.num} · {current.phase} ({current.tag})
              </span>
              <h3 style={{ margin: '0.2rem 0 0', color: '#fff', fontSize: '1.25rem' }}>
                {current.icon} {current.title}
              </h3>
            </div>
            <span className="badge" style={{ background: `${current.color}15`, color: current.color, border: `1px solid ${current.color}35` }}>
              Stage {currentStep + 1} of 4
            </span>
          </div>

          {/* Plain English Translation Card */}
          <div className="protocol-detail-card" style={{ borderColor: `${current.color}40`, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>🗣️</span>
              <strong style={{ color: '#fff', fontSize: '0.92rem' }}>In Plain English:</strong>
            </div>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.65 }}>
              {current.plainEnglish}
            </p>
          </div>

          {/* Institutional Specifications */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ⚙️ Deterministic Protocol Mechanics:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {current.keyMechanics.map((pt, idx) => (
                <div key={idx} className="protocol-point-row">
                  <div className="protocol-point-bullet" style={{ borderColor: current.color, color: current.color }}>
                    {idx + 1}
                  </div>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{pt.label}: </strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{pt.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip */}
          <div style={{ padding: '0.85rem 1rem', background: `${current.color}10`, border: `1px solid ${current.color}25`, borderRadius: 10, fontSize: '0.82rem', color: '#e2e8f0' }}>
            {current.proTip}
          </div>
        </div>

        {/* Footer with Step Controls */}
        <div className="protocol-modal-footer">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            style={{ opacity: currentStep === 0 ? 0.4 : 1 }}
          >
            ← Previous Stage
          </button>

          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {currentStep + 1} / {stages.length}
          </span>

          {currentStep < stages.length - 1 ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setCurrentStep(prev => Math.min(stages.length - 1, prev + 1))}
            >
              Next Stage →
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Complete Overview ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
