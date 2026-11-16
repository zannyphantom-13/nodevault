// NodeVault — Core Platform Data & Calculation Engine
// Supports two regional modes: Nigeria (NGN) and US (USD)
// Group rule: Tiers 1–8 → max 100 pools. Tiers 9–15 (Nexus+) → 1 pool only.

// ══════════════════════════════════════════════════════
// ── POOL CAP RULE ──
//   Tiers 1–8:  Up to 100 Genesis Groups per tier
//   Tiers 9–15: SINGLE group per tier (Nexus Node and above)
// ══════════════════════════════════════════════════════
const MAX_POOLS_NEXUS_UP = 1;

export function getMaxPools(tierId) {
  // Tiers 6–15: single pool (1)
  if (tierId >= 6) return 1;
  // Tiers 1–5: step down from 20 to 5
  const maxPoolsMap = { 1: 20, 2: 15, 3: 10, 4: 7, 5: 5 };
  return maxPoolsMap[tierId] || 1;
}


// ══════════════════════════════════════════════════════
// ── TIER DEFINITIONS ──
// Same 15 names & structure for both regions.
// Fees differ: NGN (₦) vs USD ($)
// ══════════════════════════════════════════════════════

const TIER_DEFS = [
  { id: 1,  label: 'Tier 1',        name: 'Micro Node',      category: 'small',   color: '#64748b' },
  { id: 2,  label: 'Tier 2',        name: 'Spark Node',      category: 'small',   color: '#818cf8' },
  { id: 3,  label: 'Tier 3',        name: 'Alpha Node',      category: 'small',   color: '#a78bfa' },
  { id: 4,  label: 'Tier 4',        name: 'Delta Node',      category: 'small',   color: '#38bdf8' },
  { id: 5,  label: 'Tier 5',        name: 'Echo Node',       category: 'small',   color: '#22d3ee' },
  { id: 6,  label: 'Tier 6',        name: 'Prime Node',      category: 'mid',     color: '#34d399' },
  { id: 7,  label: 'Tier 7',        name: 'Sigma Node',      category: 'mid',     color: '#4ade80' },
  { id: 8,  label: 'Tier 8',        name: 'Omega Node',      category: 'mid',     color: '#a3e635' },
  // ── Nexus and above: single group per tier ──
  { id: 9,  label: 'Tier 9',        name: 'Nexus Node',      category: 'premium', color: '#facc15' },
  { id: 10, label: 'Tier 10',       name: 'Apex Node',       category: 'premium', color: '#fb923c' },
  { id: 11, label: 'Tier 11',       name: 'Zenith Node',     category: 'premium', color: '#f87171' },
  { id: 12, label: 'Tier 12',       name: 'Nova Node',       category: 'premium', color: '#f472b6' },
  { id: 13, label: 'Tier 13',       name: 'Titan Node',      category: 'premium', color: '#c084fc' },
  { id: 14, label: 'Tier 14',       name: 'Sovereign Node',  category: 'premium', color: '#818cf8' },
  { id: 15, label: 'Tier 15 (Cap)', name: 'Genesis Supreme', category: 'elite',   color: '#00e5ff' },
];

// ── Nigeria fees (₦) ──
const FEES_NG = [1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000,
                 250000, 400000, 640000, 1000000, 1500000, 2000000, 2560000];

// ── US fees ($) — same 15 tiers, starts at $1, 2× doubling to $2,560 ──
const FEES_US = [1, 2, 4, 8, 16, 32, 64, 128,
                 250, 400, 640, 1000, 1500, 2000, 2560];

// ── Build tier array for a region ──
// Standard statutory capital protection guarantees 100% of validator principal
// returned upon scheduled settlement / maturity, less only statutory non-refundable inflow charges.
function buildTiers(fees) {
  return TIER_DEFS.map((def, i) => ({
    ...def,
    fee:                     fees[i],
    maxRefundTierA:          fees[i], // 100% Full Principal Returned
    standardPrincipalRefund: fees[i], // 100% Full Principal Returned
    protocolMargin:          parseFloat((fees[i] * 0.2284).toFixed(2)),
    maxPools:                getMaxPools(def.id),
    singleGroup:             def.id >= 6,   // Tiers 6–15 are single pool
  }));
}


export const TIER_DATA_NG = buildTiers(FEES_NG);
export const TIER_DATA_US = buildTiers(FEES_US);

// Convenience export
export const buildTierData = buildTiers;

// ── Region config ──
export const REGIONS = {
  NG: {
    code:     'NG',
    name:     'Nigeria',
    flag:     '🇳🇬',
    currency: 'NGN',
    symbol:   '₦',
    locale:   'en-NG',
    tiers:    TIER_DATA_NG,
    tierCount: 15,
    cap:      2560000,
    platformStats: {
      totalNodes:       18742,
      activePools:      1487,
      totalStaked:      4820000000,
      yieldDistributed: 963000000,
      activeValidators: 18742,
      avgApy:           12.7,
    },
  },
  US: {
    code:     'US',
    name:     'United States',
    flag:     '🇺🇸',
    currency: 'USD',
    symbol:   '$',
    locale:   'en-US',
    tiers:    TIER_DATA_US,
    tierCount: 15,
    cap:      2560,
    platformStats: {
      totalNodes:       9214,
      activePools:      697,
      totalStaked:      2840000,
      yieldDistributed: 412000,
      activeValidators: 9214,
      avgApy:           12.7,
    },
  },
};

// ── Category metadata ──
export const TIER_CATEGORIES = {
  small:   { label: 'Small Investment', description: 'Entry-level nodes. Perfect for first-time stakers.' },
  mid:     { label: 'Mid Tier',         description: 'Balanced nodes with solid yield velocity.' },
  premium: { label: 'Premium',          description: 'High-yield nodes. Single exclusive group per tier.' },
  elite:   { label: 'Genesis Elite',    description: 'Maximum protocol tier. One global group. Top protocol dividends.' },
};

// ══════════════════════════════════════════════════════
// ── PROTOCOL CONSTANTS (shared, currency-agnostic) ──
// ══════════════════════════════════════════════════════

// ── Outbound (withdrawal / payout) fee architecture ──
export const OUTBOUND_OPEX         = 0.03;  // 3% Platform OPEX on outbound payouts
export const OUTBOUND_FEE_RATE     = 0.03;  // Total outbound deduction = OPEX only (tax reserve removed)

// ── Refund & Statutory Capital Protection constants ──
// Under Federal Government Treasury Bill & NIBSS statutory regulation,
// 100% of user principal is protected and returned upon scheduled maturity,
// less only non-refundable statutory charges (OPEX, VAT, EMTL, gateway markup, early unbundling penalties).
export const REFUND_PROTECTION_RATE= 1.00;  // 100% Statutory Principal Protection
export const REFUND_LOCK_MONTHS    = 6;
export const REFUND_TAX_RATE       = 0.03;  // 3% processing fee on refund disbursements
export const TIER_A_REFUND_RATE    = 1.00;  // 100% Principal Floor
export const TIER_A_EARLY_PENALTY  = 0.10;  // 10% early exit penalty

// ── Institutional Sovereign Rate Engine (CBN / DMO 364D NTB Benchmark) ──
/**
 * Calculates Real / Investment Yield from NTB Stop Rate (Discount Rate d)
 * Formula for 364-day bill: Price = 100 - (d * 364/365 * 100)
 * Real Yield = d / (1 - (d * 364/365))
 */
