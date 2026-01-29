
import { NextResponse } from 'next/server';

export async function GET() {
    const uri = process.env.DB_CONNECTION || '';
    const masked = uri.replace(/:([^:@]+)@/, ':****@');
    return NextResponse.json({ 
        env_db_connection: masked,
        is_configured: !!uri && !uri.includes('<db_password>'),
        node_env: process.env.NODE_ENV
    });
}
