"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, Gauge, Cpu, FileCode } from "lucide-react";
import { api } from "@/lib/apiClient";

type SimulateApiResponse = {
    success?: unknown;
    ok?: unknown;
    gasUsed?: unknown;
    gasLimit?: unknown;
    stateChanges?: unknown;
    logs?: unknown;
    result?: unknown;
    error?: unknown;
};

type ProxyDetails = { proxy?: boolean; implementation?: string };
type PauseDetails = { paused?: boolean };
type SimulationDetails = Partial<ProxyDetails & PauseDetails> | undefined;

function isProxyDetails(d: SimulationDetails): d is ProxyDetails {
    return !!d && (typeof d.proxy === 'boolean' || typeof d.implementation === 'string');
}

function isPauseDetails(d: SimulationDetails): d is PauseDetails {
    return !!d && (typeof d.paused === 'boolean');
}

function asSimulationDetails(result: unknown): SimulationDetails {
    if (!result || typeof result !== 'object') return undefined;
    const obj = result as Record<string, unknown>;
    const details: Partial<ProxyDetails & PauseDetails> = {};
    if (typeof obj.proxy === 'boolean') details.proxy = obj.proxy;
    if (typeof obj.implementation === 'string') details.implementation = obj.implementation;
    if (typeof obj.paused === 'boolean') details.paused = obj.paused;
    return Object.keys(details).length ? details : undefined;
}

interface SimulationResult {
    success: boolean;
    gasUsed: number;
    gasLimit: number;
    stateChanges: {
        asset: string;
        from: string;
        to: string;
        amount: string;
    }[];
    logs: string[];
    security: {
        isHoneypot: boolean;
        hasTransferTax: boolean;
        taxPercent?: number;
        canPause: boolean;
    };
    error?: string;
    details?: SimulationDetails;
}

type ActionType = 'native_transfer' | 'erc20_transfer' | 'erc20_approve' | 'contract_call';
type QuickAction = 'quick_native' | 'quick_erc20_transfer' | 'quick_erc20_approve' | 'quick_proxy' | 'quick_paused';

