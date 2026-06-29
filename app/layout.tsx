import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://app.topagentmi.com"),
  title: "SplitKey — Commission management for brokerages",
  description: "Calculate splits, route approvals, pay agents, and file 1099s — the all-in-one commission platform for real-estate brokerages.",
  keywords: [
    "real estate commission software", "brokerage commission management", "commission split calculator",
    "agent commission portal", "1099 for real estate agents", "real estate brokerage software",
  ],
  openGraph: {
    title: "SplitKey — Commission management for brokerages",
    description: "Calculate splits, route approvals, pay agents, and file 1099s — all in one place.",
    type: "website",
    siteName: "SplitKey",
    url: "https://app.topagentmi.com",
  },
  twitter: { card: "summary_large_image", title: "SplitKey — Commission management for brokerages" },
  appleWebApp: { capable: true, title: "SplitKey", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f2440",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}<PWARegister /></body>
    </html>
  );
}
