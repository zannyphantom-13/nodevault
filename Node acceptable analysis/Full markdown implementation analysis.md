# NodeVault — Financial Implementation Parameters

> **Classification:** Internal Operating Reference  
> **Jurisdiction:** Nigeria (₦ NGN) · United States ($ USD)  
> **Governing Standards:** FIRS, CBN, CITA, VAT Act 2023, ISA

---

## 1. Institutional Yield Rate

- **Rate:** 12% per annum
- **Source:** Institutional-grade instruments (FGN Treasury Bills, SEC Money Market Funds)
- **Usage:** Basis for blade fuel award calculations — applied as `fee × 12% ÷ 12` monthly

---

## 2. Platform OPEX Structure (Direction-Split)

| Direction | Rate | Applied To |
|---|---|---|
| **Inbound OPEX** | **5%** of base staking fee | All checkout / staking deposits |
| **Outbound OPEX** | **3%** of gross payout | All withdrawals, gift payouts, refunds |

VAT of **7.5%** is applied to OPEX fees only (not to the base staking amount).

---

## 3. Referral Programme

### 3.1 Deposit Inclusion
- **30% of investment** is included as a fixed Referral Programme Reserve on every deposit.
- This funds the referral payout pool — it is a checkout line item, not a user bonus.

### 3.2 Referral Payout Structure (OR Logic)
A node earns **one** rate based on its relationship type — rates are **not stacked**:

| Relationship Type | Rate | Trigger |
|---|---|---|
| **Direct Referral** | 15% (one-time) | Paid once when the referred member completes their first stake |
| **Mainline Position** | 1% per annum | Annual recurring on the direct mainline referral |
| **Binary Downline** | 0.1% per annum | Annual per level, maximum **7 binary levels** deep |

---

## 4. Checkout Fee Architecture (Inbound)

All fees charged on staking deposits:

| Fee Component | Rate | Basis |
|---|---|---|
| Network Referral Reserve | 30.0% | Base staking fee |
| Platform OPEX Fee | 5.0% | Base staking fee |
| Gateway & Network Fee | 3.0% | Base staking fee |
| VAT on Service Fees | 7.5% | Applied to OPEX + Gateway only |
| EMTL Levy (NGN only) | ₦50 flat | Transactions ≥ ₦10,000 |

---

## 5. Outbound Fee Architecture (Withdrawals / Payouts)

Deductions from gross payout to user:

| Fee Component | Rate | Note |
|---|---|---|
| Platform Processing Fee | 3.0% | Outbound OPEX |
| VAT on Processing Fee | 7.5% of OPEX | Effective rate: 0.225% of gross |
| Bank Transfer Fee | ₦100 flat (NGN) / $1 (USD) | NIBSS / ACH clearing |
| EMTL Levy (NGN only) | ₦50 flat | Transactions ≥ ₦10,000 |

> **Note:** No tax reserve is deducted from user payouts. Tax obligations are managed internally by the platform from OPEX income and pool-level retained margin.

---

## 6. Profit Distribution (Internal)

After all operating costs, gateway fees, and applicable taxes are accounted for:

| Recipient | Share |
|---|---|
| **Investor Distribution Pool** | **60%** of net profit |
| **Founder Allocation** | **40%** of net profit |

> This split is an internal accounting classification and is **not disclosed** in any user-facing interface.

---

## 7. Risk Reserve

- **Rate:** 3% (internal treasury buffer)
- Carved silently from platform net — not stated to users or shown in receipts.
- Held as a liquidity buffer against unexpected redemption or regulatory events.

---

## 8. Pool Sellout / Completion Bonus

- When a node pool completes (all 255 slots filled), the platform recognises a **Protocol Completion Bonus**.
- **Value:** 60% of the pool's net OPEX income.
- Recorded in admin revenue analytics as "Protocol Pool Sellout Revenue."

---

## 9. Payment Gateway Support

| Gateway | Role | Cost |
|---|---|---|
| **Paystack** | Primary (90% traffic) | 1.5% capped at ₦2,000 |
| **Monnify** | Secondary / Fallback | 1.2% capped at ₦1,000 |
| **Direct Bank Transfer** | Manual / High-value | Per CBN settlement |

Supported payment methods: Paystack, Credo, Direct Bank Transfer.

---

## 10. KYC & Platform Compliance Fees

- KYC verification fee, platform notification fees, and other platform charges are incorporated into the **inbound OPEX rate (9%)**.
- These are not broken out as separate line items to users.

---

## 11. Refund Policy Summary

| Refund Tier | Condition | Gross Refund | Processing Fee | Net to User |
|---|---|---|---|---|
| **Tier A** — End of Month | Zero gifts received | 70% of entry fee | 3% | ~67.9% of fee |
| **Tier A** — Early Exit | Zero gifts, before 25th | 63% of entry fee | 3% | ~61.1% of fee |
| **Tier B** — After 6 months | Gifts < 60% of fee | 60% of fee minus gifts | 3% | Variable |
| **Tier B** — Before 6 months | Gifts < 60% of fee | Locked | — | ₦0 |
| **Tier C** — Any time | Gifts ≥ 60% of fee | Disqualified | — | ₦0 |

---

*Last updated: 2026-11-08 — supersedes all prior raw notes.*