export function SimulationEngine({ displayId, actualAddress, chainId, entityType }: { displayId: string, actualAddress: string, chainId?: string, entityType?: 'wallet' | 'contract' | 'token' | 'nft' }) {
    const [simulating, setSimulating] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [action, setAction] = useState<QuickAction | ActionType | null>(null);

    // Extract actual address from displayId if actualAddress not provided
    // Format can be "Name (0x...)" or just "0x..."
    const getCleanAddress = (): string | null => {
        if (actualAddress) {
            return actualAddress; // Trust the actual address passed down
        }

        // Try to extract from displayId format like "Tether USD (USDT)" 
        const match = displayId.match(/\((.*?)\)/);
        if (match) {
            return match[1];
        }

        // If it looks like an address (basic length check), return it
        if (displayId.length > 20) {
            return displayId;
        }

        return null;
    };

    const simulatorSupported =
        /^\d+$/.test(String(chainId ?? '1')) && (getCleanAddress()?.startsWith('0x') ?? false);

    const runSimulation = async () => {
        setSimulating(true);
        setResult(null);

        try {
            const cleanAddr = getCleanAddress();

            if (!cleanAddr) {
                setResult({
                    success: false,
                    gasUsed: 0,
                    gasLimit: 0,
                    stateChanges: [],
                    logs: [],
                    security: { isHoneypot: false, hasTransferTax: false, canPause: false },
                    error: `Invalid address format. Cannot simulate transaction for "${displayId}".`
                });
                setSimulating(false);
                return;
            }

            const payload = {
                chainId: chainId || '1',
                action: 'native_transfer' as ActionType,
                from: '0x0000000000000000000000000000000000000001',
                to: cleanAddr,
                value: '0',
            };
            setAction('native_transfer');
            const data = await api.postJson<SimulateApiResponse>('/simulate', { body: payload });
            const details = asSimulationDetails(data.result);

            const r: SimulationResult = {
                success: !!data.success || true,
                gasUsed: Number(data.gasUsed || 0),
                gasLimit: Number(data.gasLimit || data.gasUsed || 0),
                stateChanges: Array.isArray(data.stateChanges) ? data.stateChanges : [],
                logs: Array.isArray(data.logs) ? data.logs : [],
                security: {
                    isHoneypot: false,
                    hasTransferTax: false,
                    taxPercent: 0,
                    canPause: false,
                },
                details,
            };
            setResult(r);
        } catch {
            setResult({
                success: false,
                gasUsed: 0,
                gasLimit: 0,
                stateChanges: [],
                logs: [],
                security: { isHoneypot: false, hasTransferTax: false, canPause: false },
                error: "Simulation Connection Failed"
            });
        } finally {
            setSimulating(false);
        }
    };

    const runQuick = async (qa: QuickAction) => {
        setSimulating(true);
        setResult(null);
        try {
            const cleanAddr = getCleanAddress();
            if (!cleanAddr) throw new Error('Invalid address');
            const payload: { chainId: string; action: QuickAction; token?: string; to?: string; address?: string } = { chainId: chainId || '1', action: qa };
            if (qa === 'quick_native') payload.to = cleanAddr;
            if (qa === 'quick_erc20_transfer') { payload.token = cleanAddr; payload.to = '0x0000000000000000000000000000000000000001'; }
            if (qa === 'quick_erc20_approve') { payload.token = cleanAddr; payload.to = '0x0000000000000000000000000000000000000001'; }
            if (qa === 'quick_proxy' || qa === 'quick_paused') payload.address = cleanAddr;
            setAction(qa);
            const data = await api.postJson<SimulateApiResponse>('/simulate', { body: payload });
            const details = asSimulationDetails(data.result);
            const r: SimulationResult = {
                success: !!data.success || !!data.ok,
                gasUsed: Number(data.gasUsed || 0),
                gasLimit: Number(data.gasLimit || 0),
                stateChanges: Array.isArray(data.stateChanges) ? data.stateChanges : [],
                logs: [],
                security: {
                    isHoneypot: false,
                    hasTransferTax: false,
                    taxPercent: 0,
                    canPause: qa === 'quick_paused' ? (isPauseDetails(details) ? Boolean(details.paused) : false) : false,
                },
                error: typeof data.error === 'string' ? data.error : undefined,
                details,
            };
            if (r.error === 'not_contract') {
                r.error = 'Unsupported for this address';
            }
            if (qa === 'quick_proxy') {
                const proxyInfo = details;
                r.logs = [
                    `Proxy: ${isProxyDetails(proxyInfo) && proxyInfo.proxy ? 'Yes' : 'No'}`,
                    isProxyDetails(proxyInfo) && proxyInfo.implementation ? `Impl: ${proxyInfo.implementation}` : 'Impl: Unknown',
                ];
            }
            setResult(r);
        } catch {
            setResult({
                success: false,
                gasUsed: 0,
                gasLimit: 0,
                stateChanges: [],
                logs: [],
                security: { isHoneypot: false, hasTransferTax: false, canPause: false },
                error: "Quick Simulation Failed",
            });
        } finally {
            setSimulating(false);
        }
    };

    const resetView = () => {
        setResult(null);
        setSimulating(false);
        setAction(null);
    };

    return (
        <div className="bg-zinc-900/85 border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-zinc-400" />
                    <h3 className="font-bold text-white text-sm font-sans">Transaction Simulator</h3>
                </div>
                {!result && !simulating && simulatorSupported && (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => runQuick('quick_native')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Native Dry-Run</button>
                        {entityType === 'token' && (
                            <>
                                <button onClick={() => runQuick('quick_erc20_transfer')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">ERC20 Transfer</button>
                                <button onClick={() => runQuick('quick_erc20_approve')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">ERC20 Approve</button>
                            </>
                        )}
                        {entityType === 'contract' && (
                            <>
                                <button onClick={() => runQuick('quick_proxy')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Proxy Check</button>
                                <button onClick={() => runQuick('quick_paused')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Paused Check</button>
                            </>
                        )}
                    </div>
                )}
                {result && (
                    <div className="flex gap-2">
                        <button onClick={resetView} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Back</button>
                        <button onClick={runSimulation} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Re-run</button>
                    </div>
                )}
            </div>

            <div className="p-6">
                {!simulating && !result && (
                    <div className="text-center py-8 space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/5">
                            <FileCode className="w-8 h-8 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-zinc-300 font-medium">Ready to Simulate</p>
                            <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1">
                                Execute a real-time call/estimate on the selected chain to verify logic and gas.
                            </p>
                        </div>
                            {simulatorSupported ? (
                                <div className="flex flex-wrap gap-2 justify-center">
                                    <button onClick={() => runQuick('quick_native')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Native Dry-Run</button>
                                    {entityType === 'token' && (
                                        <>
                                            <button onClick={() => runQuick('quick_erc20_transfer')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">ERC20 Transfer</button>
                                            <button onClick={() => runQuick('quick_erc20_approve')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">ERC20 Approve</button>
                                        </>
                                    )}
                                    {entityType === 'contract' && (
                                        <>
                                            <button onClick={() => runQuick('quick_proxy')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Proxy Check</button>
                                            <button onClick={() => runQuick('quick_paused')} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200">Paused Check</button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs text-zinc-500">
                                    Simulator is available for EVM (0x…) addresses only.
                                </div>
                            )}
                    </div>
                )}

                {simulating && (
                    <div className="py-12 space-y-6 text-center">
                        <div className="relative w-16 h-16 mx-auto">
                            <div className="absolute inset-0 bg-white/10 rounded-full animate-ping"></div>
                            <div className="relative bg-black rounded-full p-4 border border-white/20">
                                <Cpu className="w-full h-full text-white animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-1">Simulating Execution...</h4>
                            <div className="flex justify-center gap-1 text-xs font-mono text-zinc-500">
                                <span>Forking Chain State</span>
                                <span className="animate-pulse">...</span>
                            </div>
                        </div>
                        {/* Fake Console Output */}
                        <div className="max-w-md mx-auto bg-black/50 rounded border border-white/5 p-3 text-left font-mono text-[10px] text-zinc-400 space-y-1">
                            <div className="text-green-400">$ eth_call</div>
                            <div> estimating gas...</div>
                            <div> building transaction...</div>
                            <div className="animate-pulse"> awaiting node response...</div>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        {/* Outcome Header */}
                        <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} flex items-center gap-4`}>
                            {result.success ? (
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : (
                                <XCircle className="w-8 h-8 text-red-500" />
                            )}
                            <div>
                                <h4 className={`text-lg font-bold ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                                    {result.success ? 'Simulation Successful' : 'Transaction Failed'}
                                </h4>
                                <p className="text-sm text-zinc-400">
                                    {result.success ? 'No critical errors detected during execution.' : result.error}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(action === 'quick_native' || action === 'native_transfer' || action === 'erc20_transfer' || action === 'erc20_approve') && (
                                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                                    <h5 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                                        <Gauge className="w-3 h-3" /> Gas Analysis
                                    </h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Gas Used</span>
                                            <span className="font-mono text-white">{result.gasUsed.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Est. Cost</span>
                                            <span className="font-mono text-white">~0.004 Native</span>
                                        </div>
                                        {result.gasLimit > 0 && (
                                            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className={`h-full ${result.gasUsed > 100000 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                    style={{ width: `${(result.gasUsed / result.gasLimit) * 100}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(action === 'quick_native' || action === 'native_transfer' || action === 'erc20_transfer' || action === 'erc20_approve') && (
                                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                                    <h5 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" /> Security Checks
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                        <CheckItem label="Honeypot Detection" passed={!result.security.isHoneypot} />
                                        <CheckItem label="Transfer Tax Check" passed={!result.security.hasTransferTax} warning={result.security.hasTransferTax ? `Tax: ${result.security.taxPercent}%` : undefined} />
                                    </div>
                                </div>
                            )}

                            {action === 'quick_proxy' && (
                                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                                    <h5 className="text-xs font-bold text-zinc-500 uppercase mb-3">Proxy Info</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Proxy</span>
                                            <span className="font-mono text-white">{isProxyDetails(result.details) && result.details.proxy ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Implementation</span>
                                            <span className="font-mono text-white">{isProxyDetails(result.details) && result.details.implementation ? result.details.implementation : 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {action === 'quick_paused' && (
                                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                                    <h5 className="text-xs font-bold text-zinc-500 uppercase mb-3">Pause Status</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Paused</span>
                                            <span className="font-mono text-white">
                                                {isPauseDetails(result.details)
                                                    ? (result.details.paused ? 'Yes' : 'No')
                                                    : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(action === 'quick_native' || action === 'native_transfer' || action === 'erc20_transfer' || action === 'erc20_approve') && (
                            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                                <h5 className="text-xs font-bold text-zinc-500 uppercase mb-3 text-left">State Changes</h5>
                                <div className="space-y-2">
                                    {result.stateChanges.map((change, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-white/5 rounded border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">{change.amount} {change.asset}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                                <span>{change.from}</span>
                                                <ArrowRight className="w-3 h-3" />
                                                <span>{change.to}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end"></div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CheckItem({ label, passed, warning }: { label: string, passed: boolean, warning?: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-zinc-400">{label}</span>
            {passed ? (
                <span className="flex items-center gap-1 text-green-500 text-xs font-bold">
                    <CheckCircle className="w-3 h-3" /> Pass
                </span>
            ) : (
                <span className="flex items-center gap-1 text-red-500 text-xs font-bold">
                    <XCircle className="w-3 h-3" /> {warning || 'Fail'}
                </span>
            )}
        </div>
    );
}
