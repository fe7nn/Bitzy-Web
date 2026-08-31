# 🚀 Bitzy Infrastructure & Deployment Guide

This guide covers the complete, step-by-step process of configuring and deploying the **Bitzy Platform** across **Discord Developer Portal**, **Supabase**, **Vercel**, and **Render**.

---

## 📑 Contents

1. [Part 1: Discord Developer Portal Setup](#part-1-discord-developer-portal-setup)
2. [Part 2: Supabase Cloud Database Setup](#part-2-supabase-cloud-database-setup)
3. [Part 3: Vercel Deployment (Web Dashboard & API)](#part-3-vercel-deployment-web-dashboard--api)
4. [Part 4: Render Deployment (Discord Bot Service)](#part-4-render-deployment-discord-bot-service)
5. [Part 5: Discord Server Configuration & Role Hierarchy](#part-5-discord-server-configuration--role-hierarchy)
6. [Part 6: Keeping Free Render Services Awake (Uptime Monitoring)](#part-6-keeping-free-render-services-awake)

---

## Part 1: Discord Developer Portal Setup

### 1. Create a Discord Application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Log in and click **New Application** (top right).
3. Name your application (e.g. `Bitzy`) and accept the Developer Terms of Service.
4. Under **General Information**, copy your **Application ID**. *(This is your `CLIENT_ID`)*.

### 2. Configure the Bot & Token
1. In the left sidebar, click the **Bot** tab.
2. Under **Build-A-Bot**, click **Reset Token** (or **Add Bot** if not created).
3. Copy and securely save the token. *(This is your `DISCORD_TOKEN`)*.

### 3. Enable Privileged Gateway Intents *(Mandatory)*
Scroll down to **Privileged Gateway Intents** and enable:
- ✅ **Server Members Intent** *(Enables `guildMemberAdd` auto-role assignments)*
- ✅ **Message Content Intent** *(Enables reading Student IDs typed in `#verify`)*
- Click **Save Changes**.

### 4. Generate OAuth2 Invite URL
1. Navigate to **OAuth2 ➔ URL Generator**.
2. Under **Scopes**, select:
   - `bot`
   - `applications.commands`
3. Under **Bot Permissions**, select:
   - `Manage Roles` (Required for granting `ka-CpE` and removing `Unverified`)
   - `View Channels`
   - `Send Messages`
   - `Manage Messages` (Required for auto-deleting student IDs after 6s)
   - `Read Message History`
   - `Manage Nicknames` (Required for syncing member names)
4. **Generated Permission Integer:** `268445728`
5. **Direct Invite Link Format:**
   ```text
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=268445728
   ```

---

## Part 2: Supabase Cloud Database Setup

1. Log in to [Supabase](https://supabase.com/).
2. Click **New Project**, choose an organization, set a project name (e.g. `bitzy-database`), database password, and region.
3. Once the database initializes, navigate to **SQL Editor** (left sidebar).
4. Paste and execute the following DDL script:

```sql
-- 1. Create students table
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

-- 2. Indexes for high-speed lookups
CREATE INDEX IF NOT EXISTS idx_students_discord_id ON public.students(discord_id);
CREATE INDEX IF NOT EXISTS idx_students_is_verified ON public.students(is_verified);
CREATE INDEX IF NOT EXISTS idx_students_course_year ON public.students(course, year_level);

-- 3. Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of verification status" 
    ON public.students FOR SELECT USING (true);

CREATE POLICY "Allow all operations for anon/authenticated (Admin & Bot)" 
    ON public.students FOR ALL USING (true) WITH CHECK (true);
```

5. Go to **Project Settings (Gear Icon) ➔ API** and copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **`anon` Public API Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **`service_role` Secret Key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

## Part 3: Vercel Deployment (Web Dashboard & API)

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... ➔ Project**.
3. Import your GitHub repository (`Bitzy-Web`).
4. **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (or `next build`)
   - **Output Directory**: `.next` (default)
5. **Environment Variables**:
   Add the following environment variables:

   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` |
   | `DISCORD_BOT_URL` | `https://your-bot-service.onrender.com` *(From Part 4)* |

6. Click **Deploy**. Vercel will build the frontend and deploy the serverless routes.

---

## Part 4: Render Deployment (Discord Bot Service)

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New + ➔ Web Service**.
3. Connect your repository (`Bitzy-Web`).
4. **Service Configuration**:
   - **Name**: `bitzy-discord-bot`
   - **Region**: Select the region closest to your users.
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run bot:start`
   - **Instance Type**: `Free`
5. **Environment Variables**:
   Add the following keys under the **Environment** tab:

   | Key | Value |
   | :--- | :--- |
   | `DISCORD_TOKEN` | `MTEwMTIz...` *(Your bot token)* |
   | `CLIENT_ID` | `110123...` *(Your application client ID)* |
   | `SUPABASE_URL` | `https://your-project.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` |

6. Click **Create Web Service**. Verify the deploy logs show:
   ```text
   🌐 [Express] Uptime & Health Check server listening on port 10000
   🤖 Bitzy Discord Bot is ONLINE as Bitzy#0000
   ⚡ [Slash Commands] Synced instantly to guild: Your Server Name
   ```

---

## Part 5: Discord Server Configuration & Role Hierarchy

### 1. Authorize Bot
Open your OAuth2 invite link in your browser, select your server, and click **Authorize**.

### 2. Configure Role Hierarchy *(CRITICAL)*
> [!IMPORTANT]
> A Discord bot **cannot** assign, remove, or modify roles that sit **above or equal to** its own highest role, even if the bot is an Administrator.

1. Go to **Server Settings ➔ Roles**.
2. Click and drag the **`Bitzy`** integration role **ABOVE** the following roles:
   - `ka-CpE` (Verified Role)
   - `Unverified` (Default Role)
   - Any other course/department roles
3. Click **Save Changes**.

```
+-------------------------------------------------------------+
|                     SERVER ROLE HIERARCHY                   |
+-------------------------------------------------------------+
|  👑 Server Owner / Administrators                           |
|  🤖 Bitzy (Bot Role)  <── MUST BE DRAGGED ABOVE THESE ROLES |
|  🛡️ ka-CpE / Verified Member                                |
|  ⏳ Unverified                                              |
|  👥 @everyone                                               |
+-------------------------------------------------------------+
```

### 3. Post the Official Verification Guide
In your `#verify` channel, run the slash command:
```text
/post-verify-guide
```
This automatically posts the ICpEP.SE CIT - U welcome banner with the interactive **"🛡️ Click Here to Verify Student ID"** button and checkmark reaction!

---

## Part 6: Keeping Free Render Services Awake

Render Free Web Services spin down after 15 minutes of inactivity. Since Bitzy includes a built-in Express server listening on `/health` and `/`:

1. Copy your Render Web Service URL (e.g. `https://bitzy-discord-bot.onrender.com`).
2. Open a free uptime monitoring service like [UptimeRobot](https://uptimerobot.com/) or [cron-job.org](https://cron-job.org/).
3. Create a **HTTP(s) Monitor**:
   - **URL:** `https://bitzy-discord-bot.onrender.com/health`
   - **Monitoring Interval:** Every 5 to 10 minutes.
4. This ensures your bot process stays awake 24/7 with zero downtime!