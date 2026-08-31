import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customUrl = searchParams.get('url');

  const botUrl =
    customUrl ||
    process.env.DISCORD_BOT_URL ||
    process.env.NEXT_PUBLIC_DISCORD_BOT_URL ||
    'https://bitzy-discord-bot.onrender.com';

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(botUrl, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Bitzy-Web-Status-Checker/1.0',
      },
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return NextResponse.json({
        online: false,
        status: 'unhealthy',
        botUrl,
        latencyMs,
        error: `Bot health check returned HTTP ${res.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      online: true,
      status: data.status || 'online',
      botUser: data.botUser || 'Bitzy Bot',
      botId: data.botId || null,
      isReady: data.isReady ?? true,
      guilds: data.guilds ?? 0,
      ping: data.ping ?? -1,
      uptimeSeconds: data.uptimeSeconds ?? 0,
      latencyMs,
      botUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = error.name === 'AbortError';

    return NextResponse.json({
      online: false,
      status: 'offline',
      botUser: null,
      botUrl,
      latencyMs,
      error: isTimeout
        ? 'Connection timed out (bot service may be sleeping or offline)'
        : error.message || 'Failed to connect to bot health check endpoint',
      timestamp: new Date().toISOString(),
    });
  }
}