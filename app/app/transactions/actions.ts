"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext, canManageTeam } from "@/lib/data";
import { sendApprovalEmail } from "@/lib/email";
import { CREATE_ROLES, COMMISSION_ROLES, APPROVE_ROLES, FINALIZE_ROLES, STAGE_LABEL, type Stage } from "@/lib/transactions";
import type { Statement } from "@/lib/commission";

type Result = { ok: boolean; message?: string; id?: string };

export interface DealPayload {
  property_address: string;
  valuation: number | null;
  agent_name: string;
  source_name: string;
  side: string;
  client: string;
  close_date: string;
  commission_pct: number | null;
}

export interface CommissionPayload {
  input: Record<string, unknown>;
  result: Statement;
}

async function ctxOrFail() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") return null;
  return ctx;
}

export async function createDraft(deal: DealPayload): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!CREATE_ROLES.includes(ctx.role)) return { ok: false, message: "You can't create transactions" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      brokerage_id: ctx.brokerageId,
      created_by_email: ctx.email,
      stage: "draft",
      property_address: deal.property_address || null,
      valuation: deal.valuation,
      agent_name: deal.agent_name || null,
      source_name: deal.source_name || null,
      side: deal.side || "Buyer",
      client: deal.client || null,
      close_date: deal.close_date || null,
      commission_pct: deal.commission_pct,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/transactions");
  return { ok: true, id: (data as { id: string }).id };
}

export async function saveDeal(id: string, deal: DealPayload): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!CREATE_ROLES.includes(ctx.role)) return { ok: false, message: "No permission" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      property_address: deal.property_address || null,
      valuation: deal.valuation,
      agent_name: deal.agent_name || null,
      source_name: deal.source_name || null,
      side: deal.side || "Buyer",
      client: deal.client || null,
      close_date: deal.close_date || null,
      commission_pct: deal.commission_pct,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("stage", "draft");
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/app/transactions/${id}`);
  return { ok: true };
}

async function addNoteRow(id: string, brokerageId: string, email: string, action: string, body?: string) {
  const supabase = await createClient();
  await supabase.from("transaction_notes").insert({
    transaction_id: id,
    brokerage_id: brokerageId,
    author_email: email,
    action,
    body: body || null,
  });
}

export async function submitToAccountant(id: string): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!CREATE_ROLES.includes(ctx.role)) return { ok: false, message: "No permission" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ stage: "commission", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("stage", "draft");
  if (error) return { ok: false, message: error.message };
  await addNoteRow(id, ctx.brokerageId, ctx.email, "submit", "Sent to accountant for commission.");
  revalidatePath(`/app/transactions/${id}`);
  return { ok: true };
}

export async function saveCommission(id: string, payload: CommissionPayload): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!COMMISSION_ROLES.includes(ctx.role)) return { ok: false, message: "Only the accountant can edit commission" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      input: payload.input,
      result: payload.result,
      net_to_agent: payload.result.netToAgent,
      net_to_charles: payload.result.netToCharles,
      net_to_brokerage: payload.result.netToBrokerage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("stage", ["commission", "changes_requested"]);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/app/transactions/${id}`);
  return { ok: true };
}

export async function submitForApproval(id: string): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!COMMISSION_ROLES.includes(ctx.role)) return { ok: false, message: "No permission" };
  const supabase = await createClient();
  const { data: txn } = await supabase.from("transactions").select("result, property_address, agent_name").eq("id", id).single();
  if (!txn?.result) return { ok: false, message: "Add the commission details before submitting." };
  const { error } = await supabase
    .from("transactions")
    .update({ stage: "pending_approval", submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("stage", ["commission", "changes_requested"]);
  if (error) return { ok: false, message: error.message };
  await addNoteRow(id, ctx.brokerageId, ctx.email, "submit", "Submitted for broker approval.");

  // Notify the broker(s) / owner of this brokerage.
  const { data: approvers } = await supabase
    .from("memberships")
    .select("email, role, status")
    .eq("brokerage_id", ctx.brokerageId)
    .in("role", ["broker", "owner"])
    .eq("status", "active");
  const to = ((approvers as { email: string | null }[] | null) ?? [])
    .map((m) => m.email)
    .filter((e): e is string => !!e);
  await sendApprovalEmail({
    to,
    property: (txn as { property_address: string | null }).property_address || "",
    agent: (txn as { agent_name: string | null }).agent_name || "",
    submittedBy: ctx.email,
    transactionId: id,
  });

  revalidatePath(`/app/transactions/${id}`);
  revalidatePath("/app/transactions");
  return { ok: true };
}

export async function approveTransaction(id: string, note?: string): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!APPROVE_ROLES.includes(ctx.role)) return { ok: false, message: "Only a broker can approve" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ stage: "approved", approved_at: new Date().toISOString(), approved_by_email: ctx.email, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("stage", "pending_approval");
  if (error) return { ok: false, message: error.message };
  await addNoteRow(id, ctx.brokerageId, ctx.email, "approve", note || "Approved.");
  revalidatePath(`/app/transactions/${id}`);
  revalidatePath("/app/transactions");
  return { ok: true };
}

