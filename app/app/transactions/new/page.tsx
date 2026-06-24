import { redirect } from "next/navigation";
import { getContext, getAgents, getSources } from "@/lib/data";
import { CREATE_ROLES } from "@/lib/transactions";
import NewTransactionForm from "@/components/NewTransactionForm";

export default async function NewTransactionPage() {
  const ctx = await getContext();
  if (!ctx || !CREATE_ROLES.includes(ctx.role)) redirect("/app/transactions");
  const [agents, sources] = await Promise.all([getAgents(), getSources()]);
  return <NewTransactionForm agents={agents.map((a) => a.name)} sources={sources.map((s) => s.name)} />;
}
