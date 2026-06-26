import Link from "next/link";
import { redirect } from "next/navigation";
import { getContext, getMyTaxProfile } from "@/lib/data";
import { signOut } from "@/app/auth/actions";
import NavTabs from "@/components/NavTabs";
import Logo from "@/components/Logo";
import ChatWidget from "@/components/ChatWidget";
import W9Form from "@/components/W9Form";

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
    const taxProfile = await getMyTaxProfile();
    return (
      <>
        <header className="appbar">
          <Logo variant="dark" size={30} />
          <div className="sub" style={{ marginLeft: 4 }}>{ctx.email}</div>
          <nav className="tabs">
            <form action={signOut} style={{ display: "inline" }}><button type="submit">Sign out</button></form>
          </nav>
        </header>
        <main>
          <div style={{ maxWidth: 560, margin: "40px auto 0" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <h2>Awaiting approval</h2>
              <p className="muted" style={{ lineHeight: 1.6 }}>
                Your request to join <b>{ctx.brokerageName}</b> has been received. An administrator needs to approve your
                account before you can access the app — you&apos;ll be in as soon as they do.
              </p>
            </div>
            <p className="hint" style={{ margin: "20px 0 10px", textAlign: "center" }}>
              While you wait, get a head start — add your tax info so your broker can issue your 1099 at year-end.
            </p>
            <W9Form profile={taxProfile} intro="Complete this now so it’s ready the moment you’re approved. It’s visible only to you and your brokerage’s admins." />
          </div>
        </main>
      </>
    );
  }

  const canManageTeam = ctx.role === "owner" || ctx.role === "broker";
  return (
    <>
      <header className="appbar">
        <Link href="/app/transactions" style={{ display: "inline-flex", cursor: "pointer" }} aria-label="Go to board">
          <Logo variant="dark" size={30} />
        </Link>
        <div className="sub" style={{ marginLeft: 4 }}>{ctx.brokerageName} · {ROLE_LABEL[ctx.role] || ctx.role}</div>
        <nav className="tabs">
          <NavTabs canManageTeam={canManageTeam} role={ctx.role} />
          <form action={signOut} style={{ display: "inline" }}><button type="submit">Sign out</button></form>
        </nav>
      </header>
      <main>{children}</main>
      <ChatWidget />
    </>
  );
}
