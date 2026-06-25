import { createClient } from "@/lib/supabase/server";
import type { Txn, TxnNote } from "@/lib/transactions";

/** Active deals for the Kanban board — excludes bulk-imported historical rows so the board stays fast. */
export async function listTransactions(): Promise<Txn[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("imported", false)
    .order("created_at", { ascending: false })
    .limit(1000);
  return (data as Txn[] | null) ?? [];
}

/** Every transaction (including imported history) for Reports & the AI — light columns, paginated past 1000. */
export async function listAllForReports(): Promise<Txn[]> {
  const supabase = await createClient();
  const cols =
    "id, stage, agent_name, source_name, city, zipcode, side, client, property_address, valuation, commission_pct, close_date, created_at, net_to_agent, net_to_charles, net_to_brokerage, result, external_status, imported";
  const all: Txn[] = [];
  const pageSize = 1000;
  for (let from = 0; from < 50000; from += pageSize) {
    const { data, error } = await supabase
      .from("transactions")
      .select(cols)
      .order("close_date", { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    all.push(...(data as unknown as Txn[]));
    if (data.length < pageSize) break;
  }
  return all;
}

export async function getTransaction(id: string): Promise<{ txn: Txn | null; notes: TxnNote[] }> {
  const supabase = await createClient();
  const { data: txn } = await supabase.from("transactions").select("*").eq("id", id).single();
  const { data: notes } = await supabase
    .from("transaction_notes")
    .select("id, author_email, action, body, created_at")
    .eq("transaction_id", id)
    .order("created_at", { ascending: true });
  return { txn: (txn as Txn | null) ?? null, notes: (notes as TxnNote[] | null) ?? [] };
}