export function calculateNTBRealYield(stopRatePct, tenorDays = 364) {
  const d = Number(stopRatePct) / 100;
  const factor = tenorDays / 365;
  const realYield = d / (1 - d * factor);
  return parseFloat((realYield * 100).toFixed(2));
}

/**
 * Calculates Net Customer Sovereign APY based on protocol fee:
 * Option A (REAL_YIELD_MINUS_FEE): Real Yield - Protocol Fee (e.g. 18.70% - 6.00% = 12.70%)
 * Option B (DISCOUNT_SPREAD): Real yield calculated on (Stop Rate - Protocol Fee) (e.g. 15.80% - 6.00% = 9.80% -> 10.90%)
 */
export function calculateCustomerAPY(stopRatePct, protocolFeePct = 6.0, model = 'REAL_YIELD_MINUS_FEE', tenorDays = 364) {
  if (model === 'DISCOUNT_SPREAD') {
    const netDiscount = Math.max(0, Number(stopRatePct) - Number(protocolFeePct));
    return calculateNTBRealYield(netDiscount, tenorDays);
  }
  const realYield = calculateNTBRealYield(stopRatePct, tenorDays);
  return parseFloat(Math.max(0, realYield - Number(protocolFeePct)).toFixed(2));
}

// Active Benchmark: Central Bank of Nigeria (CBN) 364-Day NTB Sovereign Auction
export const SOVEREIGN_BENCHMARK = {
  auctionCode: 'CBN-NTB-364D-2026-W46',
  tenorDays: 364,
  stopRate: 15.80,         // 15.80% Auction Stop Rate (Discount rate)
  realYield: 18.70,        // 18.70% Effective Real Investment Yield
  protocolFee: 6.00,       // 6.00% NodeVault Infrastructure & Risk Reserve Fee
  customerAPY: 12.70,      // 12.70% Net Sovereign APY to Customer
  feeModel: 'REAL_YIELD_MINUS_FEE',
  effectiveDate: '2026-11-05',
  settlementAgency: 'Central Bank of Nigeria (CBN) / DMO Primary Auction',
  status: 'active'
};

export function getActiveSovereignRate() {
  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('nodevault_sovereign_rate') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.customerAPY) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return SOVEREIGN_BENCHMARK;
}

export const INSTITUTIONAL_YIELD_RATE = SOVEREIGN_BENCHMARK.customerAPY / 100;  // 0.127 (12.7%)
export const NTB_YIELD_RATE           = INSTITUTIONAL_YIELD_RATE;

// ── Pool governance ──
export const MAX_POOLS_PER_TIER    = 20;   // max pools for entry tiers (Tier 1)
export const TOP_BID_SLOTS         = 10;   // top bid slots (half of max pool count)

// ── Referral Network Engine (OR logic — one rate per relationship type) ──
// 30% of investment is included as a Referral Programme Reserve on every deposit.
// This pool funds the below referral payouts — it is NOT a user bonus.
export const REFERRAL_POOL_DEPOSIT_RATE    = 0.30;   // 30% included in deposit → referral reserve pool
export const REFERRAL_ONETIME_RATE         = 0.15;   // OR: 15% one-time bonus to referrer on staking
export const REFERRAL_MAINLINE_RATE        = 0.01;   // OR: 1% per annum — direct mainline position
export const REFERRAL_DOWNLINE_RATE        = 0.001;  // OR: 0.1% per annum — binary downline per level
export const REFERRAL_DOWNLINE_MAX_LEVELS  = 7;      // Max binary tree depth

// ── Profit distribution (internal accounting only — not user-facing) ──
const INVESTOR_PROFIT_SHARE = 0.60; // 60% of net profit → investor distribution
const FOUNDER_PROFIT_SHARE  = 0.40; // 40% of net profit → founder
const _RISK_RESERVE_RATE    = 0.03; // Internal risk buffer — not stated to users

// ── Pool sellout completion bonus ──
export const POOL_COMPLETION_BONUS_RATE = 0.60; // 60% of net OPEX on pool completion

// ══════════════════════════════════════════════════════
// ── TIER AVAILABILITY — Entry-level only (Tiers 1–5) ──
// ══════════════════════════════════════════════════════
export const ENTRY_TIER_IDS = [1, 2, 3, 4, 5]; // Tiers 6–15 locked
export const isTierAvailable = (tierId) => ENTRY_TIER_IDS.includes(tierId);

// ══════════════════════════════════════════════════════
// ── MINING TOKEN & ENTERPRISE SERVER ENGINE ──
// ══════════════════════════════════════════════════════
export const COIN_SYMBOL   = '$NVT';
export const COIN_RATE_NGN = 10.00; // 1 $NVT = ₦10.00 (Fixed Parity: 1 Point = 1 NVT)
export const POINT_RATE_NVT = 1.0;  // 1 Point = 1 NVT
export const COIN_RATE_USD = 0.0100; // 1 $NVT = $0.0100 (≈ ₦10 at ₦1,000/$)

// ══════════════════════════════════════════════════════
// ── AFFILIATE PROGRAM SPECIFICATION (NVT ENGINE) ──
// Rates per ₦1,000 staked by the referred user:
// 1 Point = 1 NVT = ₦10.00 NGN
//
// 1. One-time: 15 points (15 NVT = ₦150) per ₦1,000 staked.
// 2. Mainline: 1 NVT / year (0.1 permanent + 0.9 conditional).
// 3. Downline: 0.1 NVT / year (0.01 permanent + 0.09 conditional).
//
// Payment Timing (CHANGED): Full amount (permanent + conditional) is paid AT THE BEGINNING
// into the affiliate's separate Referral NVT balance as soon as referred node is CONFIRMED.
//
// End-of-Tenure Audit: At 364 days, conditional portions for nodes cancelled at any
// point become DEBT deducted from Referral NVT balance (shortfall recovered from future earnings).
//
// Caps (on affiliate's own active stake):
//   Mainline: max 1000% of affiliate's own stake
//   Downline: max 1200% of affiliate's own stake
// ══════════════════════════════════════════════════════
export const AFFILIATE_CONFIG = {
  coinRateNgn: 10.00,
  pointsPerNvt: 1,
  options: {
    'one-time': {
      id: 'one-time',
      label: 'One-Time Referral Commission',
      ratePer1k: 15,             // 15 Points = 15 NVT per ₦1,000 staked
      permanentShare: 1.0,       // 100% permanent
      conditionalShare: 0.0,
      yearlyCapMultiplier: null, // No yearly cap
      description: '15 NVT points per ₦1,000 staked. Paid in full immediately into Referral NVT balance upon node confirmation.'
    },
    'mainline': {
      id: 'mainline',
      label: 'Mainline Annual Yield',
      ratePer1k: 1.0,            // 1 NVT per year per ₦1,000 staked (paid full at beginning)
      permanentRatePer1k: 0.1,   // 0.1 NVT permanent (never clawed back)
      conditionalRatePer1k: 0.9, // 0.9 NVT conditional (audited at end of 364D tenure)
      permanentShare: 0.10,      // 10%
      conditionalShare: 0.90,    // 90%
      yearlyCapMultiplier: 10.0, // 1000% of affiliate's own stake
      description: '1 NVT/yr per ₦1,000 staked. Full amount paid at beginning into Referral NVT balance. 0.1 permanent + 0.9 conditional. Max 1000% cap.'
    },
    'downline': {
      id: 'downline',
      label: 'Downline Network Yield',
      ratePer1k: 0.1,            // 0.1 NVT per year per ₦1,000 staked (paid full at beginning)
      permanentRatePer1k: 0.01,  // 0.01 NVT permanent (never clawed back)
      conditionalRatePer1k: 0.09,// 0.09 NVT conditional (audited at end of 364D tenure)
      permanentShare: 0.10,      // 10%
      conditionalShare: 0.90,    // 90%
      yearlyCapMultiplier: 12.0, // 1200% of affiliate's own stake
      description: '0.1 NVT/yr per ₦1,000 staked. Full amount paid at beginning into Referral NVT balance. 0.01 permanent + 0.09 conditional. Max 1200% cap.'
    }
  }
};

