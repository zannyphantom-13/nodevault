import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeEmailModal.css';

export default function WelcomeEmailModal({ isOpen, onClose, emailData }) {
  const navigate = useNavigate();
  if (!isOpen || !emailData) return null;

  return (
    <div className="email-modal-overlay" onClick={onClose}>
      <div className="email-modal-card" onClick={e => e.stopPropagation()}>
        {/* Topbar */}
        <div className="email-modal-topbar">
          <div className="email-meta-row">
            <span>✉️</span>
            <span><strong>From:</strong> {emailData.from || 'compliance@nodevault.io'}</span>
            <span>•</span>
            <span><strong>To:</strong> {emailData.to}</span>
          </div>
          <button className="email-modal-close" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Email Content */}
        <div className="email-body">
          <div className="email-brand-header">
            <img src="/logo.svg" alt="NodeVault" width="32" height="32" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                Node<span className="gradient-text">Vault</span> Protocol
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Automated Validator Dispatch Service
              </div>
            </div>
          </div>

          <h2 className="email-subject">{emailData.subject}</h2>

          <p className="email-message">
            Hello <strong>{emailData.name}</strong>,
          </p>

          <p className="email-message">
            Welcome to the NodeVault Decentralized Yield Node Protocol. Your operator account has been created with unique node referral code <strong style={{ color: '#00e5ff', fontFamily: 'monospace' }}>{emailData.referralCode}</strong>.
          </p>

          <p className="email-message" style={{ marginBottom: '1rem' }}>
            To safeguard protocol liquidity and comply with anti-money laundering (AML) directives, your account must complete our 3-step verification sequence before you can stake on nodes:
          </p>

          {/* Onboarding Checklist */}
          <div className="email-checklist">
            <div className="email-check-item">
              <div className="email-check-dot done">✓</div>
              <div>
                <strong>Step 1: Account Creation</strong>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Completed successfully on {emailData.joinDate || 'today'}.</div>
              </div>
            </div>

            <div className="email-check-item">
              <div className="email-check-dot pending">2</div>
              <div>
                <strong>Step 2: Submit Payout Bank Account</strong>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Required so the protocol knows where your dividends and refunds are deposited.</div>
              </div>
            </div>

            <div className="email-check-item">
              <div className="email-check-dot pending">3</div>
              <div>
                <strong>Step 3: Identity Verification (KYC)</strong>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>NIN / BVN / Passport + Selfie photo. Automatic approval grants instant staking access.</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                onClose();
                navigate('/account');
              }}
            >
              🏦 Submit Bank Details →
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                onClose();
                navigate('/kyc');
              }}
            >
              🪪 Start KYC Verification →
            </button>
          </div>

          <div className="email-footer-notice">
            🔒 <strong>Security & Compliance Notice:</strong> NodeVault never requests your bank account PIN or private keys. All payouts are disbursed strictly via certified NUBAN transfers subject to CBN statutory Electronic Money Transfer Levies (EMTL).
          </div>
        </div>
      </div>
    </div>
  );
}
