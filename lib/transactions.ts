import type { Statement } from "@/lib/commission";

export type Stage =
  | "draft"
  | "commission"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "completed";

export const STAGE_LABEL: Record<Stage, string> = {
  draft: "Draft",
  commission: "Commission",
  pending_approval: "Pending approval",
  changes_requested: "Changes requested",
  approved: "Approved",
  completed: "Completed",
};

/** Roles allowed to take each kind of action (admins included to avoid lockouts). */
export const CREATE_ROLES = ["transaction_coordinator", "accountant", "broker", "owner"];
export const COMMISSION_ROLES = ["accountant", "broker", "owner"];
export const APPROVE_ROLES = ["broker", "owner"];
export const FINALIZE_ROLES = ["accountant", "broker", "owner"];

export interface Txn {
  id: string;
  stage: Stage;
  property_address: string | null;
  valuation: number | null;
  agent_name: string | null;
  source_name: string | null;
  side: string | null;
  client: string | null;
  close_date: string | null;
  commission_pct: number | null;
  input: Record<string, unknown> | null;
  result: Statement | null;
  net_to_agent: number | null;
  net_to_charles: number | null;
  net_to_brokerage: number | null;
  created_by_email: string | null;
  approved_by_email: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TxnNote {
  id: string;
  author_email: string | null;
  action: string;
  body: string | null;
  created_at: string;
}
