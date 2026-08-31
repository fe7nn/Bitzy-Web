'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Database, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import { Student } from '@/lib/types';
import { formatStudentFullName } from '@/lib/db';
import { ConfirmDialog } from './ConfirmDialog';

interface CsvAutoImporterProps {
  existingStudents: Student[];
  onImportComplete: () => void;
  adminToken?: string;
}

export const CsvAutoImporter: React.FC<CsvAutoImporterProps> = ({
  existingStudents,
  onImportComplete,
  adminToken,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<Student>[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    inserted: number;
    updated: number;
    deleted: number;
    total: number;
    message: string;
  } | null>(null);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview of what committing parsedRows will do to the current masterlist:
  // which students are new, which are updates, and which existing students
  // are NOT present in this CSV and would therefore be removed.
  const importPreview = useMemo(() => {
    const incomingIds = new Set(
      parsedRows
        .map(r => (r.student_id || '').toString().trim().toLowerCase())
        .filter(Boolean)
    );
    const existingIds = new Set(existingStudents.map(s => s.student_id.toLowerCase()));

    const newCount = parsedRows.filter(
      r => !existingIds.has((r.student_id || '').toString().trim().toLowerCase())
    ).length;
    const updateCount = parsedRows.length - newCount;

    const studentsToRemove = existingStudents.filter(
      s => !incomingIds.has(s.student_id.toLowerCase())
    );

    return { newCount, updateCount, studentsToRemove };
  }, [parsedRows, existingStudents]);

  const processCsvFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorDetails('Please upload a valid .csv file.');
      return;
    }

    setFileName(file.name);
    setErrorDetails(null);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const rows: Partial<Student>[] = [];
        const rawData = results.data as Record<string, any>[];

        for (const item of rawData) {
          // Normalize column lookups
          const student_id = item.student_id || item.id || item.student_number || item.id_number;
          let last_name = item.last_name || item.lastname || item.surname;
          let first_name = item.first_name || item.firstname || item.given_name;
          const middle_name = item.middle_name || item.middlename || item.mi || null;
          const course = item.course || item.program || 'BSCpE';
          const year_level = item.year_level || item.year || item.level || '1st Year';

          // Fallback if full_name column is present instead of first/last
          if (!last_name && !first_name && (item.full_name || item.name)) {
            const parts = String(item.full_name || item.name).split(',');
            if (parts.length > 1) {
              last_name = parts[0].trim();
              first_name = parts[1].trim();
            } else {
              const nameTokens = String(item.full_name || item.name).trim().split(' ');
              last_name = nameTokens.pop() || '';
              first_name = nameTokens.join(' ');
            }
          }

          if (student_id && last_name && first_name) {
            rows.push({
              student_id: String(student_id).trim(),
              last_name: String(last_name).trim(),
              first_name: String(first_name).trim(),
              middle_name: middle_name ? String(middle_name).trim() : null,
              course: String(course).trim().toUpperCase(),
              year_level: String(year_level).trim(),
              is_verified: false,
            });
          }
        }

        if (rows.length === 0) {
          setErrorDetails('No valid student records found. Ensure columns contain `student_id`, `last_name`, and `first_name`.');
        } else {
          setParsedRows(rows);
        }
      },
      error: (err) => {
        setErrorDetails(`CSV Parsing error: ${err.message}`);
      }
    });
  };

  const handleCommitToDatabase = async () => {
    if (parsedRows.length === 0 || isProcessing) return;

    setShowCommitConfirm(false);
    setIsProcessing(true);
    setErrorDetails(null);

    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({ students: parsedRows }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({
          success: true,
          inserted: data.stats.inserted,
          updated: data.stats.updated,
          deleted: data.stats.deleted || 0,
          total: data.stats.total,
          message: data.message,
        });
        setParsedRows([]);
        onImportComplete();
      } else {
        setErrorDetails(data.error || 'Failed to import students to database.');
      }
    } catch (err: any) {
      setErrorDetails(`Import error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Description Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-900/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Instant CSV Auto-Ingest Engine
          </h3>
          <p className="text-xs text-slate-300 mt-2 max-w leading-relaxed">
            Drag & drop your official student masterlist. The PapaParse engine automatically maps column headers, validates student IDs, and upserts directly into the database.
          </p>
          <p className="text-[11px] text-amber-400/90 mt-2 max-w leading-relaxed">
            This fully syncs the masterlist: students already verified keep their verification and Discord link, but any student not present in this CSV will be removed from the database.
          </p>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processCsvFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${isDragging
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
          : 'border-slate-700/80 bg-[#0b1120]/60 hover:border-blue-500/60 hover:bg-[#0b1120]'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processCsvFile(e.target.files[0]);
            }
          }}
        />
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-glow-blue">
          <FileText className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {fileName ? `Loaded: ${fileName}` : 'Drop your student masterlist .csv file here'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            or <span className="text-blue-400 underline font-medium">browse from your computer</span>
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-[10px] text-slate-400 font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">student_id</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">last_name</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">first_name</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">middle_name</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">course</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">year_level</span>
        </div>
      </div>

      {/* Error Feedback */}
      {errorDetails && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <div>
            <span className="font-bold">Error: </span>
            {errorDetails}
          </div>
        </div>
      )}

      {/* Success Feedback */}
      {importResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block text-emerald-200">Import Successful!</span>
              <span>
                Processed {importResult.total} records ({importResult.inserted} new added, {importResult.updated} updated
                {importResult.deleted > 0 ? `, ${importResult.deleted} removed (not in this CSV)` : ''}
                ). Already-verified students keep their Discord link.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Preview Table */}
      {parsedRows.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0b1120] overflow-hidden shadow-xl space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Parsed Data Preview
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-xs">
                  {parsedRows.length} valid rows
                </span>
              </h4>
              <p className="text-xs text-slate-400">Review before committing records to the master database</p>
            </div>

            <button
              onClick={() => setShowCommitConfirm(true)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow-blue transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Committing to DB...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Commit {parsedRows.length} Records to Masterlist</span>
                </>
              )}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-[#070b14] text-slate-400 font-semibold text-[11px] sticky top-0">
                <tr className="border-b border-slate-800">
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Last Name</th>
                  <th className="py-2.5 px-3">First Name</th>
                  <th className="py-2.5 px-3">Middle Name</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Year Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {parsedRows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono text-blue-300">{row.student_id}</td>
                    <td className="py-2 px-3 text-white">{row.last_name}</td>
                    <td className="py-2 px-3">{row.first_name}</td>
                    <td className="py-2 px-3 text-slate-400">{row.middle_name || '—'}</td>
                    <td className="py-2 px-3 font-semibold text-orange-400">{row.course}</td>
                    <td className="py-2 px-3 text-slate-300">{row.year_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 50 && (
            <p className="text-[11px] text-slate-500 text-center font-mono">
              + {parsedRows.length - 50} more records ready for batch ingestion
            </p>
          )}
        </div>
      )}

      {/* In-system Commit Confirmation */}
      <ConfirmDialog
        isOpen={showCommitConfirm}
        title="Commit Import to Masterlist"
        variant={importPreview.studentsToRemove.length > 0 ? 'danger' : 'default'}
        isProcessing={isProcessing}
        confirmLabel={`Commit ${parsedRows.length} Records`}
        onConfirm={handleCommitToDatabase}
        onCancel={() => setShowCommitConfirm(false)}
        message={
          <>
            <p>
              You're about to commit <span className="font-semibold text-white">{parsedRows.length}</span> record(s) from this CSV to the Masterlist.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-semibold">
                {importPreview.newCount} new
              </span>
              <span className="px-2 py-1 rounded-md bg-blue-950/40 border border-blue-800/40 text-blue-300 font-semibold">
                {importPreview.updateCount} updated
              </span>
              {importPreview.studentsToRemove.length > 0 && (
                <span className="px-2 py-1 rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300 font-semibold">
                  {importPreview.studentsToRemove.length} to be removed
                </span>
              )}
            </div>

            {importPreview.studentsToRemove.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center gap-1.5 text-rose-300 font-semibold mb-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    The following student(s) are not present in this CSV and will be removed from the database:
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-900/40 bg-rose-950/20 divide-y divide-rose-900/30">
                  {importPreview.studentsToRemove.map(s => (
                    <div key={s.student_id} className="px-3 py-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-rose-300">{s.student_id}</span>
                      <span className="text-slate-300 text-right">{formatStudentFullName(s)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        }
      />
    </div>
  );
};