"use client";

import Link from "next/link";
import { Shield, Wallet } from "lucide-react";
import { useCallback, useState } from "react";
import { useAccount, useChainId } from 'wagmi';
import { appKit } from '@/lib/walletConfig';

const DEFAULT_CHAIN_STORAGE_KEY = "cencera_default_chain";
const DEFAULT_TESTNET_CHAIN = "11155111";
type ChainOption = { value: string; label: string; disabled?: boolean };
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
];
const ENABLED_CHAIN_VALUES = new Set(CHAINS.filter((c) => !c.disabled).map((c) => c.value));

export default function SettingsPage() {
    const { isConnected } = useAccount();
    const connectedChainId = useChainId();

    const [defaultChain, setDefaultChain] = useState(() => {
        if (typeof window === "undefined") return DEFAULT_TESTNET_CHAIN;
        const stored = window.localStorage.getItem(DEFAULT_CHAIN_STORAGE_KEY);
        if (!stored || !stored.trim()) return DEFAULT_TESTNET_CHAIN;
        return ENABLED_CHAIN_VALUES.has(stored) ? stored : DEFAULT_TESTNET_CHAIN;
    });

    const setAndPersistChain = useCallback((value: string) => {
        if (!ENABLED_CHAIN_VALUES.has(value)) return;
        setDefaultChain(value);
        try {
            window.localStorage.setItem(DEFAULT_CHAIN_STORAGE_KEY, value);
        } catch {
        }
    }, []);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-2">
                    <Shield className="w-10 h-10 text-neon" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-[#E6E6E6] font-sans">Connect Wallet</h1>
                    <p className="text-[#B0B0B0] text-sm">
                        You need to connect your wallet to manage your settings, API keys, and account preferences securely.
                    </p>
                </div>
                <button
                    onClick={() => appKit.open()}
                    className="flex items-center gap-2 px-6 py-3 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 rounded-xl text-neon font-mono font-bold transition-all"
                >
                    <Wallet className="w-5 h-5" />
                    Connect Access
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-[#E6E6E6] mb-2 font-sans">Settings</h1>
                <p className="text-[#B0B0B0] text-sm">Account settings</p>
            </div>

            <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                <div className="text-sm font-medium text-[#E6E6E6] mb-1">API keys</div>
                <div className="text-xs text-[#B0B0B0] mb-4">API key management moved to the Dashboard.</div>
                <Link
                    href="/dashboard#api-keys"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 rounded-lg text-neon text-sm font-medium transition-all"
                >
                    Go to Dashboard
                </Link>
            </div>

            <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-4">
                <div>
                    <div className="text-sm font-medium text-[#E6E6E6] mb-1">Web3 preferences</div>
                    <div className="text-xs text-[#B0B0B0]">Controls the default chain used for analysis and search.</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="text-xs text-[#B0B0B0]">Connected network</div>
                        <div className="text-sm text-[#E6E6E6]">
                            {CHAINS.find((c) => c.value === String(connectedChainId))?.label ?? `Chain ${connectedChainId}`}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs text-[#B0B0B0]">Default analysis chain</div>
                        <div className="flex items-center gap-3">
                            <select
                                value={defaultChain}
                                onChange={(e) => setAndPersistChain(e.target.value)}
                                className="flex-1 bg-[#161616]/80 border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#E6E6E6] focus:outline-none focus:ring-1 focus:ring-neon/30"
                            >
                                {CHAINS.map((c) => (
                                    <option key={c.value} value={c.value} disabled={Boolean(c.disabled)}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => setAndPersistChain(String(connectedChainId))}
                                className="px-3 py-2 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 rounded-lg text-neon text-sm font-medium transition-all"
                            >
                                Use connected
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
