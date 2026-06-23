"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE = [
  { href: "/app/calculator", label: "Calculator" },
  { href: "/app/agents", label: "Agents" },
  { href: "/app/history", label: "History" },
];

export default function NavTabs({ isOwner = false }: { isOwner?: boolean }) {
  const path = usePathname();
  const tabs = isOwner ? [...BASE, { href: "/app/team", label: "Team" }] : BASE;
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
