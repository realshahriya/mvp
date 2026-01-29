
import { SolanaEngine, SuiEngine, AptosEngine, TonEngine, BitcoinEngine, StacksEngine, LightningEngine, LiquidEngine, CosmosEngine, PolkadotEngine, NearEngine } from './non-evm/agent';
import { ChainEngine } from './interface';
import { ChainGptEngine } from './ai/ChainGptEngine';
import {
    ArbitrumSepoliaEngine,
    AvalancheFujiEngine,
    BaseSepoliaEngine,
    BnbTestnetEngine,
    EthereumSepoliaEngine,
    FantomTestnetEngine,
    OptimismSepoliaEngine,
    PolygonAmoyEngine,
    RootstockTestnetEngine,
    ZkSyncSepoliaTestnetEngine,
} from './testnet/agent';

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
        if (s === 'lightning') return new LightningEngine();
        if (s === 'liquid') return new LiquidEngine();
        if (s === 'cosmos') return new CosmosEngine();
        if (s === 'polkadot') return new PolkadotEngine();
        if (s === 'near') return new NearEngine();
        return new EthereumSepoliaEngine();
    }
    const chainId = parseInt(s, 10);
    switch (chainId) {
        case 11155111: return new EthereumSepoliaEngine();
        case 421614: return new ArbitrumSepoliaEngine();
        case 11155420: return new OptimismSepoliaEngine();
        case 84532: return new BaseSepoliaEngine();
        case 80002: return new PolygonAmoyEngine();
        case 97: return new BnbTestnetEngine();
        case 43113: return new AvalancheFujiEngine();
        case 4002: return new FantomTestnetEngine();
        case 300: return new ZkSyncSepoliaTestnetEngine();
        case 31: return new RootstockTestnetEngine();
        case 1: return new EthereumSepoliaEngine();
        case 42161: return new ArbitrumSepoliaEngine();
        case 56: return new BnbTestnetEngine();
        case 10: return new OptimismSepoliaEngine();
        case 8453: return new BaseSepoliaEngine();
        case 137: return new PolygonAmoyEngine();
        case 43114: return new AvalancheFujiEngine();
        case 250: return new FantomTestnetEngine();
        case 324: return new ZkSyncSepoliaTestnetEngine();
        case 30: return new RootstockTestnetEngine();
        default: return new EthereumSepoliaEngine();
    }
}

export function getAiEngine(): ChainGptEngine {
    return new ChainGptEngine(process.env.CHAINGPT_API_KEY ?? '');
}
