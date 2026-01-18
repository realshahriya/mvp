import { BaseEvmEngine } from '../BaseEvmEngine';
import { zksync } from 'viem/chains';

export class ZkSyncEngine extends BaseEvmEngine {
    constructor() {
        super(zksync, 'zkSync Era');
    }
}

