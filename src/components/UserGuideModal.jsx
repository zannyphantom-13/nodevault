import React, { useState } from 'react';
import './UserGuideModal.css';

export default function UserGuideModal({ isOpen, onClose, onNavigateTab }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      badge: 'Step 1 of 5',
      title: 'Genesis Node Staking & Protection',
      icon: '⚡',
      subtitle: 'Stake capital into institutional validator node pools with capital preservation.',
      points: [
        'Single-Stake Policy: You can stake once per tier simultaneously (e.g. ₦1,000 Micro Node + ₦4,000 Alpha Node).',
        'Capital Protection: Staked principal is protected up to 70% under NodeVault Treasury reserves.',
        'Payment Choice: Instant online payment (Paystack, Monnify, Kuda, Flutterwave) or Direct Bank Transfer.',
      ],
      tip: '💡 Online payments activate your validator server immediately without waiting.',
      tabKey: 'overview',
      actionLabel: 'View Overview & Nodes',
    },
    {
      badge: 'Step 2 of 5',
      title: 'Binary Sub-Node Network (2 Direct & 255 Cycle)',
      icon: '🌐',
      subtitle: 'Build your validation velocity using a strict binary tree matrix.',
      points: [
        'Max 2 Direct Sub-Nodes: Each account has exactly 2 direct slots (Left and Right).',
        'Automatic Downline Spillover: Additional referrals using your code spill over under your sub-nodes.',
        '255-Validator Graduation: When your binary matrix fills 255 nodes, you graduate, collect completion rewards, and can restart a new cycle!',
      ],
      tip: '💡 Each sub-node in your downline adds +5% to your validator processing speed.',
      tabKey: 'network',
      actionLabel: 'Explore Sub-Node Tree',
    },
    {
      badge: 'Step 3 of 5',
      title: 'Server Mining & Coin Conversion',
      icon: '⛏️',
      subtitle: 'Validate cryptographic blocks and convert mined tokens into liquid cash.',
      points: [
        '1:1 Fuel Pairing: 1 Block = 1 Compute Credit + 1 Power Unit = 1 $NVT token.',
        'Fixed Liquidity Parity: 1 $NVT = ₦18.00 NGN guaranteed treasury liquidity.',
        'Instant Settlement: Settle mined coins at any time directly into your spendable Cash Balance.',
      ],
      tip: '💡 Monitor individual yield production for each staked tier node.',
      tabKey: 'mining',
      actionLabel: 'Open Mining Server',
    },
    {
      badge: 'Step 4 of 5',
      title: 'Bank Account & KYC Clearance',
      icon: '🏦',
      subtitle: 'Link your local NUBAN bank account for seamless automated dividend payouts.',
      points: [
        'Pure Local Banking: All payouts go directly to your Nigerian commercial or digital bank (OPay, Kuda, GTBank, etc.).',
        'No Crypto Hassle: No crypto wallet or Bitcoin address required — fully localized in Naira (₦).',
        'Statutory KYC: Automated tier-2 identity verification unlocks full staking and unlimited withdrawals.',
      ],
      tip: '💡 Fresh accounts start with 0 accounts — link your verified bank to unlock staking.',
      tabKey: 'payout',
      actionLabel: 'Manage Bank & KYC',
    },
    {
      badge: 'Step 5 of 5',
      title: 'Yield Withdrawals & Capital Claims',
      icon: '🛡️',
      subtitle: 'Withdraw earned yields or submit capital protection refund claims.',
      points: [
        'Instant Yield Withdrawals: Withdraw wallet cash directly to your linked bank (min ₦2,000).',
        'Regulatory Compliance: CBN statutory EMTL levy (₦50) applies for single transactions ≥ ₦10,000.',
        'Capital Protection Claim: Submit an End-of-Month (EOM) refund claim anytime with zero stress.',
      ],
      tip: '💡 Institutional clearance applies to single withdrawals exceeding ₦2,500,000.',
      tabKey: 'dividends',
      actionLabel: 'View Withdrawals & Payouts',
    },
  ];

  const current = steps[currentStep];

  const handleGoToTab = (tabKey) => {
    if (onNavigateTab) {
      onNavigateTab(tabKey);
    }
    onClose();
  };

  return (
    <div className="userguide-overlay" onClick={onClose}>
      <div className="userguide-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="userguide-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="userguide-icon">{current.icon}</span>
            <div>
              <span className="userguide-badge">{current.badge}</span>
              <h2 className="userguide-title">{current.title}</h2>
            </div>
          </div>
          <button className="userguide-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Step Progress Indicators */}
        <div className="userguide-nav-dots">
          {steps.map((s, idx) => (
            <button
              key={idx}
              className={`userguide-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(idx)}
              title={s.title}
            >
              <span>{idx + 1}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="userguide-body">
          <p className="userguide-subtitle">{current.subtitle}</p>

          <div className="userguide-points-box">
            {current.points.map((pt, i) => (
              <div key={i} className="userguide-point-row">
                <span className="userguide-check">✓</span>
                <span className="userguide-point-text">{pt}</span>
              </div>
            ))}
          </div>

          <div className="userguide-tip-card">
            {current.tip}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="userguide-footer">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            >
              ← Back
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              >
                Next Step →
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={onClose}>
                Finish Guide ✓
              </button>
            )}
          </div>

          <button
            className="btn btn-secondary btn-sm userguide-action-link"
            onClick={() => handleGoToTab(current.tabKey)}
          >
            Go to {current.actionLabel} ↗
          </button>
        </div>
      </div>
    </div>
  );
}
