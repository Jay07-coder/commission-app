import type { CSSProperties } from "react";

/** The SplitKey app mark: a blue tile with a white key split down the middle. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true" style={{ display: "block", flex: "0 0 auto" }}>
      <rect width="44" height="44" rx="11" fill="#2563eb" />
      <g fill="#ffffff">
        <circle cx="22" cy="15" r="7.5" />
        <rect x="19" y="20" width="6" height="15" rx="2" />
        <rect x="25" y="24" width="5.5" height="3" rx="1" />
        <rect x="25" y="29" width="4" height="3" rx="1" />
      </g>
      <rect x="20.6" y="5" width="2.8" height="31" fill="#2563eb" />
    </svg>
  );
}

/** Full SplitKey lockup: mark + wordmark. `variant` controls wordmark colors for dark/light backgrounds. */
export default function Logo({
  variant = "dark",
  size = 32,
  style,
}: {
  variant?: "dark" | "light";
  size?: number;
  style?: CSSProperties;
}) {
  const splitColor = variant === "dark" ? "#ffffff" : "#0f172a";
  const keyColor = variant === "dark" ? "#60a5fa" : "#2563eb";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, ...style }}>
      <LogoMark size={size} />
      <span
        style={{
          fontSize: Math.round(size * 0.66),
          fontWeight: 600,
          letterSpacing: "-0.4px",
          lineHeight: 1,
        }}
      >
        <span style={{ color: splitColor }}>Split</span>
        <span style={{ color: keyColor }}>Key</span>
      </span>
    </span>
  );
}
