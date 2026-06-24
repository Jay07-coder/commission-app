import { getContext } from "@/lib/data";
import { CREATE_ROLES } from "@/lib/transactions";
import { listTransactions } from "@/lib/transactions-server";
import TransactionsList from "@/components/TransactionsList";

export default async function TransactionsPage() {
  const ctx = await getContext();
  const transactions = await listTransactions();
  const canCreate = !!ctx && CREATE_ROLES.includes(ctx.role);
  return <TransactionsList transactions={transactions} canCreate={canCreate} />;
}
