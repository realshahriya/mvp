import type { ChainEngine, AnalysisResult } from './interface';
import type { ChainData } from '@/lib/blockchain';

export class NonEvmEngine implements ChainEngine {
    chainId: number;
    name: string;
    nativeSymbol?: string;
    chainKey: string;

    constructor(chainKey: string, name: string, nativeSymbol: string) {
        this.chainId = 0;
        this.name = name;
        this.chainKey = chainKey;
        this.nativeSymbol = nativeSymbol;
    }

    async fetchData(_input: string): Promise<ChainData | null> {
        void _input;
        return null;
    }

    async analyze(address: string): Promise<AnalysisResult> {
        const data = await this.fetchData(address);
        if (!data) throw new Error('Entity not found');

        let score = 50;
        const flags: string[] = [];

        if (data.txCount > 500) {
            score += 20;
            flags.push('High Activity');
        } else if (data.txCount < 5) {
            score -= 10;
            flags.push('Low Activity');
        }

        const bal = parseFloat(data.balance);
        if (bal > 1.0) {
            score += 15;
            flags.push('Significant Balance');
        } else if (bal === 0) {
            score -= 5;
        }

        if (data.isContract) {
            score -= 10;
            if (data.tokenMetadata) {
                score += 30;
                flags.push('Token Contract');
            } else {
                flags.push('Unverified Contract');
            }
        } else {
            score += 10;
        }

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
