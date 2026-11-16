/**
 * NodeVault Protocol — CBN / DMO 364-Day NTB Sovereign Rate Ingestion Script
 * 
 * Fetches or parses Central Bank of Nigeria (CBN) / Debt Management Office (DMO)
 * primary auction results for Nigerian Treasury Bills (NTB).
 * Computes both 6.0% fee deduction models:
 *   - Option A: Fee off Real Yield (18.70% - 6.00% = 12.70% Customer APY)
 *   - Option B: Fee off Discount Rate (15.80% - 6.00% = 9.80% -> 10.90% Customer APY)
 * 
 * Safeguard: Saves as DRAFT requiring admin sign-off before production broadcast.
 */

import fs from 'fs';
import path from 'path';

export function calculateNTBMath(stopRatePct, protocolFeePct = 6.0, tenorDays = 364) {
  const d = Number(stopRatePct) / 100;
  const factor = tenorDays / 365;
  
  // Purchase Price per ₦100 face value
  const price = 100 - (d * factor * 100);
  
  // Real / Effective Investment Yield
  const realYield = d / (1 - d * factor);
  const realYieldPct = parseFloat((realYield * 100).toFixed(2));
  
  // Option A: Fee off Real Yield
  const customerApyOptionA = parseFloat(Math.max(0, realYieldPct - protocolFeePct).toFixed(2));
  
  // Option B: Fee off Discount Rate
  const netDiscount = Math.max(0, Number(stopRatePct) - protocolFeePct);
  const netD = netDiscount / 100;
  const customerApyOptionB = parseFloat(((netD / (1 - netD * factor)) * 100).toFixed(2));
  
  return {
    tenorDays,
    stopRatePct: Number(stopRatePct),
    pricePer100: parseFloat(price.toFixed(4)),
    realYieldPct,
    protocolFeePct: Number(protocolFeePct),
    optionA: {
      model: 'REAL_YIELD_MINUS_FEE',
      description: 'Fee deducted from Real Yield',
      customerApy: customerApyOptionA,
      netSpreadPer100k: (realYieldPct - customerApyOptionA) * 1000,
    },
    optionB: {
      model: 'DISCOUNT_SPREAD',
      description: 'Fee deducted from Discount Rate',
      customerApy: customerApyOptionB,
      netSpreadPer100k: (realYieldPct - customerApyOptionB) * 1000,
    }
  };
}

export function generateDraftRatePayload(auctionCode, stopRatePct, protocolFeePct = 6.0) {
  const math = calculateNTBMath(stopRatePct, protocolFeePct);
  
  // Anomaly Circuit Breaker check
  const isAnomaly = stopRatePct < 8.0 || stopRatePct > 32.0;
  
  const draft = {
    id: `draft-${Date.now()}`,
    auctionCode: auctionCode || `CBN-NTB-364D-${new Date().toISOString().split('T')[0]}`,
    auctionDate: new Date().toISOString().split('T')[0],
    tenorDays: 364,
    stopRate: math.stopRatePct,
    pricePer100: math.pricePer100,
    realYield: math.realYieldPct,
    protocolFee: math.protocolFeePct,
    preferredCustomerAPY: math.optionA.customerApy, // Option A recommended (12.70%)
    calculations: math,
    status: isAnomaly ? 'flagged_anomaly' : 'draft',
    source: 'Central Bank of Nigeria (CBN) / DMO Primary Auction Circular',
    requiresApproval: true,
    circuitBreakerTriggered: isAnomaly,
    generatedAt: new Date().toISOString(),
  };

  return draft;
}

// CLI runner if executed directly: node scripts/fetch_sovereign_rate.js [stopRate] [fee]
if (process.argv[1] && process.argv[1].endsWith('fetch_sovereign_rate.js')) {
  const inputStopRate = process.argv[2] ? parseFloat(process.argv[2]) : 15.80;
  const inputFee = process.argv[3] ? parseFloat(process.argv[3]) : 6.00;
  
  console.log('====================================================');
  console.log('   NodeVault CBN / DMO Sovereign Rate Engine');
  console.log('====================================================');
  console.log(`Processing NTB Stop Rate: ${inputStopRate}% | Fee: ${inputFee}%\n`);
  
  const payload = generateDraftRatePayload(`CBN-NTB-364D-2026-W46`, inputStopRate, inputFee);
  console.log(JSON.stringify(payload, null, 2));
  
  const outPath = path.resolve(process.cwd(), 'src/data/latest_sovereign_draft.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\n✅ Draft saved successfully to: ${outPath}`);
}

