/**
 * Commission engine — Top Agent Realty (3-way split)
 *
 * Money flow per deal:
 *   Gross = Price × Rate
 *     − Zillow / lead referral (off the top, on referral/Zillow deals)
 *     − Concessions
 *   = Commissionable, which splits between the Agent and Charles ("Doctors"):
 *       Agent share   = commissionable × agentSplit%
 *       Charles share = the remainder
 *   Net to Agent   = agent share   − agent deductions (cap, royalty, E&O, compliance, dues, other) + bonus
 *   Net to Charles = charles share − charles deductions (cap, royalty, other)
 *   Net to Brokerage = everything that was deducted from both sides
 *                    = commissionable − net to agent − net to charles
 *                    (the pool of caps, compliance fees, monthly dues, E&O, royalties, deductions)
 */

export type Tier = "team" | "independent" | "owner";
export type SourceCategory = "company" | "self" | "referral";

export interface Agent {
  id?: string;
  name: string;
  email?: string;
  tier: Tier;
  /** % the agent keeps on their own (SOI / self-generated) deals */
  baseSplit: number;
  /** % the agent keeps on company-provided leads (Zillow etc.); null = none */
  zillowSplit: number | null;
  office?: string;
  cap?: number;
  capPaid?: number;
}

export interface Source {
  name: string;
  category: SourceCategory;
}

export interface DealInput {
  agent: Agent;
  source: Source;
  price: number;
  commissionPct: number;
  grossOverride?: number | null;
  /** Zillow / lead referral taken off the top, % of gross */
  referralPct?: number;
  concessions?: number;
  /** bonus added to the agent */
  bonus?: number;
  /** agent's split % of the commissionable amount; null = auto from agent + source */
  splitOverride?: number | null;

  // ----- Agent-side deductions (all go to the brokerage pool) -----
  agentCap?: number;
  agentRoyalty?: number;
  agentEO?: number;
  complianceFee?: number;
  monthlyDues?: number;
  agentDeductions?: number;

  // ----- Charles-side deductions (go to the brokerage pool) -----
  charlesCap?: number;
  charlesRoyalty?: number;
  charlesDeductions?: number;
}

export interface Statement {
  gross: number;
  referral: number;
  concessions: number;
  commissionable: number;

  agentSplitPct: number;
  agentShare: number;
  charlesShare: number;

  // line items
  agentCap: number;
  agentRoyalty: number;
  agentEO: number;
  complianceFee: number;
  monthlyDues: number;
  agentDeductions: number;
  agentDeductTotal: number;

  charlesCap: number;
  charlesRoyalty: number;
  charlesDeductions: number;
  charlesDeductTotal: number;

  bonus: number;

  // the three buckets
  netToAgent: number;
  netToCharles: number;
  netToBrokerage: number;
}

/** Agent's split % for an agent + source, before any override. */
export function autoSplit(agent: Agent, source: Source): number {
  if (agent.tier === "independent") return 100;
  if (agent.tier === "owner") return 0;
  if (source.category === "company") {
    return agent.zillowSplit != null ? agent.zillowSplit : agent.baseSplit;
  }
  return agent.baseSplit; // self-generated or referral source
}

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Compute the 3-way commission statement. */
export function calculate(input: DealInput): Statement {
  const {
    agent, source, price, commissionPct,
    grossOverride = null,
    referralPct = 0,
    concessions = 0,
    bonus = 0,
    splitOverride = null,
    agentCap = 0, agentRoyalty = 0, agentEO = 0, complianceFee = 0, monthlyDues = 0, agentDeductions = 0,
    charlesCap = 0, charlesRoyalty = 0, charlesDeductions = 0,
  } = input;

  const gross =
    grossOverride != null && !Number.isNaN(grossOverride)
      ? grossOverride
      : (price * commissionPct) / 100;

  const referral = gross * (referralPct / 100);
  const commissionable = gross - referral - concessions;

  const agentSplitPct = splitOverride != null ? splitOverride : autoSplit(agent, source);
  const agentShare = commissionable * (agentSplitPct / 100);
  const charlesShare = commissionable - agentShare;

  const agentDeductTotal = agentCap + agentRoyalty + agentEO + complianceFee + monthlyDues + agentDeductions;
  const charlesDeductTotal = charlesCap + charlesRoyalty + charlesDeductions;

  const netToAgent = agentShare - agentDeductTotal + bonus;
  const netToCharles = charlesShare - charlesDeductTotal;
  // Brokerage gets the remainder (the pool of all deductions, less the bonus paid out to the agent).
  const netToBrokerage = commissionable - netToAgent - netToCharles;

  return {
    gross: r2(gross),
    referral: r2(referral),
    concessions: r2(concessions),
    commissionable: r2(commissionable),
    agentSplitPct,
    agentShare: r2(agentShare),
    charlesShare: r2(charlesShare),
    agentCap: r2(agentCap), agentRoyalty: r2(agentRoyalty), agentEO: r2(agentEO),
    complianceFee: r2(complianceFee), monthlyDues: r2(monthlyDues), agentDeductions: r2(agentDeductions),
    agentDeductTotal: r2(agentDeductTotal),
    charlesCap: r2(charlesCap), charlesRoyalty: r2(charlesRoyalty), charlesDeductions: r2(charlesDeductions),
    charlesDeductTotal: r2(charlesDeductTotal),
    bonus: r2(bonus),
    netToAgent: r2(netToAgent),
    netToCharles: r2(netToCharles),
    netToBrokerage: r2(netToBrokerage),
  };
}

export const money = (n: number): string =>
  "$" +
  (Math.round((n || 0) * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