export const AFFILIATE_TIER_SCHEDULE = [
  { tier: 1,  name: 'Micro Node',      category: 'Small',   fee: 1000,    oneTimeNvt: 15,    mainlineNvt: 1,    downlineNvt: 0.1,   mainlineCapNvt: 1000,    downlineCapNvt: 1200 },
  { tier: 2,  name: 'Spark Node',      category: 'Small',   fee: 2000,    oneTimeNvt: 30,    mainlineNvt: 2,    downlineNvt: 0.2,   mainlineCapNvt: 2000,    downlineCapNvt: 2400 },
  { tier: 3,  name: 'Alpha Node',      category: 'Small',   fee: 4000,    oneTimeNvt: 60,    mainlineNvt: 4,    downlineNvt: 0.4,   mainlineCapNvt: 4000,    downlineCapNvt: 4800 },
  { tier: 4,  name: 'Delta Node',      category: 'Small',   fee: 8000,    oneTimeNvt: 120,   mainlineNvt: 8,    downlineNvt: 0.8,   mainlineCapNvt: 8000,    downlineCapNvt: 9600 },
  { tier: 5,  name: 'Echo Node',       category: 'Small',   fee: 16000,   oneTimeNvt: 240,   mainlineNvt: 16,   downlineNvt: 1.6,   mainlineCapNvt: 16000,   downlineCapNvt: 19200 },
  { tier: 6,  name: 'Prime Node',      category: 'Mid',     fee: 32000,   oneTimeNvt: 480,   mainlineNvt: 32,   downlineNvt: 3.2,   mainlineCapNvt: 32000,   downlineCapNvt: 38400 },
  { tier: 7,  name: 'Sigma Node',      category: 'Mid',     fee: 64000,   oneTimeNvt: 960,   mainlineNvt: 64,   downlineNvt: 6.4,   mainlineCapNvt: 64000,   downlineCapNvt: 76800 },
  { tier: 8,  name: 'Omega Node',      category: 'Mid',     fee: 128000,  oneTimeNvt: 1920,  mainlineNvt: 128,  downlineNvt: 12.8,  mainlineCapNvt: 128000,  downlineCapNvt: 153600 },
  { tier: 9,  name: 'Nexus Node',      category: 'Premium', fee: 250000,  oneTimeNvt: 3750,  mainlineNvt: 250,  downlineNvt: 25.0,  mainlineCapNvt: 250000,  downlineCapNvt: 300000 },
  { tier: 10, name: 'Apex Node',       category: 'Premium', fee: 400000,  oneTimeNvt: 6000,  mainlineNvt: 400,  downlineNvt: 40.0,  mainlineCapNvt: 400000,  downlineCapNvt: 480000 },
  { tier: 11, name: 'Zenith Node',     category: 'Premium', fee: 640000,  oneTimeNvt: 9600,  mainlineNvt: 640,  downlineNvt: 64.0,  mainlineCapNvt: 640000,  downlineCapNvt: 768000 },
  { tier: 12, name: 'Nova Node',       category: 'Premium', fee: 1000000, oneTimeNvt: 15000, mainlineNvt: 1000, downlineNvt: 100.0, mainlineCapNvt: 1000000, downlineCapNvt: 1200000 },
  { tier: 13, name: 'Titan Node',      category: 'Premium', fee: 1500000, oneTimeNvt: 22500, mainlineNvt: 1500, downlineNvt: 150.0, mainlineCapNvt: 1500000, downlineCapNvt: 1800000 },
  { tier: 14, name: 'Sovereign Node',  category: 'Premium', fee: 2000000, oneTimeNvt: 30000, mainlineNvt: 2000, downlineNvt: 200.0, mainlineCapNvt: 2000000, downlineCapNvt: 2400000 },
  { tier: 15, name: 'Genesis Supreme', category: 'Elite',   fee: 2560000, oneTimeNvt: 38400, mainlineNvt: 2560, downlineNvt: 256.0, mainlineCapNvt: 2560000, downlineCapNvt: 3072000 },
];

export const ENTERPRISE_SERVERS = {
  0: {
    tierId: 0,
    name: 'Public Community Pool',
    model: 'Public Shared Server (Community)',
    computeCore: 'Single-Thread Cloud Worker',
    powerAllocation: 'Standard Shared Grid',
    speedMultiplier: 1.0,
    cycleDurationSeconds: 60.0,
    hashrateThs: 0.0016,
    badgeColor: '#64748b',
    description: 'Public community mining rig. 60s processing cycle per block.',
  },
  1: {
    tierId: 1,
    name: 'Micro Node',
    model: 'Micro Node Server (v1.0)',
    computeCore: 'Dedicated Dual-Core Processor',
    powerAllocation: '120W Allocated Power Unit',
    speedMultiplier: 10,
    cycleDurationSeconds: 6.0,
    hashrateThs: 0.016,
    badgeColor: '#64748b',
    description: 'Dedicated dual-core cloud instance. 10× processing speed (6.0s/block).',
  },
  2: {
    tierId: 2,
    name: 'Spark Node',
    model: 'Spark Validator Server (v2.0)',
    computeCore: 'High-Frequency Quad Processor',
    powerAllocation: '240W Allocated Power Unit',
    speedMultiplier: 20,
    cycleDurationSeconds: 3.0,
    hashrateThs: 0.032,
    badgeColor: '#818cf8',
    description: 'High-frequency quad-core instance. 20× processing speed (3.0s/block).',
  },
  3: {
    tierId: 3,
    name: 'Alpha Node',
    model: 'Alpha Dedicated Server (v3.0)',
    computeCore: '8-Core Node Validator CPU',
    powerAllocation: '480W Allocated Power Unit',
    speedMultiplier: 40,
    cycleDurationSeconds: 1.5,
    hashrateThs: 0.064,
    badgeColor: '#a78bfa',
    description: '8-Core dedicated validator instance. 40× processing speed (1.5s/block).',
  },
  4: {
    tierId: 4,
    name: 'Delta Node',
    model: 'Delta Dedicated Server (v4.0)',
    computeCore: '16-Core Parallel Hash Engine',
    powerAllocation: '960W Dedicated Power Rail',
    speedMultiplier: 80,
    cycleDurationSeconds: 0.75,
    hashrateThs: 0.128,
    badgeColor: '#38bdf8',
    description: '16-Core parallel hash server. 80× processing speed (0.75s/block).',
  },
  5: {
    tierId: 5,
    name: 'Echo Node',
    model: 'Echo High-Throughput Server (v5.0)',
    computeCore: '32-Core Enterprise Hash Array',
    powerAllocation: '1.8kW Dedicated Power Rail',
    speedMultiplier: 160,
    cycleDurationSeconds: 0.38,
    hashrateThs: 0.256,
    badgeColor: '#22d3ee',
    description: '32-Core enterprise array. 160× processing speed (0.38s/block).',
  },
  6: {
    tierId: 6,
    name: 'Prime Node',
    model: 'Prime Enterprise Cluster (v6.0)',
    computeCore: 'Multi-Rack Validator Cluster',
    powerAllocation: 'High-Capacity Data Center Feed',
    speedMultiplier: 320,
    cycleDurationSeconds: 0.19,
    hashrateThs: 0.512,
    badgeColor: '#34d399',
    description: 'Enterprise data center cluster. 320× processing speed.',
  },
  7: {
    tierId: 7,
    name: 'Sigma Node',
    model: 'Sigma Enterprise Cluster (v7.0)',
    computeCore: 'Liquid-Cooled Sovereign Rack',
    powerAllocation: 'High-Capacity Data Center Feed',
    speedMultiplier: 640,
    cycleDurationSeconds: 0.10,
    hashrateThs: 1.024,
    badgeColor: '#4ade80',
    description: 'Liquid-cooled enterprise cluster. 640× processing speed.',
  },
  8: {
    tierId: 8,
    name: 'Omega Node',
    model: 'Omega Enterprise Cluster (v8.0)',
    computeCore: 'Cryo-Chilled Validator Array',
    powerAllocation: 'Dedicated Substation Feed',
    speedMultiplier: 1280,
    cycleDurationSeconds: 0.05,
    hashrateThs: 2.048,
    badgeColor: '#a3e635',
    description: 'Dedicated substation cluster. 1,280× processing speed.',
  },
  graduate: {
    tierId: 999,
    name: 'Genesis Master Validator',
    model: 'Protocol Master Validator Node',
    computeCore: 'Autonomous Sovereign Dividend Core',
    powerAllocation: 'Protocol-Subsidized Perpetual Feed',
    speedMultiplier: 5000,
    cycleDurationSeconds: 0.01,
    hashrateThs: 10.0,
    badgeColor: '#00e5ff',
    description: 'Protocol Graduate — Autonomous master validator. Elite status upon matrix completion.',
  }
};

