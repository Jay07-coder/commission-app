import { notFound } from "next/navigation";
import { getContext, getAgents, getSources } from "@/lib/data";
import { getTransaction } from "@/lib/transactions-server";
import TransactionDetail from "@/components/TransactionDetail";

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getContext();
  const { txn, notes } = await getTransaction(id);
  if (!ctx || !txn) notFound();
  const [agents, sources] = await Promise.all([getAgents(), getSources()]);
  const agent = agents.find((a) => a.name === txn.agent_name) ?? null;
  const source = sources.find((s) => s.name === txn.source_name) ?? null;
  return (
    <TransactionDetail
      txn={txn}
      notes={notes}
      role={ctx.role}
      agent={agent}
      source={source}
      agentNames={agents.map((a) => a.name)}
      sourceNames={sources.map((s) => s.name)}
    />
  );
}
