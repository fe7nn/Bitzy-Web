'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Link2Off, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { Student } from '@/lib/types';
import { formatStudentFullName } from '@/lib/db';

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (student: Student) => void;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onUnlinkDiscord: (studentId: string) => Promise<void>;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  isLoading,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteStudent,
  onUnlinkDiscord,
}) => {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filtered List
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search
      const searchTarget = `${s.student_id} ${s.last_name} ${s.first_name} ${s.middle_name || ''} ${s.discord_tag || ''} ${s.discord_id || ''}`.toLowerCase();
      if (search.trim() && !searchTarget.includes(search.toLowerCase().trim())) {
        return false;
      }

      // Course filter
      if (courseFilter !== 'ALL' && s.course.toUpperCase() !== courseFilter.toUpperCase()) {
        return false;
      }

      // Year filter
      if (yearFilter !== 'ALL' && s.year_level !== yearFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'VERIFIED' && !s.is_verified) return false;
      if (statusFilter === 'UNVERIFIED' && s.is_verified) return false;

      return true;
    });
  }, [students, search, courseFilter, yearFilter, statusFilter]);

  // Export to CSV handler
  const handleExportCsv = () => {
    const headers = ['student_id', 'last_name', 'first_name', 'middle_name', 'course', 'year_level', 'is_verified', 'discord_id', 'discord_tag', 'verified_at'];
    const rows = filteredStudents.map(s => [
      s.student_id,
      `"${s.last_name}"`,
      `"${s.first_name}"`,
      `"${s.middle_name || ''}"`,
      s.course,
      s.year_level,
      s.is_verified ? 'TRUE' : 'FALSE',
      s.discord_id || '',
      `"${s.discord_tag || ''}"`,
      s.verified_at || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ICpEP_Masterlist_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUnlink = async (student: Student) => {
    if (window.confirm(`Are you sure you want to unlink Discord for ${student.student_id} (${formatStudentFullName(student)})?`)) {
      setActionLoadingId(student.student_id);
      try {
        await onUnlinkDiscord(student.student_id);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleDelete = async (student: Student) => {
    if (window.confirm(`Are you sure you want to permanently delete record for ${student.student_id} (${formatStudentFullName(student)})?`)) {
      setActionLoadingId(student.student_id);
      try {
        await onDeleteStudent(student.student_id);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800 shadow-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student ID, name, or Discord tag..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#070b14] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Courses</option>
            <option value="BSCPE">BSCpE</option>
            <option value="BSCS">BSCS</option>
            <option value="BSIT">BSIT</option>
            <option value="BSIS">BSIS</option>
            <option value="BSECE">BSECE</option>
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Year Levels</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="5th Year">5th Year</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="UNVERIFIED">Pending Only</option>
          </select>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            title="Refresh Masterlist"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-700/40 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-800 bg-[#0b1120]/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070b14]/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Official Name</th>
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Year Level</th>
                <th className="py-3.5 px-4">Discord Verification</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading && students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading masterlist records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No student records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or import a masterlist CSV.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const isActionLoading = actionLoadingId === student.student_id;
                  const fullName = formatStudentFullName(student);

                  return (
                    <tr 
                      key={student.student_id} 
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Student ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-300">
                        {student.student_id}
                      </td>

                      {/* Full Name */}
                      <td className="py-3.5 px-4 text-white">
                        <div className="font-semibold">{fullName}</div>
                        {student.middle_name && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Middle: {student.middle_name}
                          </div>
                        )}
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          student.course.toUpperCase() === 'BSCPE' 
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' 
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}>
                          {student.course}
                        </span>
                      </td>

                      {/* Year Level */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {student.year_level}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        {student.is_verified ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified</span>
                            </div>
                            {(student.discord_tag || student.discord_id) && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                {student.discord_tag ? (
                                  <span className="text-[#7983F5]">@{student.discord_tag}</span>
                                ) : (
                                  <span className="text-slate-500">ID: {student.discord_id}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Unlinked / Pending</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {student.is_verified && (
                            <button
                              onClick={() => handleUnlink(student)}
                              disabled={isActionLoading}
                              title="Unlink Discord account"
                              className="p-1.5 rounded-md bg-amber-950/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800/40 transition hover:scale-105"
                            >
                              <Link2Off className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenEditModal(student)}
                            disabled={isActionLoading}
                            title="Edit Record"
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition hover:scale-105"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(student)}
                            disabled={isActionLoading}
                            title="Delete Record"
                            className="p-1.5 rounded-md bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 transition hover:scale-105"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-[#070b14]/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div>
            Showing <span className="text-white font-bold">{filteredStudents.length}</span> of{' '}
            <span className="text-white font-bold">{students.length}</span> total students
          </div>
          <div>
            Verified:{' '}
            <span className="text-emerald-400 font-bold">
              {filteredStudents.filter(s => s.is_verified).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
