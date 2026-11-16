import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconShieldNIBSS, IconCheckCircle, IconXCircle } from './icons/IconSet';

export default function SovereignRateModal({ isOpen, onClose }) {
  const { sovereignRate } = useApp();
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'formula'

  if (!isOpen) return null;

  const stopRate = sovereignRate?.stopRate || 15.80;
  const realYield = sovereignRate?.realYield || 18.70;
  const fee = sovereignRate?.protocolFee || 6.00;
  const customerAPY = sovereignRate?.customerAPY || 12.70;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
    }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 11, 25, 0.98) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: '18px',
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header Ribbon */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'rgba(0, 255, 148, 0.12)',
              border: '1px solid rgba(0, 255, 148, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconShieldNIBSS size={18} color="var(--accent-green)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                Sovereign APY Architecture
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                CBN 364-Day Sovereign Treasury Bill Benchmark
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <IconXCircle size={20} />
          </button>
        </div>

        {/* Tab Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 1.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'breakdown' ? 'var(--accent-cyan)' : 'transparent'}`,
              color: activeTab === 'breakdown' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Yield Waterfall
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('formula')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'formula' ? 'var(--accent-cyan)' : 'transparent'}`,
              color: activeTab === 'formula' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Mathematical Formulation
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'breakdown' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Benchmark Header Info */}
              <div style={{
                background: 'rgba(0, 229, 255, 0.04)',
                border: '1px solid rgba(0, 229, 255, 0.18)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}>
                <span style={{ color: '#94a3b8' }}>Latest Primary Auction:</span>
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {sovereignRate?.auctionCode || 'CBN-NTB-364D-2026-W46'}
                </strong>
              </div>

              {/* Waterfall Steps */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>1. Sovereign Stop Rate (Discount Rate)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                    {stopRate.toFixed(2)}%
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>2. Effective Real Investment Yield</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                    +{realYield.toFixed(2)}%
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>3. NodeVault Protocol Infrastructure Fee</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>
                    -{fee.toFixed(2)}%
                  </span>
                </div>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0.25rem 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                    Net Customer Sovereign APY
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    color: 'var(--accent-green)',
                    fontSize: '1.25rem',
                    textShadow: '0 0 12px rgba(0, 255, 148, 0.35)',
                  }}>
                    {customerAPY.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Safeguard & Regulatory Verification Note */}
              <div style={{
                fontSize: '0.74rem',
                color: '#94a3b8',
                lineHeight: 1.5,
                background: 'rgba(0, 255, 148, 0.04)',
                border: '1px solid rgba(0, 255, 148, 0.15)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}>
                <IconCheckCircle size={15} color="var(--accent-green)" />
                <span>
                  <strong>NIBSS Regulated Guarantee:</strong> Backed by Central Bank of Nigeria sovereign debt instruments with automated 100% principal return on scheduled maturity.
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                In primary market auctions conducted by the Central Bank of Nigeria (CBN) and Debt Management Office (DMO), Treasury Bills are sold at a discount.
              </p>

              <div style={{
                background: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: '8px',
                padding: '0.85rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                fontSize: '0.78rem',
              }}>
                <div>True Yield (Y) = d / [1 - (d × 364 / 365)]</div>
                <div style={{ marginTop: '0.35rem', color: '#94a3b8' }}>
                  At {stopRate.toFixed(2)}% Stop Rate: Y = 0.158 / [1 - (0.158 × 0.9972)] = {realYield.toFixed(2)}%
                </div>
              </div>

              <div style={{
                background: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(0, 255, 148, 0.2)',
                borderRadius: '8px',
                padding: '0.85rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-green)',
                fontSize: '0.78rem',
              }}>
                <div>Customer APY = Real Yield ({realYield.toFixed(2)}%) - Fee ({fee.toFixed(2)}%) = {customerAPY.toFixed(2)}%</div>
              </div>

              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Rates are updated bi-weekly on auction settlement dates following multi-party verification.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
            style={{ padding: '0.4rem 1.25rem', fontSize: '0.78rem' }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

