import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commission App — Top Agent Realty",
  description: "Calculate, document, and approve real-estate commissions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