export function getServerSpecs(tierId, isGraduate = false) {
  if (isGraduate) return ENTERPRISE_SERVERS.graduate;
  const tid = Number(tierId) || 0;
  if (ENTERPRISE_SERVERS[tid]) return ENTERPRISE_SERVERS[tid];
  if (tid >= 9 && tid <= 14) {
    const tier = TIER_DEFS.find(t => t.id === tid);
    return {
      tierId: tid,
      name: tier?.name || 'Nexus Node',
      model: `${tier?.name || 'Nexus'} Institutional Server`,
      computeCore: 'Multi-Grid Enterprise Cluster',
      powerAllocation: 'Direct Grid Injection',
      speedMultiplier: 2500,
      cycleDurationSeconds: 0.02,
      hashrateThs: 5.0,
      badgeColor: tier?.color || '#facc15',
      description: 'Institutional data center node. 2,500× processing speed.',
    };
  }
  if (tid === 15) {
    return {
      tierId: 15,
      name: 'Genesis Supreme',
      model: 'Genesis Supreme Data Center Node',
      computeCore: 'Apex Consensus Engine',
      powerAllocation: 'Dedicated Sovereign Infrastructure',
      speedMultiplier: 5000,
      cycleDurationSeconds: 0.01,
      hashrateThs: 10.0,
      badgeColor: '#00e5ff',
      description: 'Maximum tier enterprise infrastructure. 5,000× processing speed.',
    };
  }
  return ENTERPRISE_SERVERS[0];
}

// ══════════════════════════════════════════════════════
// ── PAID BLADE FUEL ENGINE ──
// Each paid blade has its own independent fuel tank.
// 1 Fuel Unit = the gift award for that specific tier.
// Gift award = tier fee × INSTITUTIONAL_YIELD_RATE / 12 months.
// Fuel is earned EXCLUSIVELY through network validation (block solving).
// Tier fuel values differ — higher tiers have bigger fuel unit values.
// ══════════════════════════════════════════════════════

/**
 * Returns the monetary value of 1 fuel unit for a given tier.
 * = tier.fee × 12% institutional yield / 12 months (monthly gift award)
 * This is tier-specific, so each blade's fuel unit is different.
 * @param {object} tier - A tier object with at least { fee, id }
 * @param {string} regionCode - 'NG' or 'US'
 */
export function getBladeFuelAward(tier, regionCode = 'NG') {
  const fee = Number(tier?.fee) || 0;
  // Monthly gift award = annual yield × fee / 12
  const monthlyAward = parseFloat((fee * INSTITUTIONAL_YIELD_RATE / 12).toFixed(2));
  return monthlyAward;
}

/**
 * Returns the initial fuel units a blade starts with.
 * Paid blades begin with 0 fuel — must be earned through validation.
 */
export const BLADE_INITIAL_FUEL = 0;

// ── Gift to Hardware Conversion (1:1 Equal Compute Credits + Power Units) ──
export function calculateGiftFuel(giftAmount, regionCode = 'NG') {
  const isNG = regionCode === 'NG';
  const rate = isNG ? COIN_RATE_NGN : COIN_RATE_USD;
  const amt = Number(giftAmount) || 0;
  if (amt <= 0) {
    return { cycles: 0, computeCredits: 0, powerUnits: 0, totalCoinsExpected: 0, coinRate: rate, remainingAmount: 0 };
  }
  // Each cycle = 1 token ($NVT) worth `rate` (₦10)
  const cycles = Math.floor(amt / rate);
  const totalCoinsExpected = cycles; // 1 cycle yields 1 coin
  const convertedAmount = parseFloat((cycles * rate).toFixed(2));
  const remainingAmount = parseFloat((amt - convertedAmount).toFixed(2));

  return {
    cycles,
    computeCredits: cycles,
    powerUnits: cycles,
    totalCoinsExpected,
    convertedAmount,
    remainingAmount,
    coinRate: rate,
  };
}

// ── Convert Mined Coins Back to Account Cash Balance ──
export function convertCoinsToCash(coins, regionCode = 'NG') {
  const isNG = regionCode === 'NG';
  const rate = isNG ? COIN_RATE_NGN : COIN_RATE_USD;
  const c = Math.max(0, Number(coins) || 0);
  const cashAmount = parseFloat((c * rate).toFixed(2));
  return {
    coins: c,
    coinRate: rate,
    cashAmount,
  };
}

// ══════════════════════════════════════════════════════
// ── WITHDRAWAL LIMITS ──
// ══════════════════════════════════════════════════════
export const WITHDRAWAL_LIMITS = {
  NG: {
    // Tier category → [minWithdrawal, maxSingleTx, maxDaily]
    small:   [2_000,    500_000,   1_000_000],
    mid:     [5_000,  2_000_000,   5_000_000],
    premium: [25_000, 5_000_000,  10_000_000],
    elite:   [25_000, 5_000_000,  10_000_000],
  },
  US: {
    small:   [10,   3_000,  6_000],
    mid:     [25,   5_000, 10_000],
    premium: [100, 10_000, 20_000],
    elite:   [100, 10_000, 20_000],
  },
};

// ── Convenience: single-category min (for UI display) ──
export const MIN_WITHDRAWAL_NG = 2_000;  // smallest category minimum (NGN)
export const MIN_WITHDRAWAL_US = 10;     // smallest category minimum (USD)

