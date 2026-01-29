"use client";

import { BarChart3, Clock, Key, TrendingUp, Wallet, Shield, Activity, Download, Eye, RefreshCw, Zap, AlertTriangle, EyeOff, Copy, Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { appKit } from "@/lib/walletConfig";
import { api, ApiError } from "@/lib/apiClient";
import { PLANS, PlanType } from "@/lib/plans";

type ApiKeyRecord = {
    id: string;
    name: string;
    key: string;
    createdAt: number;
    lastUsedAt: number | null;
};

function formatDate(value: number) {
    try {
        return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return String(value);
    }
}

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

type DashboardStats = {
    apiCalls: number;
    walletsAnalyzed: number;
    threatsBlocked: number;
    avgResponse: string;
};

type ActivityItem = {
    type: string;
    address: string;
    score: number;
    time: string;
    status: string;
};

type CreditTransaction = {
    amount: number;
    type: string;
    description: string;
    createdAt: string;
};

type UserCreditData = {
    balance: number;
    plan: PlanType;
    billingCycleStart: string;
    billingPeriod: "monthly" | "annual";
    planExpiresAt: string | null;
};

function CreditsPanel({ address }: { address: string }) {
    const [user, setUser] = useState<UserCreditData | null>(null);
    const [history, setHistory] = useState<CreditTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const fetchData = async () => {
            try {
                setError(null);
                const res = await api.getJson<{ user: UserCreditData, history: CreditTransaction[] }>("/credits", { query: { address } });
                if (active) {
                    setUser(res.user);
                    setHistory(res.history);
                }
            } catch (e: unknown) {
                if (!active) return;
                const msg =
                    e instanceof ApiError
                        ? typeof e.body === "object" && e.body && "error" in (e.body as Record<string, unknown>)
                            ? String((e.body as Record<string, unknown>).error)
                            : e.message
                        : e instanceof Error
                        ? e.message
                        : String(e);
                setError(msg);
            }
        };
        fetchData();
        return () => { active = false; };
    }, [address]);

    const currentPlan = user?.plan || 'free';
    const limit = PLANS[currentPlan].limit;
    const balance = user?.balance || 0;
    const nextReset = user?.billingCycleStart ? new Date(new Date(user.billingCycleStart).getTime() + 30 * 24 * 60 * 60 * 1000) : new Date();
    const planExpiresAt = user?.planExpiresAt ? new Date(user.planExpiresAt) : null;

    return (
        <div className="space-y-6">
            {error ? (
                <div className="p-3 bg-[#161616] rounded-lg border border-[#2A2A2A] text-xs text-neon">
                    {error}
                </div>
            ) : null}
            {/* Balance & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl">
                    <div className="text-sm font-medium text-[#E6E6E6] mb-2">Available Balance</div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-neon">{balance}</span>
                        <span className="text-[#666]">/ {limit} Credits</span>
                    </div>
                    <div className="w-full bg-[#2A2A2A] h-2 rounded-full overflow-hidden">
                        <div 
                            className="bg-neon h-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (balance / limit) * 100)}%` }}
                        />
                    </div>
                </div>
                <div className="p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl flex flex-col justify-between">
                    <div>
                        <div className="text-sm font-medium text-[#E6E6E6] mb-1">Current Plan</div>
                        <div className="text-2xl font-bold text-white capitalize">{PLANS[currentPlan].name}</div>
                    </div>
                    <div className="text-sm text-[#888] flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Resets on {nextReset.toLocaleDateString()}
                    </div>
                    {currentPlan !== 'free' && planExpiresAt ? (
                        <div className="text-xs text-[#666] mt-1">
                            Plan expires on {planExpiresAt.toLocaleDateString()}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* History */}
            <div>
                <h3 className="text-sm font-bold text-[#E6E6E6] mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neon" />
                    Transaction History
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {history.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-[#161616] border border-[#2A2A2A] rounded-xl hover:border-neon/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${tx.amount > 0 ? 'bg-neon' : 'bg-red-500'}`} />
                                <div>
                                    <div className="text-sm font-medium text-[#E6E6E6]">{tx.description}</div>
                                    <div className="text-xs text-[#B0B0B0]">{new Date(tx.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-neon' : 'text-red-500'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-center py-8 text-[#666] text-sm bg-[#161616] rounded-xl border border-[#2A2A2A]">No transactions yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ApiKeysPanel({ address }: { address: string }) {
    const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
    const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        api.getJson<{ keys: ApiKeyRecord[] }>("/api-keys", { query: { address } })
            .then((res) => {
                if (!active) return;
                setApiKeys(res.keys || []);
            })
            .catch((e: unknown) => {
                if (!active) return;
                const msg =
                    e instanceof ApiError
                        ? typeof e.body === "object" && e.body && "error" in (e.body as Record<string, unknown>)
                            ? String((e.body as Record<string, unknown>).error)
                            : e.message
                        : e instanceof Error
                        ? e.message
                        : String(e);
                setError(msg);
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [address]);

    const createNewKey = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.postJson<{ key: ApiKeyRecord }>("/api-keys", { body: { address } });
            const record = res.key;
            setApiKeys((prev) => [record, ...prev]);
            setRevealedKeyIds((prev) => ({ ...prev, [record.id]: true }));
        } catch (e: unknown) {
            const msg =
                e instanceof ApiError
                    ? typeof e.body === "object" && e.body && "error" in (e.body as Record<string, unknown>)
                        ? String((e.body as Record<string, unknown>).error)
                        : typeof e.body === "string"
                        ? e.body
                        : e.message
                    : e instanceof Error
                    ? e.message
                    : String(e);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const deleteKey = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/api-keys", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, id }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                const msg =
                    body && typeof body === "object" && "error" in (body as Record<string, unknown>)
                        ? String((body as Record<string, unknown>).error)
                        : `API request failed (${res.status})`;
                throw new Error(msg);
            }
            setApiKeys((prev) => prev.filter((k) => k.id !== id));
            setRevealedKeyIds((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            if (copiedKeyId === id) setCopiedKeyId(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    const toggleReveal = (id: string) => {
        setRevealedKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyKey = async (key: string, id: string) => {
        try {
            await navigator.clipboard.writeText(key);
            setCopiedKeyId(id);
            window.setTimeout(() => setCopiedKeyId((cur) => (cur === id ? null : cur)), 1200);
        } catch {
            setCopiedKeyId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium text-[#E6E6E6] mb-1">Create API key</div>
                    <div className="text-xs text-[#B0B0B0]">Generate keys for authenticating requests to the CENCERA API</div>
                </div>
                <button
                    onClick={createNewKey}
                    disabled={loading}
                    className="px-4 py-2 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 text-neon font-medium rounded-lg transition-all text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create New Key
                </button>
            </div>
            {error ? (
                <div className="p-3 bg-[#161616] rounded-lg border border-[#2A2A2A] text-xs text-neon">
                    {error}
                </div>
            ) : null}
            {apiKeys.length === 0 ? (
                <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                    <div className="text-sm text-[#E6E6E6] font-medium mb-1">{loading ? "Loading API keys..." : "No API keys yet"}</div>
                    <div className="text-xs text-[#B0B0B0]">{loading ? "Fetching keys from database." : "Create a key to start using the API."}</div>
                </div>
            ) : (
                <div className="space-y-3">
                    {apiKeys.map((k) => {
                        const revealed = Boolean(revealedKeyIds[k.id]);
                        const masked = k.key.startsWith("cen_")
                            ? `${k.key.slice(0, 9)}${"•".repeat(16)}`
                            : `${k.key.slice(0, 4)}${"•".repeat(20)}`;
                        return (
                            <div key={k.id} className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A] hover:border-neon/20 transition-colors">
                                <div className="flex items-center justify-between mb-3 gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-[#E6E6E6] mb-2">{k.name}</div>
                                        <div className="flex items-center gap-3">
                                            <code className="text-sm text-[#C7C7C7] font-mono truncate">{revealed ? k.key : masked}</code>
                                            <button
                                                onClick={() => toggleReveal(k.id)}
                                                className="text-[#B0B0B0] hover:text-[#E6E6E6] transition-colors"
                                                aria-label={revealed ? "Hide key" : "Show key"}
                                            >
                                                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => copyKey(k.key, k.id)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-[#B0B0B0] hover:text-[#E6E6E6] transition-colors"
                                            aria-label="Copy key"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteKey(k.id)}
                                            disabled={loading}
                                            className="p-2 hover:bg-white/5 rounded-lg text-[#B0B0B0] hover:text-neon transition-colors"
                                            aria-label="Delete key"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[#B0B0B0]">
                                    <span>Created {formatDate(k.createdAt)}</span>
                                    <span>•</span>
                                    <span>{k.lastUsedAt ? `Last used ${formatDate(k.lastUsedAt)}` : "Never used"}</span>
                                    {copiedKeyId === k.id ? (
                                        <>
                                            <span>•</span>
                                            <span className="text-neon">Copied</span>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="p-4 bg-neon/5 border border-neon/10 rounded-lg">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-neon flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="text-neon font-medium mb-1">Keep your API keys secure</p>
                        <p className="text-[#B0B0B0] text-xs">Never share your API keys or commit them to version control. Rotate keys regularly for security.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const [selectedPeriod, setSelectedPeriod] = useState("7d");
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        apiCalls: 0,
        walletsAnalyzed: 0,
        threatsBlocked: 0,
        avgResponse: "0ms"
    });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

    useEffect(() => {
        if (!address) return;
        api.getJson<{ stats: DashboardStats, recentActivity: ActivityItem[] }>('/dashboard', { query: { address } })
            .then(data => {
                setStats(data.stats);
                setRecentActivity(data.recentActivity);
            })
            .catch(console.error);
    }, [address]);

    useEffect(() => {
        const t = window.setTimeout(() => setMounted(true), 0);
        return () => window.clearTimeout(t);
    }, []);

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-2">
                    <BarChart3 className="w-10 h-10 text-neon" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-[#E6E6E6] font-sans">Loading Dashboard</h1>
                    <p className="text-[#B0B0B0] text-sm">Preparing your dashboard session…</p>
                </div>
            </div>
        );
    }

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

    const getStatusColor = (status: string) => {
        if (status === "blocked") return "text-neon bg-neon/10 border-neon/20";
        return "text-[#C7C7C7] bg-[#1A1A1A] border-[#2A2A2A]";
    };

    return (
        <div className="p-6 space-y-8">
            {/* Warning Banner */}
            {/* <div className="bg-neon/10 border border-neon/20 text-neon px-4 py-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Notice: Mock data is currently being used for demonstration purposes.</span>
            </div> */}

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
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">{stats.apiCalls.toLocaleString()}</div>
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
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">{stats.walletsAnalyzed.toLocaleString()}</div>
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
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">{stats.threatsBlocked.toLocaleString()}</div>
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
                    <div className="text-2xl font-bold text-[#E6E6E6] mb-1">{stats.avgResponse}</div>
                    <div className="text-xs text-[#B0B0B0]">Avg Response</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity - Cyan Primary */}
                <div className="lg:col-span-2 bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#E6E6E6]">Recent Activity</h2>
                        <button
                            onClick={() => router.push("/dashboard/activity")}
                            className="text-sm text-neon hover:text-neon-light font-medium flex items-center gap-1 transition-colors"
                        >
                            View All
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center bg-[#161616] rounded-lg border border-[#2A2A2A]">
                                <p className="text-sm text-[#E6E6E6]">No recent activity yet</p>
                                <p className="mt-1 text-xs text-[#B0B0B0]">Run an analysis or use the API to see activity here.</p>
                            </div>
                        ) : (
                            recentActivity.map((activity, i) => (
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
                                                {timeAgo(activity.time)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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

            {/* Credits Section - Cyan Primary */}
            <div id="credits" className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Wallet className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Credits & Billing</h2>
                </div>
                {address ? <CreditsPanel key={address.toLowerCase()} address={address} /> : null}
            </div>

            {/* API Keys Section - Cyan Primary */}
            <div id="api-keys" className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Key className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">API Keys</h2>
                </div>
                {address ? <ApiKeysPanel key={address.toLowerCase()} address={address} /> : null}
            </div>

            {/* Quick Actions - Cyan Primary with Accent Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-6 bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl hover:border-neon/20 transition-all text-left group">
                    <TrendingUp className="w-8 h-8 text-neon mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-bold text-[#E6E6E6] mb-2">View Analytics</h3>
                    <p className="text-sm text-[#B0B0B0]">Detailed insights and reports</p>
                </button>
                <button
                    onClick={() => document.getElementById("api-keys")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="p-6 bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl hover:border-neon/20 transition-all text-left group"
                >
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
