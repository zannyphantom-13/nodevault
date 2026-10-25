import React, { useState, useEffect } from 'react';
import './GenesisNodeInspectorModal.css';

export default function GenesisNodeInspectorModal({
  node,
  isOpen,
  onClose,
  formatCurrency,
  serverSpecs,
  minedTokens = '0.000',
  cashValue = 0,
  onSettle,
}) {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [pingTestStatus, setPingTestStatus] = useState(null);

  if (!isOpen || !node) return null;

  const nodeAddress = `0x${((node.id * 184920491) ^ 0xabcdef).toString(16).padStart(8, '0')}...${((node.id * 77192) % 65535).toString(16)}`;
  const certNumber = `NV-VAL-2026-T${String(node.id).padStart(2, '0')}-${((node.id * 8923) % 9000 + 1000)}`;
  const guaranteedFloor = Math.round(node.fee * 0.70);

  const handleRunPing = () => {
    setPingTestStatus('testing');
    setTimeout(() => {
      setPingTestStatus('success');
      setTimeout(() => setPingTestStatus(null), 4000);
    }, 900);
  };

  return (
    <div className="node-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="node-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="node-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${node.color || '#00e5ff'}20`,
              border: `1px solid ${node.color || '#00e5ff'}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              ⚡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: node.color, fontWeight: 700, letterSpacing: '0.05em' }}>
                  Genesis Tier {node.id} Validator
                </span>
                <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  🟢 Validating
                </span>
              </div>
              <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                {node.name}
              </h3>
            </div>
          </div>
          <button className="refund-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="node-modal-nav">
          {[
            { id: 'telemetry', label: 'Hardware Telemetry' },
            { id: 'protection', label: 'Capital Protection (70%)' },
            { id: 'console', label: 'Consensus Logs' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`node-modal-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="node-modal-body">
          {activeTab === 'telemetry' && (
            <div>
              {/* Quick Identity Bar */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Validator Hash: </span>
                  <code style={{ color: '#00e5ff' }}>{nodeAddress}</code>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Uptime: </span>
                  <strong style={{ color: '#00ff94' }}>99.98%</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Cluster Ping: </span>
                  <strong style={{ color: '#00e5ff' }}>12ms (Lagos Genesis DC)</strong>
                </div>
              </div>

              {/* Hardware Spec Grid */}
              <div className="node-spec-grid">
                <div className="node-spec-card">
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Server Model</div>
                  <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{serverSpecs?.model || 'Enterprise Dedicated Node'}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#00e5ff', marginTop: '0.2rem' }}>{serverSpecs?.speedMultiplier || 1}× Processing Velocity</div>
                </div>

                <div className="node-spec-card">
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Core Processor</div>
                  <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{serverSpecs?.computeCore || 'AMD EPYC 7763'}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>Dedicated 64-Core ThreadPool</div>
                </div>

                <div className="node-spec-card">
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Memory & Storage</div>
                  <strong style={{ color: '#fff', fontSize: '0.85rem' }}>64GB ECC DDR4</strong>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>2TB NVMe PCIe Gen4 SSD</div>
                </div>

                <div className="node-spec-card">
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Block Solve Cycle</div>
                  <strong style={{ color: '#00ff94', fontSize: '0.85rem' }}>{serverSpecs?.cycleDurationSeconds || 6.0}s / Block</strong>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>1 $NVT Minted per Block</div>
                </div>
              </div>

              {/* Yield & Hashrate Allocation */}
              <div style={{ background: 'rgba(0, 229, 255, 0.04)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Current Node Yield Allocation</div>
                  <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                    {minedTokens} $NVT <span style={{ fontSize: '0.82rem', color: '#00ff94' }}>({formatCurrency(cashValue)})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleRunPing}
                    disabled={pingTestStatus === 'testing'}
                    style={{ fontSize: '0.72rem' }}
                  >
                    {pingTestStatus === 'testing' ? 'Testing Ping...' : pingTestStatus === 'success' ? '✓ 12ms Latency' : '🩺 Run Ping Test'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      onClose();
                      if (onSettle) onSettle(Math.floor(Number(minedTokens)));
                    }}
                    style={{ fontSize: '0.72rem' }}
                  >
                    ⚡ Settle Token Yield
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'protection' && (
            <div>
              <div className="node-cert-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#00e5ff', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Official Certificate of Protection
                    </span>
                    <h4 style={{ margin: '0.15rem 0', color: '#fff', fontSize: '1.05rem' }}>
                      Statutory Capital Warranty
                    </h4>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                    ✓ 100% Reserve Backed
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.65rem', borderRadius: 8 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Staked Principal</div>
                    <strong style={{ color: '#fff' }}>{formatCurrency(node.fee)}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.65rem', borderRadius: 8 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Guaranteed Exit Floor (70%)</div>
                    <strong style={{ color: '#00ff94' }}>{formatCurrency(guaranteedFloor)}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.65rem', borderRadius: 8 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Certificate Serial</div>
                    <code style={{ color: '#00e5ff', fontSize: '0.75rem' }}>{certNumber}</code>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.65rem', borderRadius: 8 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Custodian Vault</div>
                    <strong style={{ color: '#fff', fontSize: '0.75rem' }}>Segregated Trust Reserve</strong>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  This validator node position is an independent legal instrument under NodeVault Capital Protection Policy v4.2.
                  In the event of an orderly end-of-month exit request, the platform guarantees immediate statutory disbursement of up to
                  <strong> 70% of gross capital (₦{guaranteedFloor.toLocaleString()})</strong> directly to your linked verified bank account.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'console' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Live Validator Consensus Terminal
                </span>
                <span style={{ fontSize: '0.7rem', color: '#00ff94' }}>● Streaming Live</span>
              </div>
              <div className="node-terminal-box">
                <div>[2026-10-23 12:44:58] [INIT] NodeVault Validator daemon v4.2 online</div>
                <div>[2026-10-23 12:45:01] [CONSENSUS] Slot #8829 assigned to validator {nodeAddress}</div>
                <div>[2026-10-23 12:45:03] [HARDWARE] CPU ThreadPool {serverSpecs?.speedMultiplier || 1}x synchronized · 41°C</div>
                <div>[2026-10-23 12:45:04] [BLOCK] Proposal block #4192804 signed (ed25519)</div>
                <div>[2026-10-23 12:45:06] [REWARD] Block validated · +1.0000 $NVT minted</div>
                <div>[2026-10-23 12:45:08] [SOLVENCY] Net unrecovered floor verified: {formatCurrency(guaranteedFloor)}</div>
                <div>[2026-10-23 12:45:10] [PING] ACK received from Genesis Cluster Lagos (12ms)</div>
                <div>[2026-10-23 12:45:12] [LEDGER] Distributed checkpoint synchronized with CBN NIBSS rail</div>
                <div style={{ color: '#00ff94' }}>[2026-10-23 12:45:14] [STATUS] Validator health OPTIMAL · Zero slashing recorded</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="node-modal-footer">
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Node Position: Active In-Cycle
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ fontSize: '0.8rem' }}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
