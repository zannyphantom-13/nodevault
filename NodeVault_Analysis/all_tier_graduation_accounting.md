# NodeVault — All-Tier Graduation Accounting (Binary Tree Structure)

## Binary Tree — Universal Rule (All 15 Tiers)

> The same 10-level binary power tree applies to **every tier**.
> A user graduates when their full tree of **1,023 members** is complete.

| Tree Layer | Levels | Members | Role |
|-----------|--------|--------:|------|
| Internal nodes (recruiters) | 0 – 7 | **255** | Qualifying — receive gift rewards |
| Leaf nodes (non-recruiters) | 8 – 9 | **768** | Non-qualifying — receive 70% refund (net of 3% tax) |
| **Total** | | **1,023** | |

```
Level 0:   1  (Graduating User — receives gifts + exits)
Level 1:   2  ↓
Level 2:   4  ↓ 255 total qualifying/recruiting members
Level 3:   8  ↓ (receive avg gift rewards = ~76% of entry fee)
Level 4:  16  ↓
Level 5:  32  ↓
Level 6:  64  ↓
Level 7: 128  ↓
─────────────────────────────────────────────────
Level 8: 256  ↓ 768 total leaf members
Level 9: 512  ↓ (receive 70% refund gross → 67.9% net after 3% tax)
```

---

## Corrected Nexus Node Accounting (with 3% Refund Tax Applied)

**Entry Fee: ₦250,000**

| Line | Calculation | Amount (₦) |
|------|------------|:----------:|
| **Revenue** | 1,023 × ₦250,000 | **+₦255,750,000** |
| Gift Rewards (Levels 0–7) | 255 × ₦190,000 avg | −₦48,450,000 |
| **Subtotal after gifts** | | **+₦207,300,000** |
| Refund Gross (Levels 8–9) | 768 × ₦175,000 (70%) | −₦134,400,000 |
| **3% Refund Tax collected back** | 768 × ₦5,250 (3% of ₦175,000) | **+₦4,032,000** |
| **Net Refunds Paid** | 768 × ₦169,750 net | −₦130,368,000 |
| **Net Platform Cash at Graduation** | | **+₦76,932,000** |

> ⚠️ Previous figure of ₦72,900,000 did not account for the 3% refund tax.
> Corrected net = **₦76,932,000** (+₦4,032,000 from refund tax retained).

---

## All-Tier Graduation Accounting — 🇳🇬 Nigeria (₦ NGN)

> **Formula per tier** (Entry Fee = F):
> - Revenue = 1,023 × F
> - Gifts = 255 × (0.76 × F) — qualifying members receive ~76% of entry fee
> - Gross Refund = 768 × (0.70 × F)
> - Refund Tax Retained = 768 × (0.70 × F × 0.03) = 768 × 0.021F
> - Net Refund Paid = 768 × (0.679 × F)
> - **Net Platform = Revenue − Gifts − Net Refunds = F × 307.728**

| Tier | Node Name | Entry Fee (₦) | Total Revenue (₦) | Gifts Paid (₦) | Gross Refunds (₦) | Refund Tax Back (₦) | Net Refund Paid (₦) | **Net Platform (₦)** |
|------|-----------|:------------:|:-----------------:|:--------------:|:-----------------:|:-------------------:|:-------------------:|:--------------------:|
| 1  | Micro Node      | ₦1,000      | ₦1,023,000      | ₦193,800      | ₦537,600      | ₦16,128      | ₦521,472      | **₦307,728**      |
| 2  | Spark Node      | ₦2,000      | ₦2,046,000      | ₦387,600      | ₦1,075,200    | ₦32,256      | ₦1,042,944    | **₦615,456**      |
| 3  | Alpha Node      | ₦4,000      | ₦4,092,000      | ₦775,200      | ₦2,150,400    | ₦64,512      | ₦2,085,888    | **₦1,230,912**    |
| 4  | Delta Node      | ₦8,000      | ₦8,184,000      | ₦1,550,400    | ₦4,300,800    | ₦129,024     | ₦4,171,776    | **₦2,461,824**    |
| 5  | Echo Node       | ₦16,000     | ₦16,368,000     | ₦3,100,800    | ₦8,601,600    | ₦258,048     | ₦8,343,552    | **₦4,923,648**    |
| 6  | Prime Node      | ₦32,000     | ₦32,736,000     | ₦6,201,600    | ₦17,203,200   | ₦516,096     | ₦16,687,104   | **₦9,847,296**    |
| 7  | Sigma Node      | ₦64,000     | ₦65,472,000     | ₦12,403,200   | ₦34,406,400   | ₦1,032,192   | ₦33,374,208   | **₦19,694,592**   |
| 8  | Omega Node      | ₦128,000    | ₦130,944,000    | ₦24,806,400   | ₦68,812,800   | ₦2,064,384   | ₦66,748,416   | **₦39,389,184**   |
| 9  | Nexus Node      | ₦250,000    | ₦255,750,000    | ₦48,450,000   | ₦134,400,000  | ₦4,032,000   | ₦130,368,000  | **₦76,932,000**   |
| 10 | Apex Node       | ₦400,000    | ₦409,200,000    | ₦77,520,000   | ₦215,040,000  | ₦6,451,200   | ₦208,588,800  | **₦123,091,200**  |
| 11 | Zenith Node     | ₦640,000    | ₦654,720,000    | ₦124,032,000  | ₦344,064,000  | ₦10,321,920  | ₦333,742,080  | **₦196,945,920**  |
| 12 | Nova Node       | ₦1,000,000  | ₦1,023,000,000  | ₦193,800,000  | ₦537,600,000  | ₦16,128,000  | ₦521,472,000  | **₦307,728,000**  |
| 13 | Titan Node      | ₦1,500,000  | ₦1,534,500,000  | ₦290,700,000  | ₦806,400,000  | ₦24,192,000  | ₦782,208,000  | **₦461,592,000**  |
| 14 | Sovereign Node  | ₦2,000,000  | ₦2,046,000,000  | ₦387,600,000  | ₦1,075,200,000 | ₦32,256,000 | ₦1,042,944,000 | **₦615,456,000** |
| 15 | Genesis Supreme | ₦2,560,000  | ₦2,618,880,000  | ₦496,128,000  | ₦1,376,256,000 | ₦41,287,680 | ₦1,334,968,320 | **₦787,783,680** |

