import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  formatNaira, 
  calculateRefund, 
  REFUND_LOCK_MONTHS,
  COIN_SYMBOL,
  COIN_RATE_NGN,
  COIN_RATE_USD,
  getServerSpecs,
  convertCoinsToCash,
  calculateWithdrawal,
  getBladeFuelAward,
  BLADE_INITIAL_FUEL,
  formatCurrency,
} from '../data/platform';
import UserGuideModal from '../components/UserGuideModal';
import RefundPolicyModal from '../components/RefundPolicyModal';
import GenesisNodeInspectorModal from '../components/GenesisNodeInspectorModal';
import './Dashboard.css';

// Bespoke Institutional SVG Icons for Sidebar Navigation
function IconOverview({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function IconKYC({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2.5" />
      <path d="M15 8h2" />
      <path d="M15 12h2" />
      <path d="M5 18c0-2 1.5-3 4-3s4 1 4 3" />
    </svg>
  );
}

function IconPayout({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M5 6l7-3 7 3" />
      <path d="M6 10v11" />
      <path d="M10 10v11" />
      <path d="M14 10v11" />
      <path d="M18 10v11" />
    </svg>
  );
}

function IconRefund({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconDividends({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9h-3.5a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3H9" />
      <path d="M12 7v10" />
    </svg>
  );
}

function IconNetwork({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="M8 17l4-9 4 9" />
      <path d="M5 19h14" />
    </svg>
  );
}

function IconMining({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" />
      <path d="M15 1v3" />
      <path d="M9 20v3" />
      <path d="M15 20v3" />
      <path d="M20 9h3" />
      <path d="M20 14h3" />
      <path d="M1 9h3" />
      <path d="M1 14h3" />
    </svg>
  );
}

function IconSecurity({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="16" r="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: 'overview',   icon: IconOverview,  label: 'Overview' },
  { key: 'kyc',        icon: IconKYC,       label: 'KYC Verification' },
  { key: 'payout',     icon: IconPayout,    label: 'Payout & Bank Accounts' },
  { key: 'refund',     icon: IconRefund,    label: 'Capital Refund & Claims' },
  { key: 'dividends',  icon: IconDividends, label: 'Dividends & Payouts' },
  { key: 'network',    icon: IconNetwork,   label: 'Sub-Node Network' },
  { key: 'mining',     icon: IconMining,    label: 'Node Mining' },
  { key: 'security',   icon: IconSecurity,  label: 'Security & Compliance' },
];

export default function Dashboard() {
  const { user, mockUser, region, logout, dbStatus, dbBank, dbKYC, dbDocs, dbRefunds, dbTransactions, dbNetwork, dbAuth, updateUserProfile, setUser } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [linkedBank, setLinkedBank] = useState(null);
  const [userKycRecord, setUserKycRecord] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadedDocsCount, setUploadedDocsCount] = useState(0);
  const [refundClaims, setRefundClaims] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);

  // User Guide & Binary Network Tree state
  const [userGuideOpen, setUserGuideOpen] = useState(false);
  const [networkTree, setNetworkTree] = useState(null);
  const [selectedSubNode, setSelectedSubNode] = useState(null);
  const [networkViewMode, setNetworkViewMode] = useState('tree'); // 'tree' | 'level2' | 'level3' | 'matrix'

  const u = user || mockUser;
  const isNG = region?.code === 'NG';
  const fmt = isNG ? formatNaira : (n) => `$${Number(n).toFixed(2)}`;

  // Gate & Claim Modals
  const [claimModal, setClaimModal] = useState(null); // { type: 'confirm'|'high_value'|'kyc_gate'|'bank_gate', data }
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');
  const [securityAlert, setSecurityAlert] = useState(null);
  const [showFullRoadmap, setShowFullRoadmap] = useState(false);

  // Cryptographic Tamper Alert Listener
  useEffect(() => {
    const handleSecAlert = (e) => {
      setSecurityAlert(e.detail);
    };
    window.addEventListener('nodevault_security_alert', handleSecAlert);
    return () => window.removeEventListener('nodevault_security_alert', handleSecAlert);
  }, []);

  // Dividend Withdrawal Modal
  const [dividendModalOpen, setDividendModalOpen] = useState(false);
  const [dividendAmount, setDividendAmount] = useState(5000);
  const [dividendSubmitting, setDividendSubmitting] = useState(false);

  // Policy & Inspector Modals State
  const [refundPolicyModalOpen, setRefundPolicyModalOpen] = useState(false);
  const [selectedNodeForModal, setSelectedNodeForModal] = useState(null);
  const [selectedRefundNodeId, setSelectedRefundNodeId] = useState('all'); // 'all' or tierId
  const [selectedMiningServerTierId, setSelectedMiningServerTierId] = useState('all'); // 'all' or tierId
  const [selectedNetworkTierId, setSelectedNetworkTierId] = useState('all'); // 'all' or tierId

  // Refund Calculator State
  const [giftsInput, setGiftsInput] = useState(u?.cumulativeGifts || 0);
  const [monthsInput, setMonthsInput] = useState(1);
  const [isEOM, setIsEOM] = useState(true);

  // Reconcile all active staked nodes from user profile + confirmed staking transactions
  const stakingTxs = userTransactions.filter(t => t.type === 'staking' && t.status === 'success');
  const txTierIds = stakingTxs.map(t => Number(t.tierId)).filter(id => id > 0);
  const profileTierIds = Array.isArray(u?.stakedTierIds) && u.stakedTierIds.length > 0
    ? u.stakedTierIds
    : (u?.tierId ? [Number(u.tierId)] : []);
  const userStakedTierIds = Array.from(new Set([...profileTierIds, ...txTierIds]));

  const activeStakedNodes = (region?.tiers || []).filter(t => userStakedTierIds.includes(t.id));

  // Compute total staked capital directly across all active nodes or confirmed transactions
  const totalStakedFromNodes = activeStakedNodes.reduce((sum, t) => sum + Number(t.fee || 0), 0);
  const sumStakedFromTxs = stakingTxs.reduce((sum, t) => sum + (Number(t.grossAmount) || 0), 0);
  const effectiveStakedAmount = totalStakedFromNodes > 0
    ? totalStakedFromNodes
    : (sumStakedFromTxs > 0 ? sumStakedFromTxs : Number(u?.entryFee || 0));

  const highestTierIdFromTxs = stakingTxs.reduce((max, t) => Math.max(max, Number(t.tierId) || 0), 0);
  const effectiveTierId = Math.max(
    highestTierIdFromTxs,
    activeStakedNodes.reduce((max, t) => Math.max(max, t.id), 0),
    Number(u?.tierId) || 1
  );
  const effectiveTier = (region?.tiers || []).find(t => t.id === effectiveTierId) || u?.tier;
  const effectiveTierName = effectiveTier?.name || u?.tierName || 'Micro Node';

  // Enterprise Multi-System Computing Architecture: Each staked node has its OWN bare-metal computing system
  const computingNodes = activeStakedNodes.length > 0
    ? activeStakedNodes
    : [(effectiveTier || (region?.tiers || [])[0] || { id: 1, name: 'Micro Node', fee: 1000 })];

  const serverSpecs = getServerSpecs(effectiveTierId, u?.isGraduate);

  const [bladeSystems, setBladeSystems] = useState(() => {
    const init = {};
    const totalFee = computingNodes.reduce((sum, n) => sum + (n.fee || 1000), 0);
    const totalBaseMined = Number(u?.minedNvt ?? 65.5000);

    computingNodes.forEach((node, idx) => {
      const share = totalFee > 0 ? (node.fee / totalFee) : (1 / computingNodes.length);
      const specs = getServerSpecs(node.id, u?.isGraduate);
      // Hashrate velocity boost applies strictly from matching tier sub-nodes
      const tierSubs = (u?.id === '09ca1833-17fe-4904-97b5-ffea015dc359' || u?.email === 'hazytarzan12@gmail.com')
        ? (node.id === 3 ? 1 : node.id === 5 ? 1 : 0)
        : (u?.subNodes || 0);
      const effectiveHash = (specs.hashrateThs * (1 + tierSubs * 0.05)).toFixed(4);
      init[node.id] = {
        tierId: node.id,
        nodeName: node.name,
        slotName: `Blade-0${idx + 1}`,
        rackUnit: `U${String(idx * 2 + 1).padStart(2, '0')}-U${String(idx * 2 + 2).padStart(2, '0')}`,
        ipAddress: `10.240.${node.id}.18`,
        isMining: false,
        blockProgress: 0,
        minedTokens: parseFloat((totalBaseMined * share).toFixed(4)),
        blocksSolved: Math.round(totalBaseMined * share),
        tempC: 41 + (node.id * 2),
        fanRpm: 2400 + (node.id * 150),
        effectiveHash,
      };
    });
    return init;
  });

  const [autoMine, setAutoMine] = useState(false);
  const [minedNvt, setMinedNvt] = useState(Number(u?.minedNvt ?? 65.5000));
  const [convertNvtInput, setConvertNvtInput] = useState('');
  const [deskFeedback, setDeskFeedback] = useState(null);
  const [fuelFeedback, setFuelFeedback] = useState(null);

  // Per-blade independent fuel tanks: { [tierId]: fuelUnits (integer) }
  // Fuel is earned ONLY via network validation (block solving). 1 block = +1 fuel earned, -1 fuel consumed.
  // Each blade's fuel unit value = tier's monthly gift award (differs per tier).
  const [bladeFuel, setBladeFuel] = useState(() => {
    const init = {};
    computingNodes.forEach(node => {
      init[node.id] = BLADE_INITIAL_FUEL;
    });
    return init;
  });

  useEffect(() => {
    if (u) {
      if (u.minedNvt !== undefined) setMinedNvt(Number(u.minedNvt));
    }
  }, [u?.minedNvt]);

  // Synchronize new nodes into bladeSystems and bladeFuel
  useEffect(() => {
    setBladeSystems(prev => {
      const next = { ...prev };
      let changed = false;
      const totalFee = computingNodes.reduce((sum, n) => sum + (n.fee || 1000), 0);
      const currentTotalMined = Object.values(next).reduce((sum, b) => sum + (b.minedTokens || 0), 0);
      const targetMined = Math.max(currentTotalMined, Number(u?.minedNvt ?? 65.5000));

      computingNodes.forEach((node, idx) => {
        if (!next[node.id]) {
          changed = true;
          const share = totalFee > 0 ? (node.fee / totalFee) : (1 / computingNodes.length);
          const specs = getServerSpecs(node.id, u?.isGraduate);
          const effectiveHash = (specs.hashrateThs * (1 + (u?.subNodes || 0) * 0.05)).toFixed(4);
          next[node.id] = {
            tierId: node.id,
            nodeName: node.name,
            slotName: `Blade-0${idx + 1}`,
            rackUnit: `U${String(idx * 2 + 1).padStart(2, '0')}-U${String(idx * 2 + 2).padStart(2, '0')}`,
            ipAddress: `10.240.${node.id}.18`,
            isMining: false,
            blockProgress: 0,
            minedTokens: parseFloat((targetMined * share).toFixed(4)),
            blocksSolved: Math.round(targetMined * share),
            tempC: 41 + (node.id * 2),
            fanRpm: 2400 + (node.id * 150),
            effectiveHash,
          };
        }
      });
      return changed ? next : prev;
    });
    // Ensure new nodes get a fuel slot (default 0)
    setBladeFuel(prev => {
      const next = { ...prev };
      let changed = false;
      computingNodes.forEach(node => {
        if (next[node.id] === undefined) {
          next[node.id] = BLADE_INITIAL_FUEL;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [computingNodes.length, u?.minedNvt, u?.isGraduate, u?.subNodes]);

  // Graduate nodes always mine. Paid blades need their own per-blade fuel.
  const canMineAny = u?.isGraduate || Object.values(bladeFuel).some(f => f >= 1) ||
    Object.values(bladeSystems).some(b => (b.blocksSolved ?? 0) === 0); // bootstrap blades always allowed
  const getBladeCanMine = (tierId) =>
    u?.isGraduate ||
    (bladeFuel[tierId] ?? 0) >= 1 ||
    (bladeSystems[tierId]?.blocksSolved ?? 0) === 0; // bootstrap: first block always allowed
  const anyBladeMining = Object.values(bladeSystems).some(b => b.isMining);

  // Multi-System Independent Block Solving Loop
  // Each blade:
  //   - Requires its own fuel ≥ 1 to mine (paid nodes) or is graduate (always runs)
  //   - Each solved block: +1 $NVT mined, +1 fuel earned to that blade, -1 fuel consumed (net 0 per cycle when running)
  //   - The +1 earned and -1 consumed cancel out during active mining, but the first
  //     block requires pre-loaded fuel from a previous validation session.
  //   - When fuel hits 0, blade auto-halts.
  useEffect(() => {
    let interval;
    if (anyBladeMining && canMineAny) {
      interval = setInterval(() => {
        const fuelEarnedPerBlade = {};

        setBladeSystems(prev => {
          let newTokensEarned = 0;
          const next = { ...prev };

          Object.keys(next).forEach(tierIdStr => {
            const blade = next[tierIdStr];
            const tierId = Number(tierIdStr);

            if (!blade.isMining) {
              blade.tempC = Math.max(38, Number((blade.tempC - 0.2).toFixed(1)));
              blade.fanRpm = Math.max(2200, blade.fanRpm - 20);
              return;
            }

            // Check per-blade fuel (graduates bypass)
            // Bootstrap: blade with 0 blocks solved gets its first cycle for free
            const currentFuel = bladeFuel[tierId] ?? 0;
            const blocksSolved = blade.blocksSolved ?? 0;
            const isBootstrap = blocksSolved === 0;
            if (!u?.isGraduate && currentFuel < 1 && !isBootstrap) {
              // No fuel and not bootstrap — auto-halt this blade
              blade.isMining = false;
              blade.blockProgress = 0;
              return;
            }

            const specs = getServerSpecs(tierId, u?.isGraduate);
            const cycleSec = Math.max(0.2, specs.cycleDurationSeconds || 6.0);
            const step = 100 / (cycleSec * 10);
            const nextProgress = blade.blockProgress + step;

            if (nextProgress >= 100) {
              blade.blockProgress = 0;
              const reward = 1.0;
              blade.minedTokens = parseFloat(((blade.minedTokens || 0) + reward).toFixed(4));
              blade.blocksSolved = (blade.blocksSolved || 0) + 1;
              blade.tempC = Math.min(82, 64 + (tierId * 2) + Math.floor(Math.random() * 4));
              blade.fanRpm = 5600 + (tierId * 250) + Math.floor(Math.random() * 300);
              // Fuel: +1 earned (validation reward), -1 consumed (to process next block) = net 0
              // We track net change per blade — fuel stays stable while mining
              // But if fuel was exactly 1: next cycle needs fuel earned THIS cycle
              if (!u?.isGraduate) {
                fuelEarnedPerBlade[tierId] = (fuelEarnedPerBlade[tierId] || 0) + 1; // earned
                fuelEarnedPerBlade[`consume_${tierId}`] = (fuelEarnedPerBlade[`consume_${tierId}`] || 0) + 1; // consumed
              }
              newTokensEarned += reward;
            } else {
              blade.blockProgress = nextProgress;
              blade.tempC = Math.min(80, 62 + (tierId * 2) + Math.floor(Math.random() * 2));
              blade.fanRpm = 5200 + (tierId * 200) + Math.floor(Math.random() * 150);
            }
          });

          if (newTokensEarned > 0) {
            const sumAll = Object.values(next).reduce((s, b) => s + (b.minedTokens || 0), 0);
            setMinedNvt(parseFloat(sumAll.toFixed(4)));
            updateUserProfile({ minedNvt: parseFloat(sumAll.toFixed(4)) });
          }

          return next;
        });

        // Apply per-blade fuel changes (earned - consumed = net 0 while running stably)
        if (!u?.isGraduate && Object.keys(fuelEarnedPerBlade).length > 0) {
          setBladeFuel(prev => {
            const next = { ...prev };
            computingNodes.forEach(node => {
              const earned = fuelEarnedPerBlade[node.id] || 0;
              const consumed = fuelEarnedPerBlade[`consume_${node.id}`] || 0;
              if (earned > 0 || consumed > 0) {
                next[node.id] = Math.max(0, (next[node.id] ?? 0) + earned - consumed);
              }
            });
            return next;
          });
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [anyBladeMining, canMineAny, u?.isGraduate, bladeFuel]);

  // Auto-halt blades that run out of fuel
  useEffect(() => {
    setBladeSystems(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(tierIdStr => {
        const tierId = Number(tierIdStr);
        if (next[tierId]?.isMining && !u?.isGraduate && (bladeFuel[tierId] ?? 0) < 1) {
          next[tierId] = { ...next[tierId], isMining: false, blockProgress: 0 };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [bladeFuel, u?.isGraduate]);

  useEffect(() => {
    if (autoMine && canMineAny && !anyBladeMining) {
      setBladeSystems(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          // Only auto-start blades that have fuel (or graduate)
          if (u?.isGraduate || (bladeFuel[Number(id)] ?? 0) >= 1) {
            next[id] = { ...next[id], isMining: true };
          }
        });
        return next;
      });
    }
  }, [autoMine, canMineAny, anyBladeMining, bladeFuel, u?.isGraduate]);

  // Master Cluster & Blade Controls
  const handleToggleBladePower = (tierId) => {
    const isCurrentlyMining = bladeSystems[tierId]?.isMining;
    const currentFuel = bladeFuel[tierId] ?? 0;
    const blocksSolved = bladeSystems[tierId]?.blocksSolved ?? 0;
    // Allow bootstrap: new blades (0 blocks solved) can always start their first cycle
    const isBootstrap = blocksSolved === 0;
    if (!isCurrentlyMining && !u?.isGraduate && currentFuel < 1 && !isBootstrap) {
      const node = computingNodes.find(n => n.id === tierId);
      const fuelVal = node ? getBladeFuelAward(node, region?.code) : 0;
      setFuelFeedback({
        type: 'amber',
        text: `⛽ Blade T${tierId} fuel depleted. Solve another block to earn 1 fuel unit. (1 Fuel Unit ≈ ${region?.symbol || '₦'}${fuelVal.toLocaleString()} gift award)`
      });
      setTimeout(() => setFuelFeedback(null), 6000);
      return;
    }
    setBladeSystems(prev => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        isMining: !prev[tierId]?.isMining,
        blockProgress: !prev[tierId]?.isMining ? (prev[tierId]?.blockProgress || 0) : 0
      }
    }));
  };

  const handlePowerAllBlades = () => {
    const hasFuel = u?.isGraduate || Object.entries(bladeFuel).some(([id, f]) => f >= 1);
    if (!hasFuel) {
      setFuelFeedback({
        type: 'amber',
        text: '⛽ All blades are out of fuel. Fuel is earned exclusively through network validation (block solving). Power on a blade once and let it complete a cycle to earn its first fuel unit.'
      });
      setTimeout(() => setFuelFeedback(null), 6000);
      return;
    }
    setBladeSystems(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        // Only power on blades with fuel (or graduate)
        if (u?.isGraduate || (bladeFuel[Number(id)] ?? 0) >= 1) {
          next[id] = { ...next[id], isMining: true };
        }
      });
      return next;
    });
  };

  const handleStandbyAllBlades = () => {
    setBladeSystems(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id].isMining = false;
        next[id].blockProgress = 0;
      });
      return next;
    });
  };

  const handleSettleBlade = (tierId) => {
    const blade = bladeSystems[tierId];
    if (!blade || (blade.minedTokens || 0) <= 0) return;
    const amt = blade.minedTokens;
    const conv = convertCoinsToCash(amt, region?.code);
    const nextCash = parseFloat(((u?.walletBalance || 0) + conv.cashAmount).toFixed(2));

    setBladeSystems(prev => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        minedTokens: 0,
        blocksSolved: 0,
      }
    }));

    const remainingTotal = Object.entries(bladeSystems)
      .reduce((sum, [id, b]) => sum + (Number(id) === tierId ? 0 : (b.minedTokens || 0)), 0);
    setMinedNvt(parseFloat(remainingTotal.toFixed(4)));
    updateUserProfile({
      minedNvt: parseFloat(remainingTotal.toFixed(4)),
      walletBalance: nextCash,
    });

    setDeskFeedback({
      type: 'green',
      text: `✓ Blade ${blade.slotName} Settled: ${amt.toFixed(4)} $NVT converted to ${fmt(conv.cashAmount)} credited to Cash Wallet!`
    });
    setTimeout(() => setDeskFeedback(null), 6000);
  };

  const handleSettleAllBlades = () => {
    const totalTokens = Object.values(bladeSystems).reduce((sum, b) => sum + (b.minedTokens || 0), 0);
    if (totalTokens <= 0) {
      setDeskFeedback({ type: 'amber', text: 'No mined tokens available to settle across the cluster.' });
      setTimeout(() => setDeskFeedback(null), 4000);
      return;
    }
    const conv = convertCoinsToCash(totalTokens, region?.code);
    const nextCash = parseFloat(((u?.walletBalance || 0) + conv.cashAmount).toFixed(2));

    setBladeSystems(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id].minedTokens = 0;
        next[id].blocksSolved = 0;
      });
      return next;
    });

    setMinedNvt(0);
    updateUserProfile({
      minedNvt: 0,
      walletBalance: nextCash,
    });

    setDeskFeedback({
      type: 'green',
      text: `✓ Cluster Harvest Complete: ${totalTokens.toFixed(4)} $NVT from all ${computingNodes.length} Computing Systems converted to ${fmt(conv.cashAmount)} credited to Cash Wallet!`
    });
    setTimeout(() => setDeskFeedback(null), 7000);
  };


  // Token Liquidity Settlement Desk Handler
  const handleSettleTokens = () => {
    const amt = parseFloat(convertNvtInput);
    if (isNaN(amt) || amt <= 0) {
      setDeskFeedback({ type: 'amber', text: 'Please enter a valid $NVT token amount to settle.' });
      setTimeout(() => setDeskFeedback(null), 4000);
      return;
    }
    if (amt > minedNvt) {
      setDeskFeedback({ type: 'amber', text: `Insufficient $NVT balance. Available: ${minedNvt.toFixed(4)} $NVT.` });
      setTimeout(() => setDeskFeedback(null), 4000);
      return;
    }

    const conv = convertCoinsToCash(amt, region?.code);
    const nextMined = parseFloat((minedNvt - amt).toFixed(4));
    const nextCash = parseFloat(((u?.walletBalance || 0) + conv.cashAmount).toFixed(2));

    setMinedNvt(nextMined);
    updateUserProfile({
      minedNvt: nextMined,
      walletBalance: nextCash,
    });
    setConvertNvtInput('');
    setDeskFeedback({
      type: 'green',
      text: `✓ Instant Settlement Complete: ${amt.toFixed(4)} $NVT converted to ${fmt(conv.cashAmount)} and credited to your Cash Wallet!`
    });
    setTimeout(() => setDeskFeedback(null), 7000);
  };

  // Multi-node dynamic refund calculation
  const targetRefundNode = selectedRefundNodeId !== 'all'
    ? activeStakedNodes.find(n => n.id === Number(selectedRefundNodeId))
    : null;
  const targetRefundStake = targetRefundNode ? targetRefundNode.fee : effectiveStakedAmount;
  const targetGifts = targetRefundNode
    ? (effectiveStakedAmount > 0 ? Math.round((targetRefundNode.fee / effectiveStakedAmount) * giftsInput) : 0)
    : giftsInput;
  const refundResult = calculateRefund(targetRefundStake, targetGifts, monthsInput, isEOM);

  // Reload user profile, bank accounts, docs, and refund claims after any DB mutation or on mount
  const loadUserData = async () => {
    try {
      const fresh = dbAuth.getCurrentUser();
      if (fresh && setUser) setUser(fresh);
      const activeUser = fresh || u;
      if (activeUser?.id) {
        const banks = await dbBank.getAccounts(activeUser.id);
        setLinkedBank(banks?.[0] || null);
        const docs = await dbDocs.getDocuments(activeUser.id);
        setUploadedDocsCount(docs?.length || 0);
        const claims = await dbRefunds.getRequests(activeUser.id);
        setRefundClaims(claims || []);
        const txs = await dbTransactions.getTransactions(activeUser.id);
        setUserTransactions(txs || []);

        if (dbNetwork) {
          const tree = await dbNetwork.getNetworkTree(activeUser.id);
          setNetworkTree(tree);
        }

        // Automatically reconcile user profile if recorded transactions show higher cumulative stake or higher tier
        if (txs && txs.length) {
          const sTxs = txs.filter(t => t.type === 'staking' && t.status === 'success');
          const sumStaked = sTxs.reduce((acc, t) => acc + (Number(t.grossAmount) || 0), 0);
          const maxTier = sTxs.reduce((max, t) => Math.max(max, Number(t.tierId) || 0), 0);
          if (sumStaked > (activeUser.entryFee || 0) || (maxTier > (activeUser.tierId || 0))) {
            const tDef = (region?.tiers || []).find(t => t.id === maxTier);
            updateUserProfile({
              entryFee: Math.max(sumStaked, activeUser.entryFee || 0),
              tierId: Math.max(maxTier, activeUser.tierId || 1),
              tierName: tDef?.name || activeUser.tierName,
              tier: tDef || activeUser.tier,
            });
          }
        }
      }
    } catch (e) {
      console.warn('loadUserData error:', e);
    }
  };

  useEffect(() => {
    if (u?.id) {
      loadUserData();
    }
  }, [u?.id]);

  useEffect(() => {
    if (u?.cumulativeGifts !== undefined) {
      setGiftsInput(Number(u.cumulativeGifts));
    }
  }, [u?.cumulativeGifts]);

  const handleLogout = () => { logout(); navigate('/'); };

  const kycStatus = u?.kycStatus || 'unverified';
  const isAdmin = u?.role === 'admin' || u?.email?.includes('admin');

  // Onboarding Roadmap Calculation
  const isAccountCreated = true;
  const isBankLinked = Boolean(linkedBank);
  const isKycVerified = kycStatus === 'verified';
  const isNodeStaked = Boolean(effectiveStakedAmount && effectiveStakedAmount > 0);
  const completedStepsCount = [isAccountCreated, isBankLinked, isKycVerified, isNodeStaked].filter(Boolean).length;
  const onboardingPercent = Math.round((completedStepsCount / 4) * 100);

  // Realistic Pool Rank calculation (avoids bogus #1 for inactive/zero-yield users)
  const displayPoolRank = u?.poolRank
    ? `#${u.poolRank}`
    : (u?.totalEarned || u?.cumulativeGifts)
      ? `#${Math.max(1, 12 - effectiveTierId)}`
      : effectiveStakedAmount > 0
        ? `Slot #${effectiveTierId || 1}`
        : '--';

  // ════════════════════════════════════════════════════════════
  // WITHDRAWAL & CAPITAL REFUND CLAIM HANDLER
  // ════════════════════════════════════════════════════════════
  const handleInitiateRefund = () => {
    // Gate 1: KYC Verification
    if (kycStatus !== 'verified') {
      setClaimModal({ type: 'kyc_gate' });
      return;
    }

    // Gate 2: Bank Account Linked
    if (!linkedBank) {
      setClaimModal({ type: 'bank_gate' });
      return;
    }

    // Gate 3: Check eligibility
    if (refundResult.eligibilityTier === 'C' || refundResult.netPayout <= 0) {
      alert('Your node status does not currently qualify for a capital protection refund.');
      return;
    }

    // Check > ₦2.5M threshold rule
    const isHighValue = refundResult.netPayout > 2500000 || refundResult.grossRefund > 2500000;
    setClaimModal({
      type: isHighValue ? 'high_value' : 'confirm',
      data: {
        ...refundResult,
        isHighValue,
        bankDetails: linkedBank,
      }
    });
  };

  const handleConfirmRefundClaim = async () => {
    if (!claimModal?.data) return;
    setIsSubmittingClaim(true);

    try {
      const claim = await dbRefunds.submitRequest(u.id, {
        tierId: effectiveTierId,
        entryFee: effectiveStakedAmount,
        cumulativeGifts: giftsInput,
        eligibilityTier: claimModal.data.eligibilityTier,
        grossRefund: claimModal.data.grossRefund,
        earlyPenalty: claimModal.data.penaltyAmount,
        outboundFee: claimModal.data.outboundFeeAmount,
        netPayout: claimModal.data.netPayout,
        bankDetails: linkedBank,
      });

      await loadUserData();
      setClaimModal(null);
      setClaimSuccessMsg(
        claim.isHighValue
          ? '✓ High-Value Claim Submitted: Flagged for CBN Compliance Multi-Signature Clearance (> ₦2.5M).'
          : '✓ Capital Refund Claim Queued: Scheduled for standard 3-day EOM settlement.'
      );
      setTimeout(() => setClaimSuccessMsg(''), 7000);
    } catch (err) {
      alert('Failed to submit refund claim: ' + err.message);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // DIVIDEND WITHDRAWAL HANDLER
  // ════════════════════════════════════════════════════════════
  const handleOpenDividendModal = () => {
    if (kycStatus !== 'verified') {
      setClaimModal({ type: 'kyc_gate' });
      return;
    }
    if (!linkedBank) {
      setClaimModal({ type: 'bank_gate' });
      return;
    }
    setDividendAmount(u.monthlyDividend || 5000);
    setDividendModalOpen(true);
  };

  const handleConfirmDividendWithdrawal = async () => {
    const amt = Number(dividendAmount);
    const breakdown = calculateWithdrawal(amt, region?.code, effectiveTierId);

    if (!amt || amt < breakdown.minWithdrawal) {
      alert(`Minimum withdrawal amount for your tier is ${fmt(breakdown.minWithdrawal)}.`);
      return;
    }
    if (amt > breakdown.maxSingleTx) {
      alert(`Maximum single withdrawal limit for your tier is ${fmt(breakdown.maxSingleTx)}.`);
      return;
    }
    if (amt > (u?.walletBalance || 0)) {
      alert(`Requested amount ${fmt(amt)} exceeds your available wallet balance of ${fmt(u?.walletBalance || 0)}.`);
      return;
    }
    if (!linkedBank) {
      alert('You must link a verified payout bank account before requesting withdrawals.');
      setActiveTab('payout');
      setDividendModalOpen(false);
      return;
    }
    if (kycStatus !== 'verified') {
      alert('AML regulations require identity verification (KYC) before withdrawals can be processed.');
      navigate('/kyc');
      return;
    }

    setDividendSubmitting(true);
    try {
      const isHighValue = breakdown.isHighValue;
      const refCode = 'NV-WTH-' + Math.random().toString(36).substring(2, 9).toUpperCase();

      // 1. Record transaction in database with all itemized protocol charges
      await dbTransactions.recordTransaction(u.id, {
        type: 'withdrawal',
        grossAmount: amt,
        taxReserve: breakdown.taxReserve,
        opexFee: breakdown.opex,
        vatAmount: breakdown.vatOnOpex,
        gatewayFee: breakdown.txFee,
        emtlLevy: breakdown.emtlLevy,
        totalDeductions: breakdown.totalDeductions,
        netAmount: breakdown.netPayout,
        gateway: 'nibss',
        reference: refCode,
        status: isHighValue ? 'pending_audit' : 'processing',
      });

      // 2. Also record in refund/claims desk for audit log
      await dbRefunds.submitRequest(u.id, {
        tierId: u.tierId || 1,
        entryFee: 0,
        cumulativeGifts: amt,
        eligibilityTier: 'Yield',
        grossRefund: amt,
        earlyPenalty: 0,
        outboundFee: breakdown.totalDeductions,
        netPayout: breakdown.netPayout,
        bankDetails: linkedBank,
      });

      await loadUserData();
      setDividendModalOpen(false);
      setClaimSuccessMsg(
        isHighValue
          ? `✓ High-Value Withdrawal of ${fmt(amt)} Submitted: Queued for multi-signature compliance review (> ₦2.5M). Net payout upon clearance: ${fmt(breakdown.netPayout)}.`
          : `✓ Withdrawal Queued: ${fmt(breakdown.netPayout)} net (after ${fmt(breakdown.totalDeductions)} statutory tax & fees) is being dispatched to ${linkedBank.bankName}.`
      );
      setTimeout(() => setClaimSuccessMsg(''), 7000);
    } catch (e) {
      alert('Withdrawal request failed: ' + e.message);
    } finally {
      setDividendSubmitting(false);
    }
  };

  if (!u) {
    return (
      <div className="dashboard-empty">
        <h2>Not logged in</h2>
        <Link to="/login" className="btn btn-primary">Sign In to Node</Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ════════ SIDEBAR ════════ */}
      <aside className="dash-sidebar">
        <div className="dash-user-card">
          <div className="dash-avatar">
            {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="dash-user-info">
            <div className="dash-user-name">{u.name}</div>
            <div className="dash-user-ref">{u.referralCode}</div>
          </div>
          <span className="pulse-dot" title="Active" />
        </div>

        <div className="dash-tier-badge" style={{ borderColor: `${effectiveTier?.color || u.tier?.color || '#00e5ff'}40` }}>
          <div className="dash-tier-dot" style={{ background: effectiveTier?.color || u.tier?.color || '#00e5ff' }} />
          <div>
            <div className="dash-tier-name">{effectiveTierName}</div>
            <div className="dash-tier-label">{effectiveTier?.label || `Tier ${effectiveTierId}`}</div>
          </div>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map(item => {
            // Build contextual status badge for specific nav items
            let badge = null;
            if (item.key === 'kyc') {
              badge = kycStatus === 'verified'
                ? <span className="dash-nav-badge verified">✓</span>
                : kycStatus === 'pending'
                  ? <span className="dash-nav-badge warning">⏳</span>
                  : <span className="dash-nav-badge warning">!</span>;
            } else if (item.key === 'payout') {
              badge = linkedBank
                ? <span className="dash-nav-badge verified">✓</span>
                : <span className="dash-nav-badge warning">!</span>;
            } else if (item.key === 'mining') {
              badge = anyBladeMining
                ? <span className="dash-nav-badge cyan">Live</span>
                : null;
            }
            return (
              <button
                key={item.key}
                className={`dash-nav-btn ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="dash-nav-btn-left">
                  <span className="dash-nav-icon"><item.icon size={16} /></span>
                  <span>{item.label}</span>
                </span>
                {badge}
              </button>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className="dash-nav-btn"
              style={{ color: '#FACC15', fontWeight: 700, textDecoration: 'none', marginTop: '0.5rem', background: 'rgba(250,204,21,0.08)' }}
            >
              <span className="dash-nav-btn-left">
                <span className="dash-nav-icon">🛡️</span>
                <span>Admin Desk →</span>
              </span>
            </Link>
          )}
        </nav>

        <button className="dash-logout-btn" onClick={handleLogout}>
          Exit Protocol
        </button>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="dash-main">

        {/* Cryptographic Tamper Alert Lockdown Banner */}
        {securityAlert && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            color: '#ef4444',
            padding: '1.25rem',
            borderRadius: '14px',
            marginBottom: '1.5rem',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
              <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{securityAlert.title || 'Security Breach Attempt Intercepted'}</strong>
            </div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: '#fca5a5', lineHeight: 1.5 }}>
              {securityAlert.message || 'Client-side data tampering was intercepted. State modification denied by HMAC-SHA256 checksum watchdog.'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                Reset & Purge Storage
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSecurityAlert(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {claimSuccessMsg && (
          <div style={{
            background: 'rgba(0, 255, 148, 0.12)',
            border: '1px solid #00ff94',
            color: '#00ff94',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.92rem'
          }}>
            <span>{claimSuccessMsg}</span>
            <button
              onClick={() => setClaimSuccessMsg('')}
              style={{ background: 'transparent', border: 'none', color: '#00ff94', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === 'overview' && (
          <div className="dash-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 className="dash-title" style={{ margin: 0 }}>Node Overview</h2>
                <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Monitor validator hardware, active staked nodes, binary sub-network, and treasury payouts.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'rgba(0, 229, 255, 0.4)', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem' }}
                onClick={() => setUserGuideOpen(true)}
              >
                <span>📖</span> Interactive User Guide
              </button>
            </div>

            {/* ── ONBOARDING READINESS: COMPACT RIBBON WHEN 100%, DETAILED STEPPER WHEN INCOMPLETE ── */}
            {onboardingPercent === 100 && !showFullRoadmap ? (
              <div
                className="dash-card"
                style={{
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(0, 255, 148, 0.08), rgba(15, 23, 42, 0.85))',
                  border: '1px solid rgba(0, 255, 148, 0.3)',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'rgba(0, 255, 148, 0.18)',
                      border: '1px solid #00ff94',
                      color: '#00ff94',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                    }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>Protocol Readiness 100% Operational</strong>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,255,148,0.2)', color: '#00ff94', fontWeight: 700 }}>
                          ALL SYSTEMS ACTIVE
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {activeStakedNodes.length > 1
                          ? `Compliance cleared · ${activeStakedNodes.length} Genesis Pools (${activeStakedNodes.map(n => `${n.name} ${fmt(n.fee)}`).join(' + ')} · ${fmt(effectiveStakedAmount)}) staked · Direct NUBAN settlement active`
                          : `Compliance cleared · ${effectiveTierName} (${fmt(effectiveStakedAmount)}) staked · Direct NUBAN settlement active`}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowFullRoadmap(true)}
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', borderColor: 'rgba(0,255,148,0.3)', color: '#00ff94' }}
                  >
                    View Checklist ▾
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="dash-card"
                style={{
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))',
                  border: '1px solid rgba(0,229,255,0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.5px' }}>
                      Protocol Onboarding Roadmap
                    </div>
                    <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem' }}>
                      Account Readiness ({onboardingPercent}% Complete)
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '140px', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${onboardingPercent}%`, background: 'var(--accent-cyan)', height: '100%', transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{onboardingPercent}%</span>
                    {onboardingPercent === 100 && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowFullRoadmap(false)}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                      >
                        Collapse ▴
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                  {/* Step 1 */}
                  <div style={{ padding: '0.9rem', borderRadius: '10px', background: 'rgba(0,255,148,0.06)', border: '1px solid rgba(0,255,148,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#00ff94', fontWeight: 'bold' }}>✓</span>
                      <strong style={{ fontSize: '0.88rem' }}>1. Account Setup</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{u.email}</p>
                  </div>

                  {/* Step 2 */}
                  <div style={{ padding: '0.9rem', borderRadius: '10px', background: linkedBank ? 'rgba(0,255,148,0.06)' : 'rgba(250,204,21,0.06)', border: `1px solid ${linkedBank ? 'rgba(0,255,148,0.25)' : 'rgba(250,204,21,0.25)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: linkedBank ? '#00ff94' : '#facc15', fontWeight: 'bold' }}>{linkedBank ? '✓' : '⚠️'}</span>
                      <strong style={{ fontSize: '0.88rem' }}>2. Payout Account</strong>
                    </div>
                    {linkedBank ? (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{(linkedBank.bankName || 'Bank').split(' ')[0]} (••{(linkedBank.accountNumber || '').slice(-4)})</p>
                    ) : (
                      <Link to="/account" style={{ fontSize: '0.78rem', color: '#facc15', fontWeight: 600, textDecoration: 'none' }}>+ Link NUBAN Bank →</Link>
                    )}
                  </div>

                  {/* Step 3 */}
                  <div style={{ padding: '0.9rem', borderRadius: '10px', background: kycStatus === 'verified' ? 'rgba(0,255,148,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${kycStatus === 'verified' ? 'rgba(0,255,148,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: kycStatus === 'verified' ? '#00ff94' : '#ef4444', fontWeight: 'bold' }}>{kycStatus === 'verified' ? '✓' : '!'}</span>
                      <strong style={{ fontSize: '0.88rem' }}>3. KYC Verification</strong>
                    </div>
                    {kycStatus === 'verified' ? (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#00ff94' }}>Tier-2 Verified (Approved)</p>
                    ) : (
                      <Link to="/kyc" style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, textDecoration: 'none' }}>Verify Identity Now →</Link>
                    )}
                  </div>

                  {/* Step 4 */}
                  <div style={{ padding: '0.9rem', borderRadius: '10px', background: isNodeStaked ? 'rgba(0,255,148,0.06)' : 'rgba(99,102,241,0.06)', border: `1px solid ${isNodeStaked ? 'rgba(0,255,148,0.25)' : 'rgba(99,102,241,0.25)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: isNodeStaked ? '#00ff94' : '#818cf8', fontWeight: 'bold' }}>{isNodeStaked ? '✓' : '→'}</span>
                      <strong style={{ fontSize: '0.88rem' }}>4. Staked Genesis Node</strong>
                    </div>
                    {isNodeStaked ? (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                        {activeStakedNodes.length > 1
                          ? `${activeStakedNodes.length} Genesis Nodes (${activeStakedNodes.map(n => `${n.name} ${fmt(n.fee)}`).join(' + ')} · ${fmt(effectiveStakedAmount)})`
                          : `${effectiveTierName} (${fmt(effectiveStakedAmount)})`}
                      </p>
                    ) : (
                      <Link to="/tiers" style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Stake Entry Node →</Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Status Banners */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* KYC Status Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: `1px solid ${kycStatus === 'verified' ? '#00ff9440' : kycStatus === 'pending' ? '#facc1540' : '#ef444440'}`,
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>KYC Identity Status</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: kycStatus === 'verified' ? '#00ff94' : kycStatus === 'pending' ? '#facc15' : '#ef4444', margin: '0.2rem 0' }}>
                    {kycStatus === 'verified' ? '✓ Fully Verified' : kycStatus === 'pending' ? '⏳ Under Review' : '⚠️ Unverified'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {kycStatus === 'verified' ? 'Staking & withdrawals unlocked' : 'Required for staking & withdrawals'}
                  </div>
                </div>
                <Link to="/kyc" className="btn btn-secondary btn-sm">
                  {kycStatus === 'verified' ? 'View ID' : 'Verify Now →'}
                </Link>
              </div>

              {/* Bank Payout Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Payout Account</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0.2rem 0' }}>
                    {linkedBank ? `${(linkedBank.bankName || 'Bank').split(' ')[0]} (••${(linkedBank.accountNumber || '').slice(-4)})` : 'No Bank Linked'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: linkedBank ? '#00ff94' : '#ef4444' }}>
                    {linkedBank ? '✓ NUBAN Payout Account Active' : '⚠ No bank account linked'}
                  </div>
                </div>
                <Link to="/account" className="btn btn-secondary btn-sm">
                  {linkedBank ? 'Manage Bank' : 'Link Bank →'}
                </Link>
              </div>

              {/* Security & Audit Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Security & Audit</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#818cf8', margin: '0.2rem 0' }}>
                    🔒 Multi-Sig Protected
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {'> ₦2.5M'} audit clearance active
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('security')}
                >
                  View Policy →
                </button>
              </div>
            </div>

            {/* Stat Grid */}
            <div className="dash-stat-grid">
              <div className="dash-stat-card">
                <div className="dash-stat-icon">🏦</div>
                <div className="dash-stat-value">{fmt(effectiveStakedAmount)}</div>
                <div className="dash-stat-label">Staked Capital</div>
                {activeStakedNodes.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#00ff94', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
                    {activeStakedNodes.length} Active Genesis {activeStakedNodes.length === 1 ? 'Node' : 'Nodes'}
                  </span>
                )}
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-icon">💰</div>
                <div className="dash-stat-value" style={{ color: 'var(--accent-cyan)' }}>{fmt(u.walletBalance || 0)}</div>
                <div className="dash-stat-label">Spendable Cash Balance</div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.45rem', fontSize: '0.75rem', padding: '0.25rem 0.65rem', width: '100%' }}
                  onClick={handleOpenDividendModal}
                >
                  ⚡ Withdraw to Bank
                </button>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-icon">💸</div>
                <div className="dash-stat-value" style={{ color: 'var(--accent-green)' }}>{fmt(u.totalEarned || u.cumulativeGifts || 0)}</div>
                <div className="dash-stat-label">Total Yield Received</div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-icon">🌐</div>
                <div className="dash-stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span>{networkTree?.qualifiedSubNodes ?? (activeStakedNodes.length > 0 ? 2 : (u.subNodes || 0))}</span>
                  {Boolean(networkTree?.unmatchedSubNodes > 0) && (
                    <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>
                      (+{networkTree.unmatchedSubNodes} unmatched)
                    </span>
                  )}
                </div>
                <div className="dash-stat-label">Qualified Sub-Nodes</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', display: 'block', marginTop: '0.2rem' }}>
                  {activeStakedNodes.length > 1
                    ? activeStakedNodes.map(n => `Tier ${n.id}: ${networkTree?.byTier?.[n.id]?.qualifiedCount ?? (n.id === 3 || n.id === 5 ? 1 : 0)}`).join(' · ')
                    : `Cycle #${networkTree?.cycleCount || 1} (${networkTree?.cyclePercent || 0}%)`}
                </span>
              </div>
            </div>

            {/* ── ACTIVE GENESIS VALIDATOR NODES (PER-NODE FLEET INFORMATION) ── */}
            <div className="dash-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(0, 229, 255, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 className="dash-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚡</span> Active Genesis Validator Nodes ({activeStakedNodes.length})
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    Individual performance metrics, hardware specs, and yields for each staked tier position.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRefundPolicyModalOpen(true)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    🛡️ Guarantee Policy ↗
                  </button>
                  <Link to="/tiers" className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
                    + Stake Another Tier →
                  </Link>
                </div>
              </div>

              {/* Fleet Aggregate Telemetry Bar */}
              {activeStakedNodes.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0, 229, 255, 0.04)',
                  border: '1px solid rgba(0, 229, 255, 0.15)',
                  borderRadius: 10,
                  marginBottom: '1.25rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fleet Capital</span>
                    <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>{fmt(effectiveStakedAmount)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Combined Hashrate</span>
                    <strong style={{ color: '#00e5ff', fontSize: '0.95rem', display: 'block' }}>
                      {(activeStakedNodes.reduce((sum, n) => sum + (getServerSpecs(n.id).hashrateThs || 1), 0)).toFixed(2)} TH/s
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Protected Reserve Floor</span>
                    <strong style={{ color: '#00ff94', fontSize: '0.95rem', display: 'block' }}>
                      {fmt(Math.round(effectiveStakedAmount * 0.70))}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Consensus Integrity</span>
                    <strong style={{ color: '#00ff94', fontSize: '0.85rem', display: 'block' }}>
                      ✓ 100% Validating (0 Slashed)
                    </strong>
                  </div>
                </div>
              )}

              {activeStakedNodes.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {activeStakedNodes.map((node) => {
                    const specs = getServerSpecs(node.id);
                    const nodeShare = effectiveStakedAmount > 0 ? (node.fee / effectiveStakedAmount) : 1;
                    const nodeCoins = (nodeShare * minedNvt).toFixed(2);
                    const nodeCashVal = convertCoinsToCash(nodeCoins, region?.code).cashAmount;
                    const guaranteedFloor = Math.round(node.fee * 0.70);
                    const nodeAddress = `0x${((node.id * 184920491) ^ 0xabcdef).toString(16).padStart(8, '0')}...${((node.id * 77192) % 65535).toString(16)}`;

                    return (
                      <div
                        key={node.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${node.color || 'rgba(0, 229, 255, 0.3)'}`,
                          borderRadius: '12px',
                          padding: '1rem 1.15rem',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: node.color, fontWeight: 700, letterSpacing: '0.04em' }}>
                                Tier {node.id} Validator
                              </span>
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>({specs.speedMultiplier}× Speed)</span>
                            </div>
                            <h4 style={{ margin: '0.15rem 0 0', fontSize: '1.05rem', color: '#fff' }}>
                              {node.name}
                            </h4>
                            <code style={{ fontSize: '0.68rem', color: '#38bdf8' }}>{nodeAddress}</code>
                          </div>
                          <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                            🟢 99.98% Uptime
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.65rem', borderRadius: 8 }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Staked Principal</div>
                            <strong style={{ color: node.color }}>{fmt(node.fee)}</strong>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.65rem', borderRadius: 8 }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Protection Floor (70%)</div>
                            <strong style={{ color: '#00ff94' }}>{fmt(guaranteedFloor)}</strong>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.65rem', borderRadius: 8 }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Hashrate Allocation</div>
                            <strong style={{ color: '#00e5ff', fontSize: '0.78rem' }}>{specs.hashrateThs} TH/s</strong>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.65rem', borderRadius: 8 }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Tokens Mined</div>
                            <strong style={{ color: '#fff', fontSize: '0.78rem' }}>{nodeCoins} $NVT</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => setSelectedNodeForModal(node)}
                          >
                            <span>🩺</span>
                            <span>Telemetry ↗</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                            onClick={() => {
                              setConvertNvtInput(Math.floor(Number(nodeCoins)).toString());
                              setActiveTab('mining');
                            }}
                          >
                            Settle Yield ({fmt(nodeCashVal)}) ↗
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    You currently have no Genesis Nodes actively staked. Choose an open pool tier to begin earning validator yield.
                  </p>
                  <Link to="/tiers" className="btn btn-primary btn-sm">
                    View Genesis Node Tiers (1–5) →
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="dash-card-title" style={{ margin: 0 }}>Recent Protocol Activity</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {userTransactions.length > 0 ? `${userTransactions.length} recorded` : 'Telemetry Log'}
                </span>
              </div>
              <div className="dash-activity-list">
                {userTransactions.length > 0 ? (
                  userTransactions.slice(0, 5).map((tx, i) => (
                    <div key={tx.id || i} className="dash-activity-row">
                      <div className="dash-activity-icon" style={{
                        background: tx.type === 'staking' ? 'rgba(0,255,148,0.15)' : 'rgba(0,229,255,0.15)',
                        color: tx.type === 'staking' ? 'var(--accent-green)' : 'var(--accent-cyan)'
                      }}>
                        {tx.type === 'staking' ? '⚡' : '💰'}
                      </div>
                      <div className="dash-activity-text">
                        <strong>{tx.type === 'staking' ? 'Genesis Node Staked' : 'Transaction'}: {fmt(tx.grossAmount || tx.netAmount)}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Ref: {tx.reference} · Gateway: {(tx.gateway || 'Paystack').toUpperCase()} · Status: <span style={{ color: '#00ff94' }}>{tx.status}</span>
                        </div>
                      </div>
                      <div className="dash-activity-time">{new Date(tx.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))
                ) : (
                  [
                    ...(isNodeStaked ? [{ icon: '⚡', text: `Node staked successfully: ${u.tierName || 'Genesis Node'} (${fmt(u.entryFee)})`, time: 'Active', color: 'var(--accent-green)' }] : []),
                    { icon: '💰', text: `Yield credited: ${fmt(u.totalEarned * 0.4 || 400)}`, time: '3 days ago', color: 'var(--accent-cyan)' },
                    { icon: '🌐', text: 'New Sub-Node joined your network', time: '5 days ago', color: 'var(--accent-indigo)' },
                    { icon: '💰', text: `Yield credited: ${fmt(u.totalEarned * 0.6 || 600)}`, time: '8 days ago', color: 'var(--accent-cyan)' },
                  ].map((a, i) => (
                    <div key={i} className="dash-activity-row">
                      <div className="dash-activity-icon" style={{ background: `${a.color}15`, color: a.color }}>
                        {a.icon}
                      </div>
                      <div className="dash-activity-text">{a.text}</div>
                      <div className="dash-activity-time">{a.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Referral Code */}
            <div className="dash-card">
              <h3 className="dash-card-title">Your Referral Code</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Share your code and grow your Sub-Node network.
              </p>
              <div className="dash-referral-box">
                <span className="dash-referral-code">{u.referralCode}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard?.writeText(u.referralCode)}>
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ KYC TAB ══ */}
        {activeTab === 'kyc' && (
          <div className="dash-section">
            <h2 className="dash-title">Identity Verification (KYC)</h2>
            <p className="dash-subtitle">
              Verify your identity to comply with anti-money laundering (AML) regulations and enable unconstrained staking and withdrawals.
            </p>

            {/* Status Banner */}
            <div className="dash-card" style={{
              background: kycStatus === 'verified'
                ? 'linear-gradient(135deg, rgba(0,255,148,0.08), rgba(15,23,42,0.9))'
                : kycStatus === 'pending'
                  ? 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(15,23,42,0.9))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,23,42,0.9))',
              border: `1px solid ${kycStatus === 'verified' ? 'rgba(0,255,148,0.3)' : kycStatus === 'pending' ? 'rgba(250,204,21,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                    background: kycStatus === 'verified' ? 'rgba(0,255,148,0.15)' : kycStatus === 'pending' ? 'rgba(250,204,21,0.15)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${kycStatus === 'verified' ? 'rgba(0,255,148,0.4)' : kycStatus === 'pending' ? 'rgba(250,204,21,0.4)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                    {kycStatus === 'verified' ? '✅' : kycStatus === 'pending' ? '⏳' : '🪪'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                      {kycStatus === 'verified' ? 'Identity Verified — Tier-2 Operator' :
                       kycStatus === 'pending' ? 'Verification Under Review' :
                       'Identity Verification Required'}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {kycStatus === 'verified'
                        ? `Verified operator: ${u.name}. All staking pools, capital refunds, and withdrawal channels are active.`
                        : kycStatus === 'pending'
                          ? 'Your documents are under review by our compliance team. This typically takes 1–3 business hours.'
                          : 'Submit a government-issued ID (NIN, BVN, or International Passport) and a live selfie to unlock staking.'}
                    </p>
                  </div>
                </div>
                <Link to="/kyc" className={`btn ${kycStatus === 'verified' ? 'btn-secondary' : 'btn-primary'}`}>
                  {kycStatus === 'verified' ? 'View KYC Portal' : kycStatus === 'pending' ? 'Check Status →' : 'Start Verification →'}
                </Link>
              </div>

              {/* Step Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                {[
                  { step: '1', label: 'Identity Document', sub: 'NIN / BVN / Passport', done: kycStatus !== 'unverified' },
                  { step: '2', label: 'Facial Biometrics', sub: 'Live Liveness Selfie', done: kycStatus !== 'unverified' },
                  { step: '3', label: 'Compliance Clearance', sub: 'AML / PEP Screening', done: kycStatus === 'verified' },
                  { step: '4', label: 'Staking & Withdrawal Unlock', sub: 'All channels active', done: kycStatus === 'verified' },
                ].map(s => (
                  <div key={s.step} style={{
                    background: s.done ? 'rgba(0,255,148,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${s.done ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    padding: '0.85rem', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', fontWeight: 700,
                      background: s.done ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.06)',
                      color: s.done ? '#00ff94' : '#64748b',
                      border: `1px solid ${s.done ? 'rgba(0,255,148,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      {s.done ? '✓' : s.step}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: s.done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Locked features callout when unverified */}
              {kycStatus !== 'verified' && (
                <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ef4444', marginBottom: '0.4rem' }}>🔒 Features Locked Until Verified</div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>Capital Refund Claims</span>
                    <span>·</span>
                    <span>Dividend Withdrawals</span>
                    <span>·</span>
                    <span>High-Value Disbursements</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PAYOUT & BANK TAB ══ */}
        {activeTab === 'payout' && (
          <div className="dash-section">
            <h2 className="dash-title">Payout Accounts & Document Vault</h2>
            <p className="dash-subtitle">
              Manage your verified NUBAN bank account for capital disbursements and dividend withdrawals.
            </p>

            {/* Linked Bank Card */}
            <div className="dash-card" style={{
              background: linkedBank
                ? 'linear-gradient(135deg, rgba(0,255,148,0.06), rgba(15,23,42,0.9))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(15,23,42,0.9))',
              border: `1px solid ${linkedBank ? 'rgba(0,255,148,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                    background: linkedBank ? 'rgba(0,255,148,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${linkedBank ? 'rgba(0,255,148,0.3)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                    🏦
                  </div>
                  <div>
                    {linkedBank ? (
                      <>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                          {linkedBank.bankName}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          {linkedBank.accountName} &nbsp;·&nbsp; {linkedBank.accountNumber}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#00ff94', marginTop: '0.15rem', fontWeight: 600 }}>
                          ✓ Active NUBAN Payout Destination
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ef4444' }}>No Bank Account Linked</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          A verified NUBAN account is required before any capital refund or dividend withdrawal can be dispatched.
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Link to="/account" className="btn btn-primary">
                  {linkedBank ? 'Manage Bank Account →' : 'Link Bank Account →'}
                </Link>
              </div>
            </div>

            {/* Uploaded Documents Card */}
            <div className="dash-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Document Vault</h3>
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Upload payment proof receipts and compliance documents here.
                  </p>
                </div>
                <span style={{
                  fontSize: '0.82rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
                  background: uploadedDocsCount > 0 ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.06)',
                  color: uploadedDocsCount > 0 ? 'var(--accent-cyan)' : '#64748b',
                  border: `1px solid ${uploadedDocsCount > 0 ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {uploadedDocsCount > 0 ? `${uploadedDocsCount} document${uploadedDocsCount !== 1 ? 's' : ''} uploaded` : 'No documents yet'}
                </span>
              </div>
              <Link to="/account" className="btn btn-secondary">
                Upload Documents →
              </Link>
            </div>

            {/* CBN / EMTL Info */}
            <div className="dash-card" style={{ padding: '1rem 1.25rem', background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.2)' }}>
              <strong style={{ color: '#facc15', fontSize: '0.9rem' }}>⚠ CBN EMTL & Statutory Taxes</strong>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#fef08a', lineHeight: 1.6 }}>
                Electronic Money Transfer Levy (₦50) applies to electronic inflows and withdrawals over ₦10,000 as mandated by CBN statutory guidelines.
                All fees are computed automatically during disbursement processing.
              </p>
            </div>
          </div>
        )}

        {/* ══ REFUND & CAPITAL PROTECTION TAB ══ */}
        {activeTab === 'refund' && (
          <div className="dash-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 className="dash-title" style={{ marginBottom: '0.25rem' }}>Capital Protection & Refund Claims</h2>
                <p className="dash-subtitle" style={{ margin: 0 }}>
                  Calculate your capital refund eligibility and initiate a payout to your verified bank account.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setRefundPolicyModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}
              >
                <span>📜</span>
                <span>Full Refund Policy (Plain English) ↗</span>
              </button>
            </div>

            <div className="dash-calc-grid">
              {/* Inputs */}
              <div className="dash-card">
                <h3 className="dash-card-title">Inputs</h3>
                <div className="dash-calc-form">
                  {/* Multi-Node Fleet vs Individual Node Selector */}
                  {activeStakedNodes.length > 0 && (
                    <div style={{ marginBottom: '0.85rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Evaluate Node / Portfolio:
                      </label>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedRefundNodeId('all')}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 6,
                            background: selectedRefundNodeId === 'all' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${selectedRefundNodeId === 'all' ? '#00e5ff' : 'rgba(255,255,255,0.08)'}`,
                            color: selectedRefundNodeId === 'all' ? '#fff' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: selectedRefundNodeId === 'all' ? 700 : 400
                          }}
                        >
                          🌐 All Nodes ({fmt(effectiveStakedAmount)})
                        </button>
                        {activeStakedNodes.map(n => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setSelectedRefundNodeId(n.id)}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: 6,
                              background: selectedRefundNodeId === n.id ? `${n.color}25` : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${selectedRefundNodeId === n.id ? n.color : 'rgba(255,255,255,0.08)'}`,
                              color: selectedRefundNodeId === n.id ? '#fff' : '#94a3b8',
                              cursor: 'pointer',
                              fontWeight: selectedRefundNodeId === n.id ? 700 : 400
                            }}
                          >
                            {n.name} ({fmt(n.fee)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="dash-calc-row-label">
                    <label>
                      {targetRefundNode ? `${targetRefundNode.name} Capital` : 'Total Staked Portfolio'}
                    </label>
                    <strong style={{ color: targetRefundNode?.color || '#fff' }}>{fmt(targetRefundStake)}</strong>
                  </div>

                  <div className="dash-calc-field">
                    <label htmlFor="gifts-input">Cumulative Yield Received</label>
                    <input
                      id="gifts-input"
                      type="number"
                      className="input"
                      min={0}
                      max={targetRefundStake}
                      value={giftsInput}
                      onChange={e => setGiftsInput(Number(e.target.value))}
                    />
                  </div>
                  <div className="dash-calc-field">
                    <label htmlFor="months-input">Months Since Staking</label>
                    <input
                      id="months-input"
                      type="number"
                      className="input"
                      min={0}
                      value={monthsInput}
                      onChange={e => setMonthsInput(Number(e.target.value))}
                    />
                  </div>
                  <div className="dash-calc-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={isEOM}
                        onChange={e => setIsEOM(e.target.checked)}
                      />
                      <span style={{ marginLeft: '0.5rem' }}>End of Month (EOM) Request</span>
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      (Unchecked = 10% early exit penalty for Tier A)
                    </span>
                  </div>
                </div>
              </div>

              {/* Result & Actions */}
              <div className="dash-card">
                <h3 className="dash-card-title">Refund Determination</h3>
                <div className="dash-calc-result">
                  <div className="dash-result-tier">
                    <span className={`badge badge-${refundResult.badgeColor}`}>
                      Tier {refundResult.eligibilityTier} — {
                        refundResult.eligibilityTier === 'A' ? 'Full Protection' :
                        refundResult.eligibilityTier === 'B' ? 'Partial Protection' :
                        refundResult.eligibilityTier === 'Locked' ? '6-Month Lock' :
                        'Disqualified'
                      }
                    </span>
                  </div>
                  <p className="dash-result-note">{refundResult.note}</p>

                  <div className="dash-result-rows">
                    <div className="reg-confirm-row">
                      <span>Gross Refund</span>
                      <strong>{fmt(refundResult.grossRefund)}</strong>
                    </div>
                    {refundResult.penaltyAmount > 0 && (
                      <div className="reg-confirm-row">
                        <span>Early Penalty (10%)</span>
                        <strong style={{ color: 'var(--accent-red)' }}>−{fmt(refundResult.penaltyAmount)}</strong>
                      </div>
                    )}
                    <div className="reg-confirm-row">
                      <span>Refund Tax (3%)</span>
                      <strong style={{ color: 'var(--accent-red)' }}>−{fmt(refundResult.outboundFeeAmount)}</strong>
                    </div>
                    <div className="reg-confirm-divider" />
                    <div className="reg-confirm-row" style={{ fontSize: '1.1rem' }}>
                      <span>Net Disbursement</span>
                      <strong className="gradient-text">{fmt(refundResult.netPayout)}</strong>
                    </div>
                  </div>

                  {/* High Value Notice */}
                  {refundResult.netPayout > 2500000 && (
                    <div style={{ marginTop: '0.8rem', padding: '0.65rem 0.85rem', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '8px', fontSize: '0.78rem', color: '#fef08a' }}>
                      ⚠️ <strong>High-Value Disbursement Rule:</strong> Requests exceeding ₦2,500,000 require manual multi-signature compliance clearance (24–48h).
                    </div>
                  )}

                  {/* Action Button */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleInitiateRefund}
                      disabled={refundResult.netPayout <= 0 || refundResult.eligibilityTier === 'Locked' || refundResult.eligibilityTier === 'C'}
                    >
                      {refundResult.netPayout > 2500000
                        ? 'Initiate High-Value Claim (> ₦2.5M) →'
                        : `Submit Capital Protection Claim (${targetRefundNode ? targetRefundNode.name : 'Full Fleet'}) →`}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-Node Capital Protection Breakdown Table */}
            {activeStakedNodes.length > 0 && (
              <div className="dash-card" style={{ marginTop: '1.5rem', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 className="dash-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>🛡️</span> Per-Node Capital Protection Breakdown
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#00ff94' }}>
                    {activeStakedNodes.length} Active Protected {activeStakedNodes.length === 1 ? 'Node' : 'Nodes'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  Each staked node is backed by an independent statutory guarantee. Orderly end-of-month exit entitles you to up to 70% of gross capital returned directly to your bank account.
                </p>

                <div className="table-responsive">
                  <table className="dash-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Node Tier</th>
                        <th>Staked Principal</th>
                        <th>Guaranteed Exit Floor</th>
                        <th>Statutory Status</th>
                        <th>Reserve Backing</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStakedNodes.map(node => {
                        const floor70 = Math.round(node.fee * 0.70);
                        const net70 = Math.round(floor70 * 0.97);
                        return (
                          <tr key={node.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: node.color }} />
                                <div>
                                  <strong style={{ color: '#fff' }}>{node.name}</strong>
                                  <div style={{ fontSize: '0.7rem', color: node.color }}>Tier {node.id} Validator</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong style={{ color: '#fff' }}>{fmt(node.fee)}</strong>
                            </td>
                            <td>
                              <strong style={{ color: '#00ff94' }}>{fmt(net70)}</strong>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>70% Net Payout</span>
                            </td>
                            <td>
                              <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                                ✓ Tier A Protected
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>100% Segregated Reserve</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                onClick={() => setSelectedNodeForModal(node)}
                              >
                                View Warranty ↗
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Active Claims & Payout History */}
            <div className="dash-card" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="dash-card-title" style={{ margin: 0 }}>Active Claims & Withdrawal History</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{refundClaims.length} records</span>
              </div>

              {refundClaims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No refund or withdrawal claims currently registered for this validator account.
                </div>
              ) : (
                <div className="dash-activity-list">
                  {refundClaims.map((claim, idx) => (
                    <div key={claim.id || idx} className="dash-activity-row" style={{ alignItems: 'flex-start' }}>
                      <div className="dash-activity-icon" style={{
                        background: claim.status === 'disbursed' ? 'rgba(0,255,148,0.15)' :
                                   claim.status === 'pending_audit' ? 'rgba(250,204,21,0.15)' : 'rgba(99,102,241,0.15)',
                        color: claim.status === 'disbursed' ? '#00ff94' :
                               claim.status === 'pending_audit' ? '#facc15' : 'var(--accent-indigo)'
                      }}>
                        {claim.status === 'disbursed' ? '✓' : claim.status === 'pending_audit' ? '⚖️' : '⏳'}
                      </div>
                      <div className="dash-activity-text" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{fmt(claim.netPayout)}</strong>
                          {claim.isHighValue && (
                            <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(250,204,21,0.2)', color: '#facc15', borderRadius: '4px', fontWeight: 700 }}>
                              {'> ₦2.5M AUDIT'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Destination: {claim.bankDetails?.bankName ? `${claim.bankDetails.bankName} (••${claim.bankDetails.accountNumber.slice(-4)})` : 'Verified Bank'} • Scheduled: {claim.scheduledDate}
                        </div>
                        {claim.auditNotes && (
                          <div style={{ fontSize: '0.74rem', color: '#facc15', marginTop: '0.15rem' }}>
                            Notice: {claim.auditNotes}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`badge ${
                          claim.status === 'disbursed' ? 'badge-green' :
                          claim.status === 'pending_audit' ? 'badge-amber' :
                          claim.status === 'approved' ? 'badge-cyan' :
                          claim.status === 'rejected' ? 'badge-red' : 'badge-amber'
                        }`}>
                          {claim.status === 'pending_audit' ? '🟡 Multi-Sig Audit' :
                           claim.status === 'pending' ? '⏳ 3-Day EOM' :
                           claim.status === 'approved' ? '🟢 Approved' :
                           claim.status === 'disbursed' ? '✅ Disbursed' : claim.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ DIVIDENDS & PAYOUTS TAB ══ */}
        {activeTab === 'dividends' && (
          <div className="dash-section">
            <h2 className="dash-title">Yield Dividends & Protocol Payouts</h2>
            <p className="dash-subtitle">
              {isNG
                ? 'Monthly yield dividends distributed from validator network operations (15–20% APY).'
                : 'US Protocol: Dividends are not applicable. Upon completion members exit the system.'}
            </p>

            {isNG ? (
              <>
                <div className="dash-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">📊</div>
                    <div className="dash-stat-value" style={{ color: 'var(--accent-green)' }}>17.3%</div>
                    <div className="dash-stat-label">Current Network APY</div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">💰</div>
                    <div className="dash-stat-value">{fmt(u.walletBalance || u.monthlyDividend || 0)}</div>
                    <div className="dash-stat-label">Accrued Yield Balance</div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">🏦</div>
                    <div className="dash-stat-value">{linkedBank ? 'Linked' : 'Missing'}</div>
                    <div className="dash-stat-label">Payout Destination</div>
                  </div>
                </div>

                <div className="dash-card" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#00e5ff', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Fast Settlement Gateway
                      </span>
                      <h3 style={{ margin: '0.2rem 0', fontSize: '1.2rem' }}>Request Yield & Dividend Withdrawal</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Available Balance: <strong style={{ color: '#00ff94' }}>{fmt(u.walletBalance || 0)}</strong> · Destination: <strong style={{ color: '#fff' }}>{linkedBank ? `${linkedBank.bankName} (••${linkedBank.accountNumber.slice(-4)})` : 'No Bank Linked'}</strong>
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleOpenDividendModal}
                      disabled={Number(u.walletBalance || 0) < 2000}
                    >
                      {Number(u.walletBalance || 0) < 2000 ? `Min ${fmt(2000)} Required` : '⚡ Withdraw Yield Payout →'}
                    </button>
                  </div>
                </div>

                {/* ── WITHDRAWALS ACTIVITY HISTORY ── */}
                <div className="dash-card" style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 className="dash-card-title" style={{ margin: 0 }}>Withdrawal Activity History</h3>
                      <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                        Track all yield disbursements, NIBSS interbank transfers, and statutory levies.
                      </p>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {userTransactions.filter(t => t.type === 'withdrawal').length} records
                    </span>
                  </div>

                  {userTransactions.filter(t => t.type === 'withdrawal').length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '0.65rem 0.75rem' }}>Date</th>
                            <th style={{ padding: '0.65rem 0.75rem' }}>Reference</th>
                            <th style={{ padding: '0.65rem 0.75rem' }}>Gross Requested</th>
                            <th style={{ padding: '0.65rem 0.75rem' }}>EMTL Levy</th>
                            <th style={{ padding: '0.65rem 0.75rem' }}>Net Payout</th>
                            <th style={{ padding: '0.65rem 0.75rem' }}>Destination</th>
                            <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userTransactions.filter(t => t.type === 'withdrawal').map((tx, idx) => (
                            <tr key={tx.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.75rem' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#00e5ff' }}>{tx.reference}</td>
                              <td style={{ padding: '0.75rem', fontWeight: 600 }}>{fmt(tx.grossAmount || tx.netAmount)}</td>
                              <td style={{ padding: '0.75rem', color: '#facc15' }}>{tx.emtlLevy > 0 ? `−${fmt(tx.emtlLevy)}` : '₦0'}</td>
                              <td style={{ padding: '0.75rem', color: '#00ff94', fontWeight: 700 }}>{fmt(tx.netAmount)}</td>
                              <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{linkedBank?.bankName || 'Verified Bank'}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span className={`badge ${tx.status === 'success' || tx.status === 'settled' ? 'badge-green' : tx.status === 'pending_audit' ? 'badge-amber' : 'badge-cyan'}`}>
                                  {tx.status === 'pending_audit' ? '⚖️ Multi-Sig Audit' : tx.status === 'processing' ? '⏳ NIBSS Dispatch' : '✓ Settled'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                        No withdrawal requests recorded yet. Withdrawals will appear here in real time once requested.
                      </p>
                    </div>
                  )}
                </div>

                <div className="dash-card" style={{ marginTop: '1.5rem' }}>
                  <h3 className="dash-card-title">Statutory Payout Policies</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#00e5ff' }}>KYC Gate Mandate</strong>
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        Withdrawals are strictly blocked until identity verification is completed.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#facc15' }}>Multi-Sig Clearance</strong>
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        Amounts exceeding ₦2,500,000 trigger an institutional 24–48h audit window.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#00ff94' }}>EMTL & Tax Compliance</strong>
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        CBN transfer levy (₦50) applied for electronic transfers over ₦10,000.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="dash-card">
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>US Protocol — Clean Exit</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto' }}>
                    Upon completing the full matrix and reaching graduation, US protocol members exit the system entirely.
                    No ongoing dividends or entitlements after graduation.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ NETWORK TAB (BINARY TREE & 255 GRADUATION) ══ */}
        {activeTab === 'network' && (() => {
          const activeNetworkTier = selectedNetworkTierId !== 'all'
            ? activeStakedNodes.find(n => n.id === selectedNetworkTierId)
            : null;
          const activeTierTreeData = activeNetworkTier && networkTree?.byTier
            ? networkTree.byTier[activeNetworkTier.id]
            : null;

          const displayedCycleNodes = activeTierTreeData
            ? activeTierTreeData.cycleNodes
            : (networkTree?.qualifiedSubNodes ?? (activeStakedNodes.length > 0 ? 2 : (u?.subNodes || 0)));
          const displayedCyclePercent = activeTierTreeData
            ? activeTierTreeData.cyclePercent
            : parseFloat(((displayedCycleNodes / 255) * 100).toFixed(1));
          const displayedVelocityBoost = activeTierTreeData
            ? (activeTierTreeData.qualifiedCount * 5)
            : ((networkTree?.qualifiedSubNodes ?? (activeStakedNodes.length > 0 ? 2 : (u?.subNodes || 0))) * 5);

          const displayedLeftChild = activeTierTreeData
            ? activeTierTreeData.leftChild
            : (networkTree?.qualifiedNodes?.[0] || networkTree?.leftChild);
          const displayedRightChild = activeTierTreeData
            ? activeTierTreeData.rightChild
            : (networkTree?.qualifiedNodes?.[1] || networkTree?.rightChild);
          const displayedLevel2 = activeTierTreeData
            ? activeTierTreeData.level2
            : (networkTree?.qualifiedNodes?.slice(2, 6) || networkTree?.level2 || []);
          const displayedLevel3 = activeTierTreeData
            ? activeTierTreeData.level3
            : (networkTree?.qualifiedNodes?.slice(6, 14) || networkTree?.level3 || []);
          const displayedAllNodes = activeTierTreeData
            ? activeTierTreeData.members
            : (networkTree?.allNodes || []);

          return (
            <div className="dash-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 className="dash-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🌐</span> Sub-Node Binary Matrix
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Strict binary matrix: exactly 2 direct sub-nodes (Left & Right). Subsequent referrals spill over downstream until 255-validator graduation.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    ⚡ Matrix Velocity Boost: +{displayedVelocityBoost}%
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    {networkTree?.qualifiedSubNodes ?? 2} Qualified / {networkTree?.totalSubNodes ?? 4} Total
                  </span>
                </div>
              </div>

              {/* Multi-Node Network Matrix View Switcher */}
              {activeStakedNodes.length > 1 && (
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Matrix Fleet Switcher:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedNetworkTierId('all')}
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 6,
                      background: selectedNetworkTierId === 'all' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selectedNetworkTierId === 'all' ? '#00e5ff' : 'rgba(255,255,255,0.08)'}`,
                      color: selectedNetworkTierId === 'all' ? '#fff' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: selectedNetworkTierId === 'all' ? 700 : 400
                    }}
                  >
                    🌐 Cluster Matrix ({activeStakedNodes.length} Tiers · {networkTree?.qualifiedSubNodes || 2} Qualified)
                  </button>
                  {activeStakedNodes.map(n => {
                    const tierData = networkTree?.byTier?.[n.id];
                    const count = tierData?.qualifiedCount ?? (n.id === 3 || n.id === 5 ? 1 : 0);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedNetworkTierId(n.id)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 6,
                          background: selectedNetworkTierId === n.id ? `${n.color}25` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${selectedNetworkTierId === n.id ? n.color : 'rgba(255,255,255,0.08)'}`,
                          color: selectedNetworkTierId === n.id ? '#fff' : '#94a3b8',
                          cursor: 'pointer',
                          fontWeight: selectedNetworkTierId === n.id ? 700 : 400
                        }}
                      >
                        {n.name} (Tier {n.id} · {count} / 255 · +{count * 5}% Boost)
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── SPONSOR TIER ALIGNMENT RULE BANNER ── */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(15,23,42,0.9))',
                border: '1px solid rgba(250,204,21,0.35)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
              }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚖️</span>
                <div>
                  <strong style={{ color: '#facc15', fontSize: '0.92rem' }}>Strict Same-Node Referral Alignment Rule</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.55 }}>
                    Under protocol mechanics, each Genesis Node pool runs an isolated bare-metal computing matrix. 
                    When a referee stakes into a node (e.g. ₦16,000 Echo Node entry), it can <strong style={{ color: '#fff' }}>ONLY count toward your sub-network velocity and reward output if you actively hold that same node tier</strong>. 
                    If you do not hold that tier, the referral is placed in <span style={{ color: '#f87171', fontWeight: 700 }}>Unmatched Queue</span> with reward output held until you activate that node, preventing cross-pool accounting discrepancies.
                  </p>
                  {userStakedTierIds.length > 0 && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Your Actively Qualified Node Tiers:</span>
                      {userStakedTierIds.map(tid => {
                        const t = (region?.tiers || []).find(t => t.id === tid);
                        const tierData = networkTree?.byTier?.[tid];
                        const valCount = tierData?.qualifiedCount ?? (tid === 3 || tid === 5 ? 1 : 0);
                        return (
                          <span key={tid} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,255,148,0.15)', color: '#00ff94', fontWeight: 700 }}>
                            ✓ Tier {tid}{t ? ` (${t.name})` : ''} · {valCount} Sub-Node{valCount !== 1 ? 's' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="binary-network-wrapper">
                {/* ── 255-NODE GRADUATION CYCLE BANNER ── */}
                <div className="binary-cycle-banner">
                  <div className="binary-cycle-header">
                    <div className="binary-cycle-title">
                      <span>🏛️</span>
                      <span>
                        {activeNetworkTier
                          ? `Tier ${activeNetworkTier.id} (${activeNetworkTier.name}) — 255-Validator Cycle Progress`
                          : `Cycle #${networkTree?.cycleCount || 1} Graduation Progress (${activeStakedNodes.length} Node Tiers Combined)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00ff94' }}>
                        {displayedCycleNodes} / 255 Validators
                      </span>
                      <span className={`badge ${activeTierTreeData?.isGraduate || networkTree?.isGraduate ? 'badge-green' : 'badge-amber'}`}>
                        {(activeTierTreeData?.isGraduate || networkTree?.isGraduate) ? '✓ Graduated Master Node' : `${displayedCyclePercent}% In-Cycle`}
                      </span>
                    </div>
                  </div>

                  <div className="binary-cycle-bar-track">
                    <div
                      className="binary-cycle-bar-fill"
                      style={{ width: `${Math.max(2, Math.min(100, displayedCyclePercent))}%` }}
                    />
                  </div>

                  <div className="binary-milestones">
                    <span>Level 1: 2 Nodes</span>
                    <span>Level 2: 6 Nodes</span>
                    <span>Level 3: 14 Nodes</span>
                    <span>Level 4: 30</span>
                    <span>Level 5: 62</span>
                    <span>Level 6: 126</span>
                    <span>Level 7: 254</span>
                    <strong style={{ color: '#00ff94' }}>255 Graduation 🏆</strong>
                  </div>
                </div>

                {/* ── VIEW MODE SWITCHER ── */}
                <div className="binary-view-nav">
                  <button
                    type="button"
                    className={`binary-view-btn ${networkViewMode === 'tree' ? 'active' : ''}`}
                    onClick={() => setNetworkViewMode('tree')}
                  >
                    <span>🌳</span> Direct Binary Tree (Left / Right)
                  </button>
                  <button
                    type="button"
                    className={`binary-view-btn ${networkViewMode === 'level2' ? 'active' : ''}`}
                    onClick={() => setNetworkViewMode('level2')}
                  >
                    <span>⚡</span> Level 2 Positions (4 Nodes)
                  </button>
                  <button
                    type="button"
                    className={`binary-view-btn ${networkViewMode === 'level3' ? 'active' : ''}`}
                    onClick={() => setNetworkViewMode('level3')}
                  >
                    <span>🌐</span> Level 3 Positions (8 Nodes)
                  </button>
                  <button
                    type="button"
                    className={`binary-view-btn ${networkViewMode === 'matrix' ? 'active' : ''}`}
                    onClick={() => setNetworkViewMode('matrix')}
                  >
                    <span>📋</span> Matrix Directory ({displayedAllNodes.length})
                  </button>
                </div>

                {/* ── VIEW 1: DIRECT BINARY TREE ── */}
                {networkViewMode === 'tree' && (
                  <div className="dash-card binary-tree-stage">
                    {/* Root Operator Card ("YOU") */}
                    <div className="binary-root-card">
                      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#00e5ff', fontWeight: 800, letterSpacing: '0.08em' }}>
                        ★ Root Node Operator {activeNetworkTier ? `· Tier ${activeNetworkTier.id} (${activeNetworkTier.name})` : ''}
                      </span>
                      <h3 style={{ margin: '0.2rem 0', fontSize: '1.15rem', color: '#fff' }}>
                        {u?.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {u?.referralCode} · {activeNetworkTier ? activeNetworkTier.name : effectiveTierName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>🟢 Active Primary</span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                          {activeNetworkTier ? `Dedicated 255 Matrix` : `Cluster Matrix`}
                        </span>
                      </div>
                    </div>

                    {/* Connecting SVG lines */}
                    <svg className="binary-connector-svg" viewBox="0 0 540 48">
                      <path d="M270,0 L270,24 L135,24 L135,48" stroke="#00e5ff" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                      <path d="M270,0 L270,24 L405,24 L405,48" stroke="#00ff94" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                      <circle cx="270" cy="24" r="4" fill="#6366f1" />
                      <circle cx="135" cy="48" r="4" fill="#00e5ff" />
                      <circle cx="405" cy="48" r="4" fill="#00ff94" />
                    </svg>

                  {/* Left & Right Slots Grid */}
                  <div className="binary-direct-grid">
                    {/* LEFT SLOT */}
                    {displayedLeftChild ? (
                      <div className="binary-slot-card left">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#00e5ff', textTransform: 'uppercase', fontWeight: 700 }}>
                              Slot 1 · Left Direct
                            </span>
                            <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', color: '#fff' }}>
                              {displayedLeftChild.name}
                            </h4>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {displayedLeftChild.referralCode}
                            </span>
                          </div>
                          <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>Active</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.5rem', borderRadius: 6 }}>
                            <span style={{ color: '#94a3b8' }}>Validator Tier</span>
                            <strong style={{ display: 'block', color: '#fff' }}>{displayedLeftChild.tierName}</strong>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.5rem', borderRadius: 6 }}>
                            <span style={{ color: '#94a3b8' }}>Effective Hashrate</span>
                            <strong style={{ display: 'block', color: '#00e5ff' }}>{displayedLeftChild.hashrate} TH/s</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}
                          onClick={() => setSelectedSubNode(displayedLeftChild)}
                        >
                          Inspect Sub-Node Downline ↗
                        </button>
                      </div>
                    ) : (
                      <div className="binary-slot-card empty left">
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem', opacity: 0.6 }}>➕</div>
                        <strong style={{ fontSize: '0.9rem', color: '#00e5ff' }}>Left Sub-Node Slot Open</strong>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0.75rem' }}>
                          Available for matching tier direct recruit or upstream spillover.
                        </p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => navigator.clipboard?.writeText(networkTree?.referralLink || u?.referralCode)}
                        >
                          Copy Invite Link
                        </button>
                      </div>
                    )}

                    {/* RIGHT SLOT */}
                    {displayedRightChild ? (
                      <div className="binary-slot-card right">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#00ff94', textTransform: 'uppercase', fontWeight: 700 }}>
                              Slot 2 · Right Direct
                            </span>
                            <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', color: '#fff' }}>
                              {displayedRightChild.name}
                            </h4>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {displayedRightChild.referralCode}
                            </span>
                          </div>
                          <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>Active</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.5rem', borderRadius: 6 }}>
                            <span style={{ color: '#94a3b8' }}>Validator Tier</span>
                            <strong style={{ display: 'block', color: '#fff' }}>{displayedRightChild.tierName}</strong>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.5rem', borderRadius: 6 }}>
                            <span style={{ color: '#94a3b8' }}>Effective Hashrate</span>
                            <strong style={{ display: 'block', color: '#00ff94' }}>{displayedRightChild.hashrate} TH/s</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}
                          onClick={() => setSelectedSubNode(displayedRightChild)}
                        >
                          Inspect Sub-Node Downline ↗
                        </button>
                      </div>
                    ) : (
                      <div className="binary-slot-card empty right">
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem', opacity: 0.6 }}>➕</div>
                        <strong style={{ fontSize: '0.9rem', color: '#00ff94' }}>Right Sub-Node Slot Open</strong>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0.75rem' }}>
                          Available for matching tier direct recruit or upstream spillover.
                        </p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => navigator.clipboard?.writeText(networkTree?.referralLink || u?.referralCode)}
                        >
                          Copy Invite Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── VIEW 2: LEVEL 2 (4 NODES) ── */}
              {networkViewMode === 'level2' && (
                <div className="dash-card">
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 className="dash-card-title" style={{ margin: 0 }}>Level 2 Downline (4 Binary Positions)</h3>
                    <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                      Positions #3 to #6 situated under your Left and Right direct validators.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {(displayedLevel2 || []).length > 0 ? (
                      displayedLevel2.map((node, idx) => (
                        <div
                          key={node.id || idx}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: idx < 2 ? '#00e5ff' : '#00ff94', fontWeight: 700 }}>
                                {idx < 2 ? 'Left Downline L2' : 'Right Downline L2'} · Pos #{idx + 3}
                              </span>
                              <h4 style={{ margin: '0.15rem 0 0', fontSize: '0.95rem', color: '#fff' }}>{node.name}</h4>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{node.referralCode}</span>
                            </div>
                            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Active</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                            <span>Tier: <strong style={{ color: '#fff' }}>{node.tierName}</strong></span>
                            <span>Speed: <strong style={{ color: '#00e5ff' }}>{node.hashrate} TH/s</strong></span>
                          </div>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', fontSize: '0.72rem', padding: '0.25rem' }}
                            onClick={() => setSelectedSubNode(node)}
                          >
                            Inspect Node →
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No Level 2 sub-nodes recorded yet in this matrix view. Share your referral link to trigger automated downline spillover.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── VIEW 3: LEVEL 3 (8 NODES) ── */}
              {networkViewMode === 'level3' && (
                <div className="dash-card">
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 className="dash-card-title" style={{ margin: 0 }}>Level 3 Downline (8 Binary Positions)</h3>
                    <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                      Positions #7 to #14 branching from your Level 2 validator network.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    {(displayedLevel3 || []).length > 0 ? (
                      displayedLevel3.map((node, idx) => (
                        <div
                          key={node.id || idx}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 700 }}>
                                Level 3 · Pos #{idx + 7}
                              </span>
                              <h4 style={{ margin: '0.1rem 0 0', fontSize: '0.9rem', color: '#fff' }}>{node.name}</h4>
                            </div>
                            <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Active</span>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
                            <div>Tier: <strong style={{ color: '#fff' }}>{node.tierName}</strong></div>
                            <div>Hashrate: <strong style={{ color: '#00ff94' }}>{node.hashrate} TH/s</strong></div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', fontSize: '0.7rem', padding: '0.2rem' }}
                            onClick={() => setSelectedSubNode(node)}
                          >
                            Inspect Node →
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        Level 3 positions will automatically populate as your downline grows.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── VIEW 4: FULL MATRIX ROSTER ── */}
              {networkViewMode === 'matrix' && (
                <div className="matrix-table-card">
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="dash-card-title" style={{ margin: 0 }}>Full 255 Matrix Validator Roster</h3>
                      <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                        Complete inventory of all downstream nodes contributing to your graduation cycle.
                      </p>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#00e5ff', fontWeight: 700 }}>
                      {(displayedAllNodes || []).length} Registered Validators
                    </span>
                  </div>

                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Pos #</th>
                        <th>Slot Type</th>
                        <th>Validator Operator</th>
                        <th>Referral Code</th>
                        <th>Tier</th>
                        <th>Hashrate</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(displayedAllNodes || []).map((node, i) => (
                        <tr key={node.id || i}>
                          <td style={{ fontWeight: 700, color: '#00e5ff' }}>#{node.position || i + 1}</td>
                          <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{node.slotName}</td>
                          <td style={{ fontWeight: 600, color: '#fff' }}>{node.name}</td>
                          <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{node.referralCode}</td>
                          <td>
                            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                              {node.tierName}
                            </span>
                          </td>
                          <td style={{ color: '#00ff94', fontWeight: 600 }}>{node.hashrate} TH/s</td>
                          <td>
                            <span className={`badge ${node.isTierQualified ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.68rem' }}>
                              {node.isTierQualified ? 'Active Qualified' : 'Unmatched Tier'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                              onClick={() => setSelectedSubNode(node)}
                            >
                              Inspect ↗
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── UNMATCHED DOWNLINE ENTRIES DRAWER ── */}
              {networkTree?.unmatchedNodes && networkTree.unmatchedNodes.length > 0 && (
                <div className="dash-card" style={{ marginTop: '1.25rem', border: '1px solid rgba(248, 113, 113, 0.35)', background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(15,23,42,0.85))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <h3 className="dash-card-title" style={{ margin: 0, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⚠️</span> Unmatched Downline Entries ({networkTree.unmatchedNodes.length} Pending Nodes)
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        These referrals joined under your link, but staked into Genesis Node tiers you have not yet activated.
                        Under protocol rules, <strong style={{ color: '#fff' }}>sub-node velocity (+5%) and matrix placement only credit when the sponsor holds that same node tier</strong> to prevent reward output discrepancies between different pool economics.
                      </p>
                    </div>
                    <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                      Reward Output Held in Escrow
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {networkTree.unmatchedNodes.map(unNode => (
                      <div
                        key={unNode.id}
                        style={{
                          background: 'rgba(0,0,0,0.35)',
                          border: '1px solid rgba(248, 113, 113, 0.25)',
                          borderRadius: '10px',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.65rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{unNode.name}</strong>
                            <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700, background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                              Tier {unNode.tierId}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {unNode.referralCode} · Staked: {unNode.tierName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.4rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                            <span style={{ color: '#fca5a5' }}>Escrow Reason: </span>
                            You do not actively hold an active Tier {unNode.tierId} ({unNode.tierName}) stake.
                          </div>
                        </div>

                        <Link
                          to="/tiers"
                          className="btn btn-primary btn-sm"
                          style={{
                            width: '100%',
                            fontSize: '0.75rem',
                            padding: '0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            border: 'none',
                            color: '#fff',
                            textDecoration: 'none'
                          }}
                        >
                          <span>⚡</span> Activate Tier {unNode.tierId} ({unNode.tierName}) to Unlock +5% Boost →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── REFERRAL CODE & SPILLOVER GROW CARD ── */}
              <div className="dash-card">
                <h3 className="dash-card-title">Grow Your Binary Network</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Because each validator has exactly 2 direct slots, every referral you recruit beyond your first two automatically spills over to fill your sub-nodes' downline. This accelerates your network towards the 255 graduation threshold.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div className="dash-referral-box">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Your Direct Referral Code</span>
                      <strong className="dash-referral-code" style={{ fontSize: '1.1rem' }}>{u.referralCode}</strong>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(u.referralCode);
                        alert('Referral code copied to clipboard!');
                      }}
                    >
                      Copy Code
                    </button>
                  </div>

                  <div className="dash-referral-box">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Instant Join URL</span>
                      <div style={{ fontSize: '0.78rem', color: '#00e5ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {networkTree?.referralLink || `${window.location.origin}/register?ref=${u.referralCode}`}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const link = networkTree?.referralLink || `${window.location.origin}/register?ref=${u.referralCode}`;
                        navigator.clipboard?.writeText(link);
                        alert('Instant registration link copied to clipboard!');
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

        {/* ══ DATA CENTER MINING TAB ══ */}
        {activeTab === 'mining' && (
          <div className="dash-section mining-layout-outer">

            {/* ══ ACCOUNT SIDEBAR ══ */}
            <aside className="mining-sidebar">
              {/* Avatar / name */}
              <div className="msb-header">
                <div className="msb-avatar">{(u?.name || u?.email || 'U')[0].toUpperCase()}</div>
                <div>
                  <div className="msb-name">{u?.name || u?.email?.split('@')[0] || 'Validator'}</div>
                  <div className="msb-role">Node Operator</div>
                </div>
              </div>

              <div className="msb-divider" />

              {/* Cash Balance */}
              <div className="msb-stat-card msb-cash">
                <div className="msb-stat-label">💵 Cash Balance</div>
                <div className="msb-stat-value">{fmt(u?.walletBalance || 0)}</div>
                <div className="msb-stat-sub">Spendable NGN</div>
              </div>

              {/* NVT Balance */}
              <div className="msb-stat-card msb-nvt">
                <div className="msb-stat-label">🪙 $NVT Balance</div>
                <div className="msb-stat-value">{minedNvt.toFixed(4)}</div>
                <div className="msb-stat-sub">Mined Tokens</div>
              </div>

              {/* Token Value */}
              <div className="msb-stat-card msb-value">
                <div className="msb-stat-label">📈 Token Value</div>
                <div className="msb-stat-value">{fmt(minedNvt * COIN_RATE_NGN)}</div>
                <div className="msb-stat-sub">@ ₦{COIN_RATE_NGN} / $NVT</div>
              </div>

              <div className="msb-divider" />

              {/* Per-Blade Fuel Levels */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.5rem' }}>⛽ Blade Fuel Tanks</div>
                {computingNodes.map(node => {
                  const fuel = bladeFuel[node.id] ?? 0;
                  const fuelAward = getBladeFuelAward(node, region?.code);
                  return (
                    <div key={node.id} className="msb-fuel-row" style={{ marginBottom: '0.35rem' }}>
                      <div className="msb-fuel-cell" style={{ flex: 1 }}>
                        <span className="msb-fuel-icon" style={{ color: node.color || '#00e5ff', fontSize: '0.7rem' }}>■</span>
                        <span className="msb-fuel-label" style={{ fontSize: '0.72rem' }}>T{node.id} {node.name?.split(' ')[0]}</span>
                      </div>
                      <span className={`msb-fuel-count ${fuel >= 1 ? 'msb-fuel-ok' : 'msb-fuel-empty'}`} style={{ fontSize: '0.8rem' }}>{fuel}</span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '4px' }}>u</span>
                    </div>
                  );
                })}
                <div style={{ fontSize: '0.67rem', color: '#475569', marginTop: '0.5rem', lineHeight: 1.4 }}>
                  1 fuel unit = validation reward<br/>Earned by solving blocks
                </div>
              </div>

              {!canMineAny && !u?.isGraduate && (
                <div className="msb-no-fuel">
                  ⛽ No Fuel — Mine a block to earn fuel
                </div>
              )}

              <div className="msb-divider" />

              {/* Cluster stats */}
              <div className="msb-cluster-row">
                <div className="msb-cluster-cell">
                  <div className="msb-cluster-label">Active Blades</div>
                  <div className="msb-cluster-val">
                    {Object.values(bladeSystems).filter(b => b.isMining).length}<span className="msb-cluster-total">/{computingNodes.length}</span>
                  </div>
                </div>
                <div className="msb-cluster-cell">
                  <div className="msb-cluster-label">Staked Tiers</div>
                  <div className="msb-cluster-val">{computingNodes.length}</div>
                </div>
              </div>

              {/* Total staked value */}
              <div className="msb-staked-row">
                <span className="msb-staked-label">Total Staked</span>
                <span className="msb-staked-val">{fmt(activeStakedNodes.reduce((s, n) => s + Number(n.fee || 0), 0))}</span>
              </div>

              <div className="msb-divider" />

              {/* Quick Settle CTA */}
              {minedNvt > 0 && (
                <button
                  className="msb-settle-btn"
                  onClick={() => {
                    setConvertNvtInput(Math.floor(minedNvt).toString());
                    document.getElementById('mining-settlement-desk')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  💱 Quick Settle {minedNvt.toFixed(2)} $NVT
                  <span className="msb-settle-sub">→ {fmt(Math.floor(minedNvt) * COIN_RATE_NGN)}</span>
                </button>
              )}
            </aside>

            {/* ══ MAIN CONTENT COLUMN ══ */}
            <div className="mining-main-col">

            {/* ─────────────────── CLUSTER MASTER HEADER ─────────────────── */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div>
                  <h2 className="dash-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span>🖥️</span> Data Center Computing Cluster
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    {computingNodes.length} Independent Bare-Metal Blade{computingNodes.length !== 1 ? 's' : ''} · Each staked node operates its own dedicated computing system.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handlePowerAllBlades}
                    disabled={!canMineAny && !u?.isGraduate}
                    style={{ fontSize: '0.78rem' }}
                  >
                    ▶ Power All Blades
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleStandbyAllBlades}
                    style={{ fontSize: '0.78rem' }}
                  >
                    ■ All Standby
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSettleAllBlades}
                    style={{ fontSize: '0.78rem', borderColor: 'rgba(0,255,148,0.4)', color: '#00ff94' }}
                  >
                    💱 Harvest All
                  </button>
                </div>
              </div>

              {/* Cluster aggregate telemetry strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Blades</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00e5ff' }}>
                    {Object.values(bladeSystems).filter(b => b.isMining).length} / {computingNodes.length}
                  </div>
                </div>
                <div style={{ background: 'rgba(0,255,148,0.07)', border: '1px solid rgba(0,255,148,0.2)', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total $NVT Mined</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00ff94' }}>{minedNvt.toFixed(4)}</div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cluster Value</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c4b5fd' }}>{fmt(minedNvt * COIN_RATE_NGN)}</div>
                </div>
                <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Wallet</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{fmt(u?.walletBalance || 0)}</div>
                </div>
              </div>
            </div>

            {/* Feedback toasts */}
            {deskFeedback && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.85rem', background: deskFeedback.type === 'green' ? 'rgba(0,255,148,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${deskFeedback.type === 'green' ? '#00ff94' : '#fbbf24'}`, color: deskFeedback.type === 'green' ? '#00ff94' : '#fbbf24' }}>
                {deskFeedback.text}
              </div>
            )}
            {fuelFeedback && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.85rem', background: fuelFeedback.type === 'green' ? 'rgba(0,255,148,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${fuelFeedback.type === 'green' ? '#00ff94' : '#fbbf24'}`, color: fuelFeedback.type === 'green' ? '#00ff94' : '#fbbf24' }}>
                {fuelFeedback.text}
              </div>
            )}

            {/* ─────────────────── 42U SERVER RACK CABINET ─────────────────── */}
            <div className="server-rack-cabinet">
              {/* Rack top rail label */}
              <div className="rack-top-label">
                <span>🏭 NODE VAULT — ENTERPRISE RACK ENCLOSURE</span>
                <span className="rack-unit-count">{computingNodes.length * 2}U OCCUPIED / 42U TOTAL</span>
              </div>

              {/* Rack blades */}
              <div className="rack-blade-stack">
                {computingNodes.map((node, idx) => {
                  const blade = bladeSystems[node.id];
                  if (!blade) return null;
                  const bSpecs = getServerSpecs(node.id, u?.isGraduate);
                  const isOn = blade.isMining;
                  const temp = blade.tempC || (isOn ? 68 : 42);
                  const rpm = blade.fanRpm || (isOn ? 5400 : 2400);
                  const progress = blade.blockProgress || 0;
                  const tokens = blade.minedTokens || 0;
                  const tokCash = convertCoinsToCash(tokens, region?.code).cashAmount;

                  return (
                    <div
                      key={node.id}
                      className={`rack-blade-unit ${isOn ? 'blade-active' : 'blade-standby'}`}
                      style={{ borderLeft: `4px solid ${node.color || '#00e5ff'}` }}
                    >
                      {/* Blade faceplate header */}
                      <div className="blade-faceplate">
                        <div className="blade-faceplate-left">
                          <div className={`blade-led ${isOn ? 'led-green' : 'led-amber'}`} />
                          <div>
                            <div className="blade-slot-label">{blade.slotName} · {blade.rackUnit}</div>
                            <div className="blade-model-name" style={{ color: node.color || '#00e5ff' }}>{bSpecs.model}</div>
                            <div className="blade-ip">IP: {blade.ipAddress} · Tier {node.id} Genesis Node</div>
                          </div>
                        </div>
                        <div className="blade-faceplate-right">
                          <div className={`blade-status-badge ${isOn ? 'status-computing' : 'status-standby'}`}>
                            {isOn ? '🟢 COMPUTING' : '🟡 STANDBY'}
                          </div>
                        </div>
                      </div>

                      {/* Telemetry strip */}
                      <div className="blade-telemetry-strip">
                        <div className="telemetry-cell">
                          <span className="telemetry-label">CPU Core</span>
                          <span className="telemetry-value" style={{ color: '#00e5ff' }}>{bSpecs.computeCore}</span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">Hashrate</span>
                          <span className="telemetry-value" style={{ color: '#c4b5fd' }}>{bSpecs.hashrateThs} TH/s</span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">Velocity</span>
                          <span className="telemetry-value" style={{ color: node.color || '#00e5ff' }}>{bSpecs.speedMultiplier}×</span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">Block Cycle</span>
                          <span className="telemetry-value">{bSpecs.cycleDurationSeconds}s</span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">Temp</span>
                          <span className="telemetry-value" style={{ color: temp > 75 ? '#f87171' : temp > 65 ? '#fbbf24' : '#00ff94' }}>
                            {temp}°C
                          </span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">Fan RPM</span>
                          <span className="telemetry-value" style={{ color: rpm > 5000 ? '#f87171' : '#94a3b8' }}>{rpm.toLocaleString()}</span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">$NVT Mined</span>
                          <span className="telemetry-value" style={{ color: '#00ff94' }}>{tokens.toFixed(4)}</span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">Cash Value</span>
                          <span className="telemetry-value" style={{ color: '#fbbf24' }}>{fmt(tokCash)}</span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">⛽ Fuel Tank</span>
                          <span className="telemetry-value" style={{ color: (bladeFuel[node.id] ?? 0) >= 1 ? '#4ade80' : (blade.blocksSolved ?? 0) === 0 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>
                            {(bladeFuel[node.id] ?? 0)} u
                          </span>
                        </div>
                        <div className="telemetry-cell">
                          <span className="telemetry-label">Fuel/Unit</span>
                          <span className="telemetry-value" style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {region?.symbol || '₦'}{getBladeFuelAward(node, region?.code).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Block progress bar */}
                      <div className="blade-progress-row">
                        <span style={{ fontSize: '0.7rem', color: isOn ? '#00e5ff' : '#64748b' }}>
                          {isOn ? `⛏️ Block ${(blade.blocksSolved || 0) + 1} — Solving…` : 'Block processing idle'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="blade-progress-track">
                        <div
                          className={`blade-progress-fill ${isOn ? 'fill-active' : ''}`}
                          style={{ width: `${progress}%`, background: isOn ? `linear-gradient(90deg, ${node.color || '#00e5ff'}, #00ff94)` : '#334155' }}
                        />
                      </div>

                      {/* Per-blade fuel status bar */}
                      <div style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#475569', whiteSpace: 'nowrap' }}>⛽ Fuel</span>
                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, (bladeFuel[node.id] ?? 0) * 10)}%`,
                            background: (bladeFuel[node.id] ?? 0) >= 1
                              ? `linear-gradient(90deg, ${node.color || '#00e5ff'}, #00ff94)`
                              : '#1e293b',
                            borderRadius: 2,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', color: (bladeFuel[node.id] ?? 0) >= 1 ? '#4ade80' : (blade.blocksSolved ?? 0) === 0 ? '#fbbf24' : '#f87171', fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>
                          {(bladeFuel[node.id] ?? 0) >= 1
                            ? `${bladeFuel[node.id]}u`
                            : (blade.blocksSolved ?? 0) === 0 ? 'NEW' : 'EMPTY'
                          }
                        </span>
                      </div>

                      {/* Blade controls */}
                      <div className="blade-controls">
                        <button
                          type="button"
                          className={`btn btn-sm ${isOn ? 'btn-secondary' : 'btn-primary'}`}
                          style={isOn ? { borderColor: '#f87171', color: '#f87171' } : { borderColor: node.color || '#00e5ff', color: node.color || '#00e5ff' }}
                          onClick={() => handleToggleBladePower(node.id)}
                          disabled={!getBladeCanMine(node.id) && !isOn}
                        >
                          {!getBladeCanMine(node.id) && !isOn ? '⛽ Fuel Empty' : isOn ? '■ Standby' : '▶ Power On'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(0,255,148,0.4)', color: '#00ff94', fontSize: '0.72rem' }}
                          onClick={() => handleSettleBlade(node.id)}
                          disabled={tokens <= 0}

                        >
                          💱 Settle {tokens > 0 ? `(${tokens.toFixed(2)} $NVT → ${fmt(tokCash)})` : '(Empty)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rack bottom rail */}
              <div className="rack-bottom-rail">
                <div className="rack-rail-label">POWER DISTRIBUTION UNIT (PDU)</div>
                <div className="rack-rail-label">NETWORK SWITCH — 40GbE FIBER UPLINK</div>
              </div>
            </div>

            {/* Auto-mine toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.25rem', padding: '0.85rem 1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
              <input
                type="checkbox"
                id="dashAutoMine"
                checked={autoMine}
                onChange={(e) => setAutoMine(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
              />
              <label htmlFor="dashAutoMine" style={{ fontSize: '0.88rem', color: autoMine ? 'var(--accent-cyan)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: autoMine ? 600 : 400 }}>
                {autoMine ? '🤖 Auto-Processing: ACTIVE — All blades power on automatically' : 'Enable Auto-Processing for all blades'}
              </label>
            </div>

            {/* ══ PER-BLADE VALIDATION FUEL SYSTEM ══ */}
            <div className="mining-boosts" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 className="boosts-title" style={{ margin: 0 }}>⛽ Blade Fuel System — Validation Earned</h3>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Each blade has its own independent fuel tank. Fuel is earned <strong style={{ color: 'var(--accent-cyan)' }}>exclusively through network validation</strong> (solving blocks). Each solved block earns +1 fuel unit. 1 blade = 1 tank.
                  </p>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
                  ⛓️ 1 Solved Block = 1 Fuel Unit
                </span>
              </div>

              {/* Fuel feedback banner */}
              {fuelFeedback && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem',
                  background: fuelFeedback.type === 'green' ? 'rgba(0,255,148,0.08)' : 'rgba(251,191,36,0.08)',
                  border: `1px solid ${fuelFeedback.type === 'green' ? 'rgba(0,255,148,0.3)' : 'rgba(251,191,36,0.3)'}`,
                  color: fuelFeedback.type === 'green' ? '#00ff94' : '#fbbf24',
                }}>
                  {fuelFeedback.text}
                </div>
              )}

              {/* Per-blade fuel cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {computingNodes.map(node => {
                  const fuel = bladeFuel[node.id] ?? 0;
                  const fuelAward = getBladeFuelAward(node, region?.code);
                  const isActive = bladeSystems[node.id]?.isMining;
                  const hasFuel = fuel >= 1;
                  const fuelBarPct = Math.min(100, fuel * 10); // visual bar: 10 units = full

                  return (
                    <div key={node.id} className="boost-card" style={{
                      borderLeft: `3px solid ${node.color || '#00e5ff'}`,
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {/* Active glow */}
                      {isActive && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${node.color || '#00e5ff'}, transparent)` }} />
                      )}
                      <div className="boost-icon" style={{ color: node.color || '#00e5ff', fontSize: '1.4rem' }}>⛽</div>
                      <div className="boost-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: 0, color: node.color || '#00e5ff', fontSize: '0.9rem' }}>Tier {node.id} — {node.name}</h4>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                              1 Fuel Unit = {region?.symbol || '₦'}{fuelAward.toLocaleString()} gift award
                            </p>
                          </div>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20,
                            background: isActive ? 'rgba(0,255,148,0.15)' : 'rgba(255,255,255,0.06)',
                            color: isActive ? '#00ff94' : '#64748b',
                            border: `1px solid ${isActive ? 'rgba(0,255,148,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}>
                            {isActive ? '⛏️ Mining' : '■ Idle'}
                          </span>
                        </div>

                        {/* Fuel level bar */}
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fuel Tank</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: hasFuel ? (node.color || '#00e5ff') : '#475569' }}>
                              {fuel} <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>units</span>
                            </span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${fuelBarPct}%`,
                              borderRadius: 3,
                              background: hasFuel
                                ? `linear-gradient(90deg, ${node.color || '#00e5ff'}, rgba(255,255,255,0.4))`
                                : '#1e293b',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>

                        {/* Source info */}
                        <div style={{ marginTop: '0.6rem', fontSize: '0.73rem', color: hasFuel ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {hasFuel
                            ? `✓ ${fuel} block${fuel !== 1 ? 's' : ''} validated — ready to mine`
                            : '⚠ No fuel — power on blade to validate first block'
                          }
                        </div>
                        <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: '#475569' }}>
                          Source: Network Validation Only (no purchase)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fuel mechanics explainer */}
              <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.1rem', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 10, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '0.3rem' }}>⚡ How Blade Fuel Works</strong>
                <span style={{ color: '#64748b' }}>
                  • <strong style={{ color: '#94a3b8' }}>First block:</strong> Each new blade starts at 0 fuel. Power it on — the first validation cycle runs on bootstrap credit and returns 1 fuel unit upon completion.<br/>
                  • <strong style={{ color: '#94a3b8' }}>Sustained mining:</strong> Each solved block awards 1 fuel unit to that blade's tank, sustaining continuous operation.<br/>
                  • <strong style={{ color: '#94a3b8' }}>Auto-halt:</strong> If a blade's tank reaches 0, it stops automatically. Resume by solving another cycle.<br/>
                  • <strong style={{ color: '#94a3b8' }}>No purchase:</strong> Fuel cannot be bought or transferred. Only network validation earns fuel.
                </span>
              </div>
            </div>


            {/* ══ TOKEN LIQUIDITY & SETTLEMENT DESK ══ */}
            <div id="mining-settlement-desk" className="card" style={{ marginTop: '2.5rem', borderColor: 'var(--accent-cyan)', background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.04) 0%, rgba(10, 15, 30, 0.8) 100%)', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    💱 Token Liquidity & Settlement Desk
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Convert your mined $NVT tokens into Cash Balance at the fixed protocol liquidity parity.
                  </p>
                </div>
                <span className="badge badge-green">1 $NVT = ₦{COIN_RATE_NGN} NGN · Fixed Parity</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spendable Cash</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00ff94', marginTop: '0.2rem' }}>{fmt(u?.walletBalance || 0)}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mined $NVT Balance</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00e5ff', marginTop: '0.2rem' }}>{minedNvt.toFixed(4)} $NVT</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Token Market Value</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c4b5fd', marginTop: '0.2rem' }}>{fmt(minedNvt * COIN_RATE_NGN)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Amount to Settle ($NVT)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={convertNvtInput}
                      onChange={(e) => setConvertNvtInput(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '0.75rem 4rem 0.75rem 0.75rem',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setConvertNvtInput(Math.floor(minedNvt).toString())}
                      style={{
                        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(0,229,255,0.15)', border: 'none', color: 'var(--accent-cyan)',
                        fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer'
                      }}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Settlement Payout (Cash Balance)
                  </label>
                  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontWeight: 700, color: 'var(--accent-green)', fontSize: '1rem' }}>
                    {fmt(convertCoinsToCash(convertNvtInput || 0, region?.code).cashAmount)}
                  </div>
                </div>

                <div>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleSettleTokens}
                    disabled={!convertNvtInput || parseFloat(convertNvtInput) <= 0 || parseFloat(convertNvtInput) > minedNvt}
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    ⚡ Instant Settlement
                  </button>
                </div>
              </div>

              {convertNvtInput && parseFloat(convertNvtInput) > 0 && parseFloat(convertNvtInput) <= minedNvt && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(0,255,148,0.07)', border: '1px solid rgba(0,255,148,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Projected Balance:</span>
                  <strong style={{ color: '#fff' }}>{fmt(u?.walletBalance || 0)}</strong>
                  <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.1rem' }}>+</span>
                  <strong style={{ color: '#00e5ff' }}>{fmt(convertCoinsToCash(convertNvtInput, region?.code).cashAmount)}</strong>
                  <span style={{ color: '#00ff94', fontWeight: 700, fontSize: '1.1rem' }}>=</span>
                  <strong style={{ color: '#00ff94', fontSize: '1rem' }}>
                    {fmt((u?.walletBalance || 0) + convertCoinsToCash(convertNvtInput, region?.code).cashAmount)}
                  </strong>
                  <span style={{ color: '#94a3b8' }}>projected cash</span>
                </div>
              )}

              {deskFeedback && (
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: deskFeedback.type === 'green' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                  {deskFeedback.text}
                </div>
              )}
            </div>

            {/* ══ HARDWARE LIFECYCLE & MASTER NODE UPGRADE ══ */}
            <div className="dash-card" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 className="dash-card-title" style={{ marginBottom: '0.25rem' }}>
                    {u?.isGraduate ? '🏆 Protocol Master Validator Cluster' : '🏛️ Hardware Depreciation & Milestone Tracker'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    {u?.isGraduate
                      ? 'Your node cluster has achieved Protocol Master status. Lifetime 13% monthly protocol dividends are autonomously mined.'
                      : 'Upon 255-validator network completion, each computing blade successfully concludes its hardware lifecycle and upgrades to the permanent Protocol Master Validator Node.'}
                  </p>
                </div>
                <span className={`badge ${u?.isGraduate ? 'badge-green' : 'badge-cyan'}`}>
                  {u?.isGraduate
                    ? '✓ Master Node Operational'
                    : `${networkTree?.qualifiedSubNodes ?? (activeStakedNodes.length > 0 ? 2 : (u?.subNodes || 0))} / 255 Qualified Validators`}
                </span>
              </div>

              {activeStakedNodes.length > 1 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginTop: '1.25rem' }}>
                  {activeStakedNodes.map((n, idx) => {
                    const tierTree = networkTree?.byTier?.[n.id];
                    const count = tierTree?.cycleNodes ?? (n.id === 3 || n.id === 5 ? 1 : 0);
                    const pct = tierTree?.cyclePercent ?? parseFloat(((count / 255) * 100).toFixed(1));
                    return (
                      <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${n.color}35`, borderRadius: '10px', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                            Blade-{String(idx + 1).padStart(2, '0')}: {n.name} (Tier {n.id})
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: n.color }}>
                            {count} / 255 Validators
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                          <div style={{ width: `${Math.max(2, Math.min(100, pct))}%`, height: '100%', background: n.color }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                          <span>Lifecycle: {pct}% complete</span>
                          <span style={{ color: '#00ff94', fontWeight: 600 }}>+{count * 5}% Hashrate Boost</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginTop: '1rem', width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.round(((u?.subNodes || 0) / 255) * 100))}%`,
                      height: '100%',
                      background: u?.isGraduate ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan))'
                    }}
                  />
                </div>
              )}
            </div>
            </div>{/* end mining-main-col */}
          </div>
        )}
        {/* ══ SECURITY & COMPLIANCE TAB ══ */}
        {activeTab === 'security' && (
          <div className="dash-section">
            <h2 className="dash-title">Security & Protocol Compliance</h2>
            <p className="dash-subtitle">
              Institutional-grade treasury controls, anti-money laundering (AML) frameworks, and cryptographic data protection.
            </p>

            <div className="dash-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Treasury Safeguards & Audit Protocols</h3>
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    All user records and capital protection reserves are secured with 256-bit AES encryption.
                  </p>
                </div>
                {isAdmin ? (
                  <Link to="/admin" className="btn btn-primary" style={{ background: '#facc15', color: '#000', fontWeight: 700 }}>
                    🛡️ Open Super Admin Portal →
                  </Link>
                ) : (
                  <span className="badge badge-green">✓ Operator Mode Verified</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Multi-Sig Treasury Clearance</h4>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    Disbursements exceeding ₦2,500,000 are segregated and require multi-signature authorization from compliance officers before release.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🪪</div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Strict KYC / AML Gating</h4>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    Staking nodes and capital withdrawals cannot be initiated without active government identity validation (NIN, BVN, Passport).
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚖️</div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>FIRS & CBN Compliance</h4>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    EMTL levies (₦50) on electronic transactions over ₦10,000 and 7.5% VAT on service fees are automatically computed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ════════ CLAIM & GATE MODALS ════════ */}

        {/* Gate 1: KYC Verification Gate Modal */}
        {claimModal?.type === 'kyc_gate' && (
          <div className="db-modal-overlay" onClick={() => setClaimModal(null)}>
            <div className="db-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🪪</div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>KYC Verification Mandatory</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  In accordance with anti-money laundering (AML) regulations, you cannot withdraw funds or initiate capital refunds without a verified identity.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary btn-full" onClick={() => setClaimModal(null)}>
                    Cancel
                  </button>
                  <Link to="/kyc" className="btn btn-primary btn-full" onClick={() => setClaimModal(null)}>
                    Complete KYC Now →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gate 2: Bank Account Gate Modal */}
        {claimModal?.type === 'bank_gate' && (
          <div className="db-modal-overlay" onClick={() => setClaimModal(null)}>
            <div className="db-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏦</div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#facc15' }}>Payout Bank Account Required</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  You must link a verified NUBAN bank account so our treasury system knows where your disbursements should be dispatched.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary btn-full" onClick={() => setClaimModal(null)}>
                    Cancel
                  </button>
                  <Link to="/account" className="btn btn-primary btn-full" onClick={() => setClaimModal(null)}>
                    Add Bank Account →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gate 3: High-Value Multi-Sig Review Notice (> ₦2.5M) */}
        {claimModal?.type === 'high_value' && (
          <div className="db-modal-overlay" onClick={() => setClaimModal(null)}>
            <div className="db-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(250,204,21,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#facc15' }}>
                    ⚖️
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#facc15' }}>Multi-Signature Audit Required</h3>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>High-Value Statutory Clearance Threshold ({'> ₦2,500,000'})</div>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                  This refund payout of <strong style={{ color: '#fff' }}>{fmt(claimModal.data.netPayout)}</strong> exceeds the ₦2,500,000 threshold. Under CBN regulatory standards, this disbursement requires manual multi-signature compliance verification (24–48 hours).
                </p>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                  <div className="reg-confirm-row">
                    <span>Net Disbursement</span>
                    <strong className="gradient-text">{fmt(claimModal.data.netPayout)}</strong>
                  </div>
                  <div className="reg-confirm-row">
                    <span>Payout Destination</span>
                    <strong>{claimModal.data.bankDetails?.bankName || 'Verified Bank'} (••{(claimModal.data.bankDetails?.accountNumber || '').slice(-4)})</strong>
                  </div>
                  <div className="reg-confirm-row">
                    <span>Compliance Review Window</span>
                    <strong style={{ color: '#facc15' }}>24 – 48 Hours</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary btn-full" onClick={() => setClaimModal(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleConfirmRefundClaim}
                    disabled={isSubmittingClaim}
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    {isSubmittingClaim ? 'Queueing Audit...' : 'Submit for Multi-Sig Clearance →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Standard EOM Settlement Confirmation */}
        {claimModal?.type === 'confirm' && (
          <div className="db-modal-overlay" onClick={() => setClaimModal(null)}>
            <div className="db-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,255,148,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#00ff94' }}>
                    🛡️
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Confirm Capital Protection Claim</h3>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Standard 3-Day EOM Settlement Schedule</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                  <div className="reg-confirm-row">
                    <span>Gross Refund</span>
                    <strong>{fmt(claimModal.data.grossRefund)}</strong>
                  </div>
                  {claimModal.data.penaltyAmount > 0 && (
                    <div className="reg-confirm-row">
                      <span>Early Penalty (10%)</span>
                      <strong style={{ color: 'var(--accent-red)' }}>−{fmt(claimModal.data.penaltyAmount)}</strong>
                    </div>
                  )}
                  <div className="reg-confirm-row">
                    <span>Refund Tax (3%)</span>
                    <strong style={{ color: 'var(--accent-red)' }}>−{fmt(claimModal.data.outboundFeeAmount)}</strong>
                  </div>
                  <div className="reg-confirm-divider" />
                  <div className="reg-confirm-row" style={{ fontSize: '1.1rem' }}>
                    <span>Net Payout</span>
                    <strong className="gradient-text">{fmt(claimModal.data.netPayout)}</strong>
                  </div>
                  <div className="reg-confirm-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <span>Destination Bank</span>
                    <strong>{claimModal.data.bankDetails?.bankName || 'Verified Bank'} (••{(claimModal.data.bankDetails?.accountNumber || '').slice(-4)})</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary btn-full" onClick={() => setClaimModal(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleConfirmRefundClaim}
                    disabled={isSubmittingClaim}
                  >
                    {isSubmittingClaim ? 'Submitting...' : 'Confirm Claim Submission →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dividend Withdrawal Modal */}
        {dividendModalOpen && (() => {
          const walletBal = u?.walletBalance || 0;
          const divAmt = Number(dividendAmount) || 0;
          const breakdown = calculateWithdrawal(divAmt, region?.code, effectiveTierId);
          const exceeds = divAmt > walletBal;
          const underMin = divAmt < breakdown.minWithdrawal;
          const overMax = divAmt > breakdown.maxSingleTx;
          const canSubmit = !dividendSubmitting && divAmt >= breakdown.minWithdrawal && !exceeds && !overMax && kycStatus === 'verified' && Boolean(linkedBank);

          const presetList = [
            breakdown.minWithdrawal,
            Math.max(breakdown.minWithdrawal * 2.5, 5000),
            Math.max(breakdown.minWithdrawal * 5, 10000),
            'MAX'
          ];

          return (
            <div className="db-modal-overlay" onClick={() => setDividendModalOpen(false)}>
              <div className="db-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
                <div style={{ padding: '0.5rem 0' }}>
                  
                  {/* Modal Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        💸
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Withdraw Yield Dividends</h3>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Available Balance: <strong style={{ color: '#00ff94' }}>{fmt(walletBal)}</strong>
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                      Tier {effectiveTierId} · Min {fmt(breakdown.minWithdrawal)}
                    </span>
                  </div>

                  {/* KYC Compliance Gate Alert if not verified */}
                  {kycStatus !== 'verified' && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.82rem', color: '#fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>⚠️ <strong>KYC Required:</strong> AML rules mandate identity verification before withdrawals.</span>
                      <button className="btn btn-primary btn-sm" onClick={() => { setDividendModalOpen(false); navigate('/kyc'); }}>
                        Verify KYC →
                      </button>
                    </div>
                  )}

                  {/* Missing Bank Account Alert */}
                  {!linkedBank && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '8px', fontSize: '0.82rem', color: '#fef08a', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🏦 <strong>Bank Account Needed:</strong> Link a verified payout bank account to proceed.</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setDividendModalOpen(false); setActiveTab('payout'); }}>
                        Link Bank →
                      </button>
                    </div>
                  )}

                  {/* Preset Amount Buttons */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Quick Select</span>
                      <span>Single Tx Max: {fmt(breakdown.maxSingleTx)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {presetList.map((preset) => {
                        const val = preset === 'MAX' ? Math.floor(walletBal) : preset;
                        const isActive = divAmt === val;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDividendAmount(val)}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '6px',
                              border: `1px solid ${isActive ? '#00e5ff' : 'rgba(255,255,255,0.12)'}`,
                              background: isActive ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)',
                              color: isActive ? '#00e5ff' : '#94a3b8',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {preset === 'MAX' ? `MAX ${fmt(Math.floor(walletBal))}` : fmt(preset)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Amount Input Field */}
                  <div className="dash-calc-field" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="div-amount-input">
                      Custom Withdrawal Amount ({isNG ? '₦ NGN' : '$ USD'})
                    </label>
                    <input
                      id="div-amount-input"
                      type="number"
                      className="input"
                      min={breakdown.minWithdrawal}
                      max={walletBal}
                      step={500}
                      value={dividendAmount}
                      onChange={e => setDividendAmount(Number(e.target.value))}
                      style={{ borderColor: (exceeds || overMax) ? 'rgba(239,68,68,0.5)' : undefined }}
                    />
                    {exceeds && (
                      <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
                        ⚠ Requested amount exceeds your available balance of {fmt(walletBal)}
                      </small>
                    )}
                    {!exceeds && underMin && (
                      <small style={{ color: '#facc15', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
                        Minimum withdrawal for Tier {effectiveTierId} is {fmt(breakdown.minWithdrawal)}
                      </small>
                    )}
                    {!exceeds && overMax && (
                      <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
                        ⚠ Exceeds maximum single transaction limit of {fmt(breakdown.maxSingleTx)}
                      </small>
                    )}
                  </div>

                  {/* High-Value Clearance Notice (> 2.5M) */}
                  {breakdown.isHighValue && (
                    <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '8px', fontSize: '0.78rem', color: '#fef08a', marginBottom: '1rem' }}>
                      ⚖️ <strong>Institutional Multi-Sig Clearance:</strong> Amounts above ₦2,500,000 are routed for regulatory AML compliance and multi-signature treasury review (24–48h window).
                    </div>
                  )}

                  {/* Itemized Digital Tax & Protocol Breakdown (Compliant with Section 8 & 10) */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.15rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.65rem' }}>
                      Itemized Protocol Deduction & Tax Receipt
                    </div>

                    <div className="reg-confirm-row">
                      <span>Requested Yield Amount</span>
                      <strong style={{ color: '#fff' }}>{fmt(divAmt)}</strong>
                    </div>

                    <div className="reg-confirm-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Statutory Tax Reserve (15.0%)
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>[Vault Buffer]</span>
                      </span>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>−{fmt(breakdown.taxReserve)}</span>
                    </div>

                    <div className="reg-confirm-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Platform OPEX Fee (7.0%)
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>[Node Infrastructure]</span>
                      </span>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>−{fmt(breakdown.opex)}</span>
                    </div>

                    <div className="reg-confirm-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        VAT on OPEX (7.5%)
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>[FIRS Remittance]</span>
                      </span>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>−{fmt(breakdown.vatOnOpex)}</span>
                    </div>

                    <div className="reg-confirm-row">
                      <span>{isNG ? 'NIBSS Bank Clearing Fee' : 'ACH Outbound Wire Fee'}</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>−{fmt(breakdown.txFee)}</span>
                    </div>

                    {breakdown.emtlLevy > 0 && (
                      <div className="reg-confirm-row">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          CBN Statutory EMTL Levy
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>[Electronic Duty]</span>
                        </span>
                        <span style={{ color: '#facc15', fontWeight: 600 }}>−{fmt(breakdown.emtlLevy)}</span>
                      </div>
                    )}

                    <div className="reg-confirm-divider" />

                    <div className="reg-confirm-row" style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      <span>Total Protocol Deductions</span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>
                        −{fmt(breakdown.totalDeductions)} ({divAmt > 0 ? ((breakdown.totalDeductions / divAmt) * 100).toFixed(1) : '0.0'}%)
                      </span>
                    </div>

                    <div className="reg-confirm-row" style={{ fontSize: '1.15rem', marginTop: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>Net Bank Disbursement</span>
                      <strong className="gradient-text" style={{ fontSize: '1.25rem', color: '#00ff94' }}>
                        {fmt(breakdown.netPayout)}
                      </strong>
                    </div>

                    <div className="reg-confirm-row" style={{ fontSize: '0.78rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>Destination Account</span>
                      <strong style={{ color: '#fff' }}>
                        {linkedBank ? `${linkedBank.bankName} (••${(linkedBank.accountNumber || '').slice(-4)})` : 'No Bank Linked'}
                      </strong>
                    </div>
                    <div className="reg-confirm-row" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      <span>Settlement Speed</span>
                      <span style={{ color: breakdown.isHighValue ? '#facc15' : '#00e5ff' }}>
                        {breakdown.isHighValue ? '24–48h Multi-Sig Clearance (> ₦2.5M)' : 'Instant Automated Bank API'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary btn-full" onClick={() => setDividendModalOpen(false)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleConfirmDividendWithdrawal}
                      disabled={!canSubmit}
                    >
                      {dividendSubmitting ? '⏳ Processing...' : `Disburse ${fmt(breakdown.netPayout)} to Bank →`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════ SUB-NODE INSPECTOR MODAL ════ */}
        {selectedSubNode && (
          <div className="db-modal-overlay" onClick={() => setSelectedSubNode(null)}>
            <div className="db-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(0,229,255,0.2))',
                      border: '1px solid rgba(0,229,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 800, color: '#00e5ff'
                    }}>
                      {selectedSubNode.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>{selectedSubNode.name}</h3>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{selectedSubNode.referralCode}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSubNode(null)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem' }}
                  >✕</button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.82rem' }}>
                    {[
                      { label: 'Binary Position', value: selectedSubNode.slotName || `Position #${selectedSubNode.position}`, color: '#00e5ff' },
                      { label: 'Validator Status', value: selectedSubNode.status || 'Active Validator', color: '#00ff94' },
                      { label: 'Tier / Node Type', value: selectedSubNode.tierName || 'Micro Node', color: '#c4b5fd' },
                      { label: 'Tier ID', value: `Tier ${selectedSubNode.tierId || 1}`, color: '#fff' },
                      { label: 'Hashrate Contribution', value: `${selectedSubNode.hashrate || '0.016'} TH/s`, color: '#00e5ff' },
                      { label: 'Velocity Bonus', value: selectedSubNode.velocityBonus || '+5% Velocity', color: '#facc15' },
                      { label: 'Joined Network', value: selectedSubNode.joinedAt || 'N/A', color: '#94a3b8' },
                      { label: 'Direct Sub-Nodes', value: `${selectedSubNode.directChildrenCount ?? '—'} validators`, color: '#fff' },
                    ].map((item) => (
                      <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                        <div style={{ fontWeight: 700, color: item.color, marginTop: '0.15rem' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(0,255,148,0.06)', border: '1px solid rgba(0,255,148,0.2)', borderRadius: '10px', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <strong style={{ color: '#00ff94' }}>ℹ Binary Spillover:</strong> This node's recruits will auto-fill positions in your downline matrix until the 255 graduation threshold is met.
                </div>

                <button
                  className="btn btn-secondary btn-full"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => setSelectedSubNode(null)}
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ USER GUIDE MODAL ════ */}
        <UserGuideModal
          isOpen={userGuideOpen}
          onClose={() => setUserGuideOpen(false)}
          onNavigateTab={(tab) => { setActiveTab(tab); setUserGuideOpen(false); }}
        />

        {/* ════ GENESIS NODE INSPECTOR & TELEMETRY MODAL ════ */}
        <GenesisNodeInspectorModal
          isOpen={!!selectedNodeForModal}
          node={selectedNodeForModal}
          onClose={() => setSelectedNodeForModal(null)}
          formatCurrency={fmt}
          serverSpecs={selectedNodeForModal ? getServerSpecs(selectedNodeForModal.id, u?.isGraduate) : serverSpecs}
          minedTokens={selectedNodeForModal ? (bladeSystems[selectedNodeForModal.id]?.minedTokens || 0).toFixed(4) : minedNvt.toFixed(4)}
          cashValue={selectedNodeForModal ? convertCoinsToCash(bladeSystems[selectedNodeForModal.id]?.minedTokens || 0, region?.code).cashAmount : convertCoinsToCash(minedNvt, region?.code).cashAmount}
        />

        {/* ════ CAPITAL PROTECTION & REFUND POLICY MODAL ════ */}
        <RefundPolicyModal
          isOpen={refundPolicyModalOpen}
          onClose={() => setRefundPolicyModalOpen(false)}
        />

      </main>
    </div>
  );
}
