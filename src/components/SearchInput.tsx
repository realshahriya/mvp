"use client";

import { Search, ArrowRight, Loader2, ChevronDown, Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'framer-motion';
import { appKit } from '@/lib/walletConfig';

const DEFAULT_CHAIN_STORAGE_KEY = "cencera_default_chain";
const DEFAULT_TESTNET_CHAIN = "11155111";
type ChainOption = { value: string; label: string; disabled?: boolean };
type DropdownPosition = { top: number; left: number; width: number };
const CHAINS: ChainOption[] = [
    { value: '11155111', label: 'Ethereum Sepolia' },
    { value: '97', label: 'BNB Testnet' },
    { value: '421614', label: 'Arbitrum Sepolia' },
    { value: '11155420', label: 'Optimism Sepolia' },
    { value: '84532', label: 'Base Sepolia' },
    { value: '80002', label: 'Polygon Amoy' },
    { value: '43113', label: 'Avalanche Fuji' },
    { value: '4002', label: 'Fantom Testnet' },
    { value: '300', label: 'zkSync Sepolia Testnet' },
    { value: '31', label: 'Rootstock Testnet' },
    { value: 'coming_soon', label: 'Coming Soon', disabled: true },
];
const ENABLED_CHAIN_VALUES = new Set(CHAINS.filter((c) => !c.disabled).map((c) => c.value));

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
    const { address, isConnected } = useAccount();
    const [term, setTerm] = useState('');
    const [chain, setChain] = useState(DEFAULT_TESTNET_CHAIN);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const didInitRef = useRef(false);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(DEFAULT_CHAIN_STORAGE_KEY);
            if (stored && stored.trim() && ENABLED_CHAIN_VALUES.has(stored)) {
                setChain(stored);
                const idx = CHAINS.findIndex((c) => c.value === stored);
                if (idx >= 0) setActiveIndex(idx);
            }
        } catch {
        } finally {
            didInitRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (!didInitRef.current) return;
        try {
            window.localStorage.setItem(DEFAULT_CHAIN_STORAGE_KEY, chain);
        } catch {
        }
    }, [chain]);

    useEffect(() => {
        const handler = (e: MouseEvent | PointerEvent) => {
            const target = e.target as Node;
            if (buttonRef.current && buttonRef.current.contains(target)) return;
            if (menuRef.current && menuRef.current.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener('pointerdown', handler);
        return () => document.removeEventListener('pointerdown', handler);
    }, []);

    useEffect(() => {
        if (!open) {
            setDropdownPosition(null);
            return;
        }
        const updatePosition = () => {
            if (!buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth || 0;
            const padding = 16;
            const left = Math.max(padding, rect.left);
            const right = Math.min(viewportWidth - padding, rect.right);
            const width = right - left;
            setDropdownPosition({
                top: rect.bottom + 8,
                left,
                width: width > 0 ? width : rect.width,
            });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    const selectedLabel = useMemo(
        () => CHAINS.find((c) => c.value === chain)?.label ?? 'Select Chain',
        [chain]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!term.trim()) return;
        if (!isConnected || !address) {
            setShowConnectModal(true);
            return;
        }
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
                        <div className="relative pl-2 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-[#2A2A2A]">
                            <button
                                type="button"
                                ref={buttonRef}
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
                                {open && dropdownPosition && (
                                    <motion.div
                                        ref={menuRef}
                                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.16, ease: "easeOut" }}
                                        className="fixed z-50"
                                        style={{
                                            top: dropdownPosition.top,
                                            left: dropdownPosition.left,
                                            width: dropdownPosition.width,
                                        }}
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
            {showConnectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1A1A1A] border border-neon/20 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
                        <p className="text-sm text-[#B0B0B0] mb-4">
                            Connect your wallet to run trust analysis. Searches use credits.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    appKit.open();
                                    setShowConnectModal(false);
                                }}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-neon/20 bg-neon/10 hover:bg-neon/20 text-neon text-sm font-medium transition-colors"
                            >
                                Connect Wallet
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConnectModal(false)}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[#2A2A2A] bg-[#1F1F1F] hover:bg-[#262626] text-[#E6E6E6] text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
