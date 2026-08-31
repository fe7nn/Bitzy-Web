# 🤖 Bitzy — ICpEP.SE Student Verification & Membership Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14.22-5865F2?style=flat-square&logo=discord)](https://discord.js.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat-square&logo=render)](https://render.com/)

**Bitzy** is a full-stack student verification and community administration platform built for the **Institute of Computer Engineers of the Philippines - Student Edition (ICpEP.SE)**. It unifies a responsive **Next.js 14 Web Dashboard**, a scalable **Supabase PostgreSQL database**, and an autonomous **Discord Bot** inside a single monorepo architecture.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Monorepo Structure](#-monorepo-structure)
- [Database Schema](#-database-schema)
- [Local Development](#-local-development)
- [Environment Variables](#-environment-variables)
- [Discord Slash Commands](#-discord-slash-commands)
- [Deployment](#-deployment)
- [Security & Privacy](#-security--privacy)

---

## ✨ Key Features

### 1. 🤖 Autonomous Discord Verification Bot (`bot/`)
- **Dual-Mode Verification**:
  - **Modern Slash Command (`/verify`)**: Ephemeral, private in-Discord verification.
  - **Smart `#verify` Channel Listener**: Validates typed Student IDs against Supabase, assigns roles, and auto-deletes both user input and confirmation embeds after 6 seconds for privacy.
- **Interactive Guide Banners (`/post-verify-guide`)**: Sends formatted ICpEP.SE verification instructions with an attached interactive button that opens an in-Discord Modal.
- **Channel Moderation (`/clear [amount]`)**: Bulk-cleans 1–100 messages in seconds.
- **Role Hierarchy & Nickname Sync**: Automatically grants `ka-CpE`, removes `Unverified`, and synchronizes server nicknames to official student names (`First M. Last`).
- **Auto-Syncing Commands**: Slash commands automatically register globally and sync to all connected servers on startup with zero caching delay.
- **Express Health Check Gateway**: Built-in Express server listening on `PORT` for 24/7 uptime monitoring.

### 2. 🌐 Next.js 14 Web Dashboard (`src/`)
- **Admin Control Room**: Masterlist management, manual overrides, search, filtering, and instant Discord unlinking.
- **Bulk CSV Auto-Importer**: Authoritative masterlist upload with intelligent reconciliation (preserves existing verified statuses).
- **Live Real-Time Bot Status Badge**: Navbar pill polling `/api/bot/status` to show live gateway connectivity, ping latency, connected guilds, and uptime.
- **Verification Simulator**: Built-in interactive modal testing student verification workflows directly in the browser.

---

## 🏛️ System Architecture

```
                       ┌─────────────────────────────────────────────────────────────┐
                       │                   BITZY MONOREPO ARCHITECTURE               │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
        ┌──────────────────────────────┐                              ┌──────────────────────────────┐
        │   VERCEL (Frontend & API)    │                              │  RENDER (Persistent Worker)  │
        ├──────────────────────────────┤                              ├──────────────────────────────┤
        │ • Next.js 14 App Router      │                              │ • discord.js v14 Client      │
        │ • Admin Masterlist Dashboard │                              │ • Gateway WebSocket listener │
        │ • CSV Auto-Importer          │                              │ • Auto-Deletes #verify msgs  │
        │ • Route: `/api/bot/status`   │ ─── HTTP Health Probe ─────► │ • Express Server (`GET /`)   │
        │ • Route: `/api/students`     │                              │ • Auto-Registers Commands    │
        └──────────────┬───────────────┘                              └──────────────┬───────────────┘
                       │                                                             │
                       │               ┌──────────────────────────────┐              │
                       └──────────────►│    SUPABASE (PostgreSQL)     │◄─────────────┘
                                       ├──────────────────────────────┤
                                       │ • Masterlist `students` Table│
                                       │ • Row Level Security (RLS)   │
                                       │ • High-Speed Indexing        │
                                       └──────────────────────────────┘
```

---

## 📂 Monorepo Structure

```
Bitzy-Web/
├── bot/                         # 🤖 Discord Bot Service
│   ├── bot.js                   # Main bot worker (discord.js + Supabase + Express)
│   └── deploy-commands.js       # Manual command deployment utility
├── src/                         # 🌐 Next.js Web Application
│   ├── app/                     # App router pages and API routes
│   │   ├── api/bot/status/      # Live Discord bot heartbeat endpoint
│   │   ├── api/students/        # CRUD endpoints for student masterlist
│   │   ├── api/verify/initiate/ # Public verification gateway API
│   │   └── page.tsx             # Main landing & admin portal view
│   ├── components/              # Reusable React UI components
│   │   ├── BotStatusBadge.tsx   # Live status indicator pill with hover diagnostics
│   │   ├── Dashboard.tsx        # Admin control room
│   │   ├── Navbar.tsx           # Global header with status badge
│   │   └── StudentTable.tsx     # Filterable masterlist data table
│   └── lib/                     # Shared utilities & database clients
│       ├── db.ts                # Verification logic & bulk CSV reconciliation
│       ├── supabase.ts          # Server-side Supabase client
│       └── types.ts             # TypeScript definitions
├── .env.example                 # Unified environment template
├── package.json                 # Unified dependencies & scripts
├── DEPLOYMENT_GUIDE.md          # Step-by-step production deployment guide
└── tsconfig.json
```

---

## 🗄️ Database Schema

Run this DDL script in your **Supabase SQL Editor**:

```sql
-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
    student_id VARCHAR(50) PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    course VARCHAR(50) NOT NULL DEFAULT 'BSCpE',
    year_level VARCHAR(50) NOT NULL DEFAULT '1st Year',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    discord_id VARCHAR(50),
    discord_tag VARCHAR(100),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_students_discord_id ON public.students(discord_id);
CREATE INDEX IF NOT EXISTS idx_students_is_verified ON public.students(is_verified);
CREATE INDEX IF NOT EXISTS idx_students_course_year ON public.students(course, year_level);

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of verification status" 
    ON public.students FOR SELECT USING (true);

CREATE POLICY "Allow all operations for anon/authenticated (Admin & Bot)" 
    ON public.students FOR ALL USING (true) WITH CHECK (true);
```

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Services

| Service | Command | Description |
| :--- | :--- | :--- |
| **Web Dashboard** | `npm run dev` | Runs Next.js at `http://localhost:3000` |
| **Discord Bot** | `npm run bot:dev` | Runs the bot worker with live console output |
| **Deploy Slash Commands** | `npm run bot:deploy-commands` | Manually syncs commands to Discord |
| **Production Web Build** | `npm run build` | Tests production Next.js bundling |

---

## 🔐 Environment Variables

| Variable | Required In | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Web & Bot | Your Supabase Project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Web | Public Supabase API anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Web & Bot | Secret service role key for database operations |
| `DISCORD_TOKEN` | Bot | Bot authentication token from Discord Developer Portal |
| `CLIENT_ID` | Bot | Discord Application Client ID |
| `DISCORD_BOT_URL` | Web (Vercel) | Live URL of your Render bot (`https://bitzy-bot.onrender.com`) |
| `PORT` | Bot | Port for Express health server (defaults to `3000` locally, `10000` on Render) |

---

## ⚡ Discord Slash Commands

| Command | Permissions | Description |
| :--- | :--- | :--- |
| `/verify <student_id>` | Everyone | Ephemerally verifies a student and grants verified roles |
| `/clear <amount>` | `Manage Messages` | Bulk deletes 1 to 100 recent messages from the channel |
| `/post-verify-guide` | `Administrator` | Sends the official ICpEP.SE CIT - U welcome banner with interactive verification button |

---

## 🚀 Deployment

For complete, step-by-step instructions on setting up **Discord Developer Portal**, **Render**, and **Vercel**, please refer to our dedicated guide:

👉 **[Read the Full Deployment Guide (DEPLOYMENT_GUIDE.md)](./DEPLOYMENT_GUIDE.md)**

---

## 🛡️ Security & Privacy

1. **Student ID Privacy**: Messages typed in `#verify` and bot replies are automatically purged after 6 seconds so personal IDs are never permanently exposed in chat logs.
2. **Discord Role Hierarchy**: The bot's integrated role must be positioned above all managed roles (`ka-CpE`, `Unverified`) in Discord Server Settings.
3. **One Account Per Student**: Prevents account sharing and duplicate claims through unique database index enforcement.