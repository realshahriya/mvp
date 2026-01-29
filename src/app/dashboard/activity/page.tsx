"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import { appKit } from "@/lib/walletConfig";
import { api } from "@/lib/apiClient";
import { BarChart3, Clock, Shield, AlertTriangle, Wallet, ArrowLeft } from "lucide-react";

type ActivityItem = {
    type: string;
    address: string;
    score: number;
    time: string;
    status: string;
};

function timeAgo(date: string | Date | number) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return Math.floor(seconds) + " sec ago";
}

export default function ActivityHistoryPage() {
    const { isConnected, address } = useAccount();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);

    useEffect(() => {
        if (!address) return;
        let active = true;
        const period = searchParams.get("period") || "90d";
        const run = async () => {
            if (!active) return;
            setLoading(true);
            setError(null);
            try {
                const data = await api.getJson<{ stats: unknown; recentActivity: ActivityItem[] }>("/dashboard", {
                    query: { address, period, limit: 100 },
                });
                if (!active) return;
                setActivity(data.recentActivity || []);
            } catch (e: unknown) {
                if (!active) return;
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                if (!active) return;
                setLoading(false);
            }
        };
        run();
        return () => {
            active = false;
        };
    }, [address, searchParams]);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-2">
                    <BarChart3 className="w-10 h-10 text-neon" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-[#E6E6E6] font-sans">Activity History</h1>
                    <p className="text-[#B0B0B0] text-sm">
                        Connect your wallet to view your full analysis and API activity history.
                    </p>
                </div>
                <button
                    onClick={() => appKit.open()}
                    className="flex items-center gap-2 px-6 py-3 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 rounded-xl text-neon font-mono font-bold transition-all"
                >
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[#E6E6E6] text-sm hover:border-neon/30 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to dashboard
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#E6E6E6]">Activity History</h1>
                        <p className="text-sm text-[#B0B0B0]">Detailed list of your scans and threat detections.</p>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="p-3 bg-[#161616] rounded-lg border border-[#2A2A2A] text-xs text-neon">{error}</div>
            ) : null}

            <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                {loading ? (
                    <div className="py-10 text-center text-sm text-[#B0B0B0]">Loading activity…</div>
                ) : activity.length === 0 ? (
                    <div className="py-10 text-center text-sm text-[#B0B0B0]">
                        No activity found for this wallet in the selected period.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activity.map((item, index) => (
                            <div
                                key={`${item.address}-${item.time}-${index}`}
                                className="flex items-center gap-4 p-4 bg-[#161616] rounded-lg border border-[#2A2A2A] hover:border-neon/20 hover:bg-[#1C1C1C] transition-colors"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                        item.type === "threat" ? "text-neon bg-neon/10 border-neon/30" : "text-[#C7C7C7] bg-[#1A1A1A] border-[#2A2A2A]"
                                    }`}
                                >
                                    {item.type === "threat" ? (
                                        <AlertTriangle className="w-5 h-5" />
                                    ) : (
                                        <Shield className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="font-mono text-sm text-[#E6E6E6] break-all">{item.address}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-medium capitalize border ${
                                                item.type === "threat" ? "text-neon bg-neon/10 border-neon/30" : "text-[#C7C7C7] bg-[#1A1A1A] border-[#2A2A2A]"
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#B0B0B0]">
                                        <span>Trust Score: {item.score}/100</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {timeAgo(item.time)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
