"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE = [
  { href: "/app/transactions", label: "Board" },
  { href: "/app/calculator", label: "Calculator" },
  { href: "/app/agents", label: "Agents" },
];

export default function NavTabs({ canManageTeam = false, role = "" }: { canManageTeam?: boolean; role?: string }) {
  const path = usePathname();
  const PORTAL = { href: "/app/me", label: "My Portal" };
  const tabs =
    role === "agent"
      ? [PORTAL]
      : canManageTeam
        ? [...BASE, { href: "/app/reports", label: "Reports" }, { href: "/app/map", label: "Map" }, { href: "/app/tax", label: "1099s" }, PORTAL, { href: "/app/team", label: "Team" }]
        : [...BASE, PORTAL];
  return (
    <>
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={path.startsWith(t.href) ? "active" : ""}>
          {t.label}
        </Link>
      ))}
    </>
  );
}
