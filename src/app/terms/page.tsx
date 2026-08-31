import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Bitzy - ICpEP.SE CIT-U',
  description: 'Terms of Service for the Bitzy Discord Verification Bot & Platform',
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: September 1, 2026 • Institute of Computer Engineers of the Philippines - Student Edition (CIT-U Chapter)
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By inviting, accessing, or interacting with the <strong>Bitzy</strong> Discord Bot, Web Dashboard, or related verification services (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>2. Purpose & Eligibility</span>
            </h2>
            <p>
              The Service is designed exclusively for students, faculty, and authorized members of the <strong>Institute of Computer Engineers of the Philippines - Student Edition (ICpEP.SE), Cebu Institute of Technology - University Chapter</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Users must provide legitimate and accurate Student ID information belonging to themselves.</li>
              <li>Impersonation of other students, faculty, or organization officers is strictly prohibited.</li>
              <li>Each student is permitted to link exactly one (1) Discord account to their official Student ID.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>3. Permitted Use & Code of Conduct</span>
            </h2>
            <p>
              When using Bitzy commands (such as <code className="text-blue-400">/verify</code>, <code className="text-blue-400">/clear</code>, or message listeners in designated channels), you agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Attempt to bypass, exploit, or reverse-engineer the verification algorithms or database.</li>
              <li>Spam, flood, or abuse verification channels, API endpoints, or slash commands.</li>
              <li>Submit forged, fraudulent, or unauthorized Student ID credentials.</li>
              <li>Use the bot for any activities that violate the Discord Community Guidelines or Terms of Service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>4. Role Assignment & Server Moderation</span>
            </h2>
            <p>
              Verification grants access to community roles (e.g., <code className="text-emerald-400">ka-CpE</code>) and automatically synchronizes member nicknames to their registered student names. Server administrators reserve the right to revoke verified roles, unlink accounts, or restrict server access at their sole discretion if terms are violated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>5. Disclaimer of Warranties</span>
            </h2>
            <p>
              The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind. While we strive for 100% uptime, the organization is not liable for temporary service interruptions, network latency, or Discord API outages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>6. Contact & Inquiries</span>
            </h2>
            <p>
              If you have any questions regarding these Terms or require account unlinking/support, please contact an organization officer or reach out via official committee channels.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ICpEP.SE CIT - U Chapter. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-400 transition">
              Privacy Policy
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