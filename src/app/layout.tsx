import type { Metadata } from "next";
import { Suspense } from "react";
import { Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { WalletProvider } from "@/components/WalletProvider";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

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
        className={`${syne.variable} ${jetbrainsMono.variable} antialiased text-zinc-100 flex min-h-screen font-sans selection:bg-neon selection:text-black`}
      >
        <div className="fixed-background" />
        <WalletProvider>
          {/* Global Sidebar */}
          <div className="flex w-full">
            <Suspense fallback={<div className="hidden md:block md:w-64" />}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative overflow-hidden">
              {children}
            </main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
