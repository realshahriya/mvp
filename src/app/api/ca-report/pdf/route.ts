import { NextRequest, NextResponse } from 'next/server';
import { runCaPipeline } from '@/lib/caPipeline';

function escapePdfText(input: string) {
    return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines: string[]) {
    const contentLines = lines.map((line, idx) => {
        const prefix = idx === 0 ? '' : '0 -14 Td ';
        return `${prefix}(${escapePdfText(line)}) Tj`;
    }).join('\n');
    const stream = `BT /F1 12 Tf 50 750 Td ${contentLines} ET`;
    const objects: string[] = [];
    objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
    objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
    objects.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >> endobj');
    objects.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');
    objects.push(`5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`);
    let offset = 0;
    const xref: string[] = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f '];
    const body = objects.map((obj) => {
        const line = `${obj}\n`;
        xref.push(`${String(offset).padStart(10, '0')} 00000 n `);
        offset += line.length;
        return line;
    }).join('');
    const xrefOffset = offset;
    const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(`%PDF-1.4\n${body}${xref.join('\n')}\n${trailer}`);
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q') || '';
    const chainId = req.nextUrl.searchParams.get('chain') || '1';
    if (!q.trim()) {
        return NextResponse.json({ error: 'missing_query' }, { status: 400 });
    }
    try {
        const data = await runCaPipeline(q, chainId);
        const lines = [
            `Cencera Report`,
            `Query: ${data.normalized.query}`,
            `Chain: ${data.normalized.chainId}`,
            `Score: ${data.chainGpt.score} (${data.rating})`,
            `Summary: ${data.chainGpt.summary}`,
            `Balance: ${data.normalized.chain.balanceNative} ${data.normalized.chain.nativeSymbol}`,
            `Tx Count: ${data.normalized.chain.txCount}`,
            `Price: $${data.normalized.market.priceUsd.toFixed(4)}`,
            `Volume 24h: $${data.normalized.market.volume24hUsd}`,
            `Liquidity: $${data.normalized.market.liquidityUsd}`,
        ];
        const pdf = buildPdf(lines);
        return new NextResponse(pdf, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="cencera-report.pdf"`,
            },
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: 'pdf_failed', details: msg }, { status: 500 });
    }
}
