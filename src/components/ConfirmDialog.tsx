'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e1424] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#090d18] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isDanger
                ? 'bg-rose-600/20 border-rose-500/30 text-rose-400'
                : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
              }`}>
              {isDanger ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-xs text-slate-300 space-y-3 max-h-[60vh] overflow-y-auto">
          {message}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-white font-semibold text-xs shadow-glow-blue transition disabled:opacity-50 ${isDanger
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
