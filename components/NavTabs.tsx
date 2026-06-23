"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app/calculator", label: "Calculator" },
  { href: "/app/agents", label: "Agents" },
  { href: "/app/history", label: "History" },
];

export default function NavTabs() {
  const path = usePathname();
  return (
    <>
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={path.startsWith(t.href) ? "active" : ""}>
          {t.label}
        </Link>
      ))}
    </>
  );
}
