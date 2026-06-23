/**
 * Commission engine — Top Agent Realty
 * Pure, dependency-free calculation logic. Validated against real closed deals.
 *
 * The math: gross = price × rate → less referral & concessions → split between
 * agent and brokerage (chosen by source + agent plan) → less royalty/E&O/compliance
 * (for team agents) → net to agent.
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
  /** % the agent keeps on company-provided leads (Zillow etc.); null = no company-lead deals */
  zillowSplit: number | null;
  office?: string;
  /** annual cap amount in $, 0 = no cap */
  cap?: number;
  /** $ already paid toward cap this year */
  capPaid?: number;
}

export interface Source {
  name: string;
  category: SourceCategory;
}

export interface DealInput {
  agent: Agent;
  source: Source;
  /** sale price in $ (ignored if grossOverride is provided) */
  price: number;
  /** commission rate %, e.g. 3 */
  commissionPct: number;
  /** optional: set the gross commission directly instead of price × rate */
  grossOverride?: number | null;
  /** referral paid out, % off the top */
  referralPct?: number;
  /** seller concessions in $ */
  concessions?: number;
  /** bonus added to the agent in $ */
  bonus?: number;
  /** override the auto-selected split %; null/undefined = auto */
  splitOverride?: number | null;
  /** royalty % charged on the agent's share (team agents) */
  royaltyPct?: number;
  /** flat E&O fee in $ */
  eoFee?: number;
  /** flat compliance fee in $ */
  complianceFee?: number;
  /** cap handling: "auto" uses the agent's balance, "capped" forces 100%, "none" ignores */
  capMode?: "auto" | "capped" | "none";
}

export interface Statement {
  gross: number;
  referral: number;
  concessions: number;
  commissionable: number;
  splitPct: number;
  agentShare: number;
  brokerageShare: number;
  royalty: number;
  eoFee: number;
  complianceFee: number;
  bonus: number;
  agentDeductions: number;
  netToAgent: number;
  toBrokerage: number;
  capped: boolean;
  capRemaining: number;
  note: string;
}

/** Decide which split % applies for an agent + source, before any override. */
export function autoSplit(agent: Agent, source: Source): number {
  if (agent.tier === "independent") return 100;
  if (agent.tier === "owner") return 0;
  if (source.category === "company") {
    return agent.zillowSplit != null ? agent.zillowSplit : agent.baseSplit;
  }
  // self-generated or referral source → agent's base/SOI split
  return agent.baseSplit;
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Compute a full commission statement from a deal. */
export function calculate(input: DealInput): Statement {
  const {
    agent,
    source,
    price,
    commissionPct,
    grossOverride = null,
    referralPct = 0,
    concessions = 0,
    bonus = 0,
    splitOverride = null,
    royaltyPct = 0,
    eoFee = 0,
    complianceFee = 0,
    capMode = "auto",
  } = input;

  const gross =
    grossOverride != null && !Number.isNaN(grossOverride)
      ? grossOverride
      : (price * commissionPct) / 100;

  const referral = gross * (referralPct / 100);
  const commissionable = gross - referral - concessions;

  // cap handling
  const capRemaining = Math.max((agent.cap || 0) - (agent.capPaid || 0), 0);
  let capped = false;
  let note = "";
  if (capMode === "capped") {
    capped = true;
    note = "Marked capped — agent keeps 100%.";
  } else if (capMode === "auto" && agent.tier === "team" && (agent.cap || 0) > 0) {
    if (capRemaining <= 0) {
      capped = true;
      note = "Agent has met cap — keeping 100%.";
    } else {
      note = `Cap remaining: $${capRemaining.toFixed(2)}.`;
    }
  }

  const baseSplit = splitOverride != null ? splitOverride : autoSplit(agent, source);
  const splitPct = capped ? 100 : baseSplit;

  const agentShare = commissionable * (splitPct / 100);
  const brokerageShare = commissionable - agentShare;

  const royalty = agentShare * (royaltyPct / 100);
  const agentDeductions = royalty + eoFee + complianceFee;
  const netToAgent = agentShare - agentDeductions + bonus;
  const toBrokerage = brokerageShare + royalty + eoFee + complianceFee;

  return {
    gross: round2(gross),
    referral: round2(referral),
    concessions: round2(concessions),
    commissionable: round2(commissionable),
    splitPct,
    agentShare: round2(agentShare),
    brokerageShare: round2(brokerageShare),
    royalty: round2(royalty),
    eoFee: round2(eoFee),
    complianceFee: round2(complianceFee),
    bonus: round2(bonus),
    agentDeductions: round2(agentDeductions),
    netToAgent: round2(netToAgent),
    toBrokerage: round2(toBrokerage),
    capped,
    capRemaining: round2(capRemaining),
    note,
  };
}

export const money = (n: number): string =>
  "$" +
  (Math.round((n || 0) * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
