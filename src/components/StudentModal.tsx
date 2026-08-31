'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Edit3, ShieldAlert, CheckCircle } from 'lucide-react';
import { Student } from '@/lib/types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => Promise<boolean>;
  student: Student | null; // If null, create mode; otherwise edit mode
}

const COURSES = ['BSCpE', 'BSCS', 'BSIT', 'BSIS', 'BSECE', 'BSCE', 'BSEE', 'BSME'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  student,
}) => {
  const [studentId, setStudentId] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [course, setCourse] = useState('BSCpE');
  const [yearLevel, setYearLevel] = useState('1st Year');
  const [isVerified, setIsVerified] = useState(false);
  const [discordId, setDiscordId] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (student) {
      setStudentId(student.student_id);
      setLastName(student.last_name);
      setFirstName(student.first_name);
      setMiddleName(student.middle_name || '');
      setCourse(student.course || 'BSCpE');
      setYearLevel(student.year_level || '1st Year');
      setIsVerified(student.is_verified);
      setDiscordId(student.discord_id || '');
      setDiscordTag(student.discord_tag || '');
    } else {
      setStudentId('');
      setLastName('');
      setFirstName('');
      setMiddleName('');
      setCourse('BSCpE');
      setYearLevel('1st Year');
      setIsVerified(false);
      setDiscordId('');
      setDiscordTag('');
    }
    setErrorMessage('');
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !lastName.trim() || !firstName.trim()) {
      setErrorMessage('Student ID, Last Name, and First Name are mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload: Partial<Student> = {
        student_id: studentId.trim(),
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        course,
        year_level: yearLevel,
        is_verified: isVerified,
        discord_id: discordId.trim() || null,
        discord_tag: discordTag.trim() || null,
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save student record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1424] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#090d18] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {student ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {student ? 'Edit Masterlist Record' : 'Add New Student Record'}
              </h3>
              <p className="text-xs text-slate-400">
                {student ? `Updating ${student.student_id}` : 'Fill in the official student information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Student ID */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Student ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!student}
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              placeholder="e.g. 12-3456-789"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Dela Cruz"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Middle Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Middle Name <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              placeholder="Santos"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Course & Year Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Course</label>
              <select
                value={course}
                onChange={e => setCourse(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {COURSES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Year Level</label>
              <select
                value={yearLevel}
                onChange={e => setYearLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {YEAR_LEVELS.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Verification Switch & Discord Fields */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Manual Discord Verification</span>
                <span className="text-[11px] text-slate-400">Mark student as verified without bot interaction</span>
              </div>
              <input
                type="checkbox"
                checked={isVerified}
                onChange={e => setIsVerified(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {isVerified && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Discord User ID</label>
                  <input
                    type="text"
                    value={discordId}
                    onChange={e => setDiscordId(e.target.value)}
                    placeholder="812938491029384756"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Discord Tag / Username</label>
                  <input
                    type="text"
                    value={discordTag}
                    onChange={e => setDiscordTag(e.target.value)}
                    placeholder="username#0000"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-glow-blue transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{student ? 'Save Changes' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
