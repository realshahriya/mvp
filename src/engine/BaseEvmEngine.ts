
import { ChainEngine, AnalysisResult } from './interface';
import { ChainData } from '@/lib/blockchain';
import { createPublicClient, http, formatEther, Chain } from 'viem';

const ERC20_ABI = [
    { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

export abstract class BaseEvmEngine implements ChainEngine {
    chainId: number;
    name: string;
    protected client;

    constructor(chain: Chain, name: string) {
        this.chainId = chain.id;
        this.name = name;
        this.client = createPublicClient({
            chain,
            transport: http()
        });
    }

    async fetchData(input: string): Promise<ChainData | null> {
        let address = input as `0x${string}`;
        let ensName: string | null = null;

        // Basic ENS resolution for Mainnet (or if applicable)
        if (this.chainId === 1 && !input.startsWith('0x')) {
            try {
                const resolved = await this.client.getEnsAddress({ name: input });
                if (resolved) {
                    address = resolved;
                    ensName = input;
                } else {
                    return null;
                }
            } catch {
                if (input.endsWith('.eth')) {
                    // Fallback mock for demo if ENS fails
                    console.warn("ENS fail mock");
                }
                return null;
            }
        }

        if (!address.startsWith('0x')) return null;

        try {
            const [balance, txCount, code] = await Promise.all([
                this.client.getBalance({ address }),
                this.client.getTransactionCount({ address }),
                this.client.getBytecode({ address })
            ]);

            const isContract = code !== undefined && code.length > 2;
            let tokenMetadata;

            if (isContract) {
                // Try fetching token data
                try {
                    const [name, symbol, decimals, totalSupply] = await Promise.all([
                        this.client.readContract({ address, abi: ERC20_ABI, functionName: 'name' }).catch(() => undefined),
                        this.client.readContract({ address, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => undefined),
                        this.client.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => undefined),
                        this.client.readContract({ address, abi: ERC20_ABI, functionName: 'totalSupply' }).catch(() => undefined),
                    ]);

                    if (name || symbol) {
                        tokenMetadata = {
                            name: name as string,
                            symbol: symbol as string,
                            decimals: decimals as number,
                            totalSupply: totalSupply ? formatEther(totalSupply as bigint) : undefined
                        };
                    }
                } catch { }
            }

            return {
                address,
                ensName,
                balance: formatEther(balance),
                txCount,
                isContract,
                codeSize: code ? code.length : 0,
                tokenMetadata
            };

        } catch (error) {
            console.error(`Error fetching data on ${this.name}:`, error);
            return null;
        }
    }

    async analyze(address: string): Promise<AnalysisResult> {
        const data = await this.fetchData(address);
        if (!data) throw new Error("Entity not found");

        let score = 50; // Base score
        const flags: string[] = [];

        // 1. Transaction Activity
        if (data.txCount > 500) {
            score += 20;
            flags.push("High Activity");
        } else if (data.txCount < 5) {
            score -= 10;
            flags.push("Low Activity");
        }

        // 2. Balance
        const bal = parseFloat(data.balance);
        if (bal > 1.0) {
            score += 15;
            flags.push("Significant Balance");
        } else if (bal === 0) {
            score -= 5;
        }

        // 3. Contract Verification
        if (data.isContract) {
            score -= 10; // Unknown contracts are risky by default
            if (data.tokenMetadata) {
                score += 30; // It's a token, likely safer
                flags.push("Token Contract");
            } else {
                flags.push("Unverified Contract");
            }
        } else {
            // EOA
            score += 10;
        }

        // Normalize
        score = Math.min(100, Math.max(0, score));

        let riskLevel: AnalysisResult['riskLevel'] = 'Caution';
        if (score >= 80) riskLevel = 'Safe';
        if (score < 40) riskLevel = 'High Risk';

        return {
            score,
            riskLevel,
            details: data,
            flags
        };
    }
}
