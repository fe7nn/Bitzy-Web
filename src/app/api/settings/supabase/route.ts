import { NextRequest, NextResponse } from 'next/server';
import { testSupabaseConnection, setRuntimeSupabaseConfig, getSupabaseClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  const client = getSupabaseClient();

  return NextResponse.json({
    hasConfig: Boolean(url && hasKey),
    url: url ? url.substring(0, 20) + '...' : '',
    isConnected: Boolean(client),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { url, key } = await req.json();

    if (!url || !key) {
      return NextResponse.json(
        { success: false, message: 'URL and API Key are required.' },
        { status: 400 }
      );
    }

    const testResult = await testSupabaseConnection(url.trim(), key.trim());

    if (!testResult.success) {
      return NextResponse.json(
        { success: false, message: testResult.message },
        { status: 400 }
      );
    }

    // Apply runtime config
    setRuntimeSupabaseConfig(url.trim(), key.trim());

    // Also persist to .env.local file
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      const envContent = `NEXT_PUBLIC_SUPABASE_URL=${url.trim()}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key.trim()}\nSUPABASE_SERVICE_ROLE_KEY=${key.trim()}\n`;
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (fsErr) {
      console.warn('Could not write .env.local file:', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: testResult.message,
      count: testResult.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save configuration.' },
      { status: 500 }
    );
  }
}
