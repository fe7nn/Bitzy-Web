'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { AdminUser } from '@/lib/types';
import logo from './icpep-logo.png';

import { BotStatusBadge } from './BotStatusBadge';

interface NavbarProps {
  currentView: 'landing' | 'admin';
  setCurrentView: (view: 'landing' | 'admin') => void;
  adminUser: AdminUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onOpenBotSimulator?: () => void;
  supabaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  adminUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#050811]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div
          onClick={() => setCurrentView(adminUser ? 'admin' : 'landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img
            src={logo.src}
            alt="ICpEP.SE Logo"
            className="w-14 h-14 flex items-center justify-center mx-auto p-1.5 object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-base font-extrabold tracking-tight text-white">
                ICpEP<span className="text-orange-500">.</span>SE
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Bitzy Gate
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Institute of Computer Engineers of the Philippines - Student Edition
            </p>
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-3">
          {/* Navigation View Switcher (When Authenticated) */}
          {adminUser && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-[#070b14] border border-slate-800">
              <button
                onClick={() => setCurrentView('landing')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  currentView === 'landing'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  currentView === 'admin'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dashboard
              </button>
            </div>
          )}

          {/* Live Bot Status Badge */}
          <BotStatusBadge />

          {/* View Toggle / Admin Actions */}
          {adminUser ? (
            <div className="flex items-center gap-2">
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
          ) : null}
        </div>
      </div>
    </header>
  );
};
