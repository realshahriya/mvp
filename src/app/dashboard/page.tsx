"use client";

import { BarChart3, Clock, Key, TrendingUp, Wallet, Shield, Activity, Download, Eye, RefreshCw, Zap, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAccount } from 'wagmi';
import { appKit } from '@/lib/walletConfig';

export default function DashboardPage() {
    const { isConnected } = useAccount();
    const [selectedPeriod, setSelectedPeriod] = useState("7d");

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-2">
                    <BarChart3 className="w-10 h-10 text-neon" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-[#E6E6E6] font-sans">Dashboard Locked</h1>
                    <p className="text-[#B0B0B0] text-sm">
                        Connect your wallet to view real-time production statistics, active threats, and API usage reports.
                    </p>
                </div>
                <button
                    onClick={() => appKit.open()}
                    className="flex items-center gap-2 px-6 py-3 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 rounded-xl text-neon font-mono font-bold transition-all"
                >
                    <Wallet className="w-5 h-5" />
                    Connect & View Dashboard
                </button>
            </div>
        );
    }

    const recentActivity = [
        { type: "scan", address: "0x742d...4cB7", score: 92, time: "2 min ago", status: "safe" },
        { type: "scan", address: "0x1234...5678", score: 45, time: "5 min ago", status: "risky" },
        { type: "threat", address: "0xabcd...ef01", score: 12, time: "12 min ago", status: "blocked" },
        { type: "scan", address: "0x9999...1111", score: 88, time: "18 min ago", status: "safe" },
        { type: "scan", address: "0x5555...6666", score: 67, time: "25 min ago", status: "caution" },
    ];

    const apiKeys = [
        { name: "Production API", key: "cen_prod_***************", created: "2 months ago", status: "active", calls: "3.8M" },
        { name: "Development API", key: "cen_dev_***************", created: "1 week ago", status: "active", calls: "420K" },
    ];

    const getStatusColor = (status: string) => {
        if (status === "blocked") return "text-neon bg-neon/10 border-neon/20";
        return "text-[#C7C7C7] bg-[#1A1A1A] border-[#2A2A2A]";
    };

    return (
        <div className="p-6 space-y-8">
            {/* Warning Banner */}
            <div className="bg-neon/10 border border-neon/20 text-neon px-4 py-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Notice: Mock data is currently being used for demonstration purposes.</span>
            </div>

            {/* Header - Cyan Primary Theme */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#E6E6E6] mb-2 font-sans">Dashboard</h1>
                    <p className="text-[#B0B0B0] text-sm">Monitor your API usage and recent activity</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] text-sm focus:outline-none focus:border-neon/30 transition-colors"
                    >
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <button className="px-4 py-2 bg-neon/5 hover:bg-neon/10 border border-neon/10 hover:border-neon/20 rounded-lg text-neon text-sm font-medium transition-all flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid - Multi-Color Themed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 hover:border-neon/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-[#C7C7C7]" />
                        </div>
                        <span className="text-sm font-medium text-[#B0B0B0]">
                            +12%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">4.2M</div>
                    <div className="text-xs text-[#B0B0B0]">API Calls</div>
                </div>

                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 hover:border-neon/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-[#C7C7C7]" />
                        </div>
                        <span className="text-sm font-medium text-[#B0B0B0]">
                            +8%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">18.3K</div>
                    <div className="text-xs text-[#B0B0B0]">Wallets Analyzed</div>
                </div>

                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 hover:border-neon/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-[#C7C7C7]" />
                        </div>
                        <span className="text-sm font-medium text-[#B0B0B0]">
                            +23%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">247</div>
                    <div className="text-xs text-[#B0B0B0]">Threats Blocked</div>
                </div>

                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 hover:border-neon/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[#C7C7C7]" />
                        </div>
                        <span className="text-sm font-medium text-[#B0B0B0]">
                            -5%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">48ms</div>
                    <div className="text-xs text-[#B0B0B0]">Avg Response</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity - Cyan Primary */}
                <div className="lg:col-span-2 bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#E6E6E6]">Recent Activity</h2>
                        <button className="text-sm text-neon hover:text-neon-light font-medium flex items-center gap-1 transition-colors">
                            View All
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.map((activity, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-[#161616] rounded-lg hover:bg-[#1C1C1C] transition-colors border border-[#2A2A2A] hover:border-neon/20">
                                <div className={`w-10 h-10 rounded-full ${getStatusColor(activity.status)} border flex items-center justify-center flex-shrink-0`}>
                                    {activity.type === 'threat' ? (
                                        <AlertTriangle className="w-5 h-5" />
                                    ) : (
                                        <Shield className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm text-[#E6E6E6]">{activity.address}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(activity.status)} border`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-[#B0B0B0]">
                                        <span>Trust Score: {activity.score}/100</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {activity.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Usage Chart - Cyan Primary */}
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                    <h2 className="text-xl font-bold text-[#E6E6E6] mb-4">Usage Trend</h2>
                    <div className="h-64 flex items-center justify-center bg-[#161616] rounded-lg border border-[#2A2A2A]">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-neon/30 mx-auto mb-2" />
                            <p className="text-sm text-[#B0B0B0]">Chart visualization</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#B0B0B0]">Peak Usage</span>
                            <span className="text-neon font-medium">1.2M calls/day</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#B0B0B0]">Average</span>
                            <span className="text-[#E6E6E6] font-medium">600K calls/day</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Keys Section - Cyan Primary */}
            <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#E6E6E6]">API Keys</h2>
                    <button className="px-4 py-2 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 text-neon font-medium rounded-lg transition-all text-sm flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Create New Key
                    </button>
                </div>
                <div className="space-y-4">
                    {apiKeys.map((key, i) => (
                        <div key={i} className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A] hover:border-neon/20 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-medium text-[#E6E6E6]">{key.name}</span>
                                        <span className="px-2 py-0.5 bg-neon/10 border border-neon/20 rounded text-xs font-medium text-neon">
                                            {key.status}
                                        </span>
                                    </div>
                                    <code className="text-sm text-[#C7C7C7] font-mono">{key.key}</code>
                                </div>
                                <button className="text-[#B0B0B0] hover:text-neon transition-colors">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-[#B0B0B0]">
                                <span>Created {key.created}</span>
                                <span>•</span>
                                <span className="text-neon">{key.calls} calls</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions - Cyan Primary with Accent Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-6 bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl hover:border-neon/20 transition-all text-left group">
                    <TrendingUp className="w-8 h-8 text-neon mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-bold text-[#E6E6E6] mb-2">View Analytics</h3>
                    <p className="text-sm text-[#B0B0B0]">Detailed insights and reports</p>
                </button>
                <button className="p-6 bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl hover:border-neon/20 transition-all text-left group">
                    <Key className="w-8 h-8 text-neon mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-bold text-[#E6E6E6] mb-2">Manage API Keys</h3>
                    <p className="text-sm text-[#B0B0B0]">Create and rotate keys</p>
                </button>
                <button className="p-6 bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl hover:border-neon/20 transition-all text-left group">
                    <Download className="w-8 h-8 text-neon mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-bold text-[#E6E6E6] mb-2">Export Data</h3>
                    <p className="text-sm text-[#B0B0B0]">Download usage reports</p>
                </button>
            </div>
        </div>
    );
}
