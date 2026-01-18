
import { ChainData } from '@/lib/blockchain';

export interface AnalysisResult {
    score: number;
    riskLevel: 'Safe' | 'Caution' | 'High Risk';
    details: ChainData;
    flags: string[];
}

export interface ChainEngine {
    chainId: number;
    name: string;
    nativeSymbol?: string;

    // Core Data Fetching
    fetchData(address: string): Promise<ChainData | null>;

    // specialized analysis
    analyze(address: string): Promise<AnalysisResult>;
}
