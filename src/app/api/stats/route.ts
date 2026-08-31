import { NextRequest, NextResponse } from 'next/server';
import { getSystemStats } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const stats = await getSystemStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch system stats', details: error.message },
      { status: 500 }
    );
  }
}