"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signUp } from "@/app/auth/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true); setMsg("");
    const action = mode === "in" ? signIn : signUp;
    const res = await action(null, formData);
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else if (res?.message) setMsg(res.message);
  }

  return (
    <>
      <header className="appbar">
        <Link href="/" style={{ display: "inline-flex" }}>
          <img src="https://topagentrealtymi.com/wp-content/uploads/2026/01/Untitled-design-7-1.png" alt="Top Agent Realty" style={{ height: 30, width: "auto", display: "block" }} />
        </Link>
        <div className="sub" style={{ marginLeft: 4 }}>Commission App</div>
      </header>
      <main style={{ maxWidth: 420 }}>
        <div className="card">
          <h2>{mode === "in" ? "Log in" : "Create your account"}</h2>
          <form action={onSubmit}>
            <label>Email</label>
            <input name="email" type="email" required placeholder="you@brokerage.com" />
            <label>Password</label>
            <input name="password" type="password" required minLength={6} placeholder="••••••••" />
            <div className="btns" style={{ marginTop: 16 }}>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "…" : mode === "in" ? "Log in" : "Sign up"}
              </button>
            </div>
          </form>
          {msg && <div className="hint" style={{ color: "var(--gold)" }}>{msg}</div>}
          <div className="hint" style={{ marginTop: 14 }}>
            {mode === "in" ? (
              <>No account? <a onClick={() => { setMode("up"); setMsg(""); }} style={{ cursor: "pointer" }}>Create one</a></>
            ) : (
              <>Already have an account? <a onClick={() => { setMode("in"); setMsg(""); }} style={{ cursor: "pointer" }}>Log in</a></>
            )}
          </div>
        </div>
        <p className="hint" style={{ textAlign: "center" }}>
          <Link href="/">← Back to preview</Link>
        </p>
      </main>
    </>
  );
}