// ══════════════════════════════════════════════════════
// ── CHECKOUT FEE ARCHITECTURE (Paystack Primary) ──
//   Platform OPEX Fee (Inbound):  5.0% of base fee
//   Network Referral Reserve:    30.0% of base fee (funds referral pool)
//   Gateway Pass-Through:         3.0% of base fee (markup)
//   VAT:                          7.5% of (OPEX + Gateway) only
//   EMTL Levy:                   ₦50 flat on txns ≥ ₦10,000
//   Actual Paystack Cost:         1.5% capped at ₦2,000
//   Actual Monnify Fallback:      1.2% capped at ₦1,000
// ══════════════════════════════════════════════════════
export const CHECKOUT_OPEX_RATE    = 0.05;   // 5% platform operating fee (inbound)
export const CHECKOUT_REFERRAL_RESERVE_RATE = 0.30; // 30% referral programme reserve (inbound deposit inclusion)
export const CHECKOUT_GATEWAY_RATE = 0.03;   // 3% pass-through markup to user
export const CHECKOUT_VAT_RATE     = 0.075;  // 7.5% VAT on service fees only
export const CHECKOUT_EMTL_NG      = 50;     // ₦50 flat levy ≥ ₦10,000 (NGN only)
export const CHECKOUT_EMTL_THRESHOLD_NG = 10_000;

// Actual gateway costs (for platform net calculation)
export const PAYSTACK_RATE         = 0.015;  // 1.5%
export const PAYSTACK_CAP_NG       = 2_000;  // ₦2,000 cap
export const PAYSTACK_CAP_US       = 2;      // $2 cap
export const MONNIFY_RATE          = 0.012;  // 1.2%
export const MONNIFY_CAP_NG        = 1_000;  // ₦1,000 cap
export const MONNIFY_CAP_US        = 1;      // $1 cap

// Outbound transfer fee (what users see on withdrawals)
export const OUTBOUND_TRANSFER_FEE_NG = 100; // ₦100 flat
export const OUTBOUND_TRANSFER_FEE_US = 1;   // $1 flat

// ── Refund window policy ──
export const REFUND_WINDOW_START_DAY = 25; // Month-end window: 25th to 28th
export const REFUND_WINDOW_END_DAY   = 28;
export const REFUND_PROCESSING_DAYS  = 3;  // Minimum 3 business days
export const EARLY_EXIT_PENALTY_RATE = 0.10; // Default fallback early exit penalty

// ── NIBSS-Aligned Tenure-Graduated Liquidity Schedule ──
// Statutory Capital Protection ensures 100% principal return upon maturity / scheduled windows.
// Early exits incur only early unbundling fees deducted from the 100% principal.
export const EARLY_EXIT_SCHEDULE = [
  {
    tier: 'immediate',
    label: 'Emergency Immediate (Days 1–30)',
    minDays: 0,
    maxDays: 30,
    penaltyRate: 0.15, // 15% penalty
    effectiveFloorRate: 0.85, // 85% net principal returned
    settlementWindow: 'Audit + 48h NIBSS Dispatch',
    description: 'Immediate liquidity unlock within first 30 days of node deployment.',
  },
  {
    tier: 'early',
    label: 'Early Liquidity Unbundle (Days 31–90)',
    minDays: 31,
    maxDays: 90,
    penaltyRate: 0.10, // 10% penalty
    effectiveFloorRate: 0.90, // 90% net principal returned
    settlementWindow: 'Batch NIBSS Direct Credit (24–48h)',
    description: 'Mid-quarter unbundling from treasury backing reserves.',
  },
  {
    tier: 'late',
    label: 'Late Cycle Liquidity Release (Days 91–180)',
    minDays: 91,
    maxDays: 180,
    penaltyRate: 0.05, // 5% penalty
    effectiveFloorRate: 0.95, // 95% net principal returned
    settlementWindow: 'Automated NIBSS Direct Credit (24h)',
    description: 'Near-term release prior to the standard maturity unlock.',
  },
  {
    tier: 'standard',
    label: 'Scheduled Month-End Window (25th–28th) / 364-Day Maturity',
    minDays: 181,
    maxDays: Infinity,
    penaltyRate: 0.00, // 0% penalty
    effectiveFloorRate: 1.00, // 100% full principal returned
    settlementWindow: 'Instant Automated NIBSS Clearing',
    description: '100% full principal returned with zero emergency release penalty via Instant Automated NIBSS Clearing.',
  },
];

export function getEarlyExitBracket(days = 0, isEndOfMonth = false) {
  if (isEndOfMonth) {
    return EARLY_EXIT_SCHEDULE[3];
  }
  const match = EARLY_EXIT_SCHEDULE.find((bracket) => days <= bracket.maxDays);
  return match || EARLY_EXIT_SCHEDULE[0];
}

// ══════════════════════════════════════════════════════
// ── CHECKOUT CALCULATION ENGINE ──
// Returns a full itemized breakdown for the user's payment modal.
// ══════════════════════════════════════════════════════
export function calculateCheckout(baseFee, regionCode = 'NG', isFirstNodeRegistration = false, optInReferral = false) {
  const isNG = regionCode === 'NG';

  // 1. Platform OPEX fee (5% inbound)
  const opexFee = parseFloat((baseFee * CHECKOUT_OPEX_RATE).toFixed(2));

  // 2. Network Referral Programme Reserve (30% of base fee — funds referral pool)
  // ONLY charged when it is user's first node registration AND they explicitly opt into the referral programme!
  const isReferralEligible = Boolean(isFirstNodeRegistration && optInReferral);
  const referralReserve = isReferralEligible
    ? parseFloat((baseFee * CHECKOUT_REFERRAL_RESERVE_RATE).toFixed(2))
    : 0;

  // 3. Gateway pass-through markup (charged to user)
  const gatewayMarkup = parseFloat((baseFee * CHECKOUT_GATEWAY_RATE).toFixed(2));

  // 4. VAT: 7.5% applied ONLY to service fees (opex + gateway markup)
  const vatBase   = opexFee + gatewayMarkup;
  const vatAmount = parseFloat((vatBase * CHECKOUT_VAT_RATE).toFixed(2));

  // 5. EMTL levy (NGN only, on transactions ≥ ₦10,000)
  const emtlLevy = (isNG && baseFee >= CHECKOUT_EMTL_THRESHOLD_NG) ? CHECKOUT_EMTL_NG : 0;

  // 6. Total charged to user
  const totalUserPays = parseFloat(
    (baseFee + opexFee + referralReserve + gatewayMarkup + vatAmount + emtlLevy).toFixed(2)
  );

  // 7. Actual gateway cost (Paystack primary, 1.5% capped)
  const cap = isNG ? PAYSTACK_CAP_NG : PAYSTACK_CAP_US;
  const actualGatewayCost = parseFloat(Math.min(baseFee * PAYSTACK_RATE, cap).toFixed(2));

  // 8. Net extra cash platform retains from fee spread
  const platformFeeSpread = parseFloat((gatewayMarkup - actualGatewayCost + opexFee).toFixed(2));

  // 9. VAT remitted to FIRS
  const vatRemittedToFIRS = vatAmount;

  return {
    baseFee,
    opexFee,
    referralReserve,
    isReferralEligible,
    gatewayMarkup,
    vatAmount,
    vatRemittedToFIRS,
    emtlLevy,
    totalUserPays,
    actualGatewayCost,
    platformFeeSpread,
    // Formatted line items for checkout UI
    lineItems: [
      { label: 'Node Staking Principal',               amount: baseFee,         note: '100% Statutory Principal Protection' },
      ...(referralReserve > 0 ? [
        { label: 'One-Time Referral Network License (30%)', amount: referralReserve, note: 'Unlocks lifetime affiliate earnings' }
      ] : []),
      { label: 'Platform Operating Fee (5.0%)',        amount: opexFee,         note: 'Inbound infrastructure & hosting' },
      { label: 'Gateway & Network Fee (3.0%)',         amount: gatewayMarkup,   note: 'Payment processing charge' },
      { label: 'VAT on Fees (7.5%)',                   amount: vatAmount,       note: 'Applied to service fees only' },
      ...(emtlLevy ? [{ label: 'Transfer Levy (EMTL)', amount: emtlLevy,        note: 'CBN statutory bank duty' }] : []),
    ],
  };
}

