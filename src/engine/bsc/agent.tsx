
import { BaseEvmEngine } from '../BaseEvmEngine';
import { bsc, bscTestnet } from 'viem/chains';

export class BscEngine extends BaseEvmEngine {
    constructor() {
        super(bsc, 'BNB Smart Chain');
    }
}

export class BscTestnetEngine extends BaseEvmEngine {
    constructor() {
        super(bscTestnet, 'BNB Smart Chain Testnet');
    }
}
