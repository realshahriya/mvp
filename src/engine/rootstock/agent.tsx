import { BaseEvmEngine } from '../BaseEvmEngine';
import { rootstock } from 'viem/chains';

export class RootstockEngine extends BaseEvmEngine {
    constructor() {
        super(rootstock, 'Rootstock (RSK)');
    }
}

