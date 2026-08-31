'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, SystemStats, AdminUser, BotStatusInfo } from '@/lib/types';
import { supabaseAuth } from '@/lib/supabaseAuthClient';

interface ToastNotification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Session & Authentication
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  login: (user: AdminUser) => void;
  logout: () => Promise<void>;

  // View Navigation (with persistence across reloads)
  currentView: 'landing' | 'admin';
  setCurrentView: (view: 'landing' | 'admin') => void;
  activeTab: 'masterlist' | 'csv' | 'analytics';
  setActiveTab: (tab: 'masterlist' | 'csv' | 'analytics') => void;

  // Masterlist & Verification State
  students: Student[];
  stats: SystemStats | null;
  isLoadingStudents: boolean;
  refreshStudents: () => Promise<void>;
  verifyStudent: (studentId: string) => Promise<boolean>;
  unlinkStudent: (studentId: string) => Promise<boolean>;

  // Bot Status State
  botStatus: BotStatusInfo | null;
  isLoadingBotStatus: boolean;
  refreshBotStatus: () => Promise<void>;

  // Modals & Notifications
  isSimulatorOpen: boolean;
  setIsSimulatorOpen: (open: boolean) => void;
  toast: ToastNotification | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const VIEW_STORAGE_KEY = 'bitzy_active_view';
const USER_STORAGE_KEY = 'bitzy_admin_user';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // View State (recovers from localStorage)
  const [currentView, setCurrentViewState] = useState<'landing' | 'admin'>('landing');
  const [activeTab, setActiveTab] = useState<'masterlist' | 'csv' | 'analytics'>('masterlist');

  // Masterlist State
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Bot Status State
  const [botStatus, setBotStatus] = useState<BotStatusInfo | null>(null);
  const [isLoadingBotStatus, setIsLoadingBotStatus] = useState(true);

  // UI State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Custom setter for view to persist in localStorage
  const setCurrentView = useCallback((view: 'landing' | 'admin') => {
    setCurrentViewState(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // ignore
    }
  }, []);

  // Global Toast Dispatcher
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // 1. Session Initialization & Recovery
  useEffect(() => {
    // Check localStorage for saved view preference
    try {
      const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
      if (savedView === 'admin' || savedView === 'landing') {
        setCurrentViewState(savedView);
      }
    } catch {
      // ignore
    }

    // Initialize Supabase Auth Session
    supabaseAuth.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session?.user) {
        const user: AdminUser = {
          email: session.user.email || '',
          name: (session.user.email || '').split('@')[0].toUpperCase(),
          role: 'Admin',
          token: session.access_token,
        };
        setAdminUser(user);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch {
          // ignore
        }
      }
      setIsLoadingSession(false);
    });

    // Listen for Auth Changes (Token refresh, expiration, sign out)
    const { data: listener } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user: AdminUser = {
          email: session.user.email || '',
          name: (session.user.email || '').split('@')[0].toUpperCase(),
          role: 'Admin',
          token: session.access_token,
        };
        setAdminUser(user);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch {
          // ignore
        }
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
        setCurrentViewState('landing');
        try {
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(VIEW_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 2. Masterlist & Statistics Fetcher
  const refreshStudents = useCallback(async () => {
    if (!adminUser?.token) {
      setIsLoadingStudents(false);
      return;
    }
    setIsLoadingStudents(true);
    try {
      const authHeaders = { Authorization: `Bearer ${adminUser.token}` };
      const [studentsRes, statsRes] = await Promise.all([
        fetch('/api/students', { headers: authHeaders }),
        fetch('/api/stats', { headers: authHeaders }),
      ]);

      if (studentsRes.ok) {
        const studentsJson = await studentsRes.json();
        if (studentsJson.data) setStudents(studentsJson.data);
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson);
      }
    } catch (err: any) {
      console.error('Failed to load masterlist data:', err);
      showToast('error', 'Failed to synchronize with database');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [adminUser?.token, showToast]);

  // Load student data whenever admin session becomes available
  useEffect(() => {
    if (adminUser?.token) {
      refreshStudents();
    }
  }, [adminUser?.token, refreshStudents]);

  // 3. Bot Status Fetcher
  const refreshBotStatus = useCallback(async () => {
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
        error: err.message || 'Bot gateway probe failed',
      });
    } finally {
      setIsLoadingBotStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshBotStatus();
    const interval = setInterval(() => refreshBotStatus(), 20000);
    return () => clearInterval(interval);
  }, [refreshBotStatus]);

  // 4. Action Handlers
  const login = useCallback(
    (user: AdminUser) => {
      setAdminUser(user);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {
        // ignore
      }
      setCurrentView('admin');
      showToast('success', `Welcome back, ${user.name}!`);
    },
    [setCurrentView, showToast]
  );

  const logout = useCallback(async () => {
    try {
      await supabaseAuth.auth.signOut();
    } catch {
      // ignore
    }
    setAdminUser(null);
    setCurrentView('landing');
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(VIEW_STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('info', 'You have been signed out.');
  }, [setCurrentView, showToast]);

  const verifyStudent = useCallback(
    async (studentId: string): Promise<boolean> => {
      if (!adminUser?.token) return false;
      try {
        const res = await fetch(`/api/students/${studentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminUser.token}`,
          },
          body: JSON.stringify({ is_verified: true }),
        });
        if (!res.ok) throw new Error('Failed to verify student record');
        await refreshStudents();
        showToast('success', `Student ID ${studentId} manually verified!`);
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Error verifying student');
        return false;
      }
    },
    [adminUser?.token, refreshStudents, showToast]
  );

  const unlinkStudent = useCallback(
    async (studentId: string): Promise<boolean> => {
      if (!adminUser?.token) return false;
      try {
        const res = await fetch(`/api/students/${studentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminUser.token}`,
          },
          body: JSON.stringify({ action: 'unlink' }),
        });
        if (!res.ok) throw new Error('Failed to unlink Discord account');
        await refreshStudents();
        showToast('success', `Discord account unlinked for ${studentId}.`);
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Error unlinking Discord');
        return false;
      }
    },
    [adminUser?.token, refreshStudents, showToast]
  );

  return (
    <AppContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoadingSession,
        login,
        logout,
        currentView,
        setCurrentView,
        activeTab,
        setActiveTab,
        students,
        stats,
        isLoadingStudents,
        refreshStudents,
        verifyStudent,
        unlinkStudent,
        botStatus,
        isLoadingBotStatus,
        refreshBotStatus,
        isSimulatorOpen,
        setIsSimulatorOpen,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}