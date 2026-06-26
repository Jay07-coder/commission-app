import { redirect } from "next/navigation";
import { getContext, getMyAgent } from "@/lib/data";
import { listMyDeals } from "@/lib/transactions-server";
import AgentPortal from "@/components/AgentPortal";

export const dynamic = "force-dynamic";

export default async function MyPortalPage() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");

  const agent = await getMyAgent();
  const deals = agent ? await listMyDeals(agent.name) : [];

  return <AgentPortal agent={agent} email={ctx.email} deals={deals} />;
}

