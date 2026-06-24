import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { getTransaction } from "@/lib/transactions-server";
import StatementView from "@/components/StatementView";
import PrintTrigger from "@/components/PrintTrigger";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getContext();
  const { txn } = await getTransaction(id);
  if (!ctx || !txn || !txn.result) notFound();
  return (
    <div className="print-sheet" style={{ background: "#fff", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <StatementView txn={txn} s={txn.result} />
      </div>
      <PrintTrigger />
    </div>
  );
}
