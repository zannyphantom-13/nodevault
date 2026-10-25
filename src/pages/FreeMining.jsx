import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { COIN_RATE_NGN, COIN_RATE_USD } from '../data/platform';
import './FreeMining.css';
import './Dashboard.css';

// ── Integrity helpers ──────────────────────────────────────────────────────────
// A lightweight non-cryptographic hash (djb2 variant).
// Used to sign offline-progress records so users can't tamper timestamps.
const SALT = 'NVT_MINE_v1_7f3a'; // change this to invalidate old saved states

const djb2Hash = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h.toString(36);
};

// Sign: hash(closeTime + energy + processorUses + SALT)
const signClose = (closeTime, energy, processorUses) =>
  djb2Hash(`${closeTime}|${energy}|${processorUses}|${SALT}`);

// Verify saved close record; returns { closeTime, energy, processorUses } or null if tampered
const verifyCloseRecord = () => {
  try {
    const raw = localStorage.getItem('nvt_fm_closeRecord');
    if (!raw) return null;
    const rec = JSON.parse(raw);
    const expected = signClose(rec.closeTime, rec.energy, rec.processorUses);
    if (rec.sig !== expected) return null; // tampered
    return rec;
  } catch { return null; }
};

const saveCloseRecord = (energy, processorUses) => {
  const closeTime = Date.now();
  const sig = signClose(closeTime, energy, processorUses);
  localStorage.setItem('nvt_fm_closeRecord', JSON.stringify({ closeTime, energy, processorUses, sig }));
};

const LS = (key, def) => {
  try {
    const v = localStorage.getItem(`nvt_fm_${key}`);
    return v !== null ? JSON.parse(v) : def;
  } catch { return def; }
};
const LSSet = (key, val) => localStorage.setItem(`nvt_fm_${key}`, JSON.stringify(val));


