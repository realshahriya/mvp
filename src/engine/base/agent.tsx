
import { BaseEvmEngine } from '../BaseEvmEngine';
import { base } from 'viem/chains';

export class BaseChainEngine extends BaseEvmEngine {
    constructor() {
        super(base, 'Base (Coinbase L2)');
    }
}
