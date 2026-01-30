"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, Menu, X, Send, Wallet, BarChart3, Settings, Lock, Loader2, UserCircle, MessageSquare, Zap } from "lucide-react";
import { useState } from "react";
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { appKit } from '@/lib/walletConfig';
import { api, ApiError } from "@/lib/apiClient";

function getApiErrorField(body: unknown, key: "error" | "details") {
    if (!body || typeof body !== "object") return "";
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "";
    return String(value);
}

export function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [showFeedbackLocal, setShowFeedbackLocal] = useState(() => searchParams.get('feedback') === '1');
    const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "other">("feature");
    const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
    const [feedbackText, setFeedbackText] = useState("");
    const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [reportError, setReportError] = useState<string | null>(null);
    const [attachWallet, setAttachWallet] = useState(true);

    const { address, isConnected } = useAccount();
    const showFeedback = showFeedbackLocal || searchParams.get('feedback') === '1';


    const links = [
        { name: "Overview", href: "/", icon: LayoutDashboard },
        { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <>
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 glass-panel rounded-lg text-white hover:bg-white/10 transition-all duration-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu className="w-6 h-6" />
            </button>

            <div className="hidden md:block fixed inset-y-0 left-0 z-40 w-64 glass-panel">
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-subtle bg-gradient-to-r from-neon/5 to-transparent">
                        <Image src="/logo.png" alt="Cencera Logo" width={32} height={32} className="mr-3" priority />
                        <span className="text-xl font-bold tracking-tight text-white font-sans">
                            CENCERA
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {links.map((link, index) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            const isLocked = !isConnected && (link.name === "Dashboard" || link.name === "Settings");

                            if (isLocked) {
                                return (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: index * 0.05,
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20
                                        }}
                                    >
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent font-mono text-sm text-zinc-600 cursor-not-allowed bg-black/20">
                                            <Icon className="w-5 h-5 opacity-50" />
                                            <span className="font-medium relative">{link.name}</span>
                                            <Lock className="w-4 h-4 ml-auto opacity-40" />
                                        </div>
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.05,
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20
                                    }}
                                >
                                    <Link
                                        href={link.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out group relative overflow-hidden font-mono text-sm ${isActive
                                            ? "text-zinc-100 bg-white/10 border border-white/10 shadow-lg shadow-white/5"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-gradient-to-r from-neon/10 to-transparent opacity-50"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-white" : "group-hover:scale-110"}`} />
                                        <span className="font-medium relative">{link.name}</span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* Wallet Section */}
                    <div className="px-4 pb-4">
                        <AnimatePresence mode="wait">
                            {isConnected && address ? (
                                <motion.div
                                    key="connected"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="space-y-2"
                                >
                                    <Link
                                        href="/plans"
                                        aria-label="Upgrade plan"
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neon/20 bg-neon/10 font-mono text-sm hover:bg-neon/20 hover:border-neon/30 transition-all duration-300"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Zap className="w-5 h-5 text-neon" />
                                        <span className="font-medium text-neon">Upgrade Plan</span>
                                    </Link>
                                    <Link
                                        href="/profile"
                                        aria-label="Open profile"
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neon/20 bg-neon/5 font-mono text-sm hover:bg-neon/10 hover:border-neon/30 transition-all duration-300"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <UserCircle className="w-5 h-5 text-neon" />
                                        <span className="font-medium text-neon">Profile</span>
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="disconnected"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    onClick={() => appKit.open()}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neon/20 bg-neon/10 hover:bg-neon/20 hover:border-neon/30 font-mono text-sm text-neon transition-all duration-300"
                                >
                                    <Wallet className="w-5 h-5" />
                                    <span className="font-medium">Connect Wallet</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Feedback Section */}
                    <div className="px-4 pb-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowFeedbackLocal(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group font-mono text-sm text-zinc-400 hover:text-white"
                        >
                            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                            <span className="font-medium">Report issue</span>
                        </motion.button>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-subtle bg-black/20">
                        <div className="text-[10px] text-amber-300 text-center font-mono uppercase tracking-[0.25em] mb-1">
                            Testnet
                        </div>
                        <div className="text-xs text-zinc-500 text-center font-mono">
                            <b>version: Alpha v0.2.1</b>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar with Animation */}
            <motion.div
                initial={false}
                animate={{ x: isOpen ? 0 : -256 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                }}
                className="md:hidden fixed inset-y-0 left-0 z-40 w-64 glass-panel"
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-subtle bg-gradient-to-r from-neon/5 to-transparent">
                        <Image src="/logo.png" alt="Cencera Logo" width={32} height={32} className="mr-3" priority />
                        <span className="text-xl font-bold tracking-tight text-white font-sans">
                            CENCERA
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            const isLocked = !isConnected && (link.name === "Dashboard" || link.name === "Settings");

                            if (isLocked) {
                                return (
                                    <div
                                        key={link.href}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent font-mono text-sm text-zinc-600 cursor-not-allowed bg-black/20"
                                    >
                                        <Icon className="w-5 h-5 opacity-50" />
                                        <span className="font-medium relative">{link.name}</span>
                                        <Lock className="w-4 h-4 ml-auto opacity-40" />
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out group relative overflow-hidden font-mono text-sm ${isActive
                                        ? "text-zinc-100 bg-white/10 border border-white/10 shadow-lg shadow-white/5"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-neon/10 to-transparent opacity-50" />
                                    )}
                                    <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-white" : "group-hover:scale-110"}`} />
                                    <span className="font-medium relative">{link.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Wallet Section */}
                    <div className="px-4 pb-4">
                            {isConnected && address ? (
                            <div className="space-y-2">
                                <Link
                                    href="/plans"
                                    aria-label="Upgrade plan"
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neon/20 bg-neon/10 font-mono text-sm hover:bg-neon/20 hover:border-neon/30 transition-all duration-300"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Zap className="w-5 h-5 text-neon" />
                                    <span className="font-medium text-neon">Upgrade Plan</span>
                                </Link>
                                <Link
                                    href="/profile"
                                    aria-label="Open profile"
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neon/20 bg-neon/5 font-mono text-sm hover:bg-neon/10 hover:border-neon/30 transition-all duration-300"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <UserCircle className="w-5 h-5 text-neon" />
                                    <span className="font-medium text-neon">Profile</span>
                                </Link>
                            </div>
                            ) : (
                            <button
                                    onClick={() => appKit.open()}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neon/20 bg-neon/10 hover:bg-neon/20 hover:border-neon/30 font-mono text-sm text-neon transition-all duration-300"
                            >
                                    <Wallet className="w-5 h-5" />
                                    <span className="font-medium">Connect Wallet</span>
                            </button>
                        )}
                    </div>

                    {/* Feedback Section */}
                    <div className="px-4 pb-4">
                        <button
                            onClick={() => setShowFeedbackLocal(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group font-mono text-sm text-zinc-400 hover:text-white"
                        >
                            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                            <span className="font-medium">Report issue</span>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-subtle bg-black/20">
                        <div className="text-xs text-zinc-500 text-center font-mono">
                            <b>version: Alpha v0.2.1</b>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Overlay for mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedback && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => { setShowFeedbackLocal(false); router.replace(pathname); }}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors duration-300"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-xl font-bold text-white mb-2 font-sans">Cencera Report</h3>
                            <p className="text-sm text-zinc-400 mb-6">Share a bug or feature request with project context.</p>

                            <div className="space-y-4">
                                <div className="flex bg-zinc-800/50 p-1 rounded-lg">
                                    {(["bug", "feature", "other"] as const).map((type) => (
                                        <motion.button
                                            key={type}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setFeedbackType(type)}
                                            className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all duration-300 ${feedbackType === type
                                                ? "bg-white text-black shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-300"
                                                }`}
                                        >
                                            {type}
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="flex bg-zinc-800/50 p-1 rounded-lg">
                                    {(["low", "medium", "high"] as const).map((level) => (
                                        <motion.button
                                            key={level}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSeverity(level)}
                                            className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all duration-300 ${severity === level
                                                ? "bg-white text-black shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-300"
                                                }`}
                                        >
                                            {level}
                                        </motion.button>
                                    ))}
                                </div>

                                <textarea
                                    className="w-full h-32 bg-zinc-800/50 border border-white/5 rounded-xl p-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none transition-all duration-300"
                                    placeholder="Describe the issue or request: screen, steps, expected behavior…"
                                value={feedbackText}
                                onChange={(e) => { setFeedbackText(e.target.value); if (reportError) setReportError(null); }}
                                />
                                {reportError && (
                                    <div className="text-xs text-red-400">{reportError}</div>
                                )}

                                {isConnected && (
                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                        <span>Attach my wallet address</span>
                                        <button
                                            onClick={() => setAttachWallet(v => !v)}
                                            className={`px-2 py-1 rounded-md border ${attachWallet ? "bg-white text-black border-white/10" : "bg-zinc-800 text-zinc-300 border-white/10"}`}
                                        >
                                            {attachWallet ? "On" : "Off"}
                                        </button>
                                    </div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    const trimmed = feedbackText.trim();
                                    if (reportStatus === "sending") return;
                                    if (trimmed.length < 3) {
                                        setReportError("Please enter at least 3 characters");
                                        return;
                                    }
                                    setReportStatus("sending");
                                    try {
                                        await api.postJson<unknown>("/report", {
                                            body: {
                                                type: feedbackType,
                                                severity,
                                                content: trimmed,
                                                address: isConnected && attachWallet && address ? address : undefined
                                            }
                                        });
                                        setReportStatus("sent");
                                        setTimeout(() => {
                                            setReportStatus("idle");
                                            setFeedbackText("");
                                            setReportError(null);
                                            setShowFeedbackLocal(false);
                                            router.replace(pathname);
                                        }, 900);
                                    } catch (e: unknown) {
                                        if (e instanceof ApiError) {
                                            let errMsg = "Unable to send. Try again.";
                                            const code = getApiErrorField(e.body, "error");
                                            if (code === "content_too_short") errMsg = "Please enter at least 3 characters";
                                            else if (code === "telegram_not_configured") errMsg = "Telegram is not configured on the server";
                                            else if (code === "telegram_failed") errMsg = getApiErrorField(e.body, "details") || "Telegram request failed";
                                            setReportError(errMsg);
                                        }
                                        setReportStatus("error");
                                        setTimeout(() => setReportStatus("idle"), 1500);
                                    }
                                }}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={feedbackText.trim().length < 3 || reportStatus === "sending"}
                                >
                                {reportStatus === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {reportStatus === "sending" ? "Sending..." : reportStatus === "sent" ? "Sent" : "Send Feedback"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
