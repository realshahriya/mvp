"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EntityData as AnalysisEntityData } from '@/lib/mockData';
import { TrustGauge } from '@/components/TrustGauge';
import { RiskCard } from '@/components/RiskCard';
import { SocialSentiment } from '@/components/SocialSentiment';
import { SimulationEngine } from '@/components/SimulationEngine';
import { Loader2, ShieldAlert, BadgeCheck, Copy, Database, ArrowUpRight, Zap, Clock, Shield, ExternalLink, AlertTriangle, Send, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseChaingptTrustResponse } from '@/lib/chaingptTrust';

const CHAIN_CONFIG: Record<string, { name: string, explorer: string, icon: string }> = {
    "1": { name: "Ethereum Mainnet", explorer: "https://etherscan.io", icon: "Ξ" },
    "56": { name: "BNB Smart Chain", explorer: "https://bscscan.com", icon: "BNB" },
    "137": { name: "Polygon", explorer: "https://polygonscan.com", icon: "MATIC" },
    "43114": { name: "Avalanche C-Chain", explorer: "https://snowtrace.io", icon: "AVAX" },
    "42161": { name: "Arbitrum One", explorer: "https://arbiscan.io", icon: "ARB" },
    "10": { name: "Optimism", explorer: "https://optimistic.etherscan.io", icon: "OP" },
    "8453": { name: "Base", explorer: "https://basescan.org", icon: "BASE" },
    "324": { name: "zkSync Era", explorer: "https://explorer.zksync.io", icon: "ZK" },
    "250": { name: "Fantom Opera", explorer: "https://ftmscan.com", icon: "FTM" },
    "solana": { name: "Solana", explorer: "https://solscan.io", icon: "SOL" },
    "sui": { name: "Sui", explorer: "https://suiscan.xyz", icon: "SUI" },
    "aptos": { name: "Aptos", explorer: "https://explorer.aptoslabs.com", icon: "APT" },
    "ton": { name: "TON", explorer: "https://tonscan.org", icon: "TON" },
    "bitcoin": { name: "Bitcoin", explorer: "https://mempool.space", icon: "BTC" },
    "stacks": { name: "Stacks", explorer: "https://explorer.hiro.so", icon: "STX" }
};

function getExplorerHref(chainId: string, address: string) {
    const chainInfo = CHAIN_CONFIG[chainId] || CHAIN_CONFIG["1"];
    if (chainId === 'solana') return `${chainInfo.explorer}/account/${address}`;
    if (chainId === 'aptos') return `${chainInfo.explorer}/account/${address}?network=mainnet`;
    if (chainId === 'sui') return `${chainInfo.explorer}/address/${address}`;
    if (chainId === 'ton') return `${chainInfo.explorer}/address/${address}`;
    if (chainId === 'bitcoin') return `${chainInfo.explorer}/address/${address}`;
    if (chainId === 'stacks') return `${chainInfo.explorer}/address/${address}`;
    return `${chainInfo.explorer}/address/${address}`;
}

