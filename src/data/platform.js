// NodeVault — Core Platform Data & Calculation Engine
// Supports two regional modes: Nigeria (NGN) and US (USD)
// Group rule: Tiers 1–8 → max 100 pools. Tiers 9–15 (Nexus+) → 1 pool only.

// ══════════════════════════════════════════════════════
// ── POOL CAP RULE ──
//   Tiers 1–8:  Up to 100 Genesis Groups per tier
//   Tiers 9–15: SINGLE group per tier (Nexus Node and above)
// ══════════════════════════════════════════════════════
const MAX_POOLS_NEXUS_UP = 1;

function getMaxPools(tierId) {
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
function buildTiers(fees) {
  return TIER_DEFS.map((def, i) => ({
    ...def,
    fee:           fees[i],
    maxRefundTierA: parseFloat((fees[i] * 0.70).toFixed(2)),
    protocolMargin: parseFloat((fees[i] * 0.40).toFixed(2)),
    maxPools:       getMaxPools(def.id),
    singleGroup:    def.id >= 6,   // Tiers 6–15 are single pool
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
      graduates:        342,
      avgApy:           17.3,
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
      graduates:        118,
      avgApy:           17.5,
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
export const OUTBOUND_FEE_RATE     = 0.22; // 15% Tax Reserve + 7% OPEX
export const OUTBOUND_OPEX         = 0.07; // 7% Platform OPEX
export const OUTBOUND_TAX_RESERVE  = 0.15; // 15% Statutory Tax Reserve
export const REFUND_PROTECTION_RATE= 0.60;
export const REFUND_LOCK_MONTHS    = 6;
export const REFUND_TAX_RATE       = 0.03; // Only 3% tax for refunds
export const TIER_A_REFUND_RATE    = 0.70;
export const TIER_A_EARLY_PENALTY  = 0.10; // 10% early exit penalty
export const GRADUATE_PENALTY_RATE = 0.50;
export const INSTITUTIONAL_YIELD_RATE = 0.175;
export const NTB_YIELD_RATE        = INSTITUTIONAL_YIELD_RATE;
export const MAX_POOLS_PER_TIER    = 20;  // max pools for entry tiers (Tier 1)
export const TOP_BID_SLOTS         = 10;  // top bid slots (half of max pool count)

// ══════════════════════════════════════════════════════
// ── TIER AVAILABILITY — Entry-level only (Tiers 1–5) ──
// ══════════════════════════════════════════════════════
export const ENTRY_TIER_IDS = [1, 2, 3, 4, 5]; // Tiers 6–15 locked
export const isTierAvailable = (tierId) => ENTRY_TIER_IDS.includes(tierId);

// ══════════════════════════════════════════════════════
// ── MINING TOKEN & ENTERPRISE SERVER ENGINE ──
// ══════════════════════════════════════════════════════
export const COIN_SYMBOL   = '$NVT';
export const COIN_RATE_NGN = 18.00; // 1 $NVT = ₦18.00
export const COIN_RATE_USD = 0.0120; // 1 $NVT = $0.0120 (≈ ₦18 at ₦1,500/$)

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
    description: 'Autonomous protocol dividend server. 13% monthly protocol dividend payout.',
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
 * = tier.fee × 17.5% annual yield / 12 months (monthly gift award)
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
  // Each cycle = 1 token ($NVT) worth `rate` (₦18)
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
//   Platform OPEX Fee:          5.0% of base fee
//   Gateway Pass-Through:       3.0% of base fee (markup)
//   VAT:                        7.5% of (OPEX + Gateway) only
//   EMTL Levy:                  ₦50 flat on txns ≥ ₦10,000
//   Actual Paystack Cost:       1.5% capped at ₦2,000
//   Actual Monnify Fallback:    1.2% capped at ₦1,000
// ══════════════════════════════════════════════════════
export const CHECKOUT_OPEX_RATE    = 0.05;   // 5% platform operating fee
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
export const EARLY_EXIT_PENALTY_RATE = 0.10; // 10% for requests before 25th

// ══════════════════════════════════════════════════════
// ── CHECKOUT CALCULATION ENGINE ──
// Returns a full itemized breakdown for the user's payment modal.
// ══════════════════════════════════════════════════════
export function calculateCheckout(baseFee, regionCode = 'NG') {
  const isNG = regionCode === 'NG';

  // 1. Platform OPEX fee
  const opexFee = parseFloat((baseFee * CHECKOUT_OPEX_RATE).toFixed(2));

  // 2. Gateway pass-through markup (charged to user)
  const gatewayMarkup = parseFloat((baseFee * CHECKOUT_GATEWAY_RATE).toFixed(2));

  // 3. VAT: 7.5% applied ONLY to service fees (opex + gateway markup)
  const vatBase = opexFee + gatewayMarkup;
  const vatAmount = parseFloat((vatBase * CHECKOUT_VAT_RATE).toFixed(2));

  // 4. EMTL levy (NGN only, on transactions ≥ ₦10,000)
  const emtlLevy = (isNG && baseFee >= CHECKOUT_EMTL_THRESHOLD_NG) ? CHECKOUT_EMTL_NG : 0;

  // 5. Total charged to user
  const totalUserPays = parseFloat((baseFee + opexFee + gatewayMarkup + vatAmount + emtlLevy).toFixed(2));

  // 6. Actual gateway cost (Paystack primary, 1.5% capped)
  const cap = isNG ? PAYSTACK_CAP_NG : PAYSTACK_CAP_US;
  const actualGatewayCost = parseFloat(Math.min(baseFee * PAYSTACK_RATE, cap).toFixed(2));

  // 7. Net extra cash platform retains from fee spread
  const platformFeeSpread = parseFloat((gatewayMarkup - actualGatewayCost + opexFee).toFixed(2));

  // 8. VAT remitted to FIRS
  const vatRemittedToFIRS = vatAmount;

  return {
    baseFee,
    opexFee,
    gatewayMarkup,
    vatAmount,
    vatRemittedToFIRS,
    emtlLevy,
    totalUserPays,
    actualGatewayCost,
    platformFeeSpread,
    // Formatted line items for checkout UI
    lineItems: [
      { label: 'Node Staking Fee',              amount: baseFee,        note: 'Enters protocol vault' },
      { label: 'Platform Operating Fee (5.0%)', amount: opexFee,        note: 'Infrastructure & maintenance' },
      { label: 'Gateway & Network Fee (3.0%)',  amount: gatewayMarkup,  note: 'Payment processing charge' },
      { label: 'VAT on Fees (7.5%)',            amount: vatAmount,      note: 'Applied to service fees only' },
      ...(emtlLevy ? [{ label: 'Transfer Levy (EMTL)', amount: emtlLevy, note: 'CBN statutory bank duty' }] : []),
    ],
  };
}

// ── Outbound withdrawal calculation (gifts / dividends / refunds) ──
export function calculateWithdrawal(grossAmount, regionCode = 'NG', tierId = 1) {
  const isNG  = regionCode === 'NG';
  const gross = Math.max(0, Number(grossAmount) || 0);

  // 1. Statutory Tax Reserve (15.0% of gross) — platform reserve vault
  const taxReserve = parseFloat((gross * OUTBOUND_TAX_RESERVE).toFixed(2));

  // 2. Outbound OPEX Fee (7.0% of gross) — platform operations & maintenance
  const opex = parseFloat((gross * OUTBOUND_OPEX).toFixed(2));

  // 3. VAT on OPEX (7.5% applied to OPEX = 0.525% of gross) — remitted to FIRS
  const vatOnOpex = parseFloat((opex * CHECKOUT_VAT_RATE).toFixed(2));

  // 4. Outbound Bank Clearing Transfer Fee (₦100 flat / $1 USD)
  const txFee = isNG ? OUTBOUND_TRANSFER_FEE_NG : OUTBOUND_TRANSFER_FEE_US;

  // 5. CBN Electronic Money Transfer Levy (EMTL: ₦50 on transactions ≥ ₦10,000 for NGN)
  const emtlLevy = (isNG && gross >= CHECKOUT_EMTL_THRESHOLD_NG) ? CHECKOUT_EMTL_NG : 0;

  // Total Protocol Deductions
  const totalDeductions = parseFloat((taxReserve + opex + vatOnOpex + txFee + emtlLevy).toFixed(2));
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
    taxReserve,
    taxReserveRate: OUTBOUND_TAX_RESERVE,
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
      { label: 'Requested Yield Dividend', amount: gross, isDeduction: false, note: 'Gross disbursement from wallet' },
      { label: 'Statutory Tax Reserve (15.0%)', amount: taxReserve, isDeduction: true, note: 'Protocol tax buffer & audit reserve' },
      { label: 'Platform OPEX Fee (7.0%)', amount: opex, isDeduction: true, note: 'Infrastructure & cloud node operations' },
      { label: 'VAT on OPEX (7.5%)', amount: vatOnOpex, isDeduction: true, note: 'FIRS statutory remittance (0.525% effective)' },
      { label: isNG ? 'NIBSS Instant Transfer Fee' : 'ACH Outbound Wire Fee', amount: txFee, isDeduction: true, note: 'Flat inter-bank clearing charge' },
      ...(emtlLevy > 0 ? [{ label: 'CBN Statutory EMTL Levy', amount: emtlLevy, isDeduction: true, note: 'Electronic money transfer duty (≥ ₦10,000)' }] : []),
    ],
  };
}

// ══════════════════════════════════════════════════════
// ── REFUND CALCULATION ENGINE (currency-agnostic) ──
// ══════════════════════════════════════════════════════
export function calculateRefund(entryFee, cumulativeGifts, monthsActive = 0, isEndOfMonth = false) {
  const giftsRatio = entryFee > 0 ? cumulativeGifts / entryFee : 0;
  
  let eligibilityTier, grossRefund, note, badgeColor, penalty = 0;

  if (cumulativeGifts === 0) {
    // Tier A
    eligibilityTier = 'A';
    grossRefund     = entryFee * TIER_A_REFUND_RATE;
    if (!isEndOfMonth) {
      penalty = grossRefund * TIER_A_EARLY_PENALTY;
      note = 'Tier A Full Protection (Early Withdrawal - 10% penalty applied).';
      badgeColor = 'amber';
    } else {
      note = 'Tier A Full Protection — No yield distributions received (End of Month).';
      badgeColor = 'green';
    }
    grossRefund -= penalty;
  } else if (cumulativeGifts < entryFee * REFUND_PROTECTION_RATE) {
    // Tier B
    if (monthsActive < REFUND_LOCK_MONTHS) {
      eligibilityTier = 'Locked';
      grossRefund     = 0;
      note            = `Refunds are locked for the first ${REFUND_LOCK_MONTHS} months (Tier B).`;
      badgeColor      = 'amber';
    } else {
      eligibilityTier = 'B';
      grossRefund = (entryFee * REFUND_PROTECTION_RATE) - cumulativeGifts;
      note = `Tier B Partial Protection. Remaining balance up to 60% cap.`;
      badgeColor = 'green';
    }
  } else {
    // Tier C
    eligibilityTier = 'C';
    grossRefund     = 0;
    note            = `Tier C Disqualified — Yield distributions received (${(giftsRatio * 100).toFixed(1)}%) meet or exceed the 60% cap.`;
    badgeColor      = 'red';
  }

  // "tax of 3% applies to refund no other tax"
  const outboundFeeAmount = grossRefund * REFUND_TAX_RATE;
  const netPayout         = grossRefund - outboundFeeAmount;

  return {
    eligibilityTier,
    badgeColor,
    grossRefund:        parseFloat(grossRefund.toFixed(2)),
    penaltyAmount:      parseFloat(penalty.toFixed(2)),
    outboundFeeAmount:  parseFloat(outboundFeeAmount.toFixed(2)),
    netPayout:          parseFloat(netPayout.toFixed(2)),
    giftsRatio:         parseFloat((giftsRatio * 100).toFixed(1)),
    note,
    monthsActive,
  };
}

export function applyOutboundFee(gross) {
  const fee        = parseFloat((gross * OUTBOUND_FEE_RATE).toFixed(2));
  return { net: parseFloat((gross - fee).toFixed(2)), fee,
           opex: parseFloat((gross * OUTBOUND_OPEX).toFixed(2)),
           taxReserve: parseFloat((gross * OUTBOUND_TAX_RESERVE).toFixed(2)) };
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

// ══════════════════════════════════════════════════════
// ── MOCK DATA ──
// ══════════════════════════════════════════════════════
export const MOCK_USER_NG = {
  id: 'usr_ng_001', name: 'Chukwuemeka Obi', email: 'c.obi@nodevault.io',
  phone: '+234 816 592 9400', referralCode: 'NV-OBI-7X2K', region: 'NG',
  tier: TIER_DATA_NG[4], tierId: 5, entryFee: 16000, cumulativeGifts: 4200,
  joinDate: '2026-09-12', status: 'active', subNodes: 5,
  totalEarned: 4200, monthlyDividend: 0, poolId: 'pool_ng_t5_042',
  poolRank: 12, walletBalance: 4200,
  computeCredits: 120, powerUnits: 120, minedNvt: 65.5000,
  serverModel: 'Echo High-Throughput Server (v5.0)', isGraduate: false,
};

export const MOCK_USER_US = {
  id: 'usr_us_001', name: 'Marcus J. Reid', email: 'm.reid@nodevault.io',
  phone: '+1 (312) 555-0194', referralCode: 'NV-MJR-9K4P', region: 'US',
  tier: TIER_DATA_US[2], tierId: 3, entryFee: 4, cumulativeGifts: 0.80,
  joinDate: '2026-09-20', status: 'active', subNodes: 3,
  totalEarned: 0.80, monthlyDividend: 0, poolId: 'pool_us_t3_011',
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
