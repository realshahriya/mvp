import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, FeedbackReportModel } from '@/lib/db';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const type = String(body?.type ?? 'other');
        const severity = String(body?.severity ?? 'medium');
        const content = String(body?.content ?? '').trim();
        const address = body?.address ? String(body.address) : undefined;
        const chain = body?.chain ? String(body.chain) : undefined;

        if (!content || content.length < 3) {
            return NextResponse.json({ error: 'content_too_short' }, { status: 400 });
        }

        await dbConnect();
        await FeedbackReportModel.create({
            type,
            severity,
            content,
            address,
            chain,
            createdAt: new Date(),
        });

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const topicId = process.env.TELEGRAM_TOPIC_ID ? Number(process.env.TELEGRAM_TOPIC_ID) : undefined;

        if (!token || !chatId) {
            return NextResponse.json({ ok: true, stored: true, delivered: false, error: 'telegram_not_configured' });
        }

        const icon = type === 'bug' ? '🐞' : type === 'feature' ? '✨' : '📝';
        const now = new Date();
        const ts = now.toISOString().replace('T', ' ').replace('Z', ' UTC');

        const escapeHTML = (s: string) =>
            s.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;');
        const CHAIN_NAME_MAP: Record<string, string> = {
            // Mainnets
            "1": "Ethereum Mainnet",
            "56": "BNB Smart Chain",
            "137": "Polygon",
            "42161": "Arbitrum One",
            "10": "Optimism",
            "8453": "Base",
            "324": "zkSync Era",
            "43114": "Avalanche C-Chain",
            "250": "Fantom Opera",
            // EVM Testnets
            "11155111": "Ethereum Sepolia Testnet",
            "97": "BNB Smart Chain Testnet",
            "421614": "Arbitrum Sepolia Testnet",
            "11155420": "Optimism Sepolia Testnet",
            "84532": "Base Sepolia Testnet",
            "80002": "Polygon Amoy Testnet",
            "43113": "Avalanche Fuji Testnet",
            "4002": "Fantom Testnet",
            "300": "zkSync Sepolia Testnet",
            "31": "Rootstock Testnet",
            // Non-EVM
            "solana": "Solana",
            "sui": "Sui",
            "aptos": "Aptos",
            "ton": "TON",
            "bitcoin": "Bitcoin",
            "stacks": "Stacks",
            "cosmos": "Cosmos Hub",
            "polkadot": "Polkadot",
            "lightning": "Lightning",
            "liquid": "Liquid",
            "near": "Near"
        };
        const chainKey = chain ? String(chain).trim() : '';
        const chainDisplay = chainKey ? (CHAIN_NAME_MAP[chainKey] ? CHAIN_NAME_MAP[chainKey] : chainKey) : '';

        const header = `<b>${icon} CENCERA Report</b>`;
        const meta: string[] = [
            `<b>Type:</b> ${escapeHTML(type)}`,
            `<b>Severity:</b> ${escapeHTML(severity)}`,
            address ? `<b>Address:</b> ${escapeHTML(address)}` : '',
            chainKey ? `<b>Chain:</b> ${escapeHTML(chainDisplay)}` : ''
        ].filter(Boolean) as string[];
        const detailsLabel = `<b>Details:</b>`;
        const detailsText = escapeHTML(content);
        const footer = `<i>Submitted at ${escapeHTML(ts)}</i>`;

        const payload: Record<string, unknown> = {
            chat_id: chatId,
            text: [header, meta.join('\n'), detailsLabel, detailsText, footer].join('\n\n'),
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };
        if (topicId && Number.isFinite(topicId)) {
            payload['message_thread_id'] = topicId;
        }

        let tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await tg.json().catch(() => ({}));
        if (!tg.ok || result?.ok === false) {
            const desc = result?.description ? String(result.description) : '';
            const hadThread = Boolean(topicId && Number.isFinite(topicId));
            const threadIssue = hadThread && /thread/i.test(desc);

            if (threadIssue) {
                const payloadNoThread: { [key: string]: unknown } = { ...payload };
                delete payloadNoThread['message_thread_id'];

                tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadNoThread)
                });
                const result2 = await tg.json().catch(() => ({}));
                if (!tg.ok || result2?.ok === false) {
                    return NextResponse.json({ error: 'telegram_failed', details: result2?.description ?? desc }, { status: 500 });
                }
                return NextResponse.json({ ok: true, fallback: true });
            }

            return NextResponse.json({ error: 'telegram_failed', details: desc }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}
