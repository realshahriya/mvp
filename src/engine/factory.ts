
import { EthereumEngine } from './ethereum/agent';
import { ArbitrumEngine } from './arb/agent';
import { BscEngine } from './bsc/agent';
import { BaseChainEngine } from './base/agent';
import { OptimismEngine } from './op/agent';
import { ChainEngine } from './interface';
import { ChainGptEngine } from './ai/ChainGptEngine';

export function getEngine(chainIdStr: string): ChainEngine {
    const chainId = parseInt(chainIdStr);

    switch (chainId) {
        case 1: return new EthereumEngine();
        case 42161: return new ArbitrumEngine();
        case 56: return new BscEngine();
        case 10: return new OptimismEngine();
        case 8453: return new BaseChainEngine();
        default: return new EthereumEngine(); // Fallback to Mainnet
    }
}

export function getAiEngine(): ChainGptEngine {
    return new ChainGptEngine(process.env.CHAINGPT_API_KEY ?? '');
}
