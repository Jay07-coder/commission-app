"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getContext, canManageTeam } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const f = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Save (upsert) the signed-in user's own W-9 / tax profile. Works while pending too. */
export async function saveW9(_prev: unknown, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await getContext();
  if (!ctx) return { error: "Please sign in again." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const legal_name = f(formData, "legal_name");
  const tin = f(formData, "tin");
  if (!legal_name) return { error: "Legal name is required." };
  if (!tin) return { error: "Your SSN or EIN is required for a 1099." };

  const row = {
    user_id: user.id,
    brokerage_id: ctx.brokerageId,
    email: ctx.email,
    legal_name,
    business_name: f(formData, "business_name"),
    classification: f(formData, "classification"),
    tin_type: f(formData, "tin_type") || "ssn",
    tin,
    address1: f(formData, "address1"),
    address2: f(formData, "address2"),
    city: f(formData, "city"),
    state: f(formData, "state"),
    zip: f(formData, "zip"),
    signed_name: f(formData, "signed_name") || legal_name,
    signed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("agent_tax_profiles").upsert(row, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/app/me");
  revalidatePath("/app");
  return { ok: true };
}

/** Admin-only: view a given agent's portal by setting a cookie. Empty name clears it. */
export async function viewAsAgent(name: string) {
  const ctx = await getContext();
  if (!canManageTeam(ctx)) return;
  const c = await cookies();
  if (name) c.set("viewAs", name, { path: "/", httpOnly: true, sameSite: "lax" });
  else c.delete("viewAs");
  revalidatePath("/app/me");
}

export async function clearViewAs() {
  const c = await cookies();
  c.delete("viewAs");
  revalidatePath("/app/me");
}
