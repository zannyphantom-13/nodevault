# 🔷 NodeVault — Decentralized Yield Node Platform

> **Stack:** React 18 + Vite + React Router + Vanilla CSS  
> **Target Directory:** `c:\Users\Hassan\Desktop\the scheme`  
> **Currency:** Nigerian Naira (₦)

---

## 1. Platform Identity & Terminology

| Raw Concept | Platform Terminology |
|---|---|
| Entry Fee | **Liquidity Node Staking Fee** |
| Referral / Downline | **Sub-Node / Network Validation Velocity** |
| Refund | **Capital Protection Guarantee** |
| Monthly Payout | **Yield Dividend** |
| Group / Pool | **Genesis Node Pool** |
| Completed Member | **Protocol Graduate** |
| Leaderboard | **Featured High-Yield Pools Leaderboard** |

---

## 2. Tier System (15 Tiers — Cap at ₦2,560,000)

> Tiers 1–5 are **Small Investment Tiers** (≤ ₦16,000). Tiers 6–8 continue 2× doubling. Tiers 9–15 step up to the ₦2,560,000 protocol cap.

| Tier | Node Name | Staking Fee | Max Refund (Tier A) | Protocol Margin |
|---|---|---|---|---|
| 1 ⭐ Small | Micro Node | ₦1,000 | ₦700 | ₦300 |
| 2 ⭐ Small | Spark Node | ₦2,000 | ₦1,400 | ₦600 |
| 3 ⭐ Small | Alpha Node | ₦4,000 | ₦2,800 | ₦1,200 |
| 4 ⭐ Small | Delta Node | ₦8,000 | ₦5,600 | ₦2,400 |
| 5 ⭐ Small | Echo Node | ₦16,000 | ₦11,200 | ₦4,800 |
| 6 | Prime Node | ₦32,000 | ₦22,400 | ₦9,600 |
| 7 | Sigma Node | ₦64,000 | ₦44,800 | ₦19,200 |
| 8 | Omega Node | ₦128,000 | ₦89,600 | ₦38,400 |
| 9 | Nexus Node | ₦250,000 | ₦175,000 | ₦75,000 |
| 10 | Apex Node | ₦400,000 | ₦280,000 | ₦120,000 |
| 11 | Zenith Node | ₦640,000 | ₦448,000 | ₦192,000 |
| 12 | Nova Node | ₦1,000,000 | ₦700,000 | ₦300,000 |
| 13 | Titan Node | ₦1,500,000 | ₦1,050,000 | ₦450,000 |
| 14 | Sovereign Node | ₦2,000,000 | ₦1,400,000 | ₦600,000 |
| 15 🔴 Cap | Genesis Supreme | ₦2,560,000 | ₦1,792,000 | ₦768,000 |

---

## 3. Refund Eligibility Engine (Net Calculation Rules)

### Tier A — Full Protection (0% gifts received)
```
Gross Refund = Entry Fee × 0.70
```

### Tier B — Partial Protection (gifts received < 70% of Entry Fee)
```
Gross Refund = (Entry Fee − Cumulative Gifts Received) × 0.55
```

### Tier C — Disqualified (gifts received ≥ 70% of Entry Fee)
```
Gross Refund = ₦0   [Fully breakeven under protocol rules]
```

---

## 4. Outbound Fee Engine

### Standard Outbound (all payouts, refunds, dividends)
```
Net Payout = Gross Amount × (1 − 0.20)
           = Gross Amount × 0.80
```
- 5% → Platform OPEX & Profit Margin  
- 15% → Statutory Tax Reserve (VAT / corporate tax provision)

### Emergency Early Exit (<14 days)
```
Final Disbursed = (Gross Refund × 0.90) × 0.80
```
- 10% early exit penalty applied first, then 20% outbound fee

---

## 5. Group/Pool Architecture

- **Max Pools per Tier:** 100 Genesis Groups  
- **Load Balancing:** Unassigned members distributed uniformly across all 100 pools  
- **Pool Founder Bid:** One-time boost bid for leaderboard placement  
- **Top-20 Leaderboard:** Highest 20 bids featured at top of marketplace  
- **Proof of Trust Metric:** "Total Bidding Stake Accumulated" displayed publicly  

---

## 6. Graduate Dividend System

- Completing full matrix progression → **Protocol Graduate Status**
- Monthly dividend funded from protocol activity (15–20% p.a.)
- **50% Penalty Rule:** If any downline member requests a Tier A/B refund, graduate's dividend is halved that month

---

## 7. Platform Revenue Streams

| Source | Mechanism |
|---|---|
| Protocol Yield | 15–20% p.a. on reserve vault |
| Auction Fees | 100% of pool boost bids → platform profit |
| Outbound Network Fee | 5% net margin on all outbound transactions |
| Tax Reserve Float | 15% tax provision earns float income before remittance |
| Early Exit Penalty | 10% retained on emergency refunds |

---

## 8. Frontend Route Map

```
/                        → Landing / Hero (platform intro, CTA)
/tiers                   → Tier Marketplace (all 9 tiers + pools leaderboard)
/register                → Registration + Tier Selection (Step 1)
/verify                  → OTP / Wallet Verification (Step 2)
/dashboard               → User Dashboard
  /dashboard/stake        → Node staking overview
  /dashboard/network      → Sub-node tree (referral network)
  /dashboard/refund       → Refund eligibility calculator
  /dashboard/dividends    → Graduate dividend tracker
/pools/:tierId           → Pool Detail + Bidding Engine
/admin                   → Admin Panel
  /admin/users            → User management
  /admin/refunds          → Refund approval queue
  /admin/pools            → Pool & bid management
  /admin/dividends        → Graduate dividend controls
  /admin/revenue          → Revenue analytics
```

---

## 9. Design System

- **Theme:** Dark mode, futuristic DeFi aesthetic
- **Primary Color:** Deep Indigo / Electric Cyan gradient
- **Font:** "Space Grotesk" (headings) + "Inter" (body)
- **Accents:** Neon green (#00FF94) for yields/gains, Amber (#F59E0B) for warnings, Red (#EF4444) for penalties
- **Animations:** Pulse effects on yield numbers, smooth card reveals, particle/node graph background on hero
- **Components:** Glassmorphism cards, animated progress rings, live-ticker counters

---

## 10. Phase 1 Build Scope (Current Sprint)

1. ✅ Vite + React project scaffold
2. ✅ Design system (CSS variables, fonts, global styles)
3. ✅ Landing page (hero, tier preview, how-it-works)
4. ✅ Tier marketplace page (9 tiers, tier cards)
5. ✅ Registration flow (account creation + tier selection)
6. ✅ User dashboard skeleton (node overview, earnings, refund calculator)

---

> [!NOTE]
> Backend/Firebase integration comes in Phase 2. Phase 1 is fully frontend with mock data + local state.