---

## All-Tier Graduation Accounting — 🇺🇸 United States ($ USD)

| Tier | Node Name | Entry Fee ($) | Total Revenue ($) | Gifts Paid ($) | Net Refund Paid ($) | **Net Platform ($)** |
|------|-----------|:------------:|:-----------------:|:--------------:|:-------------------:|:--------------------:|
| 1  | Micro Node      | $1.00      | $1,023.00      | $193.80      | $521.47      | **$307.73**      |
| 2  | Spark Node      | $2.00      | $2,046.00      | $387.60      | $1,042.94    | **$615.46**      |
| 3  | Alpha Node      | $4.00      | $4,092.00      | $775.20      | $2,085.89    | **$1,230.91**    |
| 4  | Delta Node      | $8.00      | $8,184.00      | $1,550.40    | $4,171.78    | **$2,461.82**    |
| 5  | Echo Node       | $16.00     | $16,368.00     | $3,100.80    | $8,343.55    | **$4,923.65**    |
| 6  | Prime Node      | $32.00     | $32,736.00     | $6,201.60    | $16,687.10   | **$9,847.30**    |
| 7  | Sigma Node      | $64.00     | $65,472.00     | $12,403.20   | $33,374.21   | **$19,694.59**   |
| 8  | Omega Node      | $128.00    | $130,944.00    | $24,806.40   | $66,748.42   | **$39,389.18**   |
| 9  | Nexus Node      | $250.00    | $255,750.00    | $48,450.00   | $130,368.00  | **$76,932.00**   |
| 10 | Apex Node       | $400.00    | $409,200.00    | $77,520.00   | $208,588.80  | **$123,091.20**  |
| 11 | Zenith Node     | $640.00    | $654,720.00    | $124,032.00  | $333,742.08  | **$196,945.92**  |
| 12 | Nova Node       | $1,000.00  | $1,023,000.00  | $193,800.00  | $521,472.00  | **$307,728.00**  |
| 13 | Titan Node      | $1,500.00  | $1,534,500.00  | $290,700.00  | $782,208.00  | **$461,592.00**  |
| 14 | Sovereign Node  | $2,000.00  | $2,046,000.00  | $387,600.00  | $1,042,944.00 | **$615,456.00** |
| 15 | Genesis Supreme | $2,560.00  | $2,618,880.00  | $496,128.00  | $1,334,968.32 | **$787,783.68** |

---

## Platform Margin Summary

| Metric | Value |
|--------|-------|
| Tree members per graduation | 1,023 |
| Qualifying (gift eligible) | 255 (Levels 0–7) |
| Leaf members (refund eligible) | 768 (Levels 8–9) |
| Avg gift paid per qualifying member | ~76% of entry fee |
| Refund gross per leaf member | 70% of entry fee |
| 3% refund tax retained by platform | 3% of gross refund |
| Net refund per leaf member | **67.9% of entry fee** |
| **Platform net per graduation = F ×** | **307.728** |
| **Platform margin on total inflow** | **~30.1%** |
