import Link from "next/link";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { signOut } from "@/app/auth/actions";
import NavTabs from "@/components/NavTabs";

const ROLE_LABEL: Record<string, string> = {
  owner: "Super Admin",
  broker: "Broker",
  transaction_coordinator: "Transaction Coordinator",
  accountant: "Accountant",
  agent: "Agent",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getContext();
  if (!ctx) redirect("/login");

  // Pending members can't use the app until an owner approves them.
  if (ctx.status === "pending") {
    return (
      <>
        <header className="appbar">
          <img src="https://topagentrealtymi.com/wp-content/uploads/2026/01/Untitled-design-7-1.png" alt="Top Agent Realty" style={{ height: 30, width: "auto", display: "block" }} />
          <div className="sub" style={{ marginLeft: 4 }}>{ctx.email}</div>
          <nav className="tabs">
            <form action={signOut} style={{ display: "inline" }}><button type="submit">Sign out</button></form>
          </nav>
        </header>
        <main>
          <div className="card" style={{ maxWidth: 560, margin: "48px auto", textAlign: "center" }}>
            <h2>Awaiting approval</h2>
            <p className="muted" style={{ lineHeight: 1.6 }}>
              Your request to join <b>{ctx.brokerageName}</b> has been received. An administrator needs to approve your
              account and assign your role before you can access the app — you&apos;ll be in as soon as they do.
            </p>
          </div>
        </main>
      </>
    );
  }

  const canManageTeam = ctx.role === "owner" || ctx.role === "broker";
  return (
    <>
      <header className="appbar">
        <Link href="/app/transactions" style={{ display: "inline-flex" }} aria-label="Go to board">
          <img src="https://topagentrealtymi.com/wp-content/uploads/2026/01/Untitled-design-7-1.png" alt="Top Agent Realty" style={{ height: 30, width: "auto", display: "block", cursor: "pointer" }} />
        </Link>
        <div className="sub" style={{ marginLeft: 4 }}>{ctx.email} · {ROLE_LABEL[ctx.role] || ctx.role}</div>
        <nav className="tabs">
          <NavTabs canManageTeam={canManageTeam} />
          <form action={signOut} style={{ display: "inline" }}><button type="submit">Sign out</button></form>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
