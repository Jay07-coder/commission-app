import Link from "next/link";
import Calculator from "@/components/Calculator";
import { DEFAULT_AGENTS, DEFAULT_SOURCES } from "@/lib/seed-data";

export default function PreviewPage() {
  return (
    <>
      <header className="appbar">
        <div className="logo">TA</div>
        <div>
          <h1>Top Agent Realty — Commission App</h1>
          <div className="sub">Preview · calculation engine is final and tested</div>
        </div>
        <nav className="tabs">
          <Link href="/login" className="active">Log in / Sign up →</Link>
        </nav>
      </header>
      <div className="banner">
        This is the public preview — it runs on your roster with no login. Sign in to manage agents in the cloud and save
        statement history.
      </div>
      <main>
        <Calculator agents={DEFAULT_AGENTS} sources={DEFAULT_SOURCES} />
      </main>
    </>
  );
}
