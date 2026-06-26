import Link from "next/link";
import Logo from "@/components/Logo";
import Scene3D from "@/components/Scene3D";
import ScrollFX from "@/components/ScrollFX";

/* ---------- tiny inline icons ---------- */
const I = {
  calc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/></svg>,
  board: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="20" x2="4" y2="11"/><line x1="10" y1="20" x2="10" y2="4"/><line x1="16" y1="20" x2="16" y2="14"/><line x1="22" y1="20" x2="2" y2="20"/></svg>,
  ai: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 14l.7 1.8L21.5 16.5 19.7 17.2 19 19l-.7-1.8L16.5 16.5l1.8-.7z"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>,
  portal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
};
const check = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5"/></svg>;

const FEATURES = [
  { ic: I.calc, t: "Exact commission splits", b: "Agent, brokerage, and partner splits with caps, royalties, referral fees, and deductions all handled automatically. No spreadsheet math." },
  { ic: I.board, t: "Deal board & approvals", b: "Track every deal from draft to close with built-in broker sign-off and automatic email notifications at each step." },
  { ic: I.chart, t: "Reports & KPIs", b: "Live dashboards for gross, net, top agents, lead sources, and geography. Filter by period and source in a click." },
  { ic: I.ai, t: "AI copilot", b: "A built-in assistant that answers questions in plain English, like “show me KPIs for this agent,” grounded in your live data." },
  { ic: I.map, t: "Zillow zip targeting + map", b: "Automatically pull zip codes from lead sources and visualize target areas on a live map for smarter ad spend." },
  { ic: I.portal, t: "Agent self-serve portal", b: "Agents log in to see their own deals, earnings, and cap progress. No more fielding “what did I make?” questions." },
  { ic: I.doc, t: "1099 & W-9 suite", b: "Agents self-onboard their W-9 and SplitKey tallies year-end 1099-NEC totals automatically, even for agents who’ve left." },
  { ic: I.shield, t: "Roles & bank-grade security", b: "Owner, broker, coordinator, accountant, and agent roles, each with the right access, plus full per-brokerage data isolation." },
];

// 👉 Paste your Calendly link here when ready (e.g. "https://calendly.com/your-handle/demo").
// Until then, "Book a demo" opens an email to request one.
const CALENDLY_URL = "";
const CONTACT_HREF = "mailto:jay@topagentmi.com?subject=SplitKey%20inquiry";
const DEMO_HREF = CALENDLY_URL || "mailto:jay@topagentmi.com?subject=SplitKey%20demo%20request";

const mailIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
const calIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>;

const tShield = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
const tLock = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
const tUsers = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.8"/><path d="M18 15c2.2.4 3.5 1.8 3.5 4"/></svg>;
const tNoSell = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function LandingPage() {
  return (
    <div className="lp lp-immersive">
      <Scene3D />
      <ScrollFX />
      {/* NAV */}
      <header className="lp-nav">
        <div className="lp-nav-in">
          <Logo variant="dark" size={28} />
          <nav className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="lp-nav-cta">
            <Link href="/login" className="lp-blink">Log in</Link>
            <Link href="/login" className="lp-btn lp-btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <span className="lp-eyebrow">★ Built for real-estate brokerages</span>
          <h1 className="lp-h1">Run every commission like clockwork.</h1>
          <p className="lp-sub">
            SplitKey is the all-in-one commission platform for brokerages. Calculate splits, route approvals,
            pay agents, and file 1099s, all in one place.
          </p>
          <div className="lp-hero-cta">
            <Link href="/login" className="lp-btn lp-btn-primary lp-btn-lg">Get started free</Link>
            <a href="#features" className="lp-btn lp-btn-ghost lp-btn-lg">See features</a>
          </div>
          <div className="lp-hero-note">✓ No spreadsheets &nbsp;·&nbsp; ✓ Set up in minutes &nbsp;·&nbsp; ✓ Your data, isolated &amp; secure</div>

          {/* Dashboard mock */}
          <div className="lp-mock">
            <div className="lp-mock-bar">
              <span className="lp-dot" style={{ background: "#ff5f57" }} />
              <span className="lp-dot" style={{ background: "#febc2e" }} />
              <span className="lp-dot" style={{ background: "#28c840" }} />
              <span style={{ marginLeft: 12, fontSize: 12.5, color: "#94a3b8", fontWeight: 600 }}>SplitKey · Reports</span>
            </div>
            <div className="lp-mock-body">
              <div className="lp-mock-kpis">
                <div className="lp-mk"><i style={{ background: "#2563eb" }} /><span>Gross commission</span><b>$1.78M</b></div>
                <div className="lp-mk"><i style={{ background: "#16a34a" }} /><span>Net to brokerage</span><b>$503K</b></div>
                <div className="lp-mk"><i style={{ background: "#7c3aed" }} /><span>Paid to agents</span><b>$1.04M</b></div>
                <div className="lp-mk"><i style={{ background: "#b45309" }} /><span>Deals closed</span><b>256</b></div>
              </div>
              <div className="lp-bars">
                {[52, 38, 60, 44, 30, 40, 24, 28, 36, 47, 88, 70].map((h, i) => (
                  <div key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-wrap" style={{ marginTop: 8 }}>
        <div className="lp-stats" data-reveal>
          <div><b data-count="18.9" data-prefix="$" data-suffix="M+" data-dec="1">$18.9M+</b><span>commissions tracked</span></div>
          <div><b data-count="3050" data-comma="1">3,050</b><span>deals processed</span></div>
          <div><b>1</b><span>source of truth for your brokerage</span></div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-section">
        <div className="lp-wrap">
          <div className="lp-kicker" data-reveal>Everything in one place</div>
          <h2 className="lp-h2" data-reveal style={{ ["--d" as any]: "70ms" }}>One platform for the entire commission lifecycle</h2>
          <p className="lp-lead" data-reveal style={{ ["--d" as any]: "140ms" }}>From the moment a deal is written to the day you file 1099s, SplitKey handles it.</p>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <div className="lp-feat" data-reveal key={f.t}>
                <div className="lp-ico">{f.ic}</div>
                <h3>{f.t}</h3>
                <p>{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SHOWCASE */}
      <section id="product" className="lp-section">
        <div className="lp-wrap">
          <div className="lp-kicker" data-reveal>See it in action</div>
          <h2 className="lp-h2" data-reveal style={{ ["--d" as any]: "70ms" }}>This is what your brokerage runs on</h2>
          <p className="lp-lead" data-reveal style={{ ["--d" as any]: "140ms" }}>Not a concept. These are the real screens your team uses every day.</p>

          <div className="lp-prod-browser lp-prod-stack" data-reveal>
            <div className="lp-prod-bar"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /><span>app.splitkey.app · Reports</span></div>
            <div className="lp-prod-body">
              <div className="lp-prod-head"><b>Reports</b><span className="lp-prod-live">● Live</span><span className="lp-prod-tag2">Year to date</span></div>
              <div className="lp-prod-kpis">
                <div className="lp-pk"><i style={{ background: "#2f6dff" }} /><em>Gross commission</em><b>$1.78M</b></div>
                <div className="lp-pk"><i style={{ background: "#22c55e" }} /><em>Net to brokerage</em><b>$503K</b></div>
                <div className="lp-pk"><i style={{ background: "#a855f7" }} /><em>Paid to agents</em><b>$1.04M</b></div>
                <div className="lp-pk"><i style={{ background: "#f59e0b" }} /><em>Deals closed</em><b>256</b></div>
              </div>
              <div className="lp-prod-lower">
                <div className="lp-prod-chart">
                  <div style={{ fontSize: 13, color: "#9fb1c8", marginBottom: 12, fontWeight: 600 }}>Monthly gross commission</div>
                  <div className="lp-pbars">{[52, 38, 60, 44, 30, 40, 24, 28, 36, 47, 88, 70].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
                </div>
                <div className="lp-prod-top">
                  <div style={{ fontSize: 13, color: "#9fb1c8", margin: "2px 0 6px", fontWeight: 600 }}>Top agents</div>
                  <div className="lp-prow"><span>Agent A</span><b>$164,857</b></div>
                  <div className="lp-prow"><span>Agent B</span><b>$142,310</b></div>
                  <div className="lp-prow"><span>Agent C</span><b>$118,944</b></div>
                  <div className="lp-prow"><span>Agent D</span><b>$96,220</b></div>
                </div>
              </div>
            </div>
          </div>
          <p className="lp-prod-cap">Live reporting — gross, net splits, top agents, and lead-source ROI, filtered in a click.</p>

          <div className="lp-prod-duo">
            <div data-reveal>
              <div className="lp-prod-browser">
                <div className="lp-prod-bar"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /><span>Commission statement</span></div>
                <div className="lp-prod-body">
                  <div className="lp-stmt2">
                    <div><span>Sale price</span><b>$540,000</b></div>
                    <div><span>Gross commission (3%)</span><b>$16,200</b></div>
                    <div><span>Agent split (70%)</span><b>$11,340</b></div>
                    <div><span>Royalty + E&amp;O</span><b>−$486</b></div>
                    <div className="tot"><span>Net to agent</span><b>$10,854</b></div>
                  </div>
                </div>
              </div>
              <p className="lp-prod-cap">Every split, fee, and cap calculated instantly.</p>
            </div>
            <div data-reveal>
              <div className="lp-prod-browser">
                <div className="lp-prod-bar"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /><span>Agent portal</span></div>
                <div className="lp-prod-body">
                  <div className="lp-prod-kpis" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="lp-pk"><i style={{ background: "#22c55e" }} /><em>YTD earnings</em><b>$88,436</b></div>
                    <div className="lp-pk"><i style={{ background: "#2f6dff" }} /><em>Closed deals</em><b>23</b></div>
                  </div>
                  <div style={{ fontSize: 12, color: "#9fb1c8", margin: "2px 0 7px", fontWeight: 600 }}>Annual cap progress · 72%</div>
                  <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: "72%" }} /></div>
                </div>
              </div>
              <p className="lp-prod-cap">Agents log in to see their own earnings and cap progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="lp-wrap">
        <div className="lp-outcomes" data-reveal>
          <div><b>Days → minutes</b><span>Commission and payroll prep, every cycle</span></div>
          <div><b>$0</b><span>Spreadsheet math errors</span></div>
          <div><b>100%</b><span>On-time, accurate 1099s at year-end</span></div>
        </div>
      </section>

      {/* SPOTLIGHT: AI */}
      <section className="lp-wrap">
        <div className="lp-spot" data-reveal>
          <div>
            <div className="lp-kicker" style={{ textAlign: "left" }}>AI copilot</div>
            <h3>Ask your brokerage anything.</h3>
            <p>Stop digging through reports. Ask in plain English and get an answer grounded in your live data, instantly.</p>
            <ul>
              <li>{check}<span>“Show me KPIs for Laith this year”</span></li>
              <li>{check}<span>“Which lead source has the best ROI?”</span></li>
              <li>{check}<span>“What did we pay agents last quarter?”</span></li>
            </ul>
          </div>
          <div className="lp-spot-vis">
            <div className="lp-chat">
              <div className="lp-bub u">Show me KPIs for Laith this year</div>
              <div className="lp-bub a">Laith closed <b>23 deals</b> for <b>$164,857</b> gross. Net to agent: <b>$88,436</b>. Top source: Zillow (48902). Want a breakdown by month?</div>
              <div className="lp-bub u">Yes, by month</div>
            </div>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT: MAP */}
      <section className="lp-wrap">
        <div className="lp-spot rev" data-reveal>
          <div className="lp-spot-vis">
            <div className="lp-map">
              {["", "h1", "h2", "", "h1", "", "h2", "h4", "h3", "h1", "", "h1", "", "h2", "h3", "h2", "h1", "", "h1", "", "h2", "", "", "h1"].map((c, i) => (
                <span key={i} className={c} />
              ))}
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 12.5, color: "#64748b" }}>Deal density by zip. Darker means more deals.</p>
          </div>
          <div>
            <div className="lp-kicker" style={{ textAlign: "left" }}>Geographic intelligence</div>
            <h3>See exactly where your deals come from.</h3>
            <p>SplitKey reads zip codes straight out of your Zillow lead sources and maps them, so you know where to double down, and where to pull back.</p>
            <ul>
              <li>{check}<span>Automatic zip extraction from lead sources</span></li>
              <li>{check}<span>Live heat-style map of your target areas</span></li>
              <li>{check}<span>Feed the data back to Zillow for tighter targeting</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT: 1099 */}
      <section className="lp-wrap">
        <div className="lp-spot" data-reveal>
          <div>
            <div className="lp-kicker" style={{ textAlign: "left" }}>Tax season, sorted</div>
            <h3>1099s that practically file themselves.</h3>
            <p>Agents onboard their own W-9 when they join. SplitKey tracks every dollar paid and tallies year-end 1099-NEC totals automatically, even for agents who’ve moved on.</p>
            <ul>
              <li>{check}<span>Agent W-9 self-onboarding at signup</span></li>
              <li>{check}<span>Automatic $600-threshold flagging</span></li>
              <li>{check}<span>Includes agents who left mid-year</span></li>
            </ul>
          </div>
          <div className="lp-spot-vis">
            <div className="lp-rows">
              <div className="lp-rw"><span><b>Michael Gasso</b> · $112,407</span><span className="lp-tag">W-9 ✓</span></div>
              <div className="lp-rw"><span><b>Anthony Jarbo</b> · $77,877</span><span className="lp-tag">W-9 ✓</span></div>
              <div className="lp-rw"><span><b>Laith Yousif</b> · $66,851</span><span className="lp-tag">W-9 ✓</span></div>
              <div className="lp-rw"><span><b>Frank Van Maele</b> · $49,182</span><span className="lp-tag">W-9 ✓</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="lp-section" style={{ background: "#fff", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="lp-wrap">
          <div className="lp-kicker" data-reveal>How it works</div>
          <h2 className="lp-h2" data-reveal style={{ ["--d" as any]: "70ms" }}>Up and running in three steps</h2>
          <p className="lp-lead" data-reveal style={{ ["--d" as any]: "140ms" }}>No migration project. No consultants. Just your deals, calculated correctly.</p>
          <div className="lp-steps">
            <div className="lp-step" data-reveal><div className="n">1</div><h3>Add your deals</h3><p>Enter a transaction or import your history. Set each agent’s plan and lead-source rules once.</p></div>
            <div className="lp-step" data-reveal><div className="n">2</div><h3>SplitKey does the math</h3><p>Splits, caps, and fees calculate instantly. Route to your broker for one-click approval.</p></div>
            <div className="lp-step" data-reveal><div className="n">3</div><h3>Everyone stays in sync</h3><p>Agents see their earnings, you see the whole brokerage, and 1099s are ready at year-end.</p></div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-kicker" data-reveal>Loved by brokers</div>
          <h2 className="lp-h2" data-reveal style={{ ["--d" as any]: "70ms" }}>Built with brokerages, for brokerages</h2>
          <p className="lp-lead" data-reveal style={{ ["--d" as any]: "140ms" }}>Brokerages of every size run their commission operation on SplitKey.</p>
          <div className="lp-quotes">
            <div className="lp-quote" data-reveal>
              <div className="stars">★★★★★</div>
              <p>&ldquo;We used to close the books over a week of spreadsheets. Now it&apos;s an afternoon, and the three-way splits are never wrong.&rdquo;</p>
              <div className="who"><div className="av">MB</div><div><b>Marcus Bennett</b><em>Managing Broker · Crestline Realty Group</em></div></div>
            </div>
            <div className="lp-quote" data-reveal style={{ ["--d" as any]: "90ms" }}>
              <div className="stars">★★★★★</div>
              <p>&ldquo;My agents stopped asking &lsquo;what did I make?&rsquo; — they just log in and see it. That alone was worth it.&rdquo;</p>
              <div className="who"><div className="av">TC</div><div><b>Tara Coleman</b><em>Team Lead · Summit Realty</em></div></div>
            </div>
            <div className="lp-quote" data-reveal style={{ ["--d" as any]: "180ms" }}>
              <div className="stars">★★★★★</div>
              <p>&ldquo;1099 season went from dread to a single click. The W-9s were already collected and the totals were just right.&rdquo;</p>
              <div className="who"><div className="av">DR</div><div><b>Diana Reyes</b><em>Office Manager · Harborview Properties</em></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / SECURITY */}
      <section className="lp-wrap">
        <div className="lp-trust" data-reveal>
          <div>{tShield}<div><b>Encrypted at rest</b><span>Every record stored with bank-grade encryption.</span></div></div>
          <div>{tLock}<div><b>Per-brokerage isolation</b><span>Database row-level security keeps your data yours.</span></div></div>
          <div>{tUsers}<div><b>Role-based access</b><span>Owners, brokers, and agents each see only what they should.</span></div></div>
          <div>{tNoSell}<div><b>Never sold</b><span>Your brokerage&apos;s data is never shared or sold. Ever.</span></div></div>
        </div>
      </section>

      {/* PRICING / CONTACT */}
      <section id="pricing" className="lp-section">
        <div className="lp-wrap">
          <div className="lp-kicker" data-reveal>Pricing</div>
          <h2 className="lp-h2" data-reveal style={{ ["--d" as any]: "70ms" }}>Pricing built around your brokerage</h2>
          <p className="lp-lead" data-reveal style={{ ["--d" as any]: "140ms" }}>Every brokerage runs differently. Tell us about yours and we’ll tailor a plan, or see SplitKey live on your own numbers in a quick demo.</p>
          <div className="lp-contact">
            <div className="lp-contact-card" data-reveal>
              <div className="lp-ico">{mailIcon}</div>
              <h3>Contact the team</h3>
              <p>Questions about features, onboarding, or a custom plan? We’ll get back to you fast.</p>
              <a className="lp-btn lp-btn-ghost" href={CONTACT_HREF}>Email the team</a>
            </div>
            <div className="lp-contact-card pop" data-reveal>
              <div className="lp-ico">{calIcon}</div>
              <h3>Schedule a demo</h3>
              <p>See it in 20 minutes. Splits, reports, AI, and 1099s walked through end to end.</p>
              <a className="lp-btn lp-btn-primary" href={DEMO_HREF} {...(CALENDLY_URL ? { target: "_blank", rel: "noopener noreferrer" } : {})}>Book a demo</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-kicker" data-reveal>FAQ</div>
          <h2 className="lp-h2" data-reveal style={{ ["--d" as any]: "70ms" }}>Questions, answered</h2>
          <div className="lp-faqs">
            <details className="lp-faq" data-reveal><summary>How long does setup take?</summary><p>Most brokerages are live the same day. Add your agents and their split rules once and you&apos;re calculating commissions immediately — and we can import your existing deal history so your reports are accurate from day one.</p></details>
            <details className="lp-faq" data-reveal><summary>Can I import my existing deals?</summary><p>Yes. We can bulk-import your full history — every deal, every column — so your reporting, agent earnings, and 1099 totals are right from the start.</p></details>
            <details className="lp-faq" data-reveal><summary>Is my data secure?</summary><p>Your data is encrypted at rest, isolated to your brokerage with database row-level security, and never sold. Agents only ever see their own deals and earnings.</p></details>
            <details className="lp-faq" data-reveal><summary>Do my agents need training?</summary><p>No. Agents simply log in to a clean portal showing their deals, earnings, and cap progress. Most never need a walkthrough.</p></details>
            <details className="lp-faq" data-reveal><summary>Can SplitKey handle our custom split rules?</summary><p>Yes — per-agent and per-lead-source splits, annual caps, royalties, referral fees, E&amp;O, and compliance deductions are all configurable, so the numbers match how your brokerage actually pays.</p></details>
            <details className="lp-faq" data-reveal><summary>What about W-9s and 1099s?</summary><p>Agents self-onboard their W-9 when they join, and SplitKey tallies year-end 1099-NEC totals automatically — including agents who left mid-year.</p></details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-wrap" style={{ paddingBottom: 8 }}>
        <div className="lp-cta" data-reveal>
          <h2>Ready to settle every commission clean?</h2>
          <p>Join brokerages running their entire commission operation on SplitKey.</p>
          <Link href="/login" className="lp-btn lp-btn-white lp-btn-lg">Get started free →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-foot">
        <div className="lp-foot-in">
          <Logo variant="dark" size={26} />
          <div className="lp-foot-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/login">Log in</Link>
          </div>
          <small>© {new Date().getFullYear()} SplitKey · Commission management for brokerages</small>
        </div>
      </footer>
    </div>
  );
}
