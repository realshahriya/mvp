import { Globe, Zap, ShieldAlert } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { dbConnect, ScanResultModel, CreditModel } from "@/lib/db";

export const revalidate = 60;

const SUPPORTED_CHAIN_COUNT = 18;

export default async function Home() {
  let totalSearches = 0;
  let totalUsers = 0;

  try {
    await dbConnect();
    const [searchCount, userCount] = await Promise.all([
      ScanResultModel.countDocuments({}),
      CreditModel.countDocuments({}),
    ]);
    totalSearches = searchCount;
    totalUsers = userCount;
  } catch {
  }

  return (
    <div className="p-6 space-y-8 relative z-10 overflow-y-auto">
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl md:text-6xl font-bold text-[#E6E6E6] mb-4 font-sans tracking-[0.18em] uppercase">
          Universal Trust Score Layer
        </h1>
        <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
          Real-time blockchain intelligence and threat detection across multiple chains
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent"></div>
          <div className="w-2 h-2 rounded-full bg-brand-primary shadow-neon"></div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent via-brand-primary/40 to-transparent"></div>
        </div>
      </div>

      <div id="quick-analysis" className="bg-[#1A1A1A]/90 border border-[#2A2A2A] rounded-2xl p-8 hover:border-brand-primary/40 transition-all">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border border-brand-primary/30 bg-gradient-to-br from-brand-primary/20 to-brand-soft/10">
              <Zap className="w-6 h-6 text-brand-primary" />
            </div>
            <h2 className="text-2xl font-bold text-[#E6E6E6] mb-1 font-sans uppercase tracking-[0.18em]">
              Quick Analysis
            </h2>
            <p className="text-[#C7C7C7] text-sm">
              Test wallet or contract addresses across multiple chains instantly
            </p>
          </div>

          <div className="space-y-3">
            <SearchInput placeholder="Enter wallet address, contract, or ENS name to analyze..." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-2xl p-8 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#8A8A8A] uppercase tracking-[0.18em]">
                Malicious CA Detected
              </h3>
              <p className="text-xs text-[#6F6F6F]">
                Across all supported networks.
              </p>
            </div>
            <ShieldAlert className="w-8 h-8 text-neon" />
          </div>
          <div className="text-4xl font-mono font-semibold text-neon">
            2,145,832
          </div>
        </div>

        <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-2xl p-8 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#8A8A8A] uppercase tracking-[0.18em]">
                Total Users
              </h3>
              <p className="text-xs text-[#6F6F6F]">
                Unique wallets with active credit accounts.
              </p>
            </div>
            <Zap className="w-8 h-8 text-neon" />
          </div>
          <div className="text-4xl font-mono font-semibold text-neon">
            {totalUsers.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-2xl p-8 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#8A8A8A] uppercase tracking-[0.18em]">
                Chain Support
              </h3>
            </div>
            <Globe className="w-8 h-8 text-neon" />
          </div>
          <div className="text-4xl font-mono font-semibold text-neon">
            {SUPPORTED_CHAIN_COUNT}
          </div>
        </div>
      </div>
    </div>
  );
}
