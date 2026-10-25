# NodeVault — Graduation Accounting (Corrected Gift Mechanics + Proper Refund Tiers)

---

## Gift Distribution Rule

| Relationship | Gift % Paid |
|---|:---:|
| Direct recruits you bring in (Level +1 from you) | **15%** of their entry fee |
| Their recruits (Level +2 from you) | **7.5%** of their entry fee |
| Level +3 and deeper | 0% — no further propagation |

> Each person can only directly recruit **2 members** beneath them.

---

## Per-Level Gift Receipt & Refund Eligibility (Per Member)

| Level | Members | Direct Children | Grandchildren | Gifts Received | % of Entry Fee | Refund Tier |
|-------|--------:|:--------------:|:-------------:|:--------------:|:--------------:|:-----------:|
| 0 (Root/Graduating) | 1 | 2 (L1) | 4 (L2) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 1 | 2 | 2 (L2) | 4 (L3) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 2 | 4 | 2 (L3) | 4 (L4) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 3 | 8 | 2 (L4) | 4 (L5) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 4 | 16 | 2 (L5) | 4 (L6) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 5 | 32 | 2 (L6) | 4 (L7) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 6 | 64 | 2 (L7) | 4 (L8) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 7 | 128 | 2 (L8) | 4 (L9) | 15%×2 + 7.5%×4 | **60%** | **Tier C — No refund** |
| 8 | 256 | 2 (L9) | None | 15%×2 only | **30%** | **Tier B — Partial refund** |
| 9 | 512 | None | None | 0 | **0%** | **Tier A — 70% refund** |

**Tier C threshold = 60% of entry fee received → Levels 0–7 all hit exactly 60%**

---

## Gift Cost Calculation (Per Graduation Event)

Each new member joining triggers gifts upward. Members at Level 1 only have a parent (no grandparent above root is N/A):

| Joining Level | Count | Gifts Triggered Per Joiner | Total Gifts |
|---|---:|---|---|
| Level 1 | 2 | 15% to root only | 2 × 0.15F = **0.30F** |
| Levels 2–9 | 1,020 | 15% to parent + 7.5% to grandparent = 22.5% | 1,020 × 0.225F = **229.50F** |
| **Total** | **1,022** | | **229.80F** |

---

## Refund Calculation (Per Graduation Event)

| Level | Members | Gifts Received | Refund Tier | Gross Refund | 3% Tax Retained | Net Refund Paid | Total Net Refunds |
|-------|--------:|:--------------:|:-----------:|:------------:|:---------------:|:---------------:|:-----------------:|
| 0–7 | 255 | 60% of F | **Tier C** | ₦0 | ₦0 | ₦0 | **₦0** |
| 8 | 256 | 30% of F | **Tier B** | 30% of F | 3% of gross | 29.1% of F | **74.496F** |
| 9 | 512 | 0% | **Tier A** | 70% of F | 3% of gross | 67.9% of F | **347.648F** |
| **Total** | | | | | | | **422.144F** |

---

## Corrected Net Platform Formula (Any Tier)

```
Revenue        = 1,023 × F
Gifts Paid     =   229.80 × F
Net After Gifts=   793.20 × F

Refunds (L8)   =    74.496 × F   [256 members × 29.1%]
Refunds (L9)   =   347.648 × F   [512 members × 67.9%]
Total Refunds  =   422.144 × F

Net Platform   = 793.20F − 422.144F = 371.056 × F
```

**Platform margin = 371.056 / 1,023 = 36.27% of total tree revenue**

---

## 🇳🇬 Nigeria — Corrected Graduation Accounting (All Tiers)

