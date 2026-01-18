
import { EthereumEngine } from './ethereum/agent';
import { ArbitrumEngine } from './arb/agent';
import { BscEngine } from './bsc/agent';
import { BaseChainEngine } from './base/agent';
import { OptimismEngine } from './op/agent';
import { PolygonEngine } from './polygon/agent';
import { AvalancheEngine } from './avalanche/agent';
import { FantomEngine } from './fantom/agent';
import { ZkSyncEngine } from './zksync/agent';
import { RootstockEngine } from './rootstock/agent';
import { SolanaEngine, SuiEngine, AptosEngine, TonEngine, BitcoinEngine, StacksEngine } from './non-evm/agent';
import { ChainEngine } from './interface';
import { ChainGptEngine } from './ai/ChainGptEngine';

export function getEngine(chainIdStr: string): ChainEngine {
    const s = String(chainIdStr).trim();
    const isNum = /^\d+$/.test(s);
    if (!isNum) {
        if (s === 'solana') return new SolanaEngine();
        if (s === 'sui') return new SuiEngine();
        if (s === 'aptos') return new AptosEngine();
        if (s === 'ton') return new TonEngine();
        if (s === 'bitcoin') return new BitcoinEngine();
        if (s === 'stacks') return new StacksEngine();
        return new EthereumEngine();
    }
    const chainId = parseInt(s, 10);
    switch (chainId) {
        case 1: return new EthereumEngine();
        case 42161: return new ArbitrumEngine();
        case 56: return new BscEngine();
        case 10: return new OptimismEngine();
        case 8453: return new BaseChainEngine();
        case 137: return new PolygonEngine();
        case 43114: return new AvalancheEngine();
        case 250: return new FantomEngine();
        case 324: return new ZkSyncEngine();
        case 30: return new RootstockEngine();
        default: return new EthereumEngine();
    }
}

export function getAiEngine(): ChainGptEngine {
    return new ChainGptEngine(process.env.CHAINGPT_API_KEY ?? '');
}
