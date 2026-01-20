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
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const CHAINS = useMemo(
        () => [
            { value: '1', label: 'Ethereum' },
            { value: '10', label: 'Optimism' },
            { value: '56', label: 'BNB Smart Chain' },
            { value: '137', label: 'Polygon' },
            { value: '250', label: 'Fantom' },
            { value: '324', label: 'zkSync Era' },
            { value: '8453', label: 'Base' },
            { value: '42161', label: 'Arbitrum One' },
            { value: '43114', label: 'Avalanche' },
            { value: 'bitcoin', label: 'Bitcoin' },
            { value: 'stacks', label: 'Stacks' },
            { value: '30', label: 'Rootstock (RSK)' },
            { value: 'lightning', label: 'Lightning (Coming Soon)', disabled: true },
            { value: 'liquid', label: 'Liquid (Coming Soon)', disabled: true },
            { value: 'solana', label: 'Solana' },
            { value: 'sui', label: 'Sui' },
            { value: 'aptos', label: 'Aptos' },
            { value: 'ton', label: 'The Open Network' },
            { value: 'cosmos', label: 'Cosmos Hub (Coming Soon)', disabled: true },
            { value: 'polkadot', label: 'Polkadot (Coming Soon)', disabled: true }
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
        <form onSubmit={handleSubmit} className={twMerge("relative group w-full", className)}>
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
    );
}
