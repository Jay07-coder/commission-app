/** Engine tests — run: node --experimental-strip-types lib/commission.test.ts */
import { calculate, autoSplit, type Agent, type Source } from "./commission.ts";

let passed = 0, failed = 0;
function approx(label: string, got: number, want: number, tol = 0.01) {
  if (Math.abs(got - want) <= tol) { passed++; console.log(`  ✓ ${label}  (${got})`); }
  else { failed++; console.log(`  ✗ ${label}  got ${got}, want ${want}`); }
}
function eq(label: string, got: unknown, want: unknown) {
  if (got === want) { passed++; console.log(`  ✓ ${label}  (${got})`); }
  else { failed++; console.log(`  ✗ ${label}  got ${got}, want ${want}`); }
}

const team = (base: number, zillow: number | null): Agent =>
  ({ name: "T", tier: "team", baseSplit: base, zillowSplit: zillow });
const indep: Agent = { name: "I", tier: "independent", baseSplit: 100, zillowSplit: 100 };
const owner: Agent = { name: "O", tier: "owner", baseSplit: 0, zillowSplit: 0 };
const company: Source = { name: "Zillow", category: "company" };
const soi: Source = { name: "SOI", category: "self" };

console.log("\nautoSplit logic:");
eq("independent → 100%", autoSplit(indep, company), 100);
eq("owner → 0%", autoSplit(owner, soi), 0);
eq("team + company lead → Zillow split", autoSplit(team(60, 50), company), 50);
eq("team + own deal → base split", autoSplit(team(60, 50), soi), 60);
eq("team w/o Zillow split + company → falls back to base", autoSplit(team(70, null), company), 70);

console.log("\nReal closed-deal reconciliation:");
// Michael Gasso — SOI, 80% split, gross $141,735.44, $981 compliance → recorded net $112,407.35
const gasso = calculate({
  agent: team(80, 50), source: soi, price: 0, commissionPct: 0,
  grossOverride: 141735.44, splitOverride: 80, complianceFee: 981,
});
approx("Gasso agent share", gasso.agentShare, 113388.35);
approx("Gasso net to agent matches sheet", gasso.netToAgent, 112407.35);

// Jesse Hallac — independent, $161,000 × 1.5%, no fees → recorded net $2,415
const jesse = calculate({ agent: indep, source: soi, price: 161000, commissionPct: 1.5 });
approx("Jesse gross", jesse.gross, 2415);
approx("Jesse net (100%)", jesse.netToAgent, 2415);

// Eva Slewa — Zillow 50/50, $150,000 × 2.5% → agent share $1,875; with $312.50 deductions → $1,562.50
const eva = calculate({
  agent: team(50, 50), source: company, price: 150000, commissionPct: 2.5,
  eoFee: 75, complianceFee: 237.5,
});
approx("Eva agent share", eva.agentShare, 1875);
approx("Eva net matches sheet", eva.netToAgent, 1562.5);

console.log("\nWaterfall behaviour:");
// referral 40% then 50/50 on $10,000 gross
const ref = calculate({ agent: team(50, 50), source: { name: "Referral", category: "referral" }, price: 0, commissionPct: 0, grossOverride: 10000, referralPct: 40, splitOverride: 50 });
approx("after 40% referral, 50% split → agent $3,000", ref.agentShare, 3000);
approx("reconciles: net + brokerage = post-referral pot", ref.netToAgent + ref.toBrokerage, 6000);

// cap met → agent flips to 100%
const capped = calculate({ agent: { name: "C", tier: "team", baseSplit: 50, zillowSplit: 50, cap: 20000, capPaid: 20000 }, source: company, price: 100000, commissionPct: 3 });
eq("capped agent keeps 100%", capped.splitPct, 100);
approx("capped agent net = full commissionable", capped.netToAgent, 3000);

// general reconciliation invariant
const r = calculate({ agent: team(60, 50), source: soi, price: 400000, commissionPct: 3, eoFee: 75, royaltyPct: 6, bonus: 200, concessions: 500 });
approx("invariant: net + brokerage = commissionable + bonus", r.netToAgent + r.toBrokerage, r.commissionable + 200);

console.log(`\n${failed === 0 ? "✅ ALL PASS" : "❌ FAIL"} — ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
