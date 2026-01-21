import { NonEvmEngine } from '../NonEvmEngine';
import type { ChainData } from '@/lib/blockchain';

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

function asObj(v: unknown): Record<string, unknown> {
    return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
}

function asArr(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
}

function formatUnits(value: string | number | bigint, decimals: number, maxFrac: number = 6): string {
    let v: bigint;
    try {
        v = typeof value === 'bigint' ? value : BigInt(String(value));
    } catch {
        return '0';
    }
    let base = BigInt(1);
    for (let i = 0; i < decimals; i++) base = base * BigInt(10);
    const integer = v / base;
    let frac = (v % base).toString().padStart(decimals, '0');
    if (maxFrac >= 0 && maxFrac < decimals) frac = frac.slice(0, maxFrac);
    frac = frac.replace(/0+$/, '');
    return frac ? `${integer.toString()}.${frac}` : integer.toString();
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs: number = 12000): Promise<JsonValue> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (!res.ok) return null;
        return (await res.json()) as JsonValue;
    } finally {
        clearTimeout(t);
    }
}

async function rpcJson(url: string, method: string, params: unknown[] = [], timeoutMs: number = 12000): Promise<unknown> {
    const body = { jsonrpc: '2.0', id: 1, method, params };
    const json = await fetchJson(
        url,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        },
        timeoutMs
    );
    const obj = asObj(json);
    if (obj.error) return null;
    return obj.result ?? null;
}

async function countPaged<TCursor>(opts: {
    max: number;
    pageSize: number;
    fetchPage: (cursor: TCursor | null, limit: number) => Promise<{ items: unknown[]; next: TCursor | null } | null>;
}): Promise<{ count: number; capped: boolean }> {
    const max = Math.max(1, opts.max);
    const pageSize = Math.max(1, Math.min(opts.pageSize, 1000));
    let cursor: TCursor | null = null;
    let count = 0;
    while (count < max) {
        const page = await opts.fetchPage(cursor, Math.min(pageSize, max - count));
        if (!page) break;
        const items = page.items || [];
        if (!items.length) break;
        count += items.length;
        cursor = page.next;
        if (!cursor) break;
    }
    return { count, capped: count >= max };
}

