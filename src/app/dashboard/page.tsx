"use client";

import { BarChart3, Brain, Cpu, Hash, Zap, Clock, Activity, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { backendClient, AgentStatus } from "@/lib/backendClient";

const AGENT_DATA_DEMO = {
  agentId: "CENCERA-0x1A2F",
  memoryHash: "0x9c4b7e...f3a12d",
  innovationScore: 1_847,
  onlineFor: "23d 14h 07m",
  lastEvolution: "42 seconds ago",
  chainStatus: "BNB Chain Testnet",
  recentActivity: [
    { time: "Just now", event: "Memory hash updated on-chain", type: "evolution" },
    { time: "1 min ago", event: "Analyzed contract: 0xdead...cafe", type: "analysis" },
    { time: "2 min ago", event: "Reflected on 14 recent interactions", type: "evolution" },
    { time: "4 min ago", event: "Telegram query answered: DeFi pool risk", type: "chat" },
    { time: "6 min ago", event: "Innovation Score incremented to 1847", type: "evolution" },
    { time: "9 min ago", event: "Wallet trust scored: 0xA1B2...C3D4", type: "analysis" },
    { time: "11 min ago", event: "Cross-platform sync: Web → Telegram", type: "system" },
    { time: "14 min ago", event: "Memory snapshot written to Membase", type: "system" },
  ],
};

const typeColors: Record<string, string> = {
  evolution: "text-brand-primary border-brand-primary/30 bg-brand-primary/10",
  analysis: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  chat: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  system: "text-zinc-500 border-zinc-600/30 bg-zinc-800/20",
};

export default function DashboardPage() {
  const [liveData, setLiveData] = useState<AgentStatus | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const data = await backendClient.getAgentStatus();
      if (data) {
        setLiveData(data);
        setIsLive(true);
      }
    };
    fetchStatus();
    // Refresh every 30s
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayData = {
    agentId: liveData?.agentId || AGENT_DATA_DEMO.agentId,
    memoryHash: liveData?.memoryHash || AGENT_DATA_DEMO.memoryHash,
    innovationScore: liveData?.innovationScore ? parseInt(liveData.innovationScore) : AGENT_DATA_DEMO.innovationScore,
    onlineFor: AGENT_DATA_DEMO.onlineFor, // Backend doesn't provide uptime yet
    lastEvolution: AGENT_DATA_DEMO.lastEvolution, // Backend doesn't provide this yet
    chainStatus: liveData?.chain || AGENT_DATA_DEMO.chainStatus,
    recentActivity: AGENT_DATA_DEMO.recentActivity,
  };
  return (
    <div className="p-6 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#E6E6E6] font-sans tracking-wide uppercase">Agent Dashboard</h1>
          <p className="text-[#888] text-sm mt-1 font-mono">CenceraAI — On-Chain Immortal AI Agent · Live Activity</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono tracking-widest uppercase ${isLive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          {isLive ? "Live Connection" : "Demo Offline"}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Agent ID", value: displayData.agentId, icon: Hash, color: "text-brand-primary" },
          { label: "Innovation Score", value: displayData.innovationScore.toLocaleString(), icon: Zap, color: "text-amber-400" },
          { label: "Online For", value: displayData.onlineFor, icon: Clock, color: "text-sky-400" },
          { label: "Last Evolution", value: displayData.lastEvolution, icon: RefreshCw, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 280, damping: 22 }}
            className="bg-[#141414] border border-[#222] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#666] uppercase tracking-widest">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Memory hash + chain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-mono text-[#888] uppercase tracking-widest">Current Memory Hash</span>
          </div>
          <div className="font-mono text-sm text-[#E6E6E6] bg-[#0D0D0D] px-4 py-3 rounded-lg border border-[#2A2A2A] truncate">
            {displayData.memoryHash}
          </div>
          <p className="text-[10px] text-[#555] font-mono mt-2">Stored via Unibase Membase · Tamper-resistant</p>
        </div>

        <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-[#888] uppercase tracking-widest">Chain Status</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <span className="font-mono text-sm text-emerald-400 font-bold">{displayData.chainStatus}</span>
          </div>
          <p className="text-[10px] text-[#555] font-mono mt-2">Evolution loop active · ~60s cycle · CenceraAgent contract</p>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#1E1E1E]">
          <Activity className="w-4 h-4 text-brand-primary" />
          <span className="text-sm font-mono font-bold text-[#E6E6E6] uppercase tracking-widest">Live Activity Feed</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-[10px] font-mono text-brand-primary">LIVE</span>
          </div>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {displayData.recentActivity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 24 }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[10px] font-mono text-[#555] w-16 shrink-0">{item.time}</span>
              <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border ${typeColors[item.type]}`}>
                {item.type}
              </span>
              <span className="text-sm font-mono text-[#C0C0C0]">{item.event}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111] border border-[#222]">
          <BarChart3 className="w-4 h-4 text-[#555]" />
          <span className="text-[11px] font-mono text-[#555]">{isLive ? "Live data from BNB Chain contract" : "Demo data — live agent on BNB Chain Testnet"}</span>
        </div>
      </div>

    </div>
  );
}
