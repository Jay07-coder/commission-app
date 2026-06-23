import Calculator from "@/components/Calculator";
import { getAgents, getSources, getContext } from "@/lib/data";
import { saveStatement } from "./actions";

export default async function CalculatorPage() {
  const [agents, sources, ctx] = await Promise.all([getAgents(), getSources(), getContext()]);
  return (
    <Calculator
      agents={agents}
      sources={sources}
      brokerageName={ctx?.brokerageName || "Top Agent Realty"}
      onSave={saveStatement}
    />
  );
}