// ── Outbound withdrawal calculation (gifts / payouts / refunds) ──
export function calculateWithdrawal(grossAmount, regionCode = 'NG', tierId = 1) {
  const isNG  = regionCode === 'NG';
  const gross = Math.max(0, Number(grossAmount) || 0);

  // 1. Outbound Platform OPEX Fee (3% of gross) — operations & maintenance
  const opex = parseFloat((gross * OUTBOUND_OPEX).toFixed(2));

  // 2. VAT on OPEX (7.5% of OPEX = 0.225% effective) — remitted to FIRS
  const vatOnOpex = parseFloat((opex * CHECKOUT_VAT_RATE).toFixed(2));

  // 3. Outbound Bank Clearing Transfer Fee (₦100 flat / $1 USD)
  const txFee = isNG ? OUTBOUND_TRANSFER_FEE_NG : OUTBOUND_TRANSFER_FEE_US;

  // 4. CBN Electronic Money Transfer Levy (₦50 on transactions ≥ ₦10,000 for NGN)
  const emtlLevy = (isNG && gross >= CHECKOUT_EMTL_THRESHOLD_NG) ? CHECKOUT_EMTL_NG : 0;

  // Total Protocol Deductions
  const totalDeductions = parseFloat((opex + vatOnOpex + txFee + emtlLevy).toFixed(2));
  const netPayout = parseFloat(Math.max(0, gross - totalDeductions).toFixed(2));

  // Tier Parameter Matrix Governance (Tiers 1–5 Small, Tiers 6–8 Mid, Tiers 9–15 Premium)
  const tid = Number(tierId) || 1;
  const tierCategory = tid <= 5 ? 'small' : tid <= 8 ? 'mid' : 'premium';
  const limits = WITHDRAWAL_LIMITS[isNG ? 'NG' : 'US'][tierCategory] || [2000, 500000, 1000000];
  const minWithdrawal = limits[0];
  const maxSingleTx = limits[1];
  const maxDailyLimit = limits[2];
  const isHighValue = isNG && gross > 2500000;

  return {
    grossAmount: gross,
    opex,
    opexRate: OUTBOUND_OPEX,
    vatOnOpex,
    txFee,
    emtlLevy,
    totalDeductions,
    netPayout,
    minWithdrawal,
    maxSingleTx,
    maxDailyLimit,
    isHighValue,
    tierCategory,
    lineItems: [
      { label: 'Requested Payout',                   amount: gross,      isDeduction: false, note: 'Gross disbursement from wallet' },
      { label: 'Platform Processing Fee (3.0%)',      amount: opex,       isDeduction: true,  note: 'Outbound OPEX & infrastructure' },
      { label: 'VAT on Processing Fee (7.5%)',        amount: vatOnOpex,  isDeduction: true,  note: 'FIRS statutory remittance (0.225% effective)' },
      { label: isNG ? 'NIBSS Instant Transfer Fee' : 'ACH Outbound Wire Fee', amount: txFee, isDeduction: true, note: 'Flat inter-bank clearing charge' },
      ...(emtlLevy > 0 ? [{ label: 'CBN Statutory EMTL Levy', amount: emtlLevy, isDeduction: true, note: 'Electronic money transfer duty (≥ ₦10,000)' }] : []),
    ],
  };
}

// ══════════════════════════════════════════════════════
// ── REFUND CALCULATION ENGINE (currency-agnostic) ──
// ══════════════════════════════════════════════════════
export function calculateRefund(entryFee, cumulativeGifts, monthsActive = 0, isEndOfMonth = false, holdingDays = 0) {
  const fee = Number(entryFee) || 0;
  const gifts = Number(cumulativeGifts) || 0;
  const giftsRatio = fee > 0 ? gifts / fee : 0;
  
  const days = holdingDays || (monthsActive * 30);
  const exitBracket = getEarlyExitBracket(days, isEndOfMonth);

  // 100% Principal Protection under Government / CBN Treasury Regulation
  // Penalty applies only to early unbundling (15% to 0% based on graduated schedule)
  const penalty = parseFloat((fee * exitBracket.penaltyRate).toFixed(2));
  const grossRefund = parseFloat((fee * exitBracket.effectiveFloorRate).toFixed(2));
  
  const eligibilityTier = exitBracket.penaltyRate === 0 ? 'Matured / Full' : 'Early Exit';
  const badgeColor = exitBracket.penaltyRate === 0 ? 'green' : 'cyan';
  const note = exitBracket.penaltyRate === 0
    ? '100% Principal Returned under Federal Statutory Policy. Automated NIBSS Instant Clearing.'
    : `Statutory Liquidity Release (${exitBracket.label} — ${(exitBracket.penaltyRate * 100).toFixed(0)}% early unbundling fee applied). Settlement: ${exitBracket.settlementWindow}.`;

  // Processing fee on disbursement
  const outboundFeeAmount = parseFloat((grossRefund * REFUND_TAX_RATE).toFixed(2));
  const netPayout = parseFloat(Math.max(0, grossRefund - outboundFeeAmount).toFixed(2));

  return {
    eligibilityTier,
    badgeColor,
    grossRefund,
    penaltyAmount: penalty,
    penaltyRate: exitBracket.penaltyRate,
    settlementWindow: exitBracket.settlementWindow,
    outboundFeeAmount,
    netPayout,
    giftsRatio: parseFloat((giftsRatio * 100).toFixed(1)),
    note,
    monthsActive,
    holdingDays: days,
  };
}

export function applyOutboundFee(gross) {
  const fee  = parseFloat((gross * OUTBOUND_FEE_RATE).toFixed(2));
  const opex = parseFloat((gross * OUTBOUND_OPEX).toFixed(2));
  return { net: parseFloat((gross - fee).toFixed(2)), fee, opex };
}