export class SolanaEngine extends NonEvmEngine {
    constructor() {
        super('solana', 'Solana', 'SOL');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const rpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        const [balRes, acctRes] = await Promise.all([
            rpcJson(rpc, 'getBalance', [input]),
            rpcJson(rpc, 'getAccountInfo', [input, { encoding: 'base64' }]),
        ]);
        const balObj = asObj(balRes);
        const lamportsRaw = balObj.value ?? 0;
        let lamportsNum = BigInt(0);
        try {
            lamportsNum =
                typeof lamportsRaw === 'number'
                    ? BigInt(Math.max(0, Math.trunc(lamportsRaw)))
                    : BigInt(String(lamportsRaw ?? '0'));
        } catch {
            lamportsNum = BigInt(0);
        }

        const acctObj = asObj(acctRes);
        const acctVal = asObj(acctObj.value);
        const executable = typeof acctVal.executable === 'boolean' ? acctVal.executable : false;

        const tx = await countPaged<string>({
            max: 5000,
            pageSize: 1000,
            fetchPage: async (before, limit) => {
                const params: unknown[] = [input, { limit }];
                if (before) params[1] = { limit, before };
                const res = await rpcJson(rpc, 'getSignaturesForAddress', params);
                const items = asArr(res);
                const last = items.length ? asObj(items[items.length - 1]) : {};
                const next = typeof last.signature === 'string' ? last.signature : null;
                return { items, next };
            },
        });

        return {
            address: input,
            ensName: null,
            balance: formatUnits(lamportsNum, 9, 6),
            txCount: tx.capped ? 5000 : tx.count,
            isContract: !!executable,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class SuiEngine extends NonEvmEngine {
    constructor() {
        super('sui', 'Sui', 'SUI');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const rpc = process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443';
        const balRes = await rpcJson(rpc, 'suix_getBalance', [input]);
        const balObj = asObj(balRes);
        const total = balObj.totalBalance ?? '0';

        const digests = new Set<string>();
        const max = 2000;
        const pageSize = 100;

        const fetchDigests = async (filter: Record<string, unknown>) => {
            let cursor: string | null = null;
            while (digests.size < max) {
                const query = { filter, options: { showEffects: false, showInput: false, showEvents: false } };
                const params: unknown[] = [query, cursor, pageSize, true];
                const res = await rpcJson(rpc, 'suix_queryTransactionBlocks', params);
                const obj = asObj(res);
                const data = asArr(obj.data);
                for (const it of data) {
                    const d = asObj(it).digest;
                    if (typeof d === 'string') digests.add(d);
                    if (digests.size >= max) break;
                }
                if (!obj.hasNextPage || !obj.nextCursor) break;
                cursor = String(obj.nextCursor);
            }
        };

        await Promise.all([
            fetchDigests({ FromAddress: input }),
            fetchDigests({ ToAddress: input }),
        ]);

        return {
            address: input,
            ensName: null,
            balance: formatUnits(String(total), 9, 6),
            txCount: digests.size >= max ? max : digests.size,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class AptosEngine extends NonEvmEngine {
    constructor() {
        super('aptos', 'Aptos', 'APT');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.APTOS_API_URL || 'https://fullnode.mainnet.aptoslabs.com/v1';
        const acct = await fetchJson(`${base}/accounts/${encodeURIComponent(input)}`);
        if (!acct) return null;
        const acctObj = asObj(acct);
        const seq = acctObj.sequence_number;
        const txCount = typeof seq === 'string' ? parseInt(seq, 10) : typeof seq === 'number' ? Math.trunc(seq) : 0;

        const resources = await fetchJson(`${base}/accounts/${encodeURIComponent(input)}/resources`);
        const arr = asArr(resources);
        let balanceAtomic: string | null = null;
        for (const r of arr) {
            const ro = asObj(r);
            const t = ro.type;
            if (typeof t === 'string' && t.includes('0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')) {
                const data = asObj(ro.data);
                const coin = asObj(data.coin);
                const val = coin.value;
                if (typeof val === 'string' || typeof val === 'number') {
                    balanceAtomic = String(val);
                    break;
                }
            }
        }

        return {
            address: input,
            ensName: null,
            balance: formatUnits(balanceAtomic ?? '0', 8, 6),
            txCount: Number.isFinite(txCount) ? txCount : 0,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class TonEngine extends NonEvmEngine {
    constructor() {
        super('ton', 'The Open Network', 'TON');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.TON_API_URL || 'https://tonapi.io';
        const key = process.env.TONAPI_KEY || process.env.TON_API_KEY;
        const headers: Record<string, string> = {};
        if (key) headers['Authorization'] = `Bearer ${key}`;

        const acctJson = await fetchJson(`${base}/v2/accounts/${encodeURIComponent(input)}`, { headers });
        if (!acctJson) return null;
        const acct = asObj(acctJson);
        const balanceNano = acct.balance ?? '0';
        const isWallet = typeof acct.is_wallet === 'boolean' ? acct.is_wallet : true;

        const txCounter = await countPaged<{ lt: string; hash?: string }>({
            max: 1000,
            pageSize: 100,
            fetchPage: async (cursor, limit) => {
                const qs: string[] = [`limit=${limit}`];
                if (cursor?.lt) qs.push(`before_lt=${encodeURIComponent(cursor.lt)}`);
                if (cursor?.hash) qs.push(`before_hash=${encodeURIComponent(cursor.hash)}`);
                const url = `${base}/v2/accounts/${encodeURIComponent(input)}/transactions?${qs.join('&')}`;
                const resJson = await fetchJson(url, { headers });
                const items = Array.isArray(resJson) ? (resJson as unknown[]) : asArr(asObj(resJson).transactions);
                if (!items.length) return { items: [], next: null };
                const last = asObj(items[items.length - 1]);
                const tid = asObj(last.transaction_id);
                const lt = (typeof last.lt === 'string' ? last.lt : typeof tid.lt === 'string' ? tid.lt : null) as string | null;
                const hash = (typeof last.hash === 'string' ? last.hash : typeof tid.hash === 'string' ? tid.hash : null) as string | null;
                return { items, next: lt ? { lt, hash: hash ?? undefined } : null };
            },
        });

        return {
            address: input,
            ensName: null,
            balance: formatUnits(String(balanceNano), 9, 6),
            txCount: txCounter.capped ? 1000 : txCounter.count,
            isContract: !isWallet,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class BitcoinEngine extends NonEvmEngine {
    constructor() {
        super('bitcoin', 'Bitcoin', 'BTC');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.BITCOIN_API_URL || 'https://mempool.space';
        const j = await fetchJson(`${base}/api/address/${encodeURIComponent(input)}`);
        if (!j) return null;
        const obj = asObj(j);
        const chain = asObj(obj.chain_stats);
        const mem = asObj(obj.mempool_stats);
        const funded = BigInt(String((chain.funded_txo_sum ?? 0) as unknown));
        const spent = BigInt(String((chain.spent_txo_sum ?? 0) as unknown));
        const fundedM = BigInt(String((mem.funded_txo_sum ?? 0) as unknown));
        const spentM = BigInt(String((mem.spent_txo_sum ?? 0) as unknown));
        const sats = funded - spent + (fundedM - spentM);
        const txCount = (Number(chain.tx_count ?? 0) || 0) + (Number(mem.tx_count ?? 0) || 0);

        return {
            address: input,
            ensName: null,
            balance: formatUnits(sats < BigInt(0) ? BigInt(0) : sats, 8, 8),
            txCount,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class StacksEngine extends NonEvmEngine {
    constructor() {
        super('stacks', 'Stacks', 'STX');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.STACKS_API_URL || 'https://api.mainnet.hiro.so';
        const [balJson, txJson] = await Promise.all([
            fetchJson(`${base}/extended/v1/address/${encodeURIComponent(input)}/balances`),
            fetchJson(`${base}/extended/v1/address/${encodeURIComponent(input)}/transactions?limit=1`),
        ]);
        if (!balJson) return null;
        const balObj = asObj(balJson);
        const stx = asObj(balObj.stx);
        const micro = stx.balance ?? '0';
        const txObj = asObj(txJson);
        const total = txObj.total;
        const txCount = typeof total === 'number' ? Math.trunc(total) : typeof total === 'string' ? parseInt(total, 10) : 0;

        return {
            address: input,
            ensName: null,
            balance: formatUnits(String(micro), 6, 6),
            txCount: Number.isFinite(txCount) ? txCount : 0,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class LightningEngine extends NonEvmEngine {
    constructor() {
        super('lightning', 'Lightning', 'BTC');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.LIGHTNING_API_URL || 'https://mempool.space';
        const node = await fetchJson(`${base}/api/v1/lightning/nodes/${encodeURIComponent(input)}`);
        if (!node) return null;
        const obj = asObj(node);
        const capacityRaw = obj.capacity ?? obj.total_capacity ?? 0;
        const channelsRaw = obj.channels ?? obj.channel_count ?? obj.channels_count ?? 0;
        const capacity = typeof capacityRaw === 'string' || typeof capacityRaw === 'number' ? capacityRaw : 0;
        const channels = typeof channelsRaw === 'string' || typeof channelsRaw === 'number' ? Number(channelsRaw) : 0;

        return {
            address: input,
            ensName: null,
            balance: formatUnits(String(capacity), 8, 8),
            txCount: Number.isFinite(channels) ? Math.max(0, channels) : 0,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class LiquidEngine extends NonEvmEngine {
    constructor() {
        super('liquid', 'Liquid', 'LBTC');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.LIQUID_API_URL || 'https://blockstream.info/liquid';
        const j = await fetchJson(`${base}/api/address/${encodeURIComponent(input)}`);
        if (!j) return null;
        const obj = asObj(j);
        const chain = asObj(obj.chain_stats);
        const mem = asObj(obj.mempool_stats);
        const funded = BigInt(String((chain.funded_txo_sum ?? 0) as unknown));
        const spent = BigInt(String((chain.spent_txo_sum ?? 0) as unknown));
        const fundedM = BigInt(String((mem.funded_txo_sum ?? 0) as unknown));
        const spentM = BigInt(String((mem.spent_txo_sum ?? 0) as unknown));
        const sats = funded - spent + (fundedM - spentM);
        const txCount = (Number(chain.tx_count ?? 0) || 0) + (Number(mem.tx_count ?? 0) || 0);

        return {
            address: input,
            ensName: null,
            balance: formatUnits(sats < BigInt(0) ? BigInt(0) : sats, 8, 8),
            txCount,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class CosmosEngine extends NonEvmEngine {
    constructor() {
        super('cosmos', 'Cosmos Hub', 'ATOM');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.COSMOS_API_URL || 'https://rest.cosmos.directory/cosmoshub';
        const [balJson, txJson] = await Promise.all([
            fetchJson(`${base}/cosmos/bank/v1beta1/balances/${encodeURIComponent(input)}`),
            fetchJson(`${base}/cosmos/tx/v1beta1/txs?events=message.sender%3D${encodeURIComponent(input)}&pagination.limit=1`)
        ]);
        if (!balJson) return null;
        const balObj = asObj(balJson);
        const balances = asArr(balObj.balances);
        let uatom = '0';
        for (const b of balances) {
            const bo = asObj(b);
            const denom = bo.denom;
            if (denom === 'uatom') {
                const amount = bo.amount;
                if (typeof amount === 'string' || typeof amount === 'number') {
                    uatom = String(amount);
                }
                break;
            }
        }
        const txObj = asObj(txJson);
        const pagination = asObj(txObj.pagination);
        const totalRaw = pagination.total ?? 0;
        const txCount = typeof totalRaw === 'string' ? parseInt(totalRaw, 10) : typeof totalRaw === 'number' ? Math.trunc(totalRaw) : 0;

        return {
            address: input,
            ensName: null,
            balance: formatUnits(String(uatom), 6, 6),
            txCount: Number.isFinite(txCount) ? txCount : 0,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class PolkadotEngine extends NonEvmEngine {
    constructor() {
        super('polkadot', 'Polkadot', 'DOT');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const base = process.env.POLKADOT_API_URL || 'https://polkadot.api.subscan.io';
        const body = JSON.stringify({ address: input });
        const res = await fetchJson(
            `${base}/api/scan/account`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
        );
        if (!res) return null;
        const obj = asObj(res);
        const data = asObj(obj.data);
        const balRaw = data.balance ?? data.free_balance ?? 0;
        const txRaw = data.tx_count ?? data.count_extrinsic ?? data.transfer_count ?? 0;
        const bal = typeof balRaw === 'string' || typeof balRaw === 'number' ? String(balRaw) : '0';
        const txCount = typeof txRaw === 'string' ? parseInt(txRaw, 10) : typeof txRaw === 'number' ? Math.trunc(txRaw) : 0;

        return {
            address: input,
            ensName: null,
            balance: formatUnits(bal, 10, 6),
            txCount: Number.isFinite(txCount) ? txCount : 0,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}

export class NearEngine extends NonEvmEngine {
    constructor() {
        super('near', 'Near', 'NEAR');
    }

    async fetchData(input: string): Promise<ChainData | null> {
        const rpc = process.env.NEAR_RPC_URL || 'https://rpc.mainnet.near.org';
        const acct = await rpcJson(rpc, 'query', [
            { request_type: 'view_account', finality: 'final', account_id: input }
        ]);
        if (!acct) return null;
        const obj = asObj(acct);
        const amountRaw = obj.amount ?? '0';
        const bal = typeof amountRaw === 'string' || typeof amountRaw === 'number' ? String(amountRaw) : '0';

        const base = process.env.NEAR_API_URL || 'https://api.nearblocks.io';
        const meta = await fetchJson(`${base}/v1/account/${encodeURIComponent(input)}`);
        const metaObj = asObj(meta);
        const account = asObj(metaObj.account);
        const txRaw = account.txns ?? account.tx_count ?? metaObj.txns ?? 0;
        const txCount = typeof txRaw === 'string' ? parseInt(txRaw, 10) : typeof txRaw === 'number' ? Math.trunc(txRaw) : 0;

        return {
            address: input,
            ensName: null,
            balance: formatUnits(bal, 24, 6),
            txCount: Number.isFinite(txCount) ? txCount : 0,
            isContract: false,
            codeSize: 0,
            tokenMetadata: undefined
        };
    }
}
