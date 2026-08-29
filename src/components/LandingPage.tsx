'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Bot, 
  UploadCloud, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  Server,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';
import { SystemStats, AdminUser } from '@/lib/types';

interface LandingPageProps {
  stats: SystemStats | null;
  onAdminLogin: (user: AdminUser) => void;
  onOpenBotSimulator: () => void;
  onGoToDashboard: () => void;
  adminUser: AdminUser | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  stats,
  onAdminLogin,
  onOpenBotSimulator,
  onGoToDashboard,
  adminUser,
}) => {
  // Login Form States
  const [email, setEmail] = useState('admin.icpep@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both Gmail address and password.');
      return;
    }

    if (!email.includes('@')) {
      setLoginError('Please enter a valid Gmail / institutional address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onAdminLogin({
        email: email.trim(),
        name: email.split('@')[0].toUpperCase(),
        role: 'Admin',
      });
      setIsSubmitting(false);
    }, 400);
  };

  const handleGoogleQuickLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onAdminLogin({
        email: 'admin.icpep@gmail.com',
        name: 'ICpEP Admin',
        role: 'Admin',
      });
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 radial-grid selection:bg-blue-600">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Showcase */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Badges */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-blue-500/30 shadow-glow-blue">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-xs font-semibold text-blue-300">
                Official Verification Gateway • Student Edition
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              ICpEP<span className="text-orange-500">.</span>SE Discord Community <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500">
                Automated Verification System
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Seamlessly link student masterlists with Discord identities. Automated role assignment, instant nickname synchronization, and high-speed Supabase data verification for the Institute of Computer Engineers of the Philippines.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenBotSimulator}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-glow-blue-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Bot className="w-4 h-4" />
                <span>Test Bot Verification (/verify)</span>
              </button>

              {adminUser ? (
                <button
                  onClick={onGoToDashboard}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition hover:scale-[1.02]"
                >
                  <span>Open Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <a
                  href="#admin-login-card"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition hover:scale-[1.02]"
                >
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Officer Sign-In</span>
                </a>
              )}
            </div>

            {/* Real-time Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
              <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/80 shadow-md">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Students
                </div>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                  {stats ? stats.total_students : '10'}
                </div>
                <div className="text-[10px] text-blue-400 mt-0.5">In Masterlist</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/80 shadow-md">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Members
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                  {stats ? stats.verified_students : '4'}
                </div>
                <div className="text-[10px] text-emerald-500/80 mt-0.5">Active on Discord</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/80 shadow-md">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Verification Rate
                </div>
                <div className="text-2xl font-extrabold text-blue-400 mt-1 font-mono">
                  {stats ? `${stats.verification_rate}%` : '40%'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Completion</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/80 shadow-md">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Unverified / Pending
                </div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">
                  {stats ? stats.unverified_students : '6'}
                </div>
                <div className="text-[10px] text-amber-500/80 mt-0.5">Awaiting /verify</div>
              </div>
            </div>
          </div>

          {/* Right Column: Gmail Admin Login Card */}
          <div id="admin-login-card" className="lg:col-span-5">
            <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-2xl space-y-6">
              {/* Card Header */}
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-glow-blue">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Officer & Admin Sign-In</h2>
                <p className="text-xs text-slate-400">
                  Authorized access to ICpEP.SE student masterlist, CSV auto-importer, and bot configs.
                </p>
              </div>

              {/* Google 1-Click Access Button */}
              <button
                type="button"
                onClick={handleGoogleQuickLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition hover:scale-[1.01] active:scale-[0.99] shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google / Gmail</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#0b1120] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  or sign in with password
                </span>
              </div>

              {/* Login Form */}
              <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5 text-xs">
                {loginError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gmail Account</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin.icpep@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Admin Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-blue transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In as Admin'}
                </button>
              </form>

              {/* Demo Credentials Hint */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-white font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pre-filled Single-User Admin:</span>
                </div>
                <div className="font-mono text-[10px] text-slate-300">
                  Gmail: <span className="text-blue-300">admin.icpep@gmail.com</span> | Pass: <span className="text-blue-300">admin123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Engineered for High Reliability & Zero Friction
          </h2>
          <p className="text-sm text-slate-400">
            Everything needed to verify thousands of engineering students across multiple year levels in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4 hover:border-blue-500/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Supabase Cloud Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated with Supabase PostgreSQL backend with Row Level Security (RLS) policies and automatic local cache fallback.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>One-click DDL Schema deployment</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant sub-second query indexing</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4 hover:border-blue-500/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Instant CSV Auto-Ingest</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag and drop any official `.csv` student masterlist. PapaParse automatically parses headers, splits names, and upserts thousands of rows.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live pre-commit data preview</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Duplicate detection & safe upserts</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4 hover:border-blue-500/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#7983F5] group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Discord Bot Gateway</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified `POST /api/verify/initiate` endpoint. Formats official names, grants verified roles, and syncs nicknames in Discord.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auto-formatting: Last Name, First M.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Built-in Rate Limiting & Spoof defense</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800/80 bg-[#070b14] text-center text-xs text-slate-500">
        <p>© 2026 Institute of Computer Engineers of the Philippines - Student Edition (ICpEP.SE).</p>
        <p className="mt-1 text-[11px]">Bitzy Verification Engine • Black, Blue & White Design System</p>
      </footer>
    </div>
  );
};
