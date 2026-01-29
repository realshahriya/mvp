import { BaseEvmEngine } from "../BaseEvmEngine";
import {
    arbitrumSepolia,
    avalancheFuji,
    baseSepolia,
    bscTestnet,
    fantomTestnet,
    optimismSepolia,
    polygonAmoy,
    rootstockTestnet,
    sepolia,
    zksyncSepoliaTestnet,
} from "viem/chains";

export class EthereumSepoliaEngine extends BaseEvmEngine {
    constructor() {
        super(sepolia, "Ethereum Sepolia");
    }
}

export class ArbitrumSepoliaEngine extends BaseEvmEngine {
    constructor() {
        super(arbitrumSepolia, "Arbitrum Sepolia");
    }
}

export class OptimismSepoliaEngine extends BaseEvmEngine {
    constructor() {
        super(optimismSepolia, "Optimism Sepolia");
    }
}

export class BaseSepoliaEngine extends BaseEvmEngine {
    constructor() {
        super(baseSepolia, "Base Sepolia");
    }
}

export class PolygonAmoyEngine extends BaseEvmEngine {
    constructor() {
        super(polygonAmoy, "Polygon Amoy");
    }
}

export class BnbTestnetEngine extends BaseEvmEngine {
    constructor() {
        super(bscTestnet, "BNB Smart Chain Testnet");
    }
}

export class AvalancheFujiEngine extends BaseEvmEngine {
    constructor() {
        super(avalancheFuji, "Avalanche Fuji");
    }
}

export class FantomTestnetEngine extends BaseEvmEngine {
    constructor() {
        super(fantomTestnet, "Fantom Testnet");
    }
}

export class ZkSyncSepoliaTestnetEngine extends BaseEvmEngine {
    constructor() {
        super(zksyncSepoliaTestnet, "zkSync Sepolia Testnet");
    }
}

export class RootstockTestnetEngine extends BaseEvmEngine {
    constructor() {
        super(rootstockTestnet, "Rootstock Testnet");
    }
}
