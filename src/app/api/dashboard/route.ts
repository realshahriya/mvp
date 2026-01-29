import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, ScanResultModel } from '@/lib/db';
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    try {
        await dbConnect();
        const normalizedAddress = address.toLowerCase();
        
        const period = searchParams.get('period') || '7d';
        const limitParam = Number(searchParams.get('limit') || '10');
        const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200 ? limitParam : 10;
        let dateFilter = {};
        const now = new Date();
        
        if (period === '24h') {
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
        } else if (period === '7d') {
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        } else if (period === '30d') {
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        } else if (period === '90d') {
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        }

        // Fetch recent activity (scans initiated by this user)
        const recentScans = await ScanResultModel.find({ 
            scannedBy: normalizedAddress,
            ...dateFilter
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Fetch stats
        // 1. Total Scans (Wallets Analyzed) - All time or period? Usually stats are period based if selected, 
        // but "Total Scans" implies all time. Let's make "Wallets Analyzed" respect period if intended, 
        // but typically dashboard stats like "Total" are all time unless specified. 
        // However, the UI has a period selector affecting the whole view. Let's apply filter to stats too.
        
        const periodQuery = { scannedBy: normalizedAddress, ...dateFilter };
        
        const totalScans = await ScanResultModel.countDocuments(periodQuery);

        // 2. Threats Blocked (Risky/High Risk scans)
        const threatsBlocked = await ScanResultModel.countDocuments({ 
            ...periodQuery,
            riskLevel: { $in: ['High Risk', 'Critical', 'Blocked'] } 
        });

        // 3. API Keys count or usage? "API Calls" usually refers to programmatic usage via API keys.
        // Let's count total usage of API keys owned by this user.
        // We need to store usage logs for API keys to be accurate.
        // For now, let's use the number of scans as a proxy or just 0 if no API logs.
        // Or fetch API keys and sum their usage? We only have `lastUsedAt`.
        // Let's just use `totalScans` for "Wallets Analyzed" and maybe "API Calls" = totalScans for now (if UI/manual scans count).
        
        // Map scans to dashboard activity format
        const recentActivity = recentScans.map(scan => ({
            type: (scan.riskLevel === 'High Risk' || scan.riskLevel === 'Critical') ? 'threat' : 'scan',
            address: scan.address,
            score: scan.score,
            time: scan.createdAt, // Frontend will format this
            status: scan.riskLevel.toLowerCase().replace(' ', '-')
        }));

        return NextResponse.json({
            stats: {
                apiCalls: totalScans, // Placeholder
                walletsAnalyzed: totalScans,
                threatsBlocked: threatsBlocked,
                avgResponse: "120ms" // Placeholder
            },
            recentActivity
        });

    } catch (error: unknown) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json(
            { error: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