| Tier | Node Name | Entry (F) | Revenue (₦) | Gifts Paid (₦) | L8 Refunds (₦) | L9 Refunds (₦) | **Net Platform (₦)** |
|------|-----------|:---------:|:-----------:|:--------------:|:--------------:|:--------------:|:--------------------:|
| 1  | Micro Node      | ₦1,000      | ₦1,023,000      | ₦229,800      | ₦74,496      | ₦347,648      | **₦371,056**      |
| 2  | Spark Node      | ₦2,000      | ₦2,046,000      | ₦459,600      | ₦148,992     | ₦695,296      | **₦742,112**      |
| 3  | Alpha Node      | ₦4,000      | ₦4,092,000      | ₦919,200      | ₦297,984     | ₦1,390,592    | **₦1,484,224**    |
| 4  | Delta Node      | ₦8,000      | ₦8,184,000      | ₦1,838,400    | ₦595,968     | ₦2,781,184    | **₦2,968,448**    |
| 5  | Echo Node       | ₦16,000     | ₦16,368,000     | ₦3,676,800    | ₦1,191,936   | ₦5,562,368    | **₦5,936,896**    |
| 6  | Prime Node      | ₦32,000     | ₦32,736,000     | ₦7,353,600    | ₦2,383,872   | ₦11,124,736   | **₦11,873,792**   |
| 7  | Sigma Node      | ₦64,000     | ₦65,472,000     | ₦14,707,200   | ₦4,767,744   | ₦22,249,472   | **₦23,747,584**   |
| 8  | Omega Node      | ₦128,000    | ₦130,944,000    | ₦29,414,400   | ₦9,535,488   | ₦44,498,944   | **₦47,495,168**   |
| 9  | Nexus Node      | ₦250,000    | ₦255,750,000    | ₦57,450,000   | ₦18,624,000  | ₦86,912,000   | **₦92,764,000**   |
| 10 | Apex Node       | ₦400,000    | ₦409,200,000    | ₦91,920,000   | ₦29,798,400  | ₦139,059,200  | **₦148,422,400**  |
| 11 | Zenith Node     | ₦640,000    | ₦654,720,000    | ₦147,072,000  | ₦47,677,440  | ₦222,494,720  | **₦237,475,840**  |
| 12 | Nova Node       | ₦1,000,000  | ₦1,023,000,000  | ₦229,800,000  | ₦74,496,000  | ₦347,648,000  | **₦371,056,000**  |
| 13 | Titan Node      | ₦1,500,000  | ₦1,534,500,000  | ₦344,700,000  | ₦111,744,000 | ₦521,472,000  | **₦556,584,000**  |
| 14 | Sovereign Node  | ₦2,000,000  | ₦2,046,000,000  | ₦459,600,000  | ₦148,992,000 | ₦695,296,000  | **₦742,112,000**  |
| 15 | Genesis Supreme | ₦2,560,000  | ₦2,618,880,000  | ₦588,288,000  | ₦190,709,760 | ₦889,979,392  | **₦949,902,848**  |

---

## 🇺🇸 United States — Corrected Graduation Accounting (All Tiers)

| Tier | Node Name | Entry (F) | Revenue ($) | Gifts Paid ($) | L8 Refunds ($) | L9 Refunds ($) | **Net Platform ($)** |
|------|-----------|:---------:|:-----------:|:--------------:|:--------------:|:--------------:|:--------------------:|
| 1  | Micro Node      | $1.00      | $1,023.00      | $229.80      | $74.50       | $347.65      | **$371.06**      |
| 2  | Spark Node      | $2.00      | $2,046.00      | $459.60      | $148.99      | $695.30      | **$742.11**      |
| 3  | Alpha Node      | $4.00      | $4,092.00      | $919.20      | $297.98      | $1,390.59    | **$1,484.22**    |
| 4  | Delta Node      | $8.00      | $8,184.00      | $1,838.40    | $595.97      | $2,781.18    | **$2,968.45**    |
| 5  | Echo Node       | $16.00     | $16,368.00     | $3,676.80    | $1,191.94    | $5,562.37    | **$5,936.90**    |
| 6  | Prime Node      | $32.00     | $32,736.00     | $7,353.60    | $2,383.87    | $11,124.74   | **$11,873.79**   |
| 7  | Sigma Node      | $64.00     | $65,472.00     | $14,707.20   | $4,767.74    | $22,249.47   | **$23,747.58**   |
| 8  | Omega Node      | $128.00    | $130,944.00    | $29,414.40   | $9,535.49    | $44,498.94   | **$47,495.17**   |
| 9  | Nexus Node      | $250.00    | $255,750.00    | $57,450.00   | $18,624.00   | $86,912.00   | **$92,764.00**   |
| 10 | Apex Node       | $400.00    | $409,200.00    | $91,920.00   | $29,798.40   | $139,059.20  | **$148,422.40**  |
| 11 | Zenith Node     | $640.00    | $654,720.00    | $147,072.00  | $47,677.44   | $222,494.72  | **$237,475.84**  |
| 12 | Nova Node       | $1,000.00  | $1,023,000.00  | $229,800.00  | $74,496.00   | $347,648.00  | **$371,056.00**  |
| 13 | Titan Node      | $1,500.00  | $1,534,500.00  | $344,700.00  | $111,744.00  | $521,472.00  | **$556,584.00**  |
| 14 | Sovereign Node  | $2,000.00  | $2,046,000.00  | $459,600.00  | $148,992.00  | $695,296.00  | **$742,112.00**  |
| 15 | Genesis Supreme | $2,560.00  | $2,618,880.00  | $588,288.00  | $190,709.76  | $889,979.39  | **$949,902.85**  |

---

## Key Metrics Summary

| Metric | Value |
|--------|-------|
| Gift multiplier | 229.80 × F total |
| L8 refund multiplier | 74.496 × F |
| L9 refund multiplier | 347.648 × F |
| Total refund multiplier | 422.144 × F |
| **Net platform multiplier** | **371.056 × F** |
| **Platform margin on revenue** | **36.27%** |
