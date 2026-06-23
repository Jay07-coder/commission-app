import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { signOut } from "@/app/auth/actions";
import NavTabs from "@/components/NavTabs";

const ROLE_LABEL: Record<string, string> = {
  owner: "Super Admin",
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
          <div className="logo">TA</div>
          <div><h1>{ctx.brokerageName}</h1><div className="sub">{ctx.email}</div></div>
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

  const owner = ctx.role === "owner";
  return (
    <>
      <header className="appbar">
        <div className="logo">TA</div>
        <div>
          <h1>{ctx.brokerageName}</h1>
          <div className="sub">{ctx.email} · {ROLE_LABEL[ctx.role] || ctx.role}</div>
        </div>
        <nav className="tabs">
          <NavTabs isOwner={owner} />
          <form action={signOut} style={{ display: "inline" }}><button type="submit">Sign out</button></form>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