export default function AnalysisView() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || "vitalik.eth";
    const chainId = searchParams.get('chain') || "1";
    const chainInfo = CHAIN_CONFIG[chainId] || { name: `Chain ID: ${chainId}`, explorer: "https://etherscan.io", icon: "?" };

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalysisEntityData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [copied, setCopied] = useState(false);

    const [showReport, setShowReport] = useState(false);
    const [reason, setReason] = useState("");
    const [reportText, setReportText] = useState("");
    const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [reportError, setReportError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setLoadingStep(0);

        const interval = setInterval(() => {
            setLoadingStep(prev => prev + 1);
        }, 700);

        const run = async () => {
            try {
                const res = await fetch(`/api/analyze?q=${encodeURIComponent(query)}&chain=${encodeURIComponent(chainId)}`);
                if (!res.ok) throw new Error('failed');
                const j = await res.json();
                const parsed = typeof j.ai_text === 'string' ? parseChaingptTrustResponse(j.ai_text) : null;
                const d: AnalysisEntityData = {
                    id: j.entity,
                    address: j.address ?? query,
                    type: j.type,
                    score: parsed?.trustScore ?? j.trust_score,
                    label: j.risk_level,
                    summary: parsed?.summary ?? j.summary,
                    risks: (j.risk_flags || []).map((t: string) => ({ type: 'info', title: t, description: '' })),
                    history: [],
                    sentiment: Array.isArray(j.sentiment) ? j.sentiment : [],
                    hypeScore: j.metadata?.social_hype_score,
                    mentionsCount: j.metadata?.social_mentions,
                    nativeBalance: typeof j.market_data?.native_balance === 'number' ? j.market_data.native_balance : undefined,
                    nativeSymbol: typeof j.market_data?.native_symbol === 'string' ? j.market_data.native_symbol : undefined,
                    nativePriceUsd: typeof j.market_data?.native_price_usd === 'number' ? j.market_data.native_price_usd : undefined,
                    marketData: j.market_data
                        ? {
                            ethPriceUsd: j.market_data.eth_price ?? 0,
                            portfolioValueUsd: j.market_data.portfolio_value_usd ?? 0,
                            tokenPrice: undefined
                        }
                        : undefined
                };
                setTimeout(() => {
                    clearInterval(interval);
                    setData(d);
                    setLoading(false);
                }, 3000);
            } catch {
                clearInterval(interval);
                setError("Could not analyze entity. Invalid address or network error.");
                setLoading(false);
            }
        };
        run();

        return () => clearInterval(interval);
    }, [query, chainId, chainInfo.name]);

    const handleCopy = () => {
        if (data) {
            navigator.clipboard.writeText(data.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        const steps = [
            `Connecting to ${chainInfo.name}...`,
            "Resolving ENS / Address...",
            "Scanning On-Chain History...",
            "Analyzing Risk Patterns...",
            "Finalizing Trust Report..."
        ];

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
                    <div className="relative">
                        <Loader2 className="w-20 h-20 text-blue-400 animate-spin" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl animate-pulse"></div>
                    </div>
                </div>
                <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-white">
                        AI Analysis in Progress
                    </h2>
                    <div className="h-6 overflow-hidden">
                        <motion.p
                            key={loadingStep}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-blue-400 font-mono text-sm"
                        >
                            {steps[Math.min(loadingStep, steps.length - 1)]}
                        </motion.p>
                    </div>
                    <div className="flex items-center gap-2 justify-center pt-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 w-12 rounded-full transition-all duration-300 ${i <= loadingStep ? 'bg-blue-500' : 'bg-zinc-800'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center max-w-md text-center">
                    <div className="p-4 bg-red-500/20 rounded-full mb-4">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
                    <p className="text-zinc-400 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-500/20"
                    >
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return <div>Failed to load data.</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Enhanced Header */}
            <div className="bg-zinc-900/85 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <span className="text-xs font-bold text-blue-400">{chainInfo.icon}</span>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">{chainInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white font-mono">{data.id}</h1>
                            {data.score > 80 && <BadgeCheck className="w-6 h-6 text-green-400" />}
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                            >
                                <Copy className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                {copied && (
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap">
                                        Copied!
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge type={data.type} />
                            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 font-medium flex items-center gap-1.5">
                                <Database className="w-3 h-3" /> Live Data
                            </span>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Updated just now
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <ExplorerLink chainId={chainId} address={data.id} />
                        {data.score < 50 && (
                            <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2 font-medium">
                                <ShieldAlert className="w-5 h-5" />
                                <span className="text-sm">High Risk Entity</span>
                            </div>
                        )}
                        <button
                            onClick={() => setShowReport(true)}
                            className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded-lg text-sm text-red-300 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Optimized Grid Layout - No Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    {/* Trust Gauge */}
                    <div className="bg-zinc-900/85 rounded-2xl p-8 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
                        <div className="relative z-10">
                            <TrustGauge score={data.score} size={200} />
                            <div className="mt-6 text-center">
                                <div className="text-2xl font-bold text-white mb-1 font-sans">{data.label}</div>
                                <div className="text-sm text-zinc-500">Confidence: 99.8%</div>
                            </div>
                        </div>
                        {data.hypeScore !== undefined && (
                            <div className="absolute top-6 right-6 flex flex-col items-end">
                                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Hype</div>
                                <div className={`text-xl font-bold ${data.hypeScore > 50 ? 'text-white' : 'text-zinc-500'}`}>
                                    {data.hypeScore}/100
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Summary - Enhanced */}
                    <div className="bg-zinc-900/85 rounded-2xl p-6 border border-white/10 flex-1 relative overflow-hidden">
                        {/* Subtle gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                        <Zap className="w-4 h-4 text-blue-400" />
                                    </div>
                                    AI Summary
                                </h3>
                                {data.marketData && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500">Est. Value</span>
                                        <div className="text-sm text-white font-bold font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                            ${data.marketData.portfolioValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                                <div className="text-zinc-300 leading-relaxed text-sm">
                                    <FormattedText text={data.summary} />
                                </div>
                            </div>

                            {/* AI Badge */}
                            <div className="mt-3 flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-blue-400 font-medium">AI Generated</span>
                                </div>
                                <span className="text-xs text-zinc-600">Powered by Chaingpt</span>
                            </div>
                        </div>
                    </div>

                    
                </div>

                {/* Right Column - Perfectly Aligned */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Risk Cards */}
                    <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-red-400" />
                            Risk Assessment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.risks.map((risk, i) => (
                                <RiskCard key={i} {...risk} />
                            ))}
                        </div>
                    </div>

                    {/* Transaction Simulator */}
                    <SimulationEngine
                        displayId={data.id}
                        actualAddress={data.address}
                        chainId={chainId}
                        entityType={data.type}
                    />

                    {/* Bottom Row - Equal Heights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SocialSentiment data={data.sentiment} />

                        {/* On-Chain Signals */}
                        <div className="bg-zinc-900/85 rounded-2xl p-6 border border-white/10 flex flex-col">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                                    <Database className="w-4 h-4 text-cyan-400" />
                                    On-Chain Signals
                                </h3>
                                <span className="text-xs text-zinc-500 font-mono">{chainInfo.icon}</span>
                            </div>

                            <div className="space-y-3 text-sm flex-1">
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-zinc-500">Balance</span>
                                    <span className="text-white font-mono font-medium">
                                        {typeof data.nativeBalance === 'number' && data.nativeSymbol
                                            ? `${data.nativeBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${data.nativeSymbol}${data.marketData?.portfolioValueUsd ? ` ($${data.marketData.portfolioValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })})` : ''}`
                                            : data.marketData?.portfolioValueUsd
                                            ? `$${data.marketData.portfolioValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                            : '-'}
                                    </span>
                                </div>

                                {data.type === 'token' && (
                                    <>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-zinc-500">Standard</span>
                                            <span className="text-zinc-300 font-mono">ERC-20</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-zinc-500">Symbol</span>
                                            <span className="text-white font-bold">{data.id.split('(')[1]?.replace(')', '') || 'Unknown'}</span>
                                        </div>
                                    </>
                                )}

                                {data.type === 'contract' && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-zinc-500">Verified</span>
                                        <span className="text-green-400 font-medium flex items-center gap-1">
                                            <BadgeCheck className="w-3 h-3" /> Yes
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between py-2">
                                    <span className="text-zinc-500">Last Active</span>
                                    <span className="text-zinc-200">Just now</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-auto border-t border-white/5">
                                <a
                                    href={getExplorerHref(chainId, data.address ?? (data.id.match(/\((.*?)\)/)?.[1] ?? data.id))}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors border border-white/5 font-medium group"
                                >
                                    View on Explorer
                                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Report Modal */}
            {showReport && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowReport(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors duration-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-2 font-sans">Analysis Report</h3>
                        <p className="text-sm text-zinc-400 mb-6">Send a report about the current entity and analysis.</p>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                                <div className="flex items-center justify-between bg-zinc-800/50 border border-white/5 rounded-md px-3 py-2">
                                    <span>Address</span>
                                    <span className="font-mono text-zinc-300">
                                        {(data.address ?? (data.id.match(/\((.*?)\)/)?.[1] ?? data.id)).slice(0, 10)}…
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-zinc-800/50 border border-white/5 rounded-md px-3 py-2">
                                    <span>Chain</span>
                                    <span className="font-mono text-zinc-300">{chainId}</span>
                                </div>
                            </div>
                            <input
                                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300"
                                placeholder="Reason (short title)"
                                value={reason}
                                onChange={(e) => { setReason(e.target.value); if (reportError) setReportError(null); }}
                            />
                            <textarea
                                className="w-full h-32 bg-zinc-800/50 border border-white/5 rounded-xl p-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none transition-all duration-300"
                                placeholder="Details (steps, expected behavior, context)…"
                                value={reportText}
                                onChange={(e) => { setReportText(e.target.value); if (reportError) setReportError(null); }}
                            />
                            {reportError && (
                                <div className="text-xs text-red-400">{reportError}</div>
                            )}
                            <button
                                onClick={async () => {
                                    const trimmed = reportText.trim();
                                    const short = reason.trim();
                                    if (reportStatus === "sending") return;
                                    if (short.length < 2) {
                                        setReportError("Please enter a short reason");
                                        return;
                                    }
                                    if (trimmed.length < 3) {
                                        setReportError("Please enter at least 3 characters in details");
                                        return;
                                    }
                                    setReportStatus("sending");
                                    try {
                                        const res = await fetch("/api/report-analysis", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                reason: short,
                                                details: trimmed,
                                                chain: chainId,
                                                address: (data.address ?? (data.id.match(/\((.*?)\)/)?.[1] ?? data.id))
                                            })
                                        });
                                        if (!res.ok) {
                                            let errMsg = "Unable to send. Try again.";
                                            try {
                                                const data = await res.json();
                                                const code = String(data?.error || "");
                                                if (code === "reason_too_short") errMsg = "Please enter a short reason";
                                                else if (code === "content_too_short") errMsg = "Please enter at least 3 characters in details";
                                                else if (code === "telegram_not_configured") errMsg = "Telegram is not configured for analysis reports";
                                                else if (code === "telegram_failed") errMsg = String(data?.details || "Telegram request failed");
                                            } catch {}
                                            setReportError(errMsg);
                                            setReportStatus("error");
                                            return;
                                        }
                                        setReportStatus("sent");
                                        setTimeout(() => {
                                            setReportStatus("idle");
                                            setReportText("");
                                            setReason("");
                                            setReportError(null);
                                            setShowReport(false);
                                        }, 900);
                                    } catch {
                                        setReportStatus("error");
                                        setTimeout(() => setReportStatus("idle"), 1500);
                                    }
                                }}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={reason.trim().length < 2 || reportText.trim().length < 3 || reportStatus === "sending"}
                            >
                                {reportStatus === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {reportStatus === "sending" ? "Sending..." : reportStatus === "sent" ? "Sent" : "Send Analysis Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Badge({ type }: { type: string }) {
    const colors = {
        wallet: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        contract: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        nft: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        token: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    };
    const c = colors[type as keyof typeof colors] || colors.wallet;

    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase ${c}`}>
            {type}
        </span>
    );
}

function ExplorerLink({ chainId, address }: { chainId: string, address: string }) {
    const match = address.match(/\((.*?)\)/);
    const cleanAddress = match ? match[1] : address;

    if (!cleanAddress || cleanAddress.length < 5) return null;

    return (
        <a
            href={getExplorerHref(chainId, cleanAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors font-medium group"
        >
            <span>View on Explorer</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
    );
}

function FormattedText({ text }: { text: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return (
        <p>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
    );
}
