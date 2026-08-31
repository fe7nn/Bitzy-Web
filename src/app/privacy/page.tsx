import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Bitzy - ICpEP.SE CIT-U',
  description: 'Privacy Policy for the Bitzy Discord Verification Bot & Platform',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050811] text-slate-200 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-slate-800 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: September 1, 2026 • Institute of Computer Engineers of the Philippines - Student Edition (CIT-U Chapter)
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>1. Overview & Commitment</span>
            </h2>
            <p>
              Your privacy and the security of your personal data are paramount. This Privacy Policy explains how <strong>Bitzy</strong> collects, stores, processes, and protects your information when verifying your membership in the <strong>ICpEP.SE CIT - U Chapter</strong> Discord server and web dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>2. Information We Collect</span>
            </h2>
            <p>
              To accurately verify community members, the Service processes the following limited information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
                <span className="font-bold text-white text-xs block">Discord Account Data</span>
                <p className="text-xs text-slate-400">
                  Discord User Snowflake ID, username, and user tag (for linking verification status).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
                <span className="font-bold text-white text-xs block">Academic Directory Data</span>
                <p className="text-xs text-slate-400">
                  Student ID Number, Full Name, Program/Course, and Year Level (provided via official masterlists).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>3. How Your Information is Used</span>
            </h2>
            <p>Collected data is strictly used for the following operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Authenticating valid student enrollment against the official ICpEP.SE Masterlist.</li>
              <li>Assigning verified server roles (e.g. <code className="text-emerald-400">ka-CpE</code>) and course permissions.</li>
              <li>Updating your server nickname to your official student name for community accountability.</li>
              <li>Preventing multiple accounts from claiming the same Student ID.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>4. Data Retention & Privacy Protection (Auto-Purge)</span>
            </h2>
            <p>
              We implement industry-standard security measures to safeguard your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong>Automatic Chat Purging:</strong> All Student ID inputs and bot confirmation messages in the public <code className="text-blue-400">#verify</code> channel are automatically deleted within <strong>6 seconds</strong> so your ID is never permanently visible in chat history.
              </li>
              <li>
                <strong>Database Security:</strong> Data is stored in secure, encrypted cloud databases (Supabase PostgreSQL) protected by Row Level Security (RLS).
              </li>
              <li>
                <strong>No Third-Party Sale or Sharing:</strong> Your data is <strong>never sold, shared, or distributed</strong> to any third parties or advertisers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>5. User Rights & Data Deletion</span>
            </h2>
            <p>
              You have the right to request the unlinking or deletion of your Discord account record. If you transfer accounts or leave the organization, you may contact a server administrator to request manual unlinking or data removal.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ICpEP.SE CIT - U Chapter. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-400 transition">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-slate-400 transition">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}