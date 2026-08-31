'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Bot,
  Activity,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Server,
  Zap,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Student, SystemStats, BotStatusInfo, GuildSettings } from '@/lib/types';
import { useApp } from '@/context/AppContext';

interface AnalyticsAndBotHealthProps {
  students: Student[];
  stats: SystemStats | null;
  onOpenBotSimulator: () => void;
}

export const AnalyticsAndBotHealth: React.FC<AnalyticsAndBotHealthProps> = ({
  students,
  stats,
  onOpenBotSimulator,
}) => {
  const { adminUser, showToast } = useApp();
  const [botStatus, setBotStatus] = useState<BotStatusInfo | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Dynamic Guild Settings State
  const [guildSettings, setGuildSettings] = useState<GuildSettings>({
    guild_id: 'default',
    guild_name: 'ICpEP.SE CIT - U Chapter',
    verified_role_name: 'ka-CpE',
    unverified_role_name: 'Unverified',
    verify_channel_name: 'verify',
    nickname_format: 'First M. Last',
    auto_delete_seconds: 6,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch current guild settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/guild');
      if (res.ok) {
        const json = await res.json();
        if (json.settings) {
          setGuildSettings(json.settings);
        }
      }
    } catch (err) {
      console.warn('Failed to load guild settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save updated guild settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser?.token) {
      showToast('error', 'Admin authorization required to modify server settings.');
      return;
    }
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings/guild', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminUser.token}`,
        },
        body: JSON.stringify(guildSettings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }
      showToast('success', '✅ Discord bot server settings updated & synced!');
    } catch (err: any) {
      showToast('error', err.message || 'Error saving guild settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/bot/status', { cache: 'no-store' });
      if (res.ok) {
        const data: BotStatusInfo = await res.json();
        setBotStatus(data);
      } else {
        setBotStatus({
          online: false,
          status: 'offline',
          error: `HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      setBotStatus({
        online: false,
        status: 'offline',
        error: err.message || 'Failed to connect to bot gateway',
      });
    } finally {
      setIsLoadingStatus(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 20000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // --- Compute Live Analytics from students array ---
  const total = students.length;
  const verifiedCount = students.filter(s => s.is_verified).length;
  const unverifiedCount = total - verifiedCount;
  const verificationRate = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

  // Year level aggregation
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  const yearStats = yearLevels.map(year => {
    const inYear = students.filter(s => s.year_level === year);
    const verifiedInYear = inYear.filter(s => s.is_verified).length;
    const rate = inYear.length > 0 ? Math.round((verifiedInYear / inYear.length) * 100) : 0;
    return {
      year,
      total: inYear.length,
      verified: verifiedInYear,
      rate,
    };
  });

  // Course distribution aggregation
  const courses = Array.from(new Set(students.map(s => s.course || 'BSCpE')));
  const courseStats = courses.map(course => {
    const inCourse = students.filter(s => (s.course || 'BSCpE') === course);
    const verifiedInCourse = inCourse.filter(s => s.is_verified).length;
    const rate = inCourse.length > 0 ? Math.round((verifiedInCourse / inCourse.length) * 100) : 0;
    return {
      course,
      total: inCourse.length,
      verified: verifiedInCourse,
      rate,
    };
  });

  // Recent Verifications
  const recentVerifications = [...students]
    .filter(s => s.is_verified && s.verified_at)
    .sort((a, b) => new Date(b.verified_at!).getTime() - new Date(a.verified_at!).getTime())
    .slice(0, 5);

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Just started';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const isOnline = botStatus?.online === true && botStatus?.status === 'online';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Live Bot Health & Diagnostics Card (Render Service) */}
      <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white">Discord Bot Live Diagnostics</h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    isLoadingStatus
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : isOnline
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLoadingStatus
                        ? 'bg-slate-500'
                        : isOnline
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-rose-400'
                    }`}
                  />
                  {isLoadingStatus ? 'Probing...' : isOnline ? 'Render Service Online' : 'Render Service Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time WebSocket handshake, Render worker gateway, and Supabase Keep-Alive health.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchStatus(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Health'}</span>
            </button>
            <button
              onClick={onOpenBotSimulator}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#7983F5] border border-[#5865F2]/40 text-xs font-semibold transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Simulate /verify</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Bot Instance</span>
            <span className="text-sm font-bold text-white font-mono mt-1 block truncate">
              {botStatus?.botUser || (isLoadingStatus ? 'Checking...' : 'Offline')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {botStatus?.botId ? `ID: ${botStatus.botId.slice(0, 8)}...` : 'Render Free Tier'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">HTTP Latency</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">
              {botStatus?.latencyMs !== undefined ? `${botStatus.latencyMs}ms` : '---'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Roundtrip API probe</span>
          </div>

          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Gateway Ping</span>
            <span className="text-sm font-bold text-blue-400 font-mono mt-1 block">
              {botStatus?.ping !== undefined && botStatus.ping >= 0 ? `${botStatus.ping}ms` : '---'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Discord WebSocket latency</span>
          </div>

          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Process Uptime</span>
            <span className="text-sm font-bold text-indigo-300 font-mono mt-1 block">
              {botStatus?.uptimeSeconds ? formatUptime(botStatus.uptimeSeconds) : '---'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Triple Keep-Alive Active</span>
          </div>
        </div>

        {/* Keep-Alive Status Banner */}
        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-blue-300">
            <Zap className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Render 24/7 Keep-Alive:</strong> Triple-layer automated pinger active via <code>bot.js</code> internal timer, Supabase <code>pg_cron</code> (every 10m), and web status probes.
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">
            https://bitzy-discord-bot.onrender.com
          </span>
        </div>
      </div>

      {/* 2. Visual Analytics & Verification Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Overview Progress Card */}
        <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Verification Adoption</h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">{verificationRate}%</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Verified Community Members</span>
                <span className="font-mono font-bold text-emerald-400">{verifiedCount} / {total}</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  style={{ width: `${verificationRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Claimed Roles</span>
                <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">{verifiedCount}</span>
                <span className="text-[10px] text-slate-500">ka-CpE active</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Unclaimed Records</span>
                <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">{unverifiedCount}</span>
                <span className="text-[10px] text-slate-500">Pending claim</span>
              </div>
            </div>
          </div>
        </div>

        {/* Year Level Distribution Visual Chart */}
        <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Verification by Year Level</h3>
            </div>
            <span className="text-[11px] text-slate-400">Total vs Verified</span>
          </div>

          <div className="space-y-3 pt-1">
            {yearStats.map(stat => (
              <div key={stat.year} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{stat.year}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">{stat.verified} verified</span>
                    <span className="text-slate-500">/ {stat.total} total</span>
                    <span className="text-blue-400 font-bold">({stat.rate}%)</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Recent Activity & Course Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Distribution */}
        <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Program Distribution</h3>
            </div>
            <span className="text-[11px] text-slate-400">{courseStats.length} Programs Registered</span>
          </div>

          <div className="space-y-3">
            {courseStats.map(c => (
              <div key={c.course} className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white font-mono block">{c.course}</span>
                  <span className="text-[10px] text-slate-400">
                    {c.verified} of {c.total} students verified
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-purple-400 font-mono block">{c.rate}%</span>
                  <span className="text-[10px] text-slate-500">admitted</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Verifications Timeline */}
        <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Latest Verified Students</h3>
            </div>
            <span className="text-[11px] text-slate-400">Live feed</span>
          </div>

          {recentVerifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No recent verifications recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentVerifications.map(s => (
                <div
                  key={s.student_id}
                  className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">
                        {s.last_name}, {s.first_name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {s.student_id} • {s.course} ({s.year_level})
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[10px] text-emerald-400 block">
                      {s.discord_tag || 'Discord Linked'}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {s.verified_at ? new Date(s.verified_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Dynamic Server & Role Configuration Editor */}
      <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Server & Role Configuration</h3>
              <p className="text-xs text-slate-400">
                Customize verified role names, channel triggers, and nickname formats in real-time without redeploying.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
            guild_settings Table Active
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Field 1: Verified Role Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Verified Role Name <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                required
                value={guildSettings.verified_role_name}
                onChange={e =>
                  setGuildSettings({ ...guildSettings, verified_role_name: e.target.value })
                }
                placeholder="e.g. ka-CpE"
                className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500 block">Role automatically granted to verified members</span>
            </div>

            {/* Field 2: Unverified Role to Remove */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Unverified Role to Remove
              </label>
              <input
                type="text"
                value={guildSettings.unverified_role_name}
                onChange={e =>
                  setGuildSettings({ ...guildSettings, unverified_role_name: e.target.value })
                }
                placeholder="e.g. Unverified"
                className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500 block">Stripped from member upon successful verification</span>
            </div>

            {/* Field 3: Verify Channel Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Verification Channel Name <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                required
                value={guildSettings.verify_channel_name}
                onChange={e =>
                  setGuildSettings({ ...guildSettings, verify_channel_name: e.target.value })
                }
                placeholder="e.g. verify"
                className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500 block">Discord text channel listened by Bitzy</span>
            </div>

            {/* Field 4: Nickname Format */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Member Nickname Format
              </label>
              <select
                value={guildSettings.nickname_format}
                onChange={e =>
                  setGuildSettings({ ...guildSettings, nickname_format: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
              >
                <option value="First M. Last">First M. Last (e.g. Juan D. Cruz)</option>
                <option value="First Last">First Last (e.g. Juan Cruz)</option>
                <option value="Last, First M.">Last, First M. (e.g. Cruz, Juan D.)</option>
              </select>
              <span className="text-[10px] text-slate-500 block">Format applied to member server nickname</span>
            </div>

            {/* Field 5: Auto-Delete Seconds */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Chat Auto-Purge Delay (Seconds)
              </label>
              <input
                type="number"
                min={3}
                max={60}
                value={guildSettings.auto_delete_seconds}
                onChange={e =>
                  setGuildSettings({ ...guildSettings, auto_delete_seconds: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500 block">Seconds before chat messages in #verify are purged</span>
            </div>

            {/* Action Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSavingSettings || isLoadingSettings}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-blue transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Server Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 5. Discord Bot Commands & Administrative Operations Guide */}
      <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#7983F5]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Discord Bot Operations & Command Manual</h3>
              <p className="text-xs text-slate-400">
                Official slash commands, channel triggers, and server moderation procedures for Bitzy.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Command 1: /verify */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <code className="text-xs font-bold text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  /verify &lt;student_id&gt;
                </code>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Everyone</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Allows students to verify privately anywhere in the server via an ephemeral response with role granting and nickname synchronization.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard('/verify student_id:12-3456-789', 'cmd1')}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {copiedCmd === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'cmd1' ? 'Copied Command!' : 'Copy Example'}</span>
            </button>
          </div>

          {/* Command 2: /post-verify-guide */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <code className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  /post-verify-guide
                </code>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase">Admin Only</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Posts the official ICpEP.SE CIT - U welcome banner in <code className="text-blue-400">#verify</code> with the interactive <strong>&ldquo;🛡️ Click Here to Verify&rdquo;</strong> modal button and reaction.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard('/post-verify-guide', 'cmd2')}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {copiedCmd === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'cmd2' ? 'Copied Command!' : 'Copy Command'}</span>
            </button>
          </div>

          {/* Command 3: /clear */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <code className="text-xs font-bold text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  /clear &lt;amount&gt;
                </code>
                <span className="text-[10px] text-rose-400 font-semibold uppercase">Moderators</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bulk deletes recent messages in the active channel (Range: 1 to 100). Ideal for clearing testing logs and keeping channels clean.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard('/clear amount:20', 'cmd3')}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {copiedCmd === 'cmd3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'cmd3' ? 'Copied Command!' : 'Copy Example'}</span>
            </button>
          </div>
        </div>

        {/* Role Hierarchy Reminder Banner */}
        <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Discord Server Role Hierarchy Configuration</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Discord, a bot cannot assign or remove roles positioned above its own highest role. In <strong>Server Settings ➔ Roles</strong>, ensure the <strong>Bitzy</strong> role is positioned <strong>above</strong> <code className="text-emerald-400">ka-CpE</code> and <code className="text-amber-400">Unverified</code>.
          </p>
        </div>
      </div>
    </div>
  );
};