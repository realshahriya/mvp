"use client";

import { useState, useRef } from "react";
import { Search, Loader2, ShieldCheck, ShieldAlert, AlertTriangle, Hash, ExternalLink, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TrustGauge } from "@/components/TrustGauge";
import { backendClient } from "@/lib/backendClient";

// Static demo result — deterministic fake score based on input length
function generateDemoResult(query: string) {
  const seed = query.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const score = 30 + (seed % 60); // 30–89
  const chains = ["Ethereum", "BNB Chain", "Arbitrum", "Polygon", "Avalanche"];
  const chain = chains[seed % chains.length];
  const isContract = query.startsWith("0x") && query.length > 30;
  const type = isContract ? "Smart Contract" : "Wallet (EOA)";

  let risk: "LOW" | "MEDIUM" | "HIGH";
  let riskColor: string;
  let Icon: typeof ShieldCheck;
  if (score >= 70) { risk = "LOW"; riskColor = "text-emerald-400"; Icon = ShieldCheck; }
  else if (score >= 45) { risk = "MEDIUM"; riskColor = "text-amber-400"; Icon = AlertTriangle; }
  else { risk = "HIGH"; riskColor = "text-red-400"; Icon = ShieldAlert; }

  const onChain = Math.min(100, score + (seed % 15));
  const market = Math.max(0, score - (seed % 20));
  const offChain = Math.min(100, score + 5 + (seed % 10));
  const aiDerived = Math.max(0, score - 5 + (seed % 12));

  return { score, chain, type, risk, riskColor, Icon, onChain, market, offChain, aiDerived, isDemo: true };
}

interface SearchInputProps {
  placeholder?: string;
}

export function SearchInput({ placeholder = "Enter wallet address or contract address..." }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "result">("idle");
  const [result, setResult] = useState<any>(null);
  const [backendReply, setBackendReply] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || phase === "analyzing") return;
    setPhase("analyzing");
    setResult(null);
    setBackendReply(null);

    // 1. Try backend
    const reply = await backendClient.sendChat(
        `Please analyze this address for trust and security risks: ${trimmed}`,
        "CENCERA_WEB_SEARCH", 
        "0x0000000000000000000000000000000000000000" // Mock wallet
    );

    if (reply) {
        setBackendReply(reply);
        setPhase("result");
    } else {
        // 2. Fallback to demo
        await new Promise(r => setTimeout(r, 1500));
        setResult(generateDemoResult(trimmed));
        setPhase("result");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setResult(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder={placeholder}
            disabled={phase === "analyzing"}
            className="w-full pl-12 pr-4 py-4 bg-[#0D0D0D] border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-brand-primary/50 rounded-xl font-mono text-sm text-[#E6E6E6] placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-brand-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || phase === "analyzing"}
          className="px-6 py-4 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 hover:border-brand-primary/60 text-brand-primary rounded-xl font-mono text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {phase === "analyzing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {phase === "analyzing" ? "Analyzing" : "Analyze"}
        </button>
      </div>

      {/* Analyzing phase */}
      <AnimatePresence>
        {phase === "analyzing" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#111]/80 border border-[#2A2A2A] rounded-xl p-6 text-center space-y-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
            <div className="space-y-1">
              <p className="text-[#E6E6E6] font-mono text-sm font-bold">CenceraAI Analyzing...</p>
              <p className="text-[#666] text-xs font-mono">Querying 4 signal domains across 18 chains</p>
            </div>
            <div className="flex justify-center gap-2">
              {["On-Chain", "Market", "Off-Chain", "AI-Derived"].map((label, i) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                  className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-md text-[10px] font-mono text-brand-primary uppercase tracking-widest"
                >
                  {label}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {phase === "result" && (result || backendReply) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="bg-[#111]/90 border border-[#2A2A2A] rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1E1E1E]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {result ? <result.Icon className={`w-4 h-4 ${result.riskColor}`} /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  <span className={`text-xs font-mono font-bold uppercase tracking-widest ${result ? result.riskColor : "text-emerald-400"}`}>
                    {result ? `${result.risk} RISK` : "AI ANALYSIS"}
                  </span>
                  {result?.isDemo && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[8px] font-mono text-amber-500 uppercase tracking-widest">Demo</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#666] font-mono">
                  <Hash className="w-3 h-3" />
                  <span className="truncate max-w-xs">{query}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded-md text-[10px] font-mono text-[#888] uppercase">{result ? result.chain : "BNB Chain"}</span>
                <span className="px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded-md text-[10px] font-mono text-[#888]">{result ? result.type : "Target Entity"}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {backendReply ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-brand-primary uppercase tracking-[0.2em] mb-2">
                            <Zap className="w-3 h-3" /> CenceraAI Reasoning
                        </div>
                        <div className="p-4 bg-black/40 border border-[#222] rounded-xl text-sm font-mono text-[#B0B0B0] leading-relaxed whitespace-pre-wrap">
                            {backendReply}
                        </div>
                    </div>
                ) : result && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col items-center gap-3">
                            <TrustGauge score={result.score} />
                            <div className="text-center">
                            <p className="text-[#888] text-xs font-mono">Composite Trust Score</p>
                            <p className="text-[10px] text-[#555] font-mono mt-1">Confidence: Medium (Demo)</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-mono text-[#666] uppercase tracking-widest mb-4">Signal Breakdown</p>
                            {[
                            { label: "On-Chain", value: result.onChain, weight: "45%" },
                            { label: "Market", value: result.market, weight: "25%" },
                            { label: "Off-Chain", value: result.offChain, weight: "15%" },
                            { label: "AI-Derived", value: result.aiDerived, weight: "15%" },
                            ].map(({ label, value, weight }) => (
                            <div key={label} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-[#C0C0C0]">{label}</span>
                                <span className="text-[#666]">{weight} · <span className="text-[#E6E6E6]">{value}</span></span>
                                </div>
                                <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${value}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                    className="h-full rounded-full bg-brand-primary/70"
                                />
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1E1E1E] flex items-center justify-between">
              <p className="text-[10px] text-[#444] font-mono">
                {result?.isDemo ? "Demo result" : "Live Backend Reply"} · CenceraAI v1.0 · {new Date().toLocaleTimeString()}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="text-[11px] font-mono text-[#666] hover:text-[#E6E6E6] flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> New query
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