export default function FreeMining() {
  const { region } = useApp();
  const isNG = region?.code === 'NG';
  const coinRate = isNG ? COIN_RATE_NGN : COIN_RATE_USD;

  // ── Persistent state ─────────────────────────────────────────────────────────
  const [isMining,       setIsMining]       = useState(() => LS('isMining',       false));
  const [minedAmount,    setMinedAmount]     = useState(() => LS('minedAmount',    0));
  const [sessionTarget,  setSessionTarget]  = useState(() => LS('sessionTarget',  0));
  const [energy,         setEnergy]         = useState(() => LS('energy',         0));
  const [processorUses,  setProcessorUses]  = useState(() => LS('processorUses',  0));
  const [dailyEnergy,    setDailyEnergy]    = useState(() => LS('dailyEnergy',    0));
  const [dailyProcessors,setDailyProcessors]= useState(() => LS('dailyProcessors',0));
  const [lastDay,        setLastDay]        = useState(() => LS('lastDay',        new Date().toDateString()));
  const [autoMine,       setAutoMine]       = useState(() => LS('autoMine',       false));
  const [showAdModal,    setShowAdModal]    = useState(false);
  const [offlineReport,  setOfflineReport]  = useState(null); // { sessions, earned }

  // ── Refs for stale-closure-free access ───────────────────────────────────────
  const energyRef        = useRef(energy);
  const processorUsesRef = useRef(processorUses);
  const minedAmountRef   = useRef(minedAmount);
  const isMiningRef      = useRef(isMining);
  const autoMineRef      = useRef(autoMine);

  React.useEffect(() => { energyRef.current        = energy;        }, [energy]);
  React.useEffect(() => { processorUsesRef.current = processorUses; }, [processorUses]);
  React.useEffect(() => { minedAmountRef.current   = minedAmount;   }, [minedAmount]);
  React.useEffect(() => { isMiningRef.current      = isMining;      }, [isMining]);
  React.useEffect(() => { autoMineRef.current      = autoMine;      }, [autoMine]);

  // ── Offline progress (runs once on mount) ────────────────────────────────────
  React.useEffect(() => {
    const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000; // cap at 24 hours
    const SESSION_MS     = 60_000;               // 1 minute per session
    const MAX_SESSIONS   = 20;                   // hard daily cap

    const rec = verifyCloseRecord();
    localStorage.removeItem('nvt_fm_closeRecord');

    if (rec) {
      // Clamp elapsed to max 24h to prevent old-timestamp abuse
      const elapsed        = Math.min(Date.now() - rec.closeTime, MAX_OFFLINE_MS);
      const sessionsNeeded = Math.floor(elapsed / SESSION_MS);

      if (sessionsNeeded > 0) {
        // Resources at close time are signed inside the record — use THOSE values,
        // not what's in localStorage (which the user could have edited separately).
        const signedEnergy = rec.energy;
        const signedProc   = rec.processorUses;
        const canRun       = Math.min(sessionsNeeded, signedEnergy, signedProc, MAX_SESSIONS);

        if (canRun > 0) {
          const totalEarned = canRun * 1.0;
          // Subtract from CURRENT stored state (not signed values)
          setEnergy(prev        => Math.max(0, prev - canRun));
          setProcessorUses(prev => Math.max(0, prev - canRun));
          setMinedAmount(prev   => {
            const next = prev + totalEarned;
            LSSet('minedAmount', next);
            return next;
          });
          setOfflineReport({ sessions: canRun, earned: totalEarned });
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save tamper-proof close record when user leaves ──────────────────────────
  React.useEffect(() => {
    const save = () => {
      if (autoMineRef.current || isMiningRef.current) {
        // Sign with current energy + processorUses so we know how much they had at close
        saveCloseRecord(energyRef.current, processorUsesRef.current);
      } else {
        localStorage.removeItem('nvt_fm_closeRecord');
      }
    };
    window.addEventListener('pagehide',     save);
    window.addEventListener('beforeunload', save);
    return () => {
      window.removeEventListener('pagehide',     save);
      window.removeEventListener('beforeunload', save);
    };
  }, []);

  // ── Daily reset ───────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const today = new Date().toDateString();
    if (lastDay !== today) {
      setDailyEnergy(0);
      setDailyProcessors(0);
      setLastDay(today);
    }
  }, [lastDay]);

  // ── Persist all state on every change ────────────────────────────────────────
  React.useEffect(() => {
    LSSet('isMining',        isMining);
    LSSet('minedAmount',     minedAmount);
    LSSet('sessionTarget',   sessionTarget);
    LSSet('energy',          energy);
    LSSet('processorUses',   processorUses);
    LSSet('dailyEnergy',     dailyEnergy);
    LSSet('dailyProcessors', dailyProcessors);
    LSSet('lastDay',         lastDay);
    LSSet('autoMine',        autoMine);
  }, [isMining, minedAmount, sessionTarget, energy, processorUses, dailyEnergy, dailyProcessors, lastDay, autoMine]);

  const canMine = energy >= 1 && processorUses >= 1;
  const activeHashrate = 0.0016;

  // ── Core: start one mining session (stale-closure-safe via refs) ─────────────
  const startSession = useCallback(() => {
    if (energyRef.current >= 1 && processorUsesRef.current >= 1 && !isMiningRef.current) {
      setEnergy(prev        => prev - 1);
      setProcessorUses(prev => prev - 1);
      const sessionYield = 1.0; // 1 block = 1 $NVT (worth ₦18.00)
      setSessionTarget(minedAmountRef.current + sessionYield);
      setIsMining(true);
    }
  }, []);

  // ── Mining interval (visual tick: 60s per block at 100ms ticks = 600 ticks) ──
  React.useEffect(() => {
    if (!isMining) return;
    const interval = setInterval(() => {
      setMinedAmount(prev => {
        const tickYield = 1.0 / 600; // 60 seconds
        const next = prev + tickYield;
        if (next >= sessionTarget) {
          setIsMining(false);
          return sessionTarget;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isMining, sessionTarget]);

  // ── Auto-mine: session just ended → start next immediately if resources exist ─
  // RULE: Only the USER toggles autoMine. System never touches it.
  React.useEffect(() => {
    if (!isMining && autoMineRef.current &&
        energyRef.current >= 1 && processorUsesRef.current >= 1) {
      startSession(); // no delay
    }
  }, [isMining, startSession]);

  // ── Auto-mine: user just turned it ON → start immediately if resources exist ──
  React.useEffect(() => {
    if (autoMine && !isMiningRef.current &&
        energyRef.current >= 1 && processorUsesRef.current >= 1) {
      startSession();
    }
  }, [autoMine]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-mine: new resources arrived while autoMine is ON and rig is idle ────
  React.useEffect(() => {
    if (autoMineRef.current && !isMiningRef.current &&
        energyRef.current >= 1 && processorUsesRef.current >= 1) {
      startSession();
    }
  }, [energy, processorUses]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual start ─────────────────────────────────────────────────────────────
  const handlePowerToggle = () => {
    if (!isMining && canMine) startSession();
  };

  return (
    <div className="free-mining-page">
      <div className="container">
        <div className="mining-hero">
          <h1 className="mining-title">Public Shared <span className="gradient-text">Mining Server</span></h1>
          <p className="mining-subtitle">
            Validate blocks on the public community server. Each block solves in 60 seconds.
            Upgrade to a Dedicated Staked Server for 10× to 160× faster validation velocity.
          </p>
        </div>

        {/* Offline earnings report */}
        {offlineReport && (
          <div className="card" style={{
            maxWidth: '800px', margin: '0 auto 1.5rem auto', padding: '1rem 1.5rem',
            borderColor: 'var(--accent-cyan)', background: 'rgba(0,229,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>⛏️ Offline Mining Complete!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Your server ran <strong>{offlineReport.sessions} block{offlineReport.sessions > 1 ? 's' : ''}</strong> while you were away
                and earned <strong style={{ color: 'var(--accent-green)' }}>+{offlineReport.earned.toFixed(4)} $NVT</strong>
                {isNG ? ` (~₦${(offlineReport.earned * coinRate).toFixed(2)})` : ` (~$${(offlineReport.earned * coinRate).toFixed(4)})`}.
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setOfflineReport(null)}>Dismiss</button>
          </div>
        )}

        <div className="airdrop-card card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="airdrop-header">
            <div>
              <h2 className="dash-title" style={{ marginBottom: 0 }}>Public Shared Server (Community)</h2>
              <span className="badge" style={{ marginTop: '0.35rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                1× Processing Velocity (60.0s / block)
              </span>
            </div>
            <div className={`badge ${isMining ? 'badge-green pulse' : 'badge-amber'}`}>
              {isMining ? '🟢 Server Active' : '🟡 Server Standby'}
            </div>
          </div>

          <div className="airdrop-visual" style={{ marginTop: '2rem' }}>
            <div className={`coin-wrapper ${isMining ? 'spinning' : ''}`}>
              <img src="/logo.svg" alt="$NVT Coin" className="coin-image" />
            </div>
            
            <div className="airdrop-allocation">
              <div className="allocation-label">Total Mined Balance</div>
              <div className="allocation-amount gradient-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {minedAmount.toFixed(4)} <span className="allocation-symbol">$NVT</span>
              </div>
              <div className="allocation-usd">
                ≈ {isNG ? `₦${(minedAmount * coinRate).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN` : `$${(minedAmount * coinRate).toFixed(4)} USD`}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                  (@ ₦18/token parity)
                </span>
              </div>
            </div>
          </div>

          <div className="airdrop-actions" style={{ maxWidth: '400px', margin: '0 auto 3rem auto' }}>
            <button 
              className={`btn btn-full ${isMining ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handlePowerToggle}
              disabled={(!canMine && !isMining) || isMining}
              style={isMining ? { borderColor: 'var(--accent-green)', color: 'var(--accent-green)' } : {}}
            >
              {isMining ? '⚡ Solving Block (60s)...' : (!canMine ? 'Hardware Resources Required' : '▶ Power On Public Server')}
            </button>
            {!canMine && !isMining && (
              <div style={{textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--accent-amber)'}}>
                You need at least 1 Power Unit and 1 Compute Credit to validate a block.
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="checkbox" 
                id="autoMine" 
                checked={autoMine} 
                onChange={(e) => setAutoMine(e.target.checked)} 
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
              />
              <label htmlFor="autoMine" style={{ fontSize: '0.9rem', color: autoMine ? 'var(--accent-cyan)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: autoMine ? 600 : 400 }}>
                {autoMine ? '🤖 Auto-Process: ACTIVE' : 'Enable Auto-Processing'}
              </label>
            </div>
            {autoMine && !canMine && !isMining && (
              <div style={{textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                Waiting for server resources... server will resume automatically.
              </div>
            )}

            {minedAmount >= sessionTarget && sessionTarget > 0 && !isMining && (
              <div style={{textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--accent-green)'}}>
                ✓ Block Completed! Balance updated to {sessionTarget.toFixed(4)} $NVT.
              </div>
            )}
          </div>

          {/* ══ REQUIRED RESOURCES ══ */}
          <div className="mining-boosts">
            <h3 className="boosts-title">Required Server Resources</h3>
            <div className="boosts-grid">
              
              <div className="boost-card">
                <div className="boost-icon">⚡</div>
                <div className="boost-info">
                  <h4>Power Units (Energy)</h4>
                  <p>Community grid feed. Sponsor refresh allocates +1 Power Unit. (Max 20/day)</p>
                  <div className="energy-progress">
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: energy >= 1 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {energy} Power Units Ready
                    </div>
                  </div>
                  {dailyEnergy >= 20 ? (
                    <div className="boost-active-badge" style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Daily Limit Reached</div>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => {
                        setShowAdModal(true);
                        setTimeout(() => {
                          setShowAdModal(false);
                          setEnergy(prev => prev + 1);
                          setDailyEnergy(prev => prev + 1);
                        }, 1500);
                      }}
                    >
                      Recharge Feed (+1 Power)
                    </button>
                  )}
                </div>
              </div>

              <div className="boost-card">
                <div className="boost-icon">💻</div>
                <div className="boost-info">
                  <h4>Compute Credits (Processor)</h4>
                  <p>Community cloud worker task allocates 20 compute credits. (Max 1/day)</p>
                  <div className="energy-progress">
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: processorUses > 0 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {processorUses} / 20 Credits Left
                    </div>
                  </div>
                  {processorUses > 0 ? (
                    <div className="boost-active-badge" style={{ marginTop: '0.5rem' }}>Active Core</div>
                  ) : dailyProcessors >= 1 ? (
                    <div className="boost-active-badge" style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Daily Limit Reached</div>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => {
                        if (window.confirm("Allocate 20 community compute credits?")) {
                          setProcessorUses(20);
                          setDailyProcessors(prev => prev + 1);
                        }
                      }}
                    >
                      Allocate (+20 Credits)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="airdrop-info-grid">
            <div className="airdrop-info-item">
              <span>Server Velocity</span>
              <strong style={isMining ? { color: 'var(--accent-green)' } : {}}>
                1.0× (60.0s / block)
              </strong>
            </div>
            <div className="airdrop-info-item">
              <span>Infrastructure Tier</span>
              <strong>Public Shared Worker</strong>
            </div>
            <div className="airdrop-info-item">
              <span>Resource Status</span>
              {canMine ? (
                <strong style={{ color: 'var(--accent-cyan)' }}>Operational</strong>
              ) : (
                <strong style={{ color: 'var(--accent-amber)' }}>Resources Depleted</strong>
              )}
            </div>
            <div className="airdrop-info-item">
              <span>Token Parity</span>
              <strong style={{ color: 'var(--accent-green)' }}>1 $NVT = ₦18.00</strong>
            </div>
          </div>

          {/* ══ UPGRADE TO DEDICATED SERVER BANNER ══ */}
          <div className="card" style={{ marginTop: '2rem', borderColor: 'var(--accent-cyan)', background: 'rgba(0, 229, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '1rem' }}>
                ⚡ Upgrade to a Dedicated Node Server (10× to 160× Velocity)
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Stake a Tier 1 Micro Node (₦1,000) for 10× processing speed (6.0s/block) or Tier 5 Echo Node for 160× speed.
                Dedicated servers convert network validation rewards directly into Compute & Power fuel.
              </div>
            </div>
            <Link to="/tiers" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
              View Node Tiers →
            </Link>
          </div>

          {/* ══ TOKEN LIQUIDITY NOTICE ══ */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Looking to liquidate tokens? Log in to your <Link to="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>User Dashboard</Link> to access the instant Token Settlement Desk (₦18/token).
          </div>
        </div>
      </div>

      {showAdModal && (
        <div className="ad-modal-overlay">
          <div className="ad-modal">
            <div className="spinner"></div>
            <p>Watching Sponsored Video...</p>
            <small>Please do not close this window.</small>
          </div>
        </div>
      )}
    </div>
  );
}
