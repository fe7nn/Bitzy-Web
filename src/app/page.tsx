'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/Dashboard';
import { BotSimulatorModal } from '@/components/BotSimulatorModal';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function HomePage() {
  const {
    adminUser,
    currentView,
    setCurrentView,
    students,
    stats,
    isLoadingStudents,
    refreshStudents,
    login,
    logout,
    isSimulatorOpen,
    setIsSimulatorOpen,
    toast,
  } = useApp();

  const handleOpenLoginModal = () => {
    setCurrentView('landing');
    const el = document.getElementById('admin-login-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        adminUser={adminUser}
        onOpenLoginModal={handleOpenLoginModal}
        onLogout={logout}
        onOpenBotSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main View Container */}
      <div className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage
            stats={stats}
            adminUser={adminUser}
            onAdminLogin={login}
            onOpenBotSimulator={() => setIsSimulatorOpen(true)}
            onGoToDashboard={() => setCurrentView('admin')}
          />
        ) : adminUser ? (
          <Dashboard
            students={students}
            stats={stats}
            isLoading={isLoadingStudents}
            onRefreshData={refreshStudents}
            adminUser={adminUser}
            onOpenBotSimulator={() => setIsSimulatorOpen(true)}
          />
        ) : (
          <LandingPage
            stats={stats}
            adminUser={null}
            onAdminLogin={login}
            onOpenBotSimulator={() => setIsSimulatorOpen(true)}
            onGoToDashboard={() => setCurrentView('admin')}
          />
        )}
      </div>

      {/* Discord Bot Simulator Modal */}
      <BotSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onVerificationSuccess={refreshStudents}
      />

      {/* Global Toast Notification System */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-300'
              : 'bg-blue-950/95 border-blue-500/40 text-blue-300'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}