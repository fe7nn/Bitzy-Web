'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UploadCloud, 
  Settings2, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Sparkles,
  Database,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Student, SystemStats, AdminUser } from '@/lib/types';
import { StudentTable } from './StudentTable';
import { CsvAutoImporter } from './CsvAutoImporter';
import { SettingsAndBotIntegration } from './SettingsAndBotIntegration';
import { StudentModal } from './StudentModal';

interface DashboardProps {
  students: Student[];
  stats: SystemStats | null;
  isLoading: boolean;
  onRefreshData: () => void;
  adminUser: AdminUser;
  onOpenBotSimulator: () => void;
  onSupabaseStatusChange?: (connected: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  stats,
  isLoading,
  onRefreshData,
  adminUser,
  onOpenBotSimulator,
  onSupabaseStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<'masterlist' | 'csv' | 'settings'>('masterlist');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student CRUD operations
  const handleSaveStudent = async (studentData: Partial<Student>): Promise<boolean> => {
    try {
      if (editingStudent) {
        // Edit existing
        const res = await fetch(`/api/students/${editingStudent.student_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData),
        });
        if (!res.ok) throw new Error('Failed to update student');
      } else {
        // Create new
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData),
        });
        if (!res.ok) throw new Error('Failed to create student');
      }
      onRefreshData();
      return true;
    } catch (err: any) {
      alert(err.message || 'Error saving student record');
      return false;
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete student');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error deleting student');
    }
  };

  const handleUnlinkDiscord = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink' }),
      });
      if (!res.ok) throw new Error('Failed to unlink Discord');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error unlinking Discord');
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Stats */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold uppercase tracking-wider">
                Admin Control Room
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs text-slate-400 font-mono">Logged in as {adminUser.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ICpEP.SE Verification Masterlist
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage student registries, monitor real-time Discord claims, and configure bot bridges.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenBotSimulator}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#7983F5] border border-[#5865F2]/40 text-xs font-semibold transition hover:scale-105"
            >
              <Bot className="w-4 h-4" />
              <span>Simulate /verify</span>
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-glow-blue transition hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Compact Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Masterlist
              </span>
              <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                {stats ? stats.total_students : students.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Registered records</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Verified Members
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                {stats ? stats.verified_students : students.filter(s => s.is_verified).length}
              </span>
              <span className="text-[10px] text-emerald-500/80 font-medium">Discord linked</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pending Verification
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">
                {stats ? stats.unverified_students : students.filter(s => !s.is_verified).length}
              </span>
              <span className="text-[10px] text-amber-500/80 font-medium">Awaiting claim</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Verification Rate
              </span>
              <span className="text-2xl font-black text-blue-400 font-mono mt-0.5 block">
                {stats ? `${stats.verification_rate}%` : '0%'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Community adoption</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('masterlist')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'masterlist'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Masterlist & Quick Stats</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'csv'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Instant CSV Auto-Ingest</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'settings'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Bot & Supabase Settings</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'masterlist' && (
          <StudentTable
            students={students}
            isLoading={isLoading}
            onRefresh={onRefreshData}
            onOpenAddModal={openAddModal}
            onOpenEditModal={openEditModal}
            onDeleteStudent={handleDeleteStudent}
            onUnlinkDiscord={handleUnlinkDiscord}
          />
        )}

        {activeTab === 'csv' && (
          <CsvAutoImporter
            onImportComplete={() => {
              onRefreshData();
              setActiveTab('masterlist');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAndBotIntegration
            onSupabaseStatusChange={onSupabaseStatusChange}
          />
        )}
      </div>

      {/* Student Add/Edit Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveStudent}
        student={editingStudent}
      />
    </div>
  );
};
