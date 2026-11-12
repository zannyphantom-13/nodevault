# NodeVault: One-Page Summary for Securities Lawyer

Prepared 28 October 2026. Status: demo phase, no deposits taken, no public promotion. Purpose: get a legal opinion on structure and registration route before any launch.

## 1. What the platform does

NodeVault is a savings and investment platform for Nigerian retail users. Users deposit money, which is invested in FGN Treasury Bills, and they receive a share of the bill income as a monthly payout. The current build is React/Vite with a Supabase backend, Paystack for payments and an admin dashboard.

## 2. Proposed economics

- Source of return: FGN Treasury Bills only. Recent CBN auction stop rates: 91-day 15.50%, 182-day 15.80%, 364-day 15.85% (7 October 2026).
- Base user payout: 12% a year (1% a month). The platform keeps about 3% a year to cover custody, payments, KYC and profit.
- Preferred option: the payout is variable, set as the bill rate minus a disclosed fee, rather than a fixed 12%. A fixed 12% leaves no margin if bill rates fall.
- Lock period: the founder proposed 10 years. Open question, see section 5.

## 3. Proposed referral mechanism

- One level only. A user is paid only for people they directly refer. Nothing is paid to the referrer's referrer.
- A referral counts only if the referred person is a separately verified (KYC) individual who deposits at least the same amount as the referrer, and only while that money stays invested.
- Proposed benefit: 1% a year of the referred person's deposit, paid from the platform's 3% fee on that same deposit. Each referral is therefore covered by income on the referred money.
- Alternative for comparison: a flat one-time cash bonus from the platform's own fee on first deposit, with no change to anyone's rate.
- A cap and a pause switch if bill rates fall to the point where the fee margin disappears.

## 4. Safeguards in the design

- Client money held by a licensed custodian or trustee, segregated from company funds, and invested through SEC-registered institutions or a registered fund manager.
- No payout funded from other users' deposits.
- No refund guarantee paid from the pooled money.
- No fabricated statistics. No wording such as "capital always protected". Plain risk disclosure.
- Registration or a registered partner in place before any deposit is accepted or any promotion starts.

## 5. Questions for counsel

1. Registration route: should the platform register with the SEC itself (and in which capacity), or distribute products of an already registered fund manager?
2. Referral benefit: does a referral payment of 1% a year of the referred deposit, one level only, fall within or outside the prohibited schemes provisions (section 357 of the ISA 2025)? Would a flat one-time bonus be safer?
3. Multi-level: the founder has asked whether a downline (for example a binary tree to seven levels, with a very small payment per downline member) could be permitted. Is multi-level payment of any size permissible under the ISA 2025 for this structure?
4. Lock period: is a long lock-in with no early exit acceptable for a product offered to the public, or is an exit option with a disclosed penalty required?
5. Wording: what disclosures and risk statements must appear on the site and in marketing, including any wording about returns and capital?
6. Custody and KYC: which custodian, trustee and KYC arrangements are required before accepting deposits?
7. Promotion: what, if anything, may be said to prospective users while registration is pending?

## 6. Sources checked

- Legal summaries of the Investments and Securities Act 2025, including Section 357 (prohibited schemes include Ponzi and pyramid schemes) and the penalty of a fine of at least N20 million and/or up to 10 years' imprisonment. Summaries only, so counsel should check the Act's text.
- SEC Nigeria public notice on unregistered online investment schemes.
- Nairametrics reports on T-bill auction rates and money market fund yields.
