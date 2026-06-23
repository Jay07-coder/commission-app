import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { signOut } from "@/app/auth/actions";
import NavTabs from "@/components/NavTabs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getContext();
  if (!ctx) redirect("/login");

  return (
    <>
      <header className="appbar">
        <div className="logo">TA</div>
        <div>
          <h1>{ctx.brokerageName}</h1>
          <div className="sub">{ctx.email}</div>
        </div>
        <nav className="tabs">
          <NavTabs />
          <form action={signOut} style={{ display: "inline" }}>
            <button type="submit">Sign out</button>
          </form>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
