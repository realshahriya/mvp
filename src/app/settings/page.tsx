"use client";

import { Brain, Link2, Cpu, Database, Bot, Shield, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";

const CONFIG_SECTIONS = [
  {
    title: "Agent Identity",
    icon: Bot,
    color: "text-brand-primary",
    borderColor: "border-brand-primary/20",
    bgColor: "bg-brand-primary/5",
    fields: [
      { label: "Agent ID", value: "CENCERA-0x1A2F" },
      { label: "Persona", value: "Lawful Neutral Sovereign Intelligence" },
      { label: "Specialization", value: "Solidity · DeFi · Web3 Security" },
      { label: "LLM Engine", value: "ASI-1 Mini (Fetch.ai) + Gemini 2.0 Flash" },
    ],
  },
  {
    title: "Memory Layer",
    icon: Brain,
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-500/5",
    fields: [
      { label: "Provider", value: "Unibase Membase" },
      { label: "Type", value: "Decentralized · Tamper-Resistant" },
      { label: "Sync", value: "Cross-platform (Web + Telegram)" },
      { label: "Persistence", value: "Immortal — cannot be erased" },
    ],
  },
  {
    title: "On-Chain State",
    icon: Link2,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/5",
    fields: [
      { label: "Blockchain", value: "BNB Chain Testnet" },
      { label: "Contract", value: "CenceraAgent.sol" },
      { label: "Evolution Cycle", value: "~60 seconds" },
      { label: "Innovation Score", value: "1,847 (on-chain)" },
    ],
  },
  {
    title: "Trust Protocol",
    icon: Shield,
    color: "text-sky-400",
    borderColor: "border-sky-400/20",
    bgColor: "bg-sky-400/5",
    fields: [
      { label: "Signal Domains", value: "4 (On-Chain, Market, Off-Chain, AI)" },
      { label: "Entity Types", value: "EOA, Smart Contract, Token, NFT, Protocol" },
      { label: "Chain Coverage", value: "18 chains" },
      { label: "Score Range", value: "0–100 probabilistic composite" },
    ],
  },
  {
    title: "Ecosystem",
    icon: Globe,
    color: "text-purple-400",
    borderColor: "border-purple-400/20",
    bgColor: "bg-purple-400/5",
    fields: [
      { label: "Agentverse", value: "Registered via uAgents bridge" },
      { label: "Launchpad", value: "BitAgent Autonomous Action Execution" },
      { label: "Interfaces", value: "Web Dashboard + Telegram Bot" },
      { label: "Status", value: "Testnet — Mainnet launch TBD" },
    ],
  },
  {
    title: "Infrastructure",
    icon: Cpu,
    color: "text-rose-400",
    borderColor: "border-rose-400/20",
    bgColor: "bg-rose-400/5",
    fields: [
      { label: "Backend", value: "Node.js · Express · Ethers.js" },
      { label: "Frontend", value: "Next.js · RainbowKit · Wagmi" },
      { label: "Smart Contracts", value: "Solidity · Hardhat" },
      { label: "Messaging", value: "node-telegram-bot-api" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-8 relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E6E6E6] font-sans tracking-wide uppercase">Agent Configuration</h1>
        <p className="text-[#888] text-sm mt-1 font-mono">CenceraAI system architecture and protocol parameters</p>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-brand-primary/10 via-[#1A1A1A] to-transparent border border-brand-primary/20 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center shrink-0">
          <Database className="w-7 h-7 text-brand-primary" />
        </div>
        <div>
          <p className="font-bold text-[#E6E6E6] font-sans">Durable. Sovereign. Evolving.</p>
          <p className="text-sm text-[#888] font-mono mt-0.5">
            CenceraAI — the world&apos;s first On-Chain Immortal AI Agent. Anchored to BNB Chain with decentralized memory that cannot be erased.
          </p>
        </div>
        <div className="ml-auto shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest">Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-mono text-amber-400">Evolution loop active</span>
          </div>
        </div>
      </div>

      {/* Config sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CONFIG_SECTIONS.map(({ title, icon: Icon, color, borderColor, bgColor, fields }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 22 }}
            className={`bg-[#111] border ${borderColor} rounded-xl overflow-hidden`}
          >
            <div className={`flex items-center gap-2.5 px-5 py-4 border-b ${borderColor} ${bgColor}`}>
              <Icon className={`w-4 h-4 ${color}`} />
              <span className={`text-xs font-mono font-bold uppercase tracking-widest ${color}`}>{title}</span>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {fields.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3 gap-4">
                  <span className="text-xs font-mono text-[#666] shrink-0">{label}</span>
                  <span className="text-xs font-mono text-[#C0C0C0] text-right">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center text-xs font-mono text-[#444] pt-2">
        Read-only showcase · Configuration reflects CenceraAI whitepaper v1.0
      </div>
    </div>
  );
}
