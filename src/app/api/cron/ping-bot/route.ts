import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const botUrl = process.env.DISCORD_BOT_URL || 'https://bitzy-discord-bot.onrender.com';
  const startTime = Date.now();

  try {
    const res = await fetch(`${botUrl}/health`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Vercel-KeepAlive-Cron/1.0',
      },
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      latencyMs,
      targetUrl: `${botUrl}/health`,
      botData: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to ping bot service',
        targetUrl: `${botUrl}/health`,
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}