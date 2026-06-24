import { getContext } from "@/lib/data";
import { CREATE_ROLES } from "@/lib/transactions";
import { listTransactions } from "@/lib/transactions-server";
import TransactionsBoard from "@/components/TransactionsBoard";

export default async function TransactionsPage() {
  const ctx = await getContext();
  const transactions = await listTransactions();
  const canCreate = !!ctx && CREATE_ROLES.includes(ctx.role);
  return <TransactionsBoard transactions={transactions} canCreate={canCreate} />;
}
