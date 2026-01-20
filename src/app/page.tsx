import { Globe, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/SearchInput";

export default function Home() {
  return (
    <div className="p-6 space-y-8 relative z-10 overflow-y-auto">
      {/* Hero Section - Brand Themed */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl md:text-6xl font-bold text-[#E6E6E6] mb-4 font-sans">
          Universal Trust Score Layer
        </h1>
        <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
          Real-time blockchain intelligence and threat detection across multiple chains
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-neon/60 to-transparent"></div>
          <div className="w-2 h-2 rounded-full bg-neon shadow-neon"></div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent via-neon/60 to-transparent"></div>
        </div>
      </div>

      {/* Quick Analysis - Brand Themed */}
      <div id="quick-analysis" className="bg-[#1A1A1A]/90 border border-[#2A2A2A] rounded-2xl p-8 hover:border-neon/25 transition-all">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-neon/20">
              <Zap className="w-6 h-6 text-neon" />
            </div>
            <h2 className="text-2xl font-bold text-[#E6E6E6] mb-2 font-sans">Quick Analysis</h2>
            <p className="text-[#C7C7C7] text-sm">Test wallet or contract addresses across multiple chains instantly</p>
          </div>

          <div className="space-y-3">
            <SearchInput placeholder="Enter wallet address, contract, or ENS name to analyze..." />
          </div>
        </div>
      </div>

      {/* Quick Navigation - Cyan Themed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="#quick-analysis"
          className="group bg-[#1A1A1A]/80 border border-[#2A2A2A] hover:border-neon/30 hover:bg-[#222222] rounded-2xl p-8 transition-all"
        >
          <Zap className="w-12 h-12 text-neon mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-[#E6E6E6] mb-2">Start Analysis</h3>
          <p className="text-sm text-[#B0B0B0] mb-4">
            Jump to Quick Analysis and scan wallets, contracts, or ENS names
          </p>
          <div className="flex items-center gap-2 text-neon font-medium text-sm">
            Start Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/analysis?q=vitalik.eth&chain=1"
          className="group bg-[#1A1A1A]/80 border border-[#2A2A2A] hover:border-neon/30 hover:bg-[#222222] rounded-2xl p-8 transition-all"
        >
          <Zap className="w-12 h-12 text-neon mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-[#E6E6E6] mb-2">Interactive Demo</h3>
          <p className="text-sm text-[#B0B0B0] mb-4">
            Run a sample analysis on an ENS address to preview results
          </p>
          <div className="flex items-center gap-2 text-neon font-medium text-sm">
            Analyze Sample
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/?feedback=1"
          className="group bg-[#1A1A1A]/80 border border-[#2A2A2A] hover:border-neon/30 hover:bg-[#222222] rounded-2xl p-8 transition-all"
        >
          <Globe className="w-12 h-12 text-neon mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-[#E6E6E6] mb-2">Report Issue</h3>
          <p className="text-sm text-[#B0B0B0] mb-4">
            Share bugs, feedback, or feature requests to improve Cencera
          </p>
          <div className="flex items-center gap-2 text-neon font-medium text-sm">
            Open Report
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
