import Link from "next/link";
import Logo from "@/components/Logo";

const FEATURES = [
  {
    title: "Accurate commission splits",
    body: "Calculate net-to-agent, net-to-broker, and partner splits in seconds — referral fees, caps, royalties, E&O, compliance, and deductions all handled automatically.",
  },
  {
    title: "Per-source, per-agent rules",
    body: "Every lead source and agent can carry its own split logic. Set it once and the right numbers flow through on every deal.",
  },
  {
    title: "Polished client statements",
    body: "Generate a clean, professional commission statement for every transaction — ready to copy, print, or share with your accountant.",
  },
  {
    title: "Roles for your whole team",
    body: "Invite transaction coordinators, accountants, and brokers. You approve each request and assign exactly the access they need.",
  },
  {
    title: "Secure cloud history",
    body: "Sign in and your agents, sources, and saved statements live safely in the cloud — available to your team, isolated to your brokerage.",
  },
  {
    title: "Branded from your domain",
    body: "Confirmation and account emails are sent from your own domain with your logo, so everything your team receives looks like you.",
  },
];

export default function LandingPage() {
  return (
    <>
      <header className="appbar">
        <Logo variant="dark" size={30} />
        <nav className="tabs">
          <Link href="/login" className="active">Log in / Sign up →</Link>
        </nav>
      </header>

      <main>
        <section style={{ textAlign: "center", padding: "56px 16px 36px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "5px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".4px",
              textTransform: "uppercase",
              background: "#eef2ff",
              color: "var(--accent)",
              marginBottom: 18,
            }}
          >
            Every commission, settled clean
          </div>
          <h2
            style={{
              fontSize: 40,
              lineHeight: 1.15,
              fontWeight: 800,
              margin: "0 auto 16px",
              maxWidth: 720,
              color: "var(--ink)",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            Commission calculations, done right — every deal, every time.
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 600, margin: "0 auto 28px", lineHeight: 1.6 }}>
            A purpose-built tool for the brokerage. Calculate splits, generate clean statements, and keep your whole
            team on the same page — securely in the cloud.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn" style={{ padding: "13px 26px", fontSize: 15 }}>
              Get started
            </Link>
            <Link href="/login" className="btn ghost" style={{ padding: "13px 26px", fontSize: 15 }}>
              Log in
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
            padding: "16px 0 40px",
          }}
        >
          {FEATURES.map((f) => (
            <div className="card" key={f.title}>
              <h2 style={{ textTransform: "none", letterSpacing: 0, fontSize: 17, color: "var(--ink)", marginBottom: 8 }}>
                {f.title}
              </h2>
              <p className="muted" style={{ margin: 0, lineHeight: 1.6, fontSize: 14 }}>
                {f.body}
              </p>
            </div>
          ))}
        </section>

        <section
          className="card"
          style={{ textAlign: "center", padding: "40px 24px", marginBottom: 48 }}
        >
          <h2 style={{ textTransform: "none", letterSpacing: 0, fontSize: 24, color: "var(--ink)", marginBottom: 10 }}>
            Ready to run your next deal?
          </h2>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto 22px", lineHeight: 1.6 }}>
            Sign in to manage your agents and lead sources, calculate commissions, and save your statement history.
            New team members can request access and you approve them.
          </p>
          <Link href="/login" className="btn" style={{ padding: "13px 26px", fontSize: 15 }}>
            Log in / Sign up →
          </Link>
        </section>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "20px 22px",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        © SplitKey · Commission management for brokerages
      </footer>
    </>
  );
}
