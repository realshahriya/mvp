import { BaseEvmEngine } from '../BaseEvmEngine';
import { avalanche } from 'viem/chains';

export class AvalancheEngine extends BaseEvmEngine {
    constructor() {
        super(avalanche, 'Avalanche');
    }
}

