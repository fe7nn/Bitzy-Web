'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, RefreshCw, Wifi, WifiOff, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { BotStatusInfo } from '@/lib/types';

interface BotStatusBadgeProps {
  compact?: boolean;
}

export const BotStatusBadge: React.FC<BotStatusBadgeProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<BotStatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchBotStatus = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/bot/status', { cache: 'no-store' });
      if (res.ok) {
        const data: BotStatusInfo = await res.json();
        setStatus(data);
      } else {
        setStatus({
          online: false,
          status: 'offline',
          error: `HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      setStatus({
        online: false,
        status: 'offline',
        error: err.message || 'Connection failed',
      });
    } finally {
      setIsLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchBotStatus();
    // Poll status every 25 seconds
    const interval = setInterval(() => {
      fetchBotStatus();
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchBotStatus]);

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Just started';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const isOnline = status?.online === true && status?.status === 'online';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => fetchBotStatus(true)}
        title="Click to refresh bot status"
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 select-none ${
          isLoading
            ? 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            : isOnline
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50 hover:border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
        }`}
      >
        {/* Pulsing indicator light */}
        <span className="relative flex h-2 w-2">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLoading ? 'bg-slate-500' : isOnline ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          ></span>
        </span>

        {/* Icon & Label */}
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span className="tracking-tight">
            {isLoading
              ? 'Checking Bot...'
              : isOnline
              ? compact
                ? 'Online'
                : 'Bot Active'
              : compact
              ? 'Offline'
              : 'Bot Offline'}
          </span>
        </div>

        {isRefreshing && <RefreshCw className="w-3 h-3 animate-spin text-slate-400 ml-0.5" />}
      </button>

      {/* Hover Status Card / Tooltip */}
      {showTooltip && status && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3.5 rounded-xl bg-[#080d1a] border border-slate-700/80 shadow-2xl text-xs z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-white">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Discord Bot Gateway</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {isOnline ? (
            <div className="space-y-1.5 text-[11px] text-slate-300">
              {status.botUser && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tag:</span>
                  <span className="font-mono text-emerald-400 font-bold">{status.botUser}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">HTTP Latency:</span>
                <span className="font-mono text-white">{status.latencyMs ?? 0}ms</span>
              </div>
              {status.ping !== undefined && status.ping >= 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Discord Ping:</span>
                  <span className="font-mono text-blue-400">{status.ping}ms</span>
                </div>
              )}
              {status.guilds !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Servers Connected:</span>
                  <span className="font-mono text-white">{status.guilds}</span>
                </div>
              )}
              {status.uptimeSeconds !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Uptime:</span>
                  <span className="font-mono text-slate-200">{formatUptime(status.uptimeSeconds)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-1.5 text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>The bot service is unreachable or sleeping.</span>
              </div>
              {status.error && (
                <div className="p-1.5 rounded bg-rose-950/40 border border-rose-900/60 font-mono text-[10px] text-rose-400 break-all">
                  {status.error}
                </div>
              )}
              <p className="text-[10px] text-slate-400">
                Ensure your Render service is running and <code className="text-blue-400">DISCORD_BOT_URL</code> is set in Vercel.
              </p>
            </div>
          )}

          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Auto-refreshing</span>
            <button
              onClick={() => fetchBotStatus(true)}
              className="hover:text-blue-400 underline transition"
            >
              Refresh now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};