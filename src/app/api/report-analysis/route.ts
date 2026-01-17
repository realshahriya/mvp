import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const reason = String(body?.reason ?? '').trim();
        const details = String(body?.details ?? '').trim();
        const chain = body?.chain ? String(body.chain) : undefined;
        const address = body?.address ? String(body.address) : undefined;

        if (!reason || reason.length < 2) {
            return NextResponse.json({ error: 'reason_too_short' }, { status: 400 });
        }
        if (!details || details.length < 3) {
            return NextResponse.json({ error: 'content_too_short' }, { status: 400 });
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const topicId = process.env.TELEGRAM_ANALYSIS_TOPIC_ID ? Number(process.env.TELEGRAM_ANALYSIS_TOPIC_ID) : undefined;

        if (!token || !chatId) {
            return NextResponse.json({ error: 'telegram_not_configured' }, { status: 500 });
        }

        const icon = '🛠️';
        const now = new Date();
        const ts = now.toISOString().replace('T', ' ').replace('Z', ' UTC');

        const escapeHTML = (s: string) =>
            s.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;');
        const CHAIN_NAME_MAP: Record<string, string> = {
            "1": "Ethereum Mainnet",
            "56": "BNB Smart Chain",
            "137": "Polygon",
            "42161": "Arbitrum One",
            "10": "Optimism",
            "8453": "Base",
            "324": "zkSync Era",
            "43114": "Avalanche C-Chain",
            "250": "Fantom Opera",
            "solana": "Solana",
            "sui": "Sui",
            "aptos": "Aptos",
            "ton": "TON"
        };
        const chainKey = chain ? String(chain).trim() : '';
        const chainDisplay = chainKey ? (CHAIN_NAME_MAP[chainKey] ? CHAIN_NAME_MAP[chainKey] : chainKey) : '';

        const header = `<b>${icon} CENCERA Analysis Report</b>`;
        const meta: string[] = [
            address ? `<b>Address:</b> ${escapeHTML(address)}` : '',
            chainKey ? `<b>Chain:</b> ${escapeHTML(chainDisplay)}` : '',
        ].filter(Boolean) as string[];
        const reasonRow = `<b>Reason:</b> ${escapeHTML(reason)}`;
        const detailsLabel = `<b>Details:</b>`;
        const detailsText = escapeHTML(details);
        const footer = `<i>Submitted at ${escapeHTML(ts)}</i>`;

        const payload: Record<string, unknown> = {
            chat_id: chatId,
            text: [header, meta.join('\n'), reasonRow, detailsLabel, detailsText, footer].join('\n\n'),
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
        const asObj = (v: unknown) => (typeof v === 'object' && v !== null ? v as Record<string, unknown> : {});
        const okFlag = asObj(result)['ok'] ? Boolean(asObj(result)['ok']) : undefined;
        const desc = asObj(result)['description'] ? String(asObj(result)['description']) : '';
        if (!tg.ok || okFlag === false) {
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
                const obj2 = asObj(result2);
                const ok2 = obj2['ok'] ? Boolean(obj2['ok']) : undefined;
                const desc2 = obj2['description'] ? String(obj2['description']) : undefined;
                if (!tg.ok || ok2 === false) {
                    return NextResponse.json({ error: 'telegram_failed', details: desc2 ?? desc }, { status: 500 });
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
