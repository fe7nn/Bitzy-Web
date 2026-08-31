'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  Key, 
  Link, 
  ShieldCheck, 
  Code2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Server,
  RefreshCw
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '@/lib/supabase';

interface SettingsAndBotIntegrationProps {
  onSupabaseStatusChange?: (connected: boolean) => void;
}

const DISCORD_BOT_SAMPLE_CODE = `// ==============================================================
// ICpEP.SE Bitzy Verification Slash Command Handler (discord.js)
// ==============================================================
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your ICpEP.SE student membership')
    .addStringOption(option =>
      option.setName('student_id')
        .setDescription('Your official Student ID (e.g. 12-3456-789)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const studentId = interaction.options.getString('student_id').trim();
    const discordId = interaction.user.id;
    const discordTag = interaction.user.tag;

    try {
      // 1. Send request to Bitzy Verification Gateway API
      const response = await fetch(process.env.BITZY_API_URL || 'https://your-domain.com/api/verify/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          discord_id: discordId,
          discord_tag: discordTag
        })
      });

      const data = await response.json();

      // 2. Handle Rejections (Not found / Already verified)
      if (!data.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xF43F5E)
          .setTitle('❌ Verification Failed')
          .setDescription(data.message)
          .setFooter({ text: 'ICpEP.SE Verification Gateway • Need help? Contact an Admin.' });

        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // 3. Assign Verified Roles
      const guildMember = interaction.member;
      if (data.roles && guildMember) {
        for (const roleName of data.roles) {
          const role = interaction.guild.roles.cache.find(r => r.name === roleName);
          if (role) await guildMember.roles.add(role);
        }
      }

      // 4. Update Member Nickname to Official Student Name
      if (data.nickname && guildMember) {
        try {
          await guildMember.setNickname(data.nickname);
        } catch (nickErr) {
          console.warn('Could not update nickname (may have higher hierarchy):', nickErr.message);
        }
      }

      // 5. Send Success Embed
      const successEmbed = new EmbedBuilder()
        .setColor(0x2563EB)
        .setTitle('✅ Verification Successful!')
        .setDescription(\`Welcome to the ICpEP.SE Community, **\${data.student.full_name}**!\`)
        .addFields(
          { name: 'Student ID', value: data.student.student_id, inline: true },
          { name: 'Course & Year', value: \`\${data.student.course} - \${data.student.year_level}\`, inline: true },
          { name: 'Roles Assigned', value: data.roles.join(', '), inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [successEmbed] });

    } catch (err) {
      console.error('Verification Bot Error:', err);
      return interaction.editReply({
        content: '⚠️ An error occurred while contacting the verification server. Please try again later.',
        ephemeral: true
      });
    }
  }
};`;

export const SettingsAndBotIntegration: React.FC<SettingsAndBotIntegrationProps> = ({
  onSupabaseStatusChange,
}) => {
  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  // Copy state helpers
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedBotCode, setCopiedBotCode] = useState(false);

  const handleTestAndSaveConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSupabaseStatus({
        tested: true,
        success: false,
        message: 'Please paste both your Supabase Project URL and Anon API Key.',
      });
      return;
    }

    setIsTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      const res = await fetch('/api/settings/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: supabaseUrl.trim(),
          key: supabaseKey.trim(),
        }),
      });

      const data = await res.json();
      setSupabaseStatus({
        tested: true,
        success: data.success,
        message: data.message || (data.success ? 'Connected and saved to server!' : 'Connection failed'),
      });

      if (onSupabaseStatusChange) {
        onSupabaseStatusChange(data.success);
      }
    } catch (err: any) {
      setSupabaseStatus({
        tested: true,
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentApiOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const apiEndpointUrl = `${currentApiOrigin}/api/verify/initiate`;

  return (
    <div className="space-y-8">
      {/* 1. Supabase Backend Configuration */}
      <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supabase Cloud Database Settings</h3>
              <p className="text-xs text-slate-400">
                Connect your live PostgreSQL instance for automatic real-time synchronization
              </p>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project URL (<code className="text-blue-400">NEXT_PUBLIC_SUPABASE_URL</code>)
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Anon / Service Role API Key (<code className="text-blue-400">SUPABASE_ANON_KEY</code>)
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Status result */}
        {supabaseStatus && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              supabaseStatus.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            {supabaseStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">
              <span className="font-bold">
                {supabaseStatus.success ? 'Connected: ' : 'Connection Issue: '}
              </span>
              {supabaseStatus.message}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-400">
            Paste your Project URL & Key above and click <strong>Test & Save Connection</strong> to link the database.
          </div>
          <button
            onClick={handleTestAndSaveConnection}
            disabled={isTestingSupabase || !supabaseUrl || !supabaseKey}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glow-blue transition disabled:opacity-50"
          >
            {isTestingSupabase ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing & Saving...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Test & Save Connection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. SQL Schema DDL */}
      <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Database SQL Schema (PostgreSQL / Supabase DDL)</h3>
              <p className="text-xs text-slate-400">Execute this script in your Supabase SQL editor to create the students table & indexes</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA, setCopiedSchema)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSchema ? 'Copied SQL!' : 'Copy SQL Script'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-[#050811] border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-56">
            <code>{SUPABASE_SQL_SCHEMA}</code>
          </pre>
        </div>
      </div>

      {/* 3. Discord Bot Integration & Webhook */}
      <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#7983F5]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Discord Bot Integration Gateway</h3>
              <p className="text-xs text-slate-400">
                Connect your external Node.js / discord.js bot repository to the verification endpoint
              </p>
            </div>
          </div>
        </div>

        {/* API Endpoint Box */}
        <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
              Verification API Endpoint
            </span>
            <span className="text-xs font-mono font-bold text-white break-all">
              POST {apiEndpointUrl}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(apiEndpointUrl, setCopiedEndpoint)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-semibold transition shrink-0"
          >
            {copiedEndpoint ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEndpoint ? 'Copied URL!' : 'Copy Endpoint'}</span>
          </button>
        </div>

        {/* Bot Code Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Copyable discord.js Slash Command (/verify) Handler:
            </span>
            <button
              onClick={() => copyToClipboard(DISCORD_BOT_SAMPLE_CODE, setCopiedBotCode)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              {copiedBotCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBotCode ? 'Copied Bot Script!' : 'Copy Bot Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-[#050811] border border-slate-800 text-[#a5b4fc] font-mono text-[11px] overflow-x-auto max-h-72">
            <code>{DISCORD_BOT_SAMPLE_CODE}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
