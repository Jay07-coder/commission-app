"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext, canManageTeam } from "@/lib/data";

type Result = { ok: boolean; message?: string };

/** Owner or Broker may manage the team. */
async function teamAdminGuard(): Promise<Result | null> {
  const ctx = await getContext();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!canManageTeam(ctx)) return { ok: false, message: "You don't have permission to manage the team" };
  return null;
}

// Roles that can be assigned through the app (never 'owner' — there is one Super Admin).
const ROLES = ["broker", "transaction_coordinator", "accountant", "agent"];

/** Approve a pending member and give them a role (or just change a role). */
export async function setMemberRole(membershipId: string, role: string): Promise<Result> {
  const guard = await teamAdminGuard();
  if (guard) return guard;
  if (!ROLES.includes(role)) return { ok: false, message: "Invalid role" };
  const supabase = await createClient();
  // The Super Admin (owner) account can't be changed by anyone (incl. brokers).
  const { data: target } = await supabase.from("memberships").select("role").eq("id", membershipId).single();
  if (target?.role === "owner") return { ok: false, message: "The Super Admin account can't be changed" };
  const { error } = await supabase
    .from("memberships")
    .update({ role, status: "active" })
    .eq("id", membershipId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function removeMember(membershipId: string): Promise<Result> {
  const guard = await teamAdminGuard();
  if (guard) return guard;
  const ctx = await getContext();
  const supabase = await createClient();
  const { data: row } = await supabase.from("memberships").select("user_id, role").eq("id", membershipId).single();
  if (row?.user_id === ctx?.userId) return { ok: false, message: "You can't remove yourself" };
  // Protect the Super Admin account.
  if (row?.role === "owner") return { ok: false, message: "The Super Admin account can't be removed" };
  const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}
