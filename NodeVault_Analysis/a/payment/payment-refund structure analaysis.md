# NodeVault Payment & Refund Structure Analysis

## 1. Core Mechanics & Graduation (The 255-Node Matrix)
The NodeVault system operates on a binary tree structure that caps and "graduates" at **Level 7**. 
- **Maximum Depth:** Level 7
- **Total Network Size:** 255 Members (Nodes) per graduation cycle ($2^0 + 2^1 + ... + 2^7$).

## 2. Gift Distribution Rules (The 60% Cap)
Every user in the system contributes a portion of their entry fee as a "gift" upwards. A user graduates and exits the system immediately upon receiving **60%** of an entry fee in total gifts.

The upward yield from any joining user is strictly defined as:
- **15%** yields to their **Direct Parent** (1 level up).
- **7.5%** yields to their **Grandparent** (2 levels up).

**How Graduation is Achieved:**
When a user (e.g., Level 0) fills their immediate network, they receive:
- **Level 1 (2 users):** 15% × 2 = **30%**
- **Level 2 (4 users):** 7.5% × 4 = **30%**
- **Total Received:** **60%**. The user hits the hard cap and graduates. They receive NO gifts from Level 3 or beyond.

## 3. User ID Payout Flow (Levels 0 to 7)
Because graduation requires exactly 2 levels of depth, gifts **never** flow higher than the grandparent. The exact upward yield flow is mapped below:

| Tree Level | User IDs | Parent IDs (Receives 15%) | Grandparent IDs (Receives 7.5%) |
| :--- | :--- | :--- | :--- |
| **Level 0** | 1 | *None (Root)* | *None* |
| **Level 1** | 2, 3 | 1 | *None* |
| **Level 2** | 4, 5, 6, 7 | 2, 3 | 1 |
| **Level 3** | 8 to 15 | 4 to 7 | 2, 3 |
| **Level 4** | 16 to 31 | 8 to 15 | 4 to 7 |
| **Level 5** | 32 to 63 | 16 to 31 | 8 to 15 |
| **Level 6** | 64 to 127 | 32 to 63 | 16 to 31 |
| **Level 7** | 128 to 255 | 64 to 127 | 32 to 63 |

## 4. Refund & Status Breakdown by Level
Because the matrix stops at Level 7, users at the bottom levels do not have enough depth to graduate. The platform's automated refund policy protects them (accounting for a 3% platform tax on all refunds).

| Tree Level | User Role | Members | Gifts Earned | Gross Refund | Net Refund (After 3% Tax) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 0-5** | Graduating / Qualifying Internal | 63 total | 60% (Max) | 0% | 0% |
| **Level 6** | Partial Qualifying Leaf | 64 | 30% (from L7) | 30% | 29.1% |
| **Level 7** | Non-Qualifying Leaf | 128 | 0% | 70% | 67.9% |

## 5. System Financial Accounting (Example: Nexus Node @ ₦250,000)
If a 255-member matrix completes under the Nexus Tier (₦250,000 Entry Fee), the systemic cash flow is calculated as follows:

**Total Revenue (Inflow):**
- 255 members × ₦250,000 = **+₦63,750,000**

**Total Gifts Paid (Expense):**
- Levels 0-5 (63 members) earn 60% (₦150,000) = -₦9,450,000
- Level 6 (64 members) earns 30% (₦75,000) = -₦4,800,000
- Level 7 (128 members) earns 0% = ₦0
- **Total Gifts Out:** **-₦14,250,000**

**Total Refunds Paid (Liability):**
- Level 6 (64 members) get 29.1% net (₦72,750) = -₦4,656,000
- Level 7 (128 members) get 67.9% net (₦169,750) = -₦21,728,000
- **Total Refunds Out:** **-₦26,384,000**

**Net Platform Retention (Profit):**
- ₦63,750,000 (Rev) - ₦14,250,000 (Gifts) - ₦26,384,000 (Refunds)
- **Net Remaining:** **+₦23,116,000** (Approx 36.26% Profit Margin)
