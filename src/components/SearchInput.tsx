"use client";

import { Search, ArrowRight, Loader2, ChevronDown, Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'framer-motion';

export function SearchInput({
    className,
    placeholder = "Enter wallet address to test API...",
    onSearch,
    compact = false
}: {
    className?: string;
    placeholder?: string;
    onSearch?: (term: string) => void;
    compact?: boolean;
}) {
    const router = useRouter();
    const [term, setTerm] = useState('');
    const [chain, setChain] = useState('1');
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [sentiment, setSentiment] = useState<{
        fetchedAt: string;
        hashtagTotals: Array<{ bucket: string; count: number }>;
        hashtagFrequency: Record<string, number>;
        sentimentPercentages: { positive: number; neutral: number; negative: number };
        engagementTotals: { likes: number; retweets: number; replies: number; quotes: number };
        engagementTrend: Array<{ bucket: string; likes: number; retweets: number; replies: number; quotes: number; count: number }>;
        topInfluentialPosts: Array<{
            id: string;
            text: string;
            author: string;
            influenceScore: number;
            metrics: { likes: number; retweets: number; replies: number; quotes: number };
            createdAt?: string;
            url?: string;
        }>;
        baselineComparison: {
            hashtagAvg: number;
            engagementAvg: number;
            sentimentAvg: { positive: number; neutral: number; negative: number };
            deltas: {
                hashtagDelta: number;
                engagementDelta: number;
                sentimentDelta: { positive: number; neutral: number; negative: number };
            };
        };
    } | null>(null);
    const [sentimentLoading, setSentimentLoading] = useState(false);
    const [sentimentError, setSentimentError] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const CHAINS = useMemo(
        () => [
            { value: '1', label: 'Ethereum' },
            { value: '10', label: 'Optimism (Coming Soon)', disabled: true },
            { value: '56', label: 'BNB Smart Chain (Coming Soon)', disabled: true },
            { value: '137', label: 'Polygon (Coming Soon)', disabled: true },
            { value: '250', label: 'Fantom (Coming Soon)', disabled: true },
            { value: '324', label: 'zkSync Era (Coming Soon)', disabled: true },
            { value: '8453', label: 'Base (Coming Soon)', disabled: true },
            { value: '42161', label: 'Arbitrum One (Coming Soon)', disabled: true },
            { value: '43114', label: 'Avalanche (Coming Soon)', disabled: true },
            { value: 'bitcoin', label: 'Bitcoin (Coming Soon)', disabled: true },
            { value: 'stacks', label: 'Stacks (Coming Soon)', disabled: true },
            { value: '30', label: 'Rootstock (RSK) (Coming Soon)', disabled: true },
            { value: 'solana', label: 'Solana (Coming Soon)', disabled: true },
            { value: 'sui', label: 'Sui (Coming Soon)', disabled: true },
            { value: 'aptos', label: 'Aptos (Coming Soon)', disabled: true },
            { value: 'ton', label: 'The Open Network (Coming Soon)', disabled: true },
            { value: 'cosmos', label: 'Cosmos Hub (Coming Soon)', disabled: true },
            { value: 'polkadot', label: 'Polkadot (Coming Soon)', disabled: true },
            { value: 'lightning', label: 'Lightning (Coming Soon)', disabled: true },
            { value: 'liquid', label: 'Liquid (Coming Soon)', disabled: true },
            { value: 'near', label: 'Near Protocol (Coming Soon)', disabled: true },
        ],
        []
    );

    useEffect(() => {
        const handler = (e: MouseEvent | PointerEvent) => {
            if (!dropdownRef.current) return;
            if (!dropdownRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', handler);
        return () => document.removeEventListener('pointerdown', handler);
    }, []);

    useEffect(() => {
        if (compact) return;
        const trimmed = term.trim();
        if (!trimmed) return;
        const interval = setInterval(() => {
            setRefreshTick((v) => v + 1);
        }, 30_000);
        return () => clearInterval(interval);
    }, [term, compact]);

    useEffect(() => {
        if (compact) return;
        const trimmed = term.trim();
        if (!trimmed || trimmed.length < 2) {
            setSentiment(null);
            setSentimentError(null);
            return;
        }
        const controller = new AbortController();
        let active = true;
        setSentimentLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/x-sentiment?q=${encodeURIComponent(trimmed)}&chain=${encodeURIComponent(chain)}`, { signal: controller.signal });
                if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    const message = String(errJson?.details || errJson?.error || 'Sentiment fetch failed');
                    throw new Error(message);
                }
                const data = await res.json();
                if (active) {
                    setSentiment(data);
                    setSentimentError(null);
                }
            } catch (e: unknown) {
                if (!active) return;
                if ((e as { name?: string }).name === 'AbortError') return;
                const msg = e instanceof Error ? e.message : String(e);
                setSentimentError(msg);
            } finally {
                if (active) setSentimentLoading(false);
            }
        }, 600);
        return () => {
            active = false;
            clearTimeout(timer);
            controller.abort();
        };
    }, [term, chain, compact, refreshTick]);

    const selectedLabel = useMemo(
        () => CHAINS.find((c) => c.value === chain)?.label ?? 'Select Chain',
        [chain, CHAINS]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!term.trim()) return;
        setIsLoading(true);
        if (onSearch) {
            onSearch(term);
        } else {
            setTimeout(() => {
                router.push(`/analysis?q=${encodeURIComponent(term)}&chain=${chain}`);
                setIsLoading(false);
            }, 500);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            setOpen(true);
            e.preventDefault();
            return;
        }
        if (!open) return;
        if (e.key === 'Escape') {
            setOpen(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => {
                let next = i + 1;
                while (next < CHAINS.length && CHAINS[next].disabled) next++;
                return Math.min(next, CHAINS.length - 1);
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => {
                let prev = i - 1;
                while (prev >= 0 && CHAINS[prev].disabled) prev--;
                return Math.max(prev, 0);
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const opt = CHAINS[activeIndex];
            if (!opt.disabled) {
                setChain(opt.value);
                setOpen(false);
            }
        }
    };

    return (
        <div className={twMerge("w-full space-y-4", className)}>
            <form onSubmit={handleSubmit} className="relative group w-full">
                {!compact && <div className="absolute -inset-0.5 bg-gradient-to-r from-neon/40 via-neon/15 to-transparent rounded-lg blur opacity-40 group-focus-within:opacity-75 transition duration-500"></div>}
                <div className={twMerge(
                    "relative flex flex-wrap items-stretch sm:items-center bg-surface rounded-lg border border-[#2A2A2A] ring-1 ring-[#2A2A2A] group-focus-within:ring-neon/40",
                    compact ? "py-0 bg-transparent border-transparent ring-0" : ""
                )}>
                {!compact && (
                    <div ref={dropdownRef} className="relative pl-2 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-[#2A2A2A]">
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            onKeyDown={onKeyDown}
                            className="flex items-center justify-between gap-2 bg-transparent text-sm font-medium text-[#C7C7C7] focus:outline-none py-3 md:py-4 px-2 w-full sm:w-[180px] truncate hover:text-[#E6E6E6]"
                            aria-haspopup="listbox"
                            aria-expanded={open}
                        >
                            <span className="truncate">{selectedLabel}</span>
                            <ChevronDown className={twMerge("w-4 h-4 transition-transform", open ? "rotate-180" : "")} />
                        </button>
                        <AnimatePresence>
                            {open && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                    className="absolute left-2 right-2 sm:left-0 sm:right-0 top-full z-50 mt-2"
                                >
                                    <div className="rounded-lg border border-[#2A2A2A] bg-[#161616]/90 backdrop-blur-sm shadow-xl">
                                        <ul role="listbox" className="max-h-72 overflow-auto py-1 overscroll-contain">
                                            {CHAINS.map((c, i) => {
                                                const isActive = i === activeIndex;
                                                const isSelected = c.value === chain;
                                                const baseClasses = c.disabled
                                                    ? "text-[#8A8A8A] cursor-not-allowed"
                                                    : "text-[#C7C7C7] hover:text-[#E6E6E6] hover:bg-white/5 cursor-pointer";
                                                return (
                                                    <li
                                                        key={c.value}
                                                        role="option"
                                                        aria-selected={isSelected}
                                                        className={twMerge("flex items-center justify-between px-3 py-3 sm:py-2 text-sm", baseClasses, isActive && !c.disabled ? "bg-white/5" : "")}
                                                        onMouseEnter={() => !c.disabled && setActiveIndex(i)}
                                                        onTouchStart={() => !c.disabled && setActiveIndex(i)}
                                                        onClick={() => {
                                                            if (c.disabled) return;
                                                            setChain(c.value);
                                                            setActiveIndex(i);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <span className="truncate">{c.label}</span>
                                                        {isSelected && <Check className="w-4 h-4 text-neon" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
                    <div className={twMerge("pl-1 text-[#B0B0B0] flex-shrink-0", compact ? "pl-2" : "")}>
                        <Search className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <input
                        type="text"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className={twMerge(
                            "flex-1 min-w-0 bg-transparent border-none text-[#E6E6E6] placeholder-[#8A8A8A] focus:outline-none focus:ring-0",
                            compact ? "py-2 px-2 text-sm" : "py-3 px-3 text-base md:py-4 md:px-4 md:text-lg"
                        )}
                        placeholder={placeholder}
                    />
                </div>
                {!compact && (
                    <button
                        type="submit"
                        disabled={!term.trim() || isLoading}
                        className="w-full sm:w-auto mt-2 sm:mt-0 mr-0 sm:mr-2 p-3 sm:p-2 rounded-md bg-white/5 hover:bg-white/10 text-[#E6E6E6] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5 text-neon" />
                        )}
                    </button>
                )}
                </div>
            </form>
            {!compact && term.trim() && (
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#B0B0B0]">
                        <span>Social Sentiment (X)</span>
                        <span>{sentimentLoading ? 'Updating...' : sentiment?.fetchedAt ? new Date(sentiment.fetchedAt).toLocaleTimeString() : 'Idle'}</span>
                    </div>
                    {sentimentError && (
                        <div className="text-xs text-neon">{sentimentError}</div>
                    )}
                    {sentiment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-[#E6E6E6]">Hashtag volume</div>
                                    <div className="text-xs text-[#B0B0B0]">
                                        Total {sentiment.hashtagTotals.reduce((sum, h) => sum + h.count, 0)} • Baseline {sentiment.baselineComparison.hashtagAvg} • Δ {sentiment.baselineComparison.deltas.hashtagDelta}
                                    </div>
                                    <div className="space-y-1 text-xs text-[#B0B0B0]">
                                        {sentiment.hashtagTotals.slice(-4).map((h) => (
                                            <div key={h.bucket} className="flex items-center justify-between">
                                                <span>{h.bucket}</span>
                                                <span>{h.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-[#E6E6E6]">Sentiment split</div>
                                    <div className="text-xs text-[#B0B0B0]">
                                        Positive {sentiment.sentimentPercentages.positive}% • Neutral {sentiment.sentimentPercentages.neutral}% • Negative {sentiment.sentimentPercentages.negative}%
                                    </div>
                                    <div className="text-xs text-[#B0B0B0]">
                                        Baseline {sentiment.baselineComparison.sentimentAvg.positive}% / {sentiment.baselineComparison.sentimentAvg.neutral}% / {sentiment.baselineComparison.sentimentAvg.negative}%
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-[#E6E6E6]">Engagement trend</div>
                                <div className="text-xs text-[#B0B0B0]">
                                    Likes {sentiment.engagementTotals.likes} • Retweets {sentiment.engagementTotals.retweets} • Replies {sentiment.engagementTotals.replies}
                                </div>
                                <div className="space-y-1 text-xs text-[#B0B0B0]">
                                    {sentiment.engagementTrend.slice(-4).map((e) => (
                                        <div key={e.bucket} className="flex items-center justify-between">
                                            <span>{e.bucket}</span>
                                            <span>{e.likes + e.retweets + e.replies + e.quotes}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-[#E6E6E6]">Top influential posts</div>
                                <div className="space-y-2">
                                    {sentiment.topInfluentialPosts.slice(0, 3).map((post) => (
                                        <a
                                            key={post.id}
                                            href={post.url || '#'}
                                            target={post.url ? '_blank' : undefined}
                                            rel={post.url ? 'noreferrer' : undefined}
                                            className="block text-xs text-[#B0B0B0] border border-[#2A2A2A] rounded-lg px-3 py-2 hover:border-neon/30 hover:bg-white/5 transition-all"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="truncate">{post.author}</span>
                                                <span>Influence {post.influenceScore}</span>
                                            </div>
                                            <div className="mt-1 line-clamp-2">{post.text}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
