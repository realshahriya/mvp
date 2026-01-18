import { BaseEvmEngine } from '../BaseEvmEngine';
import { polygon } from 'viem/chains';

export class PolygonEngine extends BaseEvmEngine {
    constructor() {
        super(polygon, 'Polygon');
    }
}

