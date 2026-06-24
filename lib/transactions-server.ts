import { createClient } from "@/lib/supabase/server";
import type { Txn, TxnNote } from "@/lib/transactions";

export async function listTransactions(): Promise<Txn[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  return (data as Txn[] | null) ?? [];
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
