
import { BaseEvmEngine } from '../BaseEvmEngine';
import { arbitrum } from 'viem/chains';

export class ArbitrumEngine extends BaseEvmEngine {
    constructor() {
        super(arbitrum, 'Arbitrum One');
    }
}
