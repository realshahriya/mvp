import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SidebarClient } from "@/components/SidebarClient";
import { WalletProvider } from "@/components/WalletProvider";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";

export const metadata: Metadata = {
  title: "CENCERA - Universal Trust Score Layer",
  description: "The Universal Trust Score Layer. We analyze on-chain and off-chain data to generate real-time reputation scores for wallets, contracts, and tokens.",
  icons: {
    icon: "/logo.png",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "CENCERA - Universal Trust Score Layer",
    description: "The Universal Trust Score Layer. We analyze on-chain and off-chain data to generate real-time reputation scores for wallets, contracts, and tokens.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className="antialiased text-[#E6E6E6] flex min-h-screen font-sans selection:bg-neon selection:text-[#111111]"
      >
        <div className="fixed-background" />
        <WalletProvider>
          {/* Global Sidebar */}
          <div className="flex w-full">
            <Suspense fallback={<div className="hidden md:block md:w-64" />}>
              <SidebarClient />
            </Suspense>
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative overflow-hidden">
              <div className="w-full bg-amber-500/10 border-b border-amber-500/30 text-amber-100 text-xs sm:text-sm py-2 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-20">
                <span className="font-mono uppercase tracking-[0.25em] text-[10px] sm:text-xs text-amber-300">
                  Testnet
                </span>
                <span className="text-[11px] sm:text-xs text-amber-100/90">
                  Cencera is currently running on <b>TESTNET ONLY</b>.
                </span>
              </div>
              <div className="flex-1">
                {children}
              </div>
              <GlobalLoadingOverlay />
            </main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
