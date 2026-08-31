'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SystemStats, AdminUser } from '@/lib/types';
import { supabaseAuth } from '@/lib/supabaseAuthClient';
import logo from './icpep-logo.png';

interface LandingPageProps {
  stats: SystemStats | null;
  onAdminLogin: (user: AdminUser) => void;
  onOpenBotSimulator: () => void;
  onGoToDashboard: () => void;
  adminUser: AdminUser | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onAdminLogin,
  onOpenBotSimulator,
  onGoToDashboard,
  adminUser,
}) => {
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
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
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session || !data.user) {
        setLoginError(error?.message || 'Invalid email or password.');
        return;
      }

      onAdminLogin({
        email: data.user.email || email.trim(),
        name: (data.user.email || email).split('@')[0].toUpperCase(),
        role: 'Admin',
        token: data.session.access_token,
      });
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#050811] text-slate-100 radial-grid selection:bg-blue-600 min-h-screen flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 items-center justify-items-center xl:justify-items-stretch">
          {/* Left Column: Hero Showcase */}
          <div className="xl:col-span-6 space-y-6 text-center xl:text-left max-w-xl xl:max-w-none">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-tight">
              ICpEP<span className="text-orange-500">.</span>SE Discord Verification
            </h1>

            {/* Subheading */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Link student records to Discord identities and verify members automatically.
            </p>
          </div>

          {/* Right Column: Gmail Admin Login Card */}
          <div id="admin-login-card" className="xl:col-span-6 w-full flex justify-center xl:justify-end">
            <div className="w-full max-w-md relative p-6 sm:p-8 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-2xl space-y-6">
              {adminUser ? (
                /* Authenticated Admin Session Card */
                <div className="space-y-6">
                  <div className="space-y-3 text-center">
                    <img
                      src={logo.src}
                      alt="ICpEP.SE Logo"
                      className="w-20 h-20 flex items-center justify-center mx-auto p-1.5 object-contain"
                    />
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Authenticated Admin Session</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">{adminUser.name}</h2>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{adminUser.email}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Role:</span>
                      <span className="font-bold text-white font-mono">{adminUser.role || 'Administrator'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Database Auth:</span>
                      <span className="font-bold text-emerald-400">Supabase Connected</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={onGoToDashboard}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-blue transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <span>Enter Admin Dashboard</span>
                      <span>➔</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenBotSimulator}
                      className="w-full py-2.5 rounded-xl bg-[#070b14] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2"
                    >
                      <span>Simulate Discord /verify</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Unauthenticated Login Form */
                <>
                  <div className="space-y-4 text-center">
                    <img
                      src={logo.src}
                      alt="ICpEP.SE Logo"
                      className="w-20 h-20 flex items-center justify-center mx-auto p-1.5 object-contain"
                    />
                    <h2 className="text-xl font-extrabold text-white">Admin Sign-In</h2>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-800 w-full" />
                  </div>

                  <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5 text-xs">
                    {loginError && (
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
                        {loginError}
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
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
                      <label className="block font-semibold text-slate-300 mb-1">Password</label>
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
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bottom-0 w-full py-8 px-8 border-t border-slate-800/80 bg-[#070b14] text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Institute of Computer Engineers of the Philippines - Student Edition (ICpEP.SE).</p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <a href="/terms" className="hover:text-blue-400 underline transition">Terms of Service</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-blue-400 underline transition">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};