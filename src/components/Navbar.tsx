'use client';

import React from 'react';
import { Cpu, ShieldCheck, Terminal, LogIn, LogOut, LayoutDashboard, Home, Database } from 'lucide-react';
import { AdminUser } from '@/lib/types';

interface NavbarProps {
  currentView: 'landing' | 'admin';
  setCurrentView: (view: 'landing' | 'admin') => void;
  adminUser: AdminUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onOpenBotSimulator: () => void;
  supabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  adminUser,
  onOpenLoginModal,
  onLogout,
  onOpenBotSimulator,
  supabaseConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#050811]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div 
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 p-0.5 shadow-glow-blue">
            <div className="w-full h-full bg-[#0b1120] rounded-[10px] flex items-center justify-center group-hover:bg-[#0f172a] transition-colors">
              <Cpu className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-[#050811]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-lg">
                ICpEP<span className="text-orange-500">.</span>SE
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Bitzy Gate
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Institute of Computer Engineers of the Philippines
            </p>
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono">
              {supabaseConnected ? 'Supabase Sync' : 'Local DB Active'}
            </span>
          </div>

          {/* Discord Bot Simulator Trigger */}
          <button
            onClick={onOpenBotSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-[#7983F5] border border-[#5865F2]/30 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Simulate Discord /verify slash command"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bot Simulator</span>
            <span className="sm:hidden">Bot</span>
          </button>

          {/* View Toggle / Admin Actions */}
          {adminUser ? (
            <div className="flex items-center gap-2">
              {currentView === 'landing' ? (
                <button
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-glow-blue hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('landing')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 hover:scale-[1.02]"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Landing Page</span>
                </button>
              )}

              {/* Admin Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{adminUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{adminUser.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out of Admin Portal"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-glow-blue hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Admin Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
