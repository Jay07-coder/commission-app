"use client";

import { useState } from "react";
import { saveW9 } from "@/app/app/me/actions";
import type { TaxProfile } from "@/lib/data";

const CLASSES: { value: string; label: string }[] = [
  { value: "individual", label: "Individual / Sole proprietor" },
  { value: "sole_prop", label: "Single-member LLC" },
  { value: "llc", label: "LLC (multi-member)" },
  { value: "s_corp", label: "S corporation" },
  { value: "c_corp", label: "C corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "trust", label: "Trust / estate" },
];

export default function W9Form({ profile, intro }: { profile: TaxProfile | null; intro?: string }) {
  const onFile = !!profile?.signed_at;
  const [editing, setEditing] = useState(!onFile);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [tinType, setTinType] = useState(profile?.tin_type || "ssn");

  async function onSubmit(formData: FormData) {
    setBusy(true); setMsg("");
    const res = await saveW9(null, formData);
    setBusy(false);
    if (res?.error) { setMsg(res.error); return; }
    setMsg(""); setEditing(false);
  }

  if (onFile && !editing) {
    const last4 = (profile!.tin || "").replace(/\D/g, "").slice(-4);
    return (
      <div className="card" style={{ borderLeft: "4px solid #16a34a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>✓ Tax info (W-9) on file</span>
          <span className="pill" style={{ background: "#ecfdf5", color: "#047857" }}>Ready for 1099</span>
          <button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={() => setEditing(true)}>Update</button>
        </div>
        <p className="muted" style={{ margin: "10px 0 0", fontSize: 13 }}>
          {profile!.legal_name} · {(profile!.tin_type || "ssn").toUpperCase()} ending {last4 || "••••"} · {profile!.city}{profile!.state ? ", " + profile!.state : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "var(--ink)" }}>Your tax info (W-9)</h3>
      <p className="muted" style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.5 }}>
        {intro || "We use this to issue your year-end 1099-NEC. It’s visible only to you and your brokerage’s admins."}
      </p>
      <form action={onSubmit}>
        <label>Federal tax classification</label>
        <select name="classification" defaultValue={profile?.classification || "individual"}>
          {CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <label style={{ marginTop: 12 }}>Legal name (as shown on your tax return)</label>
        <input name="legal_name" required defaultValue={profile?.legal_name || ""} placeholder="Jane A. Smith" />

        <label style={{ marginTop: 12 }}>Business name / DBA <span className="muted">(if different — optional)</span></label>
        <input name="business_name" defaultValue={profile?.business_name || ""} placeholder="Optional" />

        <label style={{ marginTop: 12 }}>Taxpayer ID type</label>
        <div style={{ display: "flex", gap: 16, margin: "4px 0 8px" }}>
          <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 400, cursor: "pointer" }}>
            <input type="radio" name="tin_type" value="ssn" checked={tinType === "ssn"} onChange={() => setTinType("ssn")} style={{ width: "auto" }} /> SSN
          </label>
          <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 400, cursor: "pointer" }}>
            <input type="radio" name="tin_type" value="ein" checked={tinType === "ein"} onChange={() => setTinType("ein")} style={{ width: "auto" }} /> EIN (business)
          </label>
        </div>
        <input name="tin" required defaultValue={profile?.tin || ""} placeholder={tinType === "ein" ? "12-3456789" : "123-45-6789"} autoComplete="off" />

        <label style={{ marginTop: 12 }}>Street address</label>
        <input name="address1" defaultValue={profile?.address1 || ""} placeholder="123 Main St" />
        <input name="address2" defaultValue={profile?.address2 || ""} placeholder="Apt / Suite (optional)" style={{ marginTop: 8 }} />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginTop: 8 }}>
          <input name="city" defaultValue={profile?.city || ""} placeholder="City" />
          <input name="state" defaultValue={profile?.state || ""} placeholder="State" maxLength={2} />
          <input name="zip" defaultValue={profile?.zip || ""} placeholder="ZIP" />
        </div>

        <div style={{ marginTop: 16, padding: 12, background: "var(--panel)", borderRadius: 8, border: "1px solid var(--line)" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontWeight: 400, cursor: "pointer", fontSize: 12.5, lineHeight: 1.5 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required style={{ width: "auto", marginTop: 2 }} />
            <span>Under penalties of perjury, I certify that the taxpayer ID above is correct and that the information I’ve provided is true.</span>
          </label>
          <label style={{ marginTop: 10 }}>Type your full name to sign</label>
          <input name="signed_name" defaultValue={profile?.signed_name || ""} placeholder="Jane A. Smith" />
        </div>

        <div className="btns" style={{ marginTop: 16, gap: 8 }}>
          <button className="btn" type="submit" disabled={busy || !agreed}>{busy ? "Saving…" : "Save tax info"}</button>
          {onFile && <button type="button" className="btn ghost" onClick={() => { setEditing(false); setMsg(""); }}>Cancel</button>}
        </div>
        {msg && <div className="hint" style={{ color: "var(--gold)", marginTop: 10 }}>{msg}</div>}
      </form>
    </div>
  );
}
