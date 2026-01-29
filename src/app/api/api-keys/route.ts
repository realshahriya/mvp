import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { ApiKeyModel, dbConnect } from "@/lib/db";

export const runtime = "nodejs";

function bytesToBase64Url(bytes: Uint8Array) {
    return Buffer.from(bytes)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function createApiKey(prefix: string) {
    const bytes = crypto.randomBytes(24);
    return `${prefix}${bytesToBase64Url(bytes)}`;
}

function normalizeAddress(input: unknown) {
    const s = String(input || "").trim().toLowerCase();
    if (!s) return null;
    if (!/^0x[a-f0-9]{40}$/.test(s)) return null;
    return s;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const address = normalizeAddress(searchParams.get("address"));
        if (!address) {
            return NextResponse.json({ error: "invalid_address" }, { status: 400 });
        }

        await dbConnect();
        const rows = await ApiKeyModel.find({ walletAddress: address }).sort({ createdAt: -1 }).lean();
        const data = rows.map((r) => ({
            id: r.keyId,
            name: r.name,
            key: r.key,
            createdAt: new Date(r.createdAt).getTime(),
            lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).getTime() : null,
        }));
        return NextResponse.json({ keys: data });
    } catch (error) {
        console.error("API Keys GET Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        const address = normalizeAddress(body?.address);
        if (!address) {
            return NextResponse.json({ error: "invalid_address" }, { status: 400 });
        }
        const nameRaw = typeof body?.name === "string" ? body.name.trim() : "";

        await dbConnect();
        const keyId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
        const key = createApiKey("cen_prod_");
        const createdAt = new Date();
        const name = nameRaw || `Production API Key`;

        await ApiKeyModel.create({
            walletAddress: address,
            keyId,
            name,
            key,
            createdAt,
            lastUsedAt: null,
        });

        return NextResponse.json({
            key: {
                id: keyId,
                name,
                key,
                createdAt: createdAt.getTime(),
                lastUsedAt: null,
            },
        });
    } catch (error) {
        console.error("API Keys POST Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        const address = normalizeAddress(body?.address);
        const id = typeof body?.id === "string" ? body.id : null;
        if (!address || !id) {
            return NextResponse.json({ error: "invalid_request" }, { status: 400 });
        }

        await dbConnect();
        const res = await ApiKeyModel.deleteOne({ walletAddress: address, keyId: id });
        return NextResponse.json({ ok: true, deleted: res.deletedCount || 0 });
    } catch (error) {
        console.error("API Keys DELETE Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
