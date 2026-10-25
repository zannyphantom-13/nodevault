# NodeVault — Pricing, Reward & Payout Structure

> **Two regions:** Nigeria (₦ NGN) · United States ($ USD)  
> **15 tiers total** — Tiers 1–8 (Multi-Pool) · Tiers 9–15 (Nexus+, Single Global Pool)

---

## 1. Node Tier Entry Fees

| Tier | Node Name | Category | Nigeria (₦) | United States ($) | Pool Type |
|------|-----------|----------|-------------|-------------------|-----------|
| 1  | Micro Node      | Small   | ₦1,000      | $1        | Multi-pool (up to 100 pools) |
| 2  | Spark Node      | Small   | ₦2,000      | $2        | Multi-pool (up to 90 pools)  |
| 3  | Alpha Node      | Small   | ₦4,000      | $4        | Multi-pool (up to 80 pools)  |
| 4  | Delta Node      | Small   | ₦8,000      | $8        | Multi-pool (up to 70 pools)  |
| 5  | Echo Node       | Small   | ₦16,000     | $16       | Multi-pool (up to 60 pools)  |
| 6  | Prime Node      | Mid     | ₦32,000     | $32       | Multi-pool (up to 50 pools)  |
| 7  | Sigma Node      | Mid     | ₦64,000     | $64       | Multi-pool (up to 40 pools)  |
| 8  | Omega Node      | Mid     | ₦128,000    | $128      | Multi-pool (up to 30 pools)  |
| 9  | Nexus Node      | Premium | ₦250,000    | $250      | **Single Global Pool** |
| 10 | Apex Node       | Premium | ₦400,000    | $400      | **Single Global Pool** |
| 11 | Zenith Node     | Premium | ₦640,000    | $640      | **Single Global Pool** |
| 12 | Nova Node       | Premium | ₦1,000,000  | $1,000    | **Single Global Pool** |
| 13 | Titan Node      | Premium | ₦1,500,000  | $1,500    | **Single Global Pool** |
| 14 | Sovereign Node  | Premium | ₦2,000,000  | $2,000    | **Single Global Pool** |
| 15 | Genesis Supreme | Elite   | ₦2,560,000  | $2,560    | **Single Global Pool** |

> Fee pattern: Tiers 1–8 double each step (×2). Tiers 9–15 step up by fixed premium increments.

---

## 2. Payout / Yield Structure

| Parameter | Value |
|-----------|-------|
| **Protocol Yield Rate (NTB)** | 17.5% APY |
| **Protocol Margin (held)** | 40% of entry fee |
| **Outbound Fee (withdrawal)** | 35% total — 30% Tax Reserve + 5% OPEX |
| **Refund Tax** | 3% only (no other taxes on refunds) |

### Withdrawal Minimums
| Region | Minimum Withdrawal |
|--------|--------------------|
| Nigeria | ₦10,000 |
| United States | $50 |

---

## 3. Refund Protection Tiers

Capital protection applies if a user wants to exit before full graduation.

| Refund Tier | Condition | Refund Amount | Notes |
|-------------|-----------|---------------|-------|
| **Tier A** | Zero gifts/yield received | **70% of entry fee** | End-of-month: no penalty. Early withdrawal: 10% penalty on refund. |
| **Tier B** | Gifts received but < 60% of entry fee | **Top-up to 60% cap** (60% minus received) | Locked for first **6 months**. Unlocks after month 6. |
| **Tier C** | Gifts ≥ 60% of entry fee | **₦0 / $0** | Disqualified from refund — yield cap met. |

#### Refund Example (Tier 5 Echo Node — Nigeria)
| Scenario | Entry Fee | Gifts Received | Gross Refund | 3% Tax | Net Payout |
|----------|-----------|----------------|--------------|--------|------------|
| Tier A (end of month) | ₦16,000 | ₦0 | ₦11,200 | ₦336 | **₦10,864** |
| Tier A (early) | ₦16,000 | ₦0 | ₦10,080 (−10%) | ₦302 | **₦9,778** |
| Tier B (after 6 mo) | ₦16,000 | ₦4,200 | ₦5,400 | ₦162 | **₦5,238** |
| Tier C | ₦16,000 | ₦10,000+ | — | — | **₦0** |

---

## 4. Pool Structure Rules

### Tiers 1–8 (Multi-Pool / Genesis Groups)
- Up to **100 pools** per tier (decreases by 10 per tier: 100, 90, 80 … 30)
- Each pool holds up to **100 members**
- **Top-20 bid slots** per pool — pool founders bid for top positions
- Pools ranked by bid amount (highest bid = highest rank)
- Bidding is enabled within pools

### Tiers 9–15 (Nexus Node and above — Single Global Pool)
- **Exactly 1 global pool per tier**
- No bidding, no leaderboard ranking within the pool
- All members join the single exclusive group
- Restricted access — highest commitment level

---

## 5. Free Mining ($NVT Token)

| Parameter | Nigeria | United States |
|-----------|---------|---------------|
| **Coin Value** | $0.0120 per coin | $0.1050 per coin |
| **Max daily payout** | $0.0120 (~₦18) | $0.1050 |
| **Sessions per day** | 20 sessions | 20 sessions |
| **Yield per session** | ~0.0465–0.0500 $NVT | same token, higher USD value |
| **Equipment: Energy** | 1 per session · Max 20/day (via watched ads) | same |
| **Equipment: Processor** | 20 uses · Max 1 processor/day (via Offerwall task) | same |
| **Session duration** | ~1 minute | ~1 minute |
| **Offline mining** | ✅ Yes — tamper-proof timestamp signed record | same |

---

## 6. Protocol Fees Summary

| Fee Type | Rate | Applied To |
|----------|------|------------|
| Outbound (withdrawal) | **35%** | All yield/gift withdrawals |
| — Tax Reserve portion | 30% | Held in protocol reserve |
| — OPEX portion | 5% | Operational expenses |
| Refund tax | **3%** | Applied to refund gross only |
| Early refund penalty (Tier A) | **10%** | Applied before 3% refund tax |
| Graduate exit penalty | **50%** | Applies if user exits after graduation |

---

## 7. Key Protocol Rules

- **Capital Protection Guarantee** — Entry fee is protected under Tier A/B refund system
- **6-month lock** — Tier B refunds are locked for the first 6 months after joining
- **Graduation** — Once a user's cumulative yield meets or exceeds their entry fee, they graduate (Tier C — no refund)
- **US Graduation** — System-wide exit enforced upon US user graduation
- **Sub-Node Network** — Users earn dividends from their referred sub-nodes
- **NTB Yield Rate** — 17.5% APY distributed via pool mechanics
- **No mention of reserve backing sources** — Platform does not disclose reserve fund composition to users
