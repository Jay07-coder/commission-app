"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "./Logo";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How does the commission split work?",
  "How do I send a statement to an agent?",
  "Who are my top agents?",
  "What's our net to brokerage this year?",
];

function renderText(text: string) {
  return text.split("\n").map((line, i) => (
    <p key={i} style={{ margin: line.trim() ? "0 0 7px" : 0, lineHeight: 1.5 }}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : part
      )}
    </p>
  ));
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || data.error || "Something went wrong — please try again." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "I couldn't reach the server. Check your connection and try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open the SplitKey assistant"
        style={{
          position: "fixed", right: 22, bottom: 22, zIndex: 1000,
          width: 56, height: 56, borderRadius: 999, border: "none", cursor: "pointer",
          background: "#0f2440", color: "#fff",
          boxShadow: "0 10px 28px rgba(15,36,64,.34)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .15s",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.94)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? (
          <span style={{ fontSize: 22, lineHeight: 1 }}>&times;</span>
        ) : (
          <SparkleIcon />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", right: 22, bottom: 90, zIndex: 1000,
            width: 384, maxWidth: "calc(100vw - 32px)", height: 560, maxHeight: "calc(100vh - 130px)",
            background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16,
            boxShadow: "0 18px 50px rgba(16,24,40,.22)", display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ background: "#0f2440", padding: "14px 16px", display: "flex", alignItems: "center", gap: 11 }}>
            <LogoMark size={30} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>SplitKey Assistant</span>
              <span style={{ color: "#9fb0c3", fontSize: 11.5 }}>Help with the app &amp; your numbers</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#9fb0c3", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, background: "var(--panel2)" }}>
            {msgs.length === 0 && (
              <div>
                <div style={{ fontSize: 14, color: "var(--ink)", marginBottom: 4, fontWeight: 600 }}>Hi — I&apos;m your SplitKey copilot 👋</div>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Ask me how to use the app, or about your agents, deals, and commissions. Try one of these:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        textAlign: "left", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10,
                        padding: "9px 12px", fontSize: 13, color: "var(--ink)", cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div
                  style={{
                    maxWidth: "85%", padding: "9px 12px", borderRadius: 12, fontSize: 13.5,
                    background: m.role === "user" ? "var(--accent)" : "var(--panel)",
                    color: m.role === "user" ? "#fff" : "var(--ink)",
                    border: m.role === "user" ? "none" : "1px solid var(--line)",
                    borderBottomRightRadius: m.role === "user" ? 4 : 12,
                    borderBottomLeftRadius: m.role === "user" ? 12 : 4,
                  }}
                >
                  {m.role === "user" ? m.content : <div>{renderText(m.content)}</div>}
                </div>
              </div>
            ))}

            {busy && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                <div style={{ padding: "11px 14px", borderRadius: 12, background: "var(--panel)", border: "1px solid var(--line)" }}>
                  <Dots />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={{ borderTop: "1px solid var(--line)", padding: 10, display: "flex", gap: 8, alignItems: "flex-end", background: "var(--panel)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder="Ask anything about SplitKey…"
              rows={1}
              style={{
                flex: 1, resize: "none", border: "1px solid var(--line)", borderRadius: 10,
                padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--ink)",
                background: "var(--panel2)", maxHeight: 96, lineHeight: 1.4,
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              className="btn"
              style={{ padding: "10px 14px", opacity: busy || !input.trim() ? 0.5 : 1 }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SparkleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.8 4.8L18.6 9.6 13.8 11.4 12 16.2 10.2 11.4 5.4 9.6 10.2 7.8 12 3z" fill="#fff" />
      <path d="M18.5 14l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" fill="#60a5fa" />
    </svg>
  );
}

function Dots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 999, background: "var(--muted)",
            animation: "skd 1.2s infinite", animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`@keyframes skd{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}`}</style>
    </div>
  );
}
