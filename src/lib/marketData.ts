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
    '250': 'fantom'
};

const nativeCache: Record<string, { price: number; ts: number }> = {};

export async function getNativePrice(chainId: string): Promise<number> {
    const id = COINGECKO_IDS[chainId] || 'ethereum';
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
        const price = data[id]?.usd ?? 0;
        nativeCache[id] = { price, ts: now };
        return price || (cachedPrice ?? 2650.0);
    } catch {
        return entry?.price ?? (cachedPrice ?? 2650.0);
    }
}
