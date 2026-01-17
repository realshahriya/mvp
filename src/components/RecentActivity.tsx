"use client";

import { CheckCircle, XCircle, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import type { SVGProps } from "react";

interface LogItem {
    endpoint: string;
    method: 'GET' | 'POST';
    status: number;
    latency: string;
    timestamp: string;
    riskScore?: number;
}

// Helper to generate random logs
function generateRandomLogs(): LogItem[] {
    const endpoints = [
        "/v1/trust-score", "/v1/scan/contract", "/v1/scan/wallet", "/v1/monitor/add"
    ];

    return Array.from({ length: 15 }).map(() => {
        const isSuccess = Math.random() > 0.05;
        const method: 'GET' | 'POST' = Math.random() > 0.7 ? 'POST' : 'GET';

        return {
            endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
            method,
            status: isSuccess ? 200 : 429,
            latency: `${Math.floor(Math.random() * 150) + 20}ms`,
            timestamp: `${Math.floor(Math.random() * 59) + 1}s ago`,
            riskScore: isSuccess ? Math.floor(Math.random() * 100) : undefined
        };
    }).sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
}

export function RecentActivity() {
    const [logs] = useState<LogItem[]>(() => generateRandomLogs());

    if (logs.length === 0) return null;

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl flex flex-col h-full">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-zinc-400" />
                    Live API Logs
                </h3>
                <div className="flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">Real-time</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors group text-sm border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                {log.method}
                            </span>
                            <span className="font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors text-xs">
                                {log.endpoint}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-zinc-600 font-mono">{log.latency}</span>
                            <div className="flex items-center gap-1.5 min-w-[50px] justify-end">
                                <span className={`font-mono ${log.status === 200 ? "text-zinc-400" : "text-red-400"}`}>
                                    {log.status}
                                </span>
                                {log.status === 200 ? <CheckCircle className="w-3 h-3 text-zinc-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-white/5 bg-white/[0.02] text-center">
                <button className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1 w-full transition-colors font-medium">
                    View Full Logs <ArrowUpRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// Icons helper
function ActivityIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
