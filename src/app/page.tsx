'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/Dashboard';
import { BotSimulatorModal } from '@/components/BotSimulatorModal';
import { Student, SystemStats, AdminUser } from '@/lib/types';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBotSimulatorOpen, setIsBotSimulatorOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // 1. Initialize admin session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('bitzy_admin_user');
      if (savedUser) {
        setAdminUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Fetch students & stats
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsRes, statsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/stats'),
      ]);

      if (studentsRes.ok) {
        const studentsJson = await studentsRes.json();
        if (studentsJson.data) setStudents(studentsJson.data);
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Admin login handler
  const handleAdminLogin = (user: AdminUser) => {
    setAdminUser(user);
    try {
      localStorage.setItem('bitzy_admin_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    setCurrentView('admin');
  };

  // Admin logout handler
  const handleAdminLogout = () => {
    setAdminUser(null);
    try {
      localStorage.removeItem('bitzy_admin_user');
    } catch {
      // ignore
    }
    setCurrentView('landing');
  };

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
        onLogout={handleAdminLogout}
        onOpenBotSimulator={() => setIsBotSimulatorOpen(true)}
        supabaseConnected={supabaseConnected}
      />

      {/* Main View Container */}
      <div className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage
            stats={stats}
            adminUser={adminUser}
            onAdminLogin={handleAdminLogin}
            onOpenBotSimulator={() => setIsBotSimulatorOpen(true)}
            onGoToDashboard={() => setCurrentView('admin')}
          />
        ) : (
          adminUser ? (
            <Dashboard
              students={students}
              stats={stats}
              isLoading={isLoading}
              onRefreshData={fetchData}
              adminUser={adminUser}
              onOpenBotSimulator={() => setIsBotSimulatorOpen(true)}
            />
          ) : (
            <LandingPage
              stats={stats}
              adminUser={null}
              onAdminLogin={handleAdminLogin}
              onOpenBotSimulator={() => setIsBotSimulatorOpen(true)}
              onGoToDashboard={() => setCurrentView('admin')}
            />
          )
        )}
      </div>

      {/* Discord Bot Simulator Modal */}
      <BotSimulatorModal
        isOpen={isBotSimulatorOpen}
        onClose={() => setIsBotSimulatorOpen(false)}
        onVerificationSuccess={fetchData}
      />
    </main>
  );
}
