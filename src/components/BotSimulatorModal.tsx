'use client';

import React, { useState } from 'react';
import { X, Send, Bot, User, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { VerificationResponse } from '@/lib/types';
import confetti from 'canvas-confetti';

interface BotSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess?: () => void;
}

export const BotSimulatorModal: React.FC<BotSimulatorModalProps> = ({
  isOpen,
  onClose,
  onVerificationSuccess,
}) => {
  const [studentId, setStudentId] = useState('2024-00103');
  const [discordId, setDiscordId] = useState('892019283746501928');
  const [discordTag, setDiscordTag] = useState('alex_cpe#9999');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{
    type: 'user' | 'bot';
    timestamp: string;
    content?: string;
    result?: VerificationResponse;
  }>>([
    {
      type: 'bot',
      timestamp: 'Today at 8:30 PM',
      content: '👋 Welcome to the **ICpEP.SE Discord Server**! Please verify your student identity by running `/verify [student_id]`. Example: `/verify 2024-00103`',
    }
  ]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#3b82f6', '#f97316', '#ffffff'],
      });
    } catch {
      // ignore
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !discordId.trim() || isLoading) return;

    const userMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const studentInput = studentId.trim();

    // Append user slash command
    setHistory(prev => [
      ...prev,
      {
        type: 'user',
        timestamp: userMessageTime,
        content: `/verify student_id:${studentInput}`,
      }
    ]);

    setIsLoading(true);

    try {
      const res = await fetch('/api/verify/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentInput,
          discord_id: discordId.trim(),
          discord_tag: discordTag.trim() || undefined,
        }),
      });

      const data: VerificationResponse = await res.json();
      const botMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setHistory(prev => [
        ...prev,
        {
          type: 'bot',
          timestamp: botMessageTime,
          result: data,
        }
      ]);

      if (data.success) {
        triggerConfetti();
        if (onVerificationSuccess) onVerificationSuccess();
      }
    } catch (err: any) {
      setHistory(prev => [
        ...prev,
        {
          type: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          result: {
            success: false,
            message: `Connection error: ${err.message || 'Unable to connect to verification gateway.'}`,
            error_code: 'SERVER_ERROR',
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/verify/initiate`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e121e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b0e17] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center border border-[#5865F2]/40">
              <Bot className="w-4 h-4 text-[#7983F5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Discord Bot Simulator & API Tester
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                  POST /api/verify/initiate
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Simulate how Bitzy executes slash command verification in the Discord server
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

        {/* Discord Chat Window Simulator */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#070a12] font-sans">
          {history.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm">
              {msg.type === 'user' ? (
                <>
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0 ring-2 ring-blue-400/20">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-white text-xs">{discordTag || 'You'}</span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <div className="mt-1 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-200 font-mono text-xs inline-block">
                      {msg.content}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-xs shrink-0 ring-2 ring-[#5865F2]/30">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-[#7983F5] text-xs flex items-center gap-1">
                        Bitzy Bot
                        <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1 rounded uppercase tracking-wider">
                          BOT
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>

                    {msg.content && (
                      <p className="text-slate-300 text-xs leading-relaxed">{msg.content}</p>
                    )}

                    {msg.result && (
                      <div
                        className={`p-4 rounded-xl border ${
                          msg.result.success
                            ? 'bg-blue-950/30 border-blue-500/40 text-slate-200'
                            : 'bg-rose-950/30 border-rose-500/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {msg.result.success ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                          <span
                            className={`font-semibold text-xs ${
                              msg.result.success ? 'text-blue-300' : 'text-rose-300'
                            }`}
                          >
                            {msg.result.success ? 'Verification Succeeded' : `Verification Failed [${msg.result.error_code || 'ERROR'}]`}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mb-3">{msg.result.message}</p>

                        {msg.result.success && msg.result.student && (
                          <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#050811]/60 p-2.5 rounded-lg border border-slate-800">
                              <div>
                                <span className="text-slate-500 block">Student Name</span>
                                <span className="text-white font-medium">{msg.result.student.full_name}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Course & Year</span>
                                <span className="text-blue-400 font-medium">
                                  {msg.result.student.course} • {msg.result.student.year_level}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Assigned Nickname</span>
                                <span className="text-amber-300 font-mono font-medium">{msg.result.nickname}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Student ID</span>
                                <span className="text-slate-300 font-mono">{msg.result.student.student_id}</span>
                              </div>
                            </div>

                            {msg.result.roles && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-slate-400">Assigned Roles:</span>
                                {msg.result.roles.map((r, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#a5b4fc] text-[10px] font-medium"
                                  >
                                    🛡️ {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Simulator Controls & Input Form */}
        <form onSubmit={handleSimulate} className="p-4 bg-[#0b0e17] border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Student ID to Test
              </label>
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="2024-00103"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Discord User ID
              </label>
              <input
                type="text"
                value={discordId}
                onChange={e => setDiscordId(e.target.value)}
                placeholder="892019283746501928"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Discord Username / Tag
              </label>
              <input
                type="text"
                value={discordTag}
                onChange={e => setDiscordTag(e.target.value)}
                placeholder="username#0000"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 hidden sm:inline">Try samples:</span>
              <button
                type="button"
                onClick={() => { setStudentId('2024-00103'); setDiscordId('892019283746501928'); }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                2024-00103 (Unverified)
              </button>
              <button
                type="button"
                onClick={() => { setStudentId('2024-00101'); setDiscordId('812938491029384756'); }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                2024-00101 (Already Verified)
              </button>
              <button
                type="button"
                onClick={() => { setStudentId('9999-99999'); setDiscordId('123456789'); }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                Invalid ID
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !studentId.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute /verify</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