export async function requestChanges(id: string, note: string): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!APPROVE_ROLES.includes(ctx.role)) return { ok: false, message: "Only a broker can request changes" };
  if (!note.trim()) return { ok: false, message: "Add a note explaining what to change." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ stage: "changes_requested", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("stage", "pending_approval");
  if (error) return { ok: false, message: error.message };
  await addNoteRow(id, ctx.brokerageId, ctx.email, "request_changes", note.trim());
  revalidatePath(`/app/transactions/${id}`);
  revalidatePath("/app/transactions");
  return { ok: true };
}

export async function finalizeTransaction(id: string): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!FINALIZE_ROLES.includes(ctx.role)) return { ok: false, message: "No permission" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ stage: "completed", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("stage", "approved");
  if (error) return { ok: false, message: error.message };
  await addNoteRow(id, ctx.brokerageId, ctx.email, "finalize", "Statement sent to agent — transaction completed.");
  revalidatePath(`/app/transactions/${id}`);
  revalidatePath("/app/transactions");
  return { ok: true };
}

/** Drag-and-drop on the board: move a transaction to a new stage, with the same gating & effects as the buttons. */
export async function moveStage(id: string, to: Stage): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };

  const allowedRoles =
    to === "draft" || to === "commission" ? Array.from(new Set([...CREATE_ROLES, ...COMMISSION_ROLES]))
    : to === "pending_approval" ? COMMISSION_ROLES
    : to === "changes_requested" || to === "approved" ? APPROVE_ROLES
    : to === "completed" ? FINALIZE_ROLES
    : [];
  if (!allowedRoles.includes(ctx.role)) {
    return { ok: false, message: `You don't have permission to move a card to “${STAGE_LABEL[to]}”.` };
  }

  const supabase = await createClient();
  const { data: txn } = await supabase
    .from("transactions")
    .select("stage, result, property_address, agent_name")
    .eq("id", id)
    .single();
  if (!txn) return { ok: false, message: "Transaction not found" };
  if (to === "pending_approval" && !(txn as { result: unknown }).result) {
    return { ok: false, message: "Add the commission details first — open the card." };
  }

  const patch: Record<string, unknown> = { stage: to, updated_at: new Date().toISOString() };
  if (to === "pending_approval") patch.submitted_at = new Date().toISOString();
  if (to === "approved") { patch.approved_at = new Date().toISOString(); patch.approved_by_email = ctx.email; }

  const { error } = await supabase.from("transactions").update(patch).eq("id", id);
  if (error) return { ok: false, message: error.message };

  const noteAction =
    to === "approved" ? "approve" : to === "changes_requested" ? "request_changes"
    : to === "completed" ? "finalize" : "submit";
  await addNoteRow(id, ctx.brokerageId, ctx.email, noteAction, `Moved to “${STAGE_LABEL[to]}” on the board.`);

  if (to === "pending_approval") {
    const { data: approvers } = await supabase
      .from("memberships").select("email, role, status")
      .eq("brokerage_id", ctx.brokerageId).in("role", ["broker", "owner"]).eq("status", "active");
    const recips = ((approvers as { email: string | null }[] | null) ?? []).map((m) => m.email).filter((e): e is string => !!e);
    await sendApprovalEmail({
      to: recips,
      property: (txn as { property_address: string | null }).property_address || "",
      agent: (txn as { agent_name: string | null }).agent_name || "",
      submittedBy: ctx.email,
      transactionId: id,
    });
  }

  revalidatePath("/app/transactions");
  return { ok: true };
}

/** Permanently delete a transaction (admins only). */
export async function deleteTransaction(id: string): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!canManageTeam(ctx)) return { ok: false, message: "Only an admin can delete transactions" };
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/transactions");
  return { ok: true };
}

export async function addComment(id: string, body: string): Promise<Result> {
  const ctx = await ctxOrFail();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!body.trim()) return { ok: false, message: "Empty note" };
  await addNoteRow(id, ctx.brokerageId, ctx.email, "comment", body.trim());
  revalidatePath(`/app/transactions/${id}`);
  return { ok: true };
}
