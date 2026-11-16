import React, { useState } from 'react';
import './RefundPolicyModal.css';

export default function RefundPolicyModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('summary');

  if (!isOpen) return null;

  return (
    <div className="refund-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="refund-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="refund-modal-header">
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
              🛡️
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                Protocol Guarantee Rulebook
              </div>
              <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                Capital Protection & Refund Policy
              </h3>
            </div>
          </div>
          <button className="refund-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '0 1.75rem',
          gap: '0.5rem'
        }}>
          {[
            { id: 'summary', label: 'Plain-English Summary' },
            { id: 'tiers', label: '100% Principal Protection' },
            { id: 'multinode', label: 'Multiple Staked Nodes' },
            { id: 'tax', label: 'Fees & Bank Payouts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeSection === tab.id ? '2px solid #00e5ff' : '2px solid transparent',
                color: activeSection === tab.id ? '#00e5ff' : '#94a3b8',
                padding: '0.75rem 0.5rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="refund-modal-body">
          {activeSection === 'summary' && (
            <div>
              <div className="refund-card-highlight">
                <h4 style={{ margin: '0 0 0.5rem', color: '#00e5ff', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🤝</span> The NodeVault Promise: Your Capital is Protected
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                  Capital protection is governed under statutory Federal Government and NIBSS settlement policies. If you decide to exit, the protocol disburses
                  <strong> 100% of your staking principal directly back into your verified Nigerian bank account</strong> upon scheduled maturity (less standard operational fees and early unbundling discount charges if exiting prematurely).
                </p>
              </div>

              <div className="refund-faq-item">
                <div className="refund-faq-q">
                  <span>💡</span> In simple words, how does this work?
                </div>
                <p className="refund-faq-a">
                  When you stake capital (e.g. ₦16,000 for an Echo Node), that capital runs validator hardware that generates monthly dividends.
                  If at any point you want to stop participating before earning your money back in yields, our automated solvency engine calculates
                  your net unrecovered principal and refunds you from segregated institutional reserve accounts.
                </p>
              </div>

              <div className="refund-faq-item">
                <div className="refund-faq-q">
                  <span>🔒</span> Where does the refund money come from?
                </div>
                <p className="refund-faq-a">
                  Refunds do not depend on new users joining. Every stake transaction automatically routes capital into a
                  segregated, bankruptcy-remote <strong>Statutory Reserve Fund</strong> held with licensed custodian institutions.
                  These reserves are legally ring-fenced specifically to cover investor refund claims.
                </p>
              </div>

              <div className="refund-faq-item">
                <div className="refund-faq-q">
                  <span>⏱️</span> How long does it take to hit my bank?
                </div>
                <p className="refund-faq-a">
                  Standard end-of-month claims are batched and disbursed automatically on the final business day of the month via NIBSS
                  interbank settlement directly into your linked NUBAN bank account (GTBank, Zenith, Access, OPay, Kuda, etc.).
                </p>
              </div>
            </div>
          )}

          {activeSection === 'tiers' && (
            <div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#94a3b8' }}>
                Refund eligibility is calculated based on how much yield you have already received from the protocol:
              </p>

              <div className="refund-grid-2col">
                <div className="refund-tier-box" style={{ borderColor: 'rgba(0, 255, 148, 0.3)' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                    Scheduled Maturity
                  </span>
                  <h4 style={{ margin: '0.2rem 0', color: '#fff', fontSize: '1rem' }}>
                    100% Principal Return
                  </h4>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <strong>Condition:</strong> 364-day cycle completion or scheduled window.<br />
                    You receive 100% of your principal back directly to your verified bank account.
                  </p>
                  <div style={{ marginTop: '0.65rem', padding: '0.45rem', background: 'rgba(0,255,148,0.06)', borderRadius: 6, fontSize: '0.78rem', color: '#00ff94' }}>
                    Example: Stake ₦16,000 → Gross return is ₦16,000.
                  </div>
                </div>

                <div className="refund-tier-box" style={{ borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                  <span className="badge badge-amber" style={{ fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                    Early Unbundling Exit
                  </span>
                  <h4 style={{ margin: '0.2rem 0', color: '#fff', fontSize: '1rem' }}>
                    85% – 95% Net Return
                  </h4>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <strong>Condition:</strong> Premature withdrawal before 364 days.<br />
                    Subject to statutory early exit discount fees: Days 1–30 (15% fee), Days 31–90 (10% fee), Days 91–180 (5% fee).
                  </p>
                  <div style={{ marginTop: '0.65rem', padding: '0.45rem', background: 'rgba(250,204,21,0.06)', borderRadius: 6, fontSize: '0.78rem', color: '#facc15' }}>
                    Example: Stake ₦16,000 unbundled at Day 45 → 90% net (₦14,400).
                  </div>
                </div>
              </div>

              <div className="refund-tier-box" style={{ borderColor: 'rgba(239, 68, 68, 0.25)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>
                    Tier C · Cap Satisfied
                  </span>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>60%+ Cumulative Yield Earned</strong>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Once your accumulated yield distributions equal or exceed 60% of your staked capital, your initial principal has already been
                  organically returned through real profit distributions. Statutory capital refund coverage expires, while your validator continues earning protocol dividends.
                </p>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
                <strong>📅 Early Exit Notice:</strong> Orderly exits submitted for End of Month (EOM) processing receive 100% of their calculated refund. Mid-cycle emergency exits incur a 10% penalty to offset unbundled liquidity contracts.
              </div>
            </div>
          )}

          {activeSection === 'multinode' && (
            <div>
              <div className="refund-card-highlight">
                <h4 style={{ margin: '0 0 0.4rem', color: '#00e5ff', fontSize: '1rem' }}>
                  ⚡ Independent Node Protection Guarantee
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0' }}>
                  If you hold multiple staked nodes (for example, a ₦1,000 Micro Node + a ₦4,000 Alpha Node + a ₦16,000 Echo Node = ₦21,000 total capital),
                  <strong> each node is governed by its own independent statutory protection contract</strong>.
                </p>
              </div>

              <div className="refund-faq-item">
                <div className="refund-faq-q">
                  <span>1️⃣</span> Can I refund just one node and keep the others running?
                </div>
                <p className="refund-faq-a">
                  <strong>Yes, absolutely.</strong> You have full portfolio autonomy. You can liquidate and refund a single high-tier node
                  while keeping your entry tiers or lower-tier validators active and validating blocks.
                </p>
              </div>

              <div className="refund-faq-item">
                <div className="refund-faq-q">
                  <span>2️⃣</span> How is the guaranteed floor calculated across multiple nodes?
                </div>
                <p className="refund-faq-a">
                  Each node's liquidation track record is isolated. For instance, if Node #1 is unbundled early at day 45, it receives its 90% net liquidity, while Node #2 continues to run through its 364-day cycle to receive 100% of principal.
                </p>
              </div>

              <div className="refund-faq-item">
                <div className="refund-faq-q">
                  <span>3️⃣</span> Where do I manage individual node refunds?
                </div>
                <p className="refund-faq-a">
                  In your <strong>Dashboard → Capital Refund & Claims</strong> tab, you will find an interactive node selector allowing you
                  to preview and submit a refund for your entire fleet or any specific staked tier position.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'tax' && (
            <div>
              <div className="refund-card-highlight" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                <h4 style={{ margin: '0 0 0.35rem', color: '#fff', fontSize: '0.98rem' }}>
                  🏛️ Transparent 3% Statutory Processing Tax
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8' }}>
                  Every gross refund is subject to a flat <strong>3% statutory outbound fee</strong>. We believe in 100% financial transparency.
                  Here is exactly what that 3% covers:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 0.85rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#00e5ff', fontSize: '0.82rem', display: 'block' }}>1. Interbank Routing & NIBSS</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Covers commercial banking transfer rail gateways and NIBSS electronic settlement charges.</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 0.85rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#00e5ff', fontSize: '0.82rem', display: 'block' }}>2. EMTL & Statutory Levies</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Electronic Money Transfer Levy (EMTL) of ₦50 on transfers ≥ ₦10,000 under federal tax regulations.</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 0.85rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#00e5ff', fontSize: '0.82rem', display: 'block' }}>3. Custodial Ledger Audit</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Automated cryptographic verification and real-time reconciliation with our institutional trust partner.</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 0.85rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#00e5ff', fontSize: '0.82rem', display: 'block' }}>4. High-Value Anti-Fraud (&gt; ₦2.5M)</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Multi-signature compliance review for institutional capital protection under AML guidelines.</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,255,148,0.05)', border: '1px solid rgba(0,255,148,0.2)', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.82rem', color: '#00ff94' }}>
                ✓ <strong>Net Capital Return:</strong> The exact amount shown in your dashboard calculator is the net funds that will credit your bank account. No hidden deductions.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="refund-modal-footer">
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            NodeVault Regulatory Reserve Fund v4.2
          </span>
          <button className="btn btn-primary btn-sm" onClick={onClose} style={{ fontSize: '0.82rem', padding: '0.45rem 1.15rem' }}>
            Understood & Confirmed ✓
          </button>
        </div>
      </div>
    </div>
  );
}
