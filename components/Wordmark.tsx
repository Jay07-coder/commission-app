export default function Wordmark({ size = 18 }: { size?: number }) {
  const badge = Math.round(size * 1.15);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: size, letterSpacing: "-0.2px", lineHeight: 1, whiteSpace: "nowrap" }}>
      <span style={{ fontWeight: 600, color: "var(--ink)" }}>Top</span>
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: badge, height: badge, background: "var(--accent)", color: "#fff",
          borderRadius: 6, fontWeight: 600, margin: "0 2px",
        }}
      >
        A
      </span>
      <span style={{ fontWeight: 600, color: "var(--ink)" }}>gent</span>
      <span style={{ color: "var(--muted)", marginLeft: 5 }}>Realty</span>
    </span>
  );
}
