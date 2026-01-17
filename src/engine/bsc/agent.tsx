
import { BaseEvmEngine } from '../BaseEvmEngine';
import { bsc } from 'viem/chains';

export class BscEngine extends BaseEvmEngine {
    constructor() {
        super(bsc, 'BNB Smart Chain');
    }
}
