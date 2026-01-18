import { BaseEvmEngine } from '../BaseEvmEngine';
import { fantom } from 'viem/chains';

export class FantomEngine extends BaseEvmEngine {
    constructor() {
        super(fantom, 'Fantom');
    }
}