// ══════════════════════════════════════════════════════
// ── REFERRAL EARNINGS ENGINE ──
// OR logic — a node earns one rate based on its relationship type.
// The 30% Referral Reserve is collected at checkout on every deposit;
// these payouts are drawn from that pool.
//
// relationshipType:
//   'direct'   → one-time 15% bonus when referral first stakes
//   'mainline' → 1% per annum on the mainline direct referral
//   'downline'  → 0.1% per annum per level (max 7 binary levels)
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// ── AFFILIATE REWARD ENGINE (NVT POINTS) ──
// Rates per ₦1,000 staked by the referred user:
// 1 Point = 1 NVT = ₦10.00
// 
// 1. One-time: 15 points (15 NVT = ₦150) per ₦1,000 staked
// 2. Mainline: 1 NVT per year per ₦1,000 staked (0.1 permanent + 0.9 conditional)
// 3. Downline: 0.1 NVT per year per ₦1,000 staked (0.01 permanent + 0.09 conditional)
//
// Payment Timing (CHANGED): Full amount (permanent + conditional) is paid AT THE BEGINNING
// into the affiliate's separate Referral NVT balance as soon as referred node is CONFIRMED.
//
// End-of-Tenure Audit: At 364 days, conditional portions for nodes cancelled at any
// point become DEBT deducted from Referral NVT balance (shortfall recovered from future earnings).
//
// Inactive Rule: Permanent parts wait and never stack (max 1 waiting portion per node).
// Yearly Cap: Max 1000% (mainline) or 1200% (downline) of affiliate's own stake.
// ══════════════════════════════════════════════════════
export function calculateAffiliateRewards({
  programOption = 'mainline', // 'one-time' | 'mainline' | 'downline'
  affiliateStake = 1000,      // Affiliate's own active stake in NGN
  referredNodes = [],         // Array of { nodeId, userId, stakeAmount, status, cancelledInCycle, confirmed }
  cycleDaysElapsed = 0,       // Days into affiliate's 364-day cycle
  affiliateIsActive = true,
  claimedEarningsNVT = 0,     // Total already credited in current cycle toward cap
  currentDebtNVT = 0          // Existing carried-forward debt
}) {
  const opt = AFFILIATE_CONFIG.options[programOption] || AFFILIATE_CONFIG.options['mainline'];
  
  // 1. Calculate Yearly Cap in NVT (Section 9)
  // Example: ₦1,000 stake -> 1,000 NVT (mainline 1000%) or 1,200 NVT (downline 1200%)
  const yearlyCapNVT = opt.yearlyCapMultiplier 
    ? (affiliateStake / 1000) * (opt.id === 'mainline' ? 1000 : 1200)
    : Infinity;

  const remainingCapNVT = Math.max(0, yearlyCapNVT - claimedEarningsNVT);

  let totalPermanentNVT = 0;
  let totalConditionalNVT = 0;
  let tenureDebtNVT = 0;
  let waitingPermanentNVT = 0;
  const nodeBreakdowns = [];

  for (const node of referredNodes) {
    const stake = Number(node.stakeAmount) || 0;
    const unitsOf1k = stake / 1000;

    let nodePermanent = 0;
    let nodeConditional = 0;

    if (opt.id === 'one-time') {
      nodePermanent = unitsOf1k * 15; // 15 points (15 NVT)
      nodeConditional = 0;
    } else if (opt.id === 'mainline') {
      nodePermanent = unitsOf1k * 0.1; // 0.1 NVT permanent
      nodeConditional = unitsOf1k * 0.9; // 0.9 NVT conditional
    } else if (opt.id === 'downline') {
      nodePermanent = unitsOf1k * 0.01; // 0.01 NVT permanent
      nodeConditional = unitsOf1k * 0.09; // 0.09 NVT conditional
    }

    const wasCancelled = Boolean(node.cancelledInCycle || node.status === 'cancelled');

    // Section 7: If affiliate is inactive, permanent part waits (never stacks)
    if (!affiliateIsActive) {
      waitingPermanentNVT += nodePermanent;
    }

    // Section 6: End-of-tenure audit check (at 364 days)
    // If node was cancelled at any point, conditional part becomes debt
    if (cycleDaysElapsed >= 364 && wasCancelled) {
      tenureDebtNVT += nodeConditional;
    }

    totalPermanentNVT += nodePermanent;
    totalConditionalNVT += nodeConditional;

    nodeBreakdowns.push({
      nodeId: node.nodeId,
      userId: node.userId,
      stakeAmount: stake,
      permanentNVT: parseFloat(nodePermanent.toFixed(4)),
      conditionalNVT: parseFloat(nodeConditional.toFixed(4)),
      fullInitialNVT: parseFloat((nodePermanent + nodeConditional).toFixed(4)),
      wasCancelled,
      status: wasCancelled ? 'cancelled' : (node.status || 'active'),
    });
  }

  // Section 4: Full amount (permanent + conditional) paid at beginning if affiliate is active
  const totalGrossDueNVT = affiliateIsActive
    ? totalPermanentNVT + totalConditionalNVT
    : 0;

  // Payout capped at remaining cap
  const cappedGrossPayoutNVT = parseFloat(Math.min(totalGrossDueNVT, remainingCapNVT).toFixed(4));

  // Section 8: Debt recovery
  const totalOwedDebt = currentDebtNVT + tenureDebtNVT;
  const debtDeducted = Math.min(cappedGrossPayoutNVT, totalOwedDebt);
  const netReleasedToBalanceNVT = parseFloat((cappedGrossPayoutNVT - debtDeducted).toFixed(4));
  const remainingShortfallDebtNVT = parseFloat((totalOwedDebt - debtDeducted).toFixed(4));

  const isMatured = cycleDaysElapsed >= 364;

  return {
    programOption: opt.id,
    programLabel: opt.label,
    affiliateStake,
    yearlyCapNVT,
    remainingCapNVT,
    totalPermanentNVT: parseFloat(totalPermanentNVT.toFixed(4)),
    totalConditionalNVT: parseFloat(totalConditionalNVT.toFixed(4)),
    totalFullRewardNVT: parseFloat((totalPermanentNVT + totalConditionalNVT).toFixed(4)),
    cappedGrossPayoutNVT,
    tenureDebtNVT: parseFloat(tenureDebtNVT.toFixed(4)),
    totalOwedDebt: parseFloat(totalOwedDebt.toFixed(4)),
    debtDeducted: parseFloat(debtDeducted.toFixed(4)),
    netReleasedToBalanceNVT,
    remainingShortfallDebtNVT,
    waitingPermanentNVT: parseFloat(waitingPermanentNVT.toFixed(4)),
    isMatured,
    nodeBreakdowns,
  };
}

export function calculateReferralEarnings(stakingFee, relationshipType, levelDepth = 1) {
  const fee = Math.max(0, Number(stakingFee) || 0);
  let earnings = 0;
  let description = '';

  if (relationshipType === 'direct') {
    // One-time bonus on staking event
    earnings    = parseFloat((fee * REFERRAL_ONETIME_RATE).toFixed(2));
    description = 'Direct Referral Activation Bonus (15% one-time)';
  } else if (relationshipType === 'mainline') {
    // Annual recurring — mainline direct position
    earnings    = parseFloat((fee * REFERRAL_MAINLINE_RATE).toFixed(2));
    description = 'Mainline Network Position Yield (1% per annum)';
  } else if (relationshipType === 'downline') {
    // Annual per level — binary downline (max 7 levels)
    const depth = Math.min(Math.max(1, Number(levelDepth) || 1), REFERRAL_DOWNLINE_MAX_LEVELS);
    earnings    = parseFloat((fee * REFERRAL_DOWNLINE_RATE).toFixed(2));
    description = `Binary Downline Yield — Level ${depth} (0.1% per annum)`;
  }

  return {
    stakingFee:       fee,
    relationshipType,
    earnings,
    description,
    annualised:       relationshipType === 'direct' ? null : earnings, // direct is one-time only
  };
}

// ══════════════════════════════════════════════════════
// ── INTERNAL PROFIT SPLIT ENGINE (not user-facing) ──
// Distributes net platform profit after all operating costs & taxes.
// 60% → Investor distribution pool | 40% → Founder allocation
// ══════════════════════════════════════════════════════
function calculateProfitSplit(netProfit) {
  const profit = Math.max(0, Number(netProfit) || 0);
  return {
    netProfit:        parseFloat(profit.toFixed(2)),
    investorShare:    parseFloat((profit * INVESTOR_PROFIT_SHARE).toFixed(2)),
    founderShare:     parseFloat((profit * FOUNDER_PROFIT_SHARE).toFixed(2)),
    investorRate:     INVESTOR_PROFIT_SHARE,
    founderRate:      FOUNDER_PROFIT_SHARE,
  };
}

