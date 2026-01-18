let cachedPrice: number | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000;

export interface MarketData {
    ethPriceUsd: number;
    portfolioValueUsd: number;
}

export async function getEthPrice(): Promise<number> {
    const now = Date.now();

    if (cachedPrice && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedPrice;
    }

    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');

        if (!res.ok) {
            throw new Error('Failed to fetch price');
        }

        const data = await res.json();
        const price = data.ethereum.usd;

        cachedPrice = price;
        lastFetchTime = now;

        return price;
    } catch (error) {
        console.error("Market Data Error:", error);
        return cachedPrice || 2650.00;
    }
}

const COINGECKO_IDS: Record<string, string> = {
    '1': 'ethereum',
    '42161': 'ethereum',
    '10': 'ethereum',
    '8453': 'ethereum',
    '56': 'binancecoin',
    '137': 'matic-network',
    '43114': 'avalanche-2',
    '250': 'fantom',
    '324': 'ethereum',
    '30': 'rootstock-smart-bitcoin',
    'bitcoin': 'bitcoin',
    'solana': 'solana',
    'sui': 'sui',
    'aptos': 'aptos',
    'ton': 'toncoin',
    'stacks': 'stacks'
};

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
    ETH: 'ethereum',
    BNB: 'binancecoin',
    MATIC: 'matic-network',
    POL: 'polygon-ecosystem-token',
    AVAX: 'avalanche-2',
    FTM: 'fantom',
    BTC: 'bitcoin',
    RBTC: 'rootstock-smart-bitcoin',
    SOL: 'solana',
    SUI: 'sui',
    APT: 'aptos',
    TON: 'toncoin',
    STX: 'stacks',
};

const nativeCache: Record<string, { price: number; ts: number }> = {};

async function tryCryptoComparePriceUsd(symbol: string): Promise<number | null> {
    const sym = String(symbol).trim().toUpperCase();
    if (!sym) return null;
    const res = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${encodeURIComponent(sym)}&tsyms=USD`);
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== 'object') return null;
    const usd = (data as Record<string, unknown>).USD;
    const priceNum = typeof usd === 'number' ? usd : typeof usd === 'string' ? Number(usd) : NaN;
    if (!Number.isFinite(priceNum) || priceNum <= 0) return null;
    return priceNum;
}

export async function getNativePrice(chainId: string, nativeSymbol?: string): Promise<number> {
    const fromChain = COINGECKO_IDS[chainId];
    const sym = nativeSymbol ? String(nativeSymbol).trim().toUpperCase() : '';
    const fromSymbol = sym ? SYMBOL_TO_COINGECKO_ID[sym] : undefined;
    const id = fromChain || fromSymbol;
    if (!id) return 0;
    const entry = nativeCache[id];
    const now = Date.now();
    if (entry && now - entry.ts < CACHE_DURATION) return entry.price;
    try {
        if (id === 'ethereum' && process.env.ETHERSCAN_API_KEY) {
            const es = await fetch(`https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${process.env.ETHERSCAN_API_KEY}`);
            if (es.ok) {
                const j = await es.json();
                const priceStr = j?.result?.ethusd;
                const priceNum = priceStr ? parseFloat(priceStr) : NaN;
                if (!isNaN(priceNum)) {
                    nativeCache[id] = { price: priceNum, ts: now };
                    return priceNum;
                }
            }
        }
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
        if (!res.ok) throw new Error('Failed to fetch price');
        const data = await res.json();
        const price = data[id]?.usd;
        const priceNum = typeof price === 'number' ? price : Number(price);
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            throw new Error('Invalid price');
        }
        nativeCache[id] = { price: priceNum, ts: now };
        return priceNum;
    } catch {
        try {
            if (sym) {
                const cc = await tryCryptoComparePriceUsd(sym);
                if (cc) {
                    nativeCache[id] = { price: cc, ts: now };
                    return cc;
                }
            }
        } catch {
        }
        if (id === 'ethereum') return entry?.price ?? (cachedPrice ?? 2650.0);
        return entry?.price ?? 0;
    }
}
