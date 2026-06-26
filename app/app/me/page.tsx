import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getContext, getMyAgent, getAgentByName, getAgents, canManageTeam } from "@/lib/data";
import { listMyDeals } from "@/lib/transactions-server";
import AgentPortal from "@/components/AgentPortal";
import ViewAsBar from "@/components/ViewAsBar";

export const dynamic = "force-dynamic";

export default async function MyPortalPage() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");

  const isAdmin = canManageTeam(ctx);
  let viewingName: string | null = null;
  if (isAdmin) {
    const c = await cookies();
    viewingName = c.get("viewAs")?.value || null;
  }

  const agent = viewingName ? await getAgentByName(viewingName) : await getMyAgent();
  const deals = agent ? await listMyDeals(agent.name) : [];
  const agentNames = isAdmin ? (await getAgents()).map((a) => a.name) : [];

  return (
    <>
      {isAdmin && <ViewAsBar agentNames={agentNames} viewingName={viewingName} />}
      <AgentPortal agent={agent} email={viewingName || ctx.email} deals={deals} />
    </>
  );
}
