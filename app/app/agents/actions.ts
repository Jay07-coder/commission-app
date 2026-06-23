"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import type { Agent } from "@/lib/commission";

export async function saveAgent(a: Agent): Promise<{ ok: boolean; message?: string }> {
  const ctx = await getContext();
  if (!ctx) return { ok: false, message: "Not signed in" };
  const supabase = await createClient();

  const row = {
    brokerage_id: ctx.brokerageId,
    name: a.name.trim(),
    email: a.email?.trim() || null,
    tier: a.tier,
    base_split: a.baseSplit,
    zillow_split: a.zillowSplit,
    office: a.office?.trim() || null,
    cap: a.cap || 0,
    cap_paid: a.capPaid || 0,
  };
  if (!row.name) return { ok: false, message: "Name is required" };

  const { error } = a.id
    ? await supabase.from("agents").update(row).eq("id", a.id)
    : await supabase.from("agents").insert(row);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/agents");
  return { ok: true };
}

export async function deleteAgent(id: string): Promise<{ ok: boolean; message?: string }> {
  const ctx = await getContext();
  if (!ctx) return { ok: false, message: "Not signed in" };
  const supabase = await createClient();
  const { error } = await supabase.from("agents").update({ active: false }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/agents");
  return { ok: true };
}
