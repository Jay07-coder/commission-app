"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import type { SavePayload } from "@/components/Calculator";

export async function saveStatement(p: SavePayload): Promise<{ ok: boolean; message?: string }> {
  const ctx = await getContext();
  if (!ctx) return { ok: false, message: "Not signed in" };
  const supabase = await createClient();

  const { count } = await supabase
    .from("statements").select("id", { count: "exact", head: true });
  const number = "TAR-" + (1000 + (count ?? 0) + 1);

  const { error } = await supabase.from("statements").insert({
    brokerage_id: ctx.brokerageId,
    number,
    agent_name: p.agentName,
    property: p.property || null,
    client: p.client || null,
    side: p.side,
    source_name: p.sourceName,
    close_date: p.closeDate || null,
    price: p.input.price ?? null,
    commission_pct: p.input.commissionPct ?? null,
    gross_override: p.input.grossOverride ?? null,
    referral_pct: p.input.referralPct ?? 0,
    concessions: p.input.concessions ?? 0,
    bonus: p.input.bonus ?? 0,
    split_pct: p.result.agentSplitPct,
    royalty_pct: p.input.agentRoyalty ?? 0,
    eo_fee: p.input.agentEO ?? 0,
    compliance_fee: p.input.complianceFee ?? 0,
    result: p.result,
    net_to_agent: p.result.netToAgent,
    status: "draft",
    created_by: ctx.userId,
  });

  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_log").insert({
    brokerage_id: ctx.brokerageId, user_id: ctx.userId, action: "statement.created",
    detail: { number, agent: p.agentName, net: p.result.netToAgent },
  });
  revalidatePath("/app/history");
  return { ok: true };
}
