import AgentsManager from "@/components/AgentsManager";
import { getAgents } from "@/lib/data";

export default async function AgentsPage() {
  const agents = await getAgents();
  return <AgentsManager agents={agents} />;
}