// ══════════════════════════════════════════════════════
// ── POOL COMPLETION SELLOUT REVENUE ──
// When a pool fills all 255 nodes, the platform recognises
// a Protocol Completion Bonus = 60% of the pool's net OPEX income.
// ══════════════════════════════════════════════════════
export function calculatePoolCompletionBonus(poolNetOpex) {
  const opexNet = Math.max(0, Number(poolNetOpex) || 0);
  const bonus   = parseFloat((opexNet * POOL_COMPLETION_BONUS_RATE).toFixed(2));
  return {
    poolNetOpex: opexNet,
    completionBonus: bonus,
    rate: POOL_COMPLETION_BONUS_RATE,
  };
}

// ══════════════════════════════════════════════════════
// ── FORMATTERS (region-aware) ──
// ══════════════════════════════════════════════════════
export function formatCurrency(amount, region) {
  const r = region || REGIONS.NG;
  if (amount === undefined || amount === null || isNaN(amount)) return `${r.symbol}0`;
  const decimals = r.code === 'US' ? 2 : 0;
  return r.symbol + Number(amount).toLocaleString(r.locale, {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
}

export function formatCurrencyCompact(amount, region) {
  const r = region || REGIONS.NG;
  if (!amount) return `${r.symbol}0`;
  if (r.code === 'NG') {
    if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(0)}K`;
    return formatCurrency(amount, r);
  }
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${Number(amount).toFixed(2)}`;
}

// Backward-compat helpers
export const formatNaira        = (a) => formatCurrency(a, REGIONS.NG);
export const formatNairaCompact = (a) => formatCurrencyCompact(a, REGIONS.NG);

// ── $NVT Dual Projection Engine (Fixed Parity: 1 $NVT = ₦10.00 NGN | 1 Point = 1 NVT) ──
export function toNVT(ngnAmount) {
  const amt = Number(ngnAmount) || 0;
  return amt / COIN_RATE_NGN;
}

export function formatNVT(nvtAmount, compact = false) {
  const amt = Number(nvtAmount) || 0;
  if (compact && amt >= 1000) {
    if (amt >= 1_000_000) return `$NVT ${(amt / 1_000_000).toFixed(2)}M`;
    return `$NVT ${(amt / 1000).toFixed(1)}K`;
  }
  return `$NVT ${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatProjected(ngnAmount, mode = 'NGN', compact = false) {
  const amt = Number(ngnAmount) || 0;
  if (mode === 'NVT') {
    return formatNVT(toNVT(amt), compact);
  }
  if (compact && amt >= 1000) {
    return formatNairaCompact(amt);
  }
  return formatNaira(amt);
}

// ══════════════════════════════════════════════════════
// ── MOCK DATA ──
// ══════════════════════════════════════════════════════
export const MOCK_USER_NG = {
  id: 'usr_ng_001', name: 'Chukwuemeka Obi', email: 'c.obi@nodevault.io',
  phone: '+234 816 592 9400', referralCode: 'NV-OBI-7X2K', region: 'NG',
  tier: TIER_DATA_NG[4], tierId: 5, entryFee: 16000, cumulativeGifts: 4200,
  joinDate: '2026-09-12', status: 'active', subNodes: 5,
  totalEarned: 4200, poolId: 'pool_ng_t5_042',
  poolRank: 12, walletBalance: 4200,
  computeCredits: 120, powerUnits: 120, minedNvt: 65.5000,
  serverModel: 'Echo High-Throughput Server (v5.0)', isGraduate: false,
};

export const MOCK_USER_US = {
  id: 'usr_us_001', name: 'Marcus J. Reid', email: 'm.reid@nodevault.io',
  phone: '+1 (312) 555-0194', referralCode: 'NV-MJR-9K4P', region: 'US',
  tier: TIER_DATA_US[2], tierId: 3, entryFee: 4, cumulativeGifts: 0.80,
  joinDate: '2026-09-20', status: 'active', subNodes: 3,
  totalEarned: 0.80, poolId: 'pool_us_t3_011',
  poolRank: 7, walletBalance: 0.80,
  computeCredits: 40, powerUnits: 40, minedNvt: 12.0000,
  serverModel: 'Alpha Dedicated Server (v3.0)', isGraduate: false,
};

const POOL_FOUNDERS = [
  'Genesis Alpha', 'Prime Validator', 'Vault Guardian', 'Node Oracle',
  'Yield Sentinel', 'Capital Nexus', 'Chain Warden', 'Protocol Sage',
];

// ── Build mock pools respecting single-group rule ──
function buildMockPools(tierData) {
  return tierData.map((tier, idx) => {
    const isSingleGroup = tier.singleGroup;
    const poolCount     = isSingleGroup ? 1 : 6;

    const pools = Array.from({ length: poolCount }, (_, i) => ({
      id:         `pool_t${tier.id}_${String(i + 1).padStart(3, '0')}`,
      name:       isSingleGroup
                    ? `${tier.name} — Global Pool`
                    : `${tier.name} Pool #${String(i + 1).padStart(2, '0')}`,
      founder:    POOL_FOUNDERS[i % POOL_FOUNDERS.length],
      bidAmount:  isSingleGroup ? null : Math.round((idx + 1) * (6 - i) * 8500),
      members:    Math.floor(15 + Math.random() * 85),
      maxMembers: 100,
      apy:        (14 + idx * 0.35).toFixed(2),
      featured:   !isSingleGroup && i < 2,
      isSingleGroup,
      // Single-group pools have no bidding, no leaderboard ranking
      biddingEnabled: !isSingleGroup,
    }));

    return {
      tierId:        tier.id,
      tierName:      tier.name,
      tierFee:       tier.fee,
      tierColor:     tier.color,
      tierCategory:  tier.category,
      maxPools:      tier.maxPools,
      singleGroup:   isSingleGroup,
      pools:         isSingleGroup ? pools : pools.sort((a, b) => b.bidAmount - a.bidAmount),
    };
  });
}

export const MOCK_POOLS_NG = buildMockPools(TIER_DATA_NG);
export const MOCK_POOLS_US = buildMockPools(TIER_DATA_US);

// ── Mock referral tree ──
export const MOCK_TREE = {
  id: 'self', name: 'You', tierId: 5, status: 'active',
  children: [
    { id: 'n1', name: 'Amaka E.',   tierId: 5, status: 'active',
      children: [
        { id: 'n1a', name: 'Bello K.',  tierId: 3, status: 'active',  children: [] },
        { id: 'n1b', name: 'Funmi O.',  tierId: 2, status: 'pending', children: [] },
      ],
    },
    { id: 'n2', name: 'Dayo M.',    tierId: 4, status: 'active',
      children: [{ id: 'n2a', name: 'Ngozi P.', tierId: 5, status: 'active', children: [] }],
    },
    { id: 'n3', name: 'Ifeanyi U.', tierId: 2, status: 'pending', children: [] },
    { id: 'n4', name: 'Chinwe S.',  tierId: 3, status: 'active',  children: [] },
    { id: 'n5', name: 'Emeka R.',   tierId: 1, status: 'pending', children: [] },
  ],
};

export const PLATFORM_STATS = REGIONS.NG.platformStats;
