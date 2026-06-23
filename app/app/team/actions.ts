"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext, isOwner } from "@/lib/data";

type Result = { ok: boolean; message?: string };

async function ownerGuard(): Promise<Result | null> {
  const ctx = await getContext();
  if (!ctx) return { ok: false, message: "Not signed in" };
  if (!isOwner(ctx)) return { ok: false, message: "Only the Super Admin can manage the team" };
  return null;
}

const ROLES = ["transaction_coordinator", "accountant", "agent", "owner"];

/** Approve a pending member and give them a role (or just change a role). */
export async function setMemberRole(membershipId: string, role: string): Promise<Result> {
  const guard = await ownerGuard();
  if (guard) return guard;
  if (!ROLES.includes(role)) return { ok: false, message: "Invalid role" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role, status: "active" })
    .eq("id", membershipId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function removeMember(membershipId: string): Promise<Result> {
  const guard = await ownerGuard();
  if (guard) return guard;
  const ctx = await getContext();
  const supabase = await createClient();
  // don't let the owner delete themselves
  const { data: row } = await supabase.from("memberships").select("user_id, role").eq("id", membershipId).single();
  if (row?.user_id === ctx?.userId) return { ok: false, message: "You can't remove yourself" };
  const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}
