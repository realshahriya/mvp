import { BaseEvmEngine } from '../BaseEvmEngine';
import { optimism } from 'viem/chains';

export class OptimismEngine extends BaseEvmEngine {
    constructor() {
        super(optimism, 'Optimism');
    }
}
