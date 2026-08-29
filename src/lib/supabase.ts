import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student } from './types';

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

// Runtime configurable credentials (from UI or .env.local)
let runtimeUrl: string = '';
let runtimeKey: string = '';

export function setRuntimeSupabaseConfig(url: string, key: string) {
  runtimeUrl = url;
  runtimeKey = key;
  cachedClient = null; // reset cached client
}

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || runtimeUrl || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : '') || '';
  const key = customKey || runtimeKey || (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : '') || '';

  if (!url || !key) {
    return null;
  }

  if (cachedClient && currentUrl === url && currentKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    currentUrl = url;
    currentKey = key;
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    if (!url || !key) {
      return { success: false, message: 'URL and API Key are required.' };
    }
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data, count, error } = await client
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase project, but the `students` table does not exist yet. Please run the SQL schema in your Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Supabase error: ${error.message}` };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase! Table 'students' is active (${count ?? 0} records).`,
      count: count ?? 0,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection test failed.' };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- ICpEP.SE Discord Community Masterlist Schema
-- Institute of Computer Engineers of the Philippines - Student Edition
-- ==========================================

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

-- 2. Indexes for high-speed lookups and verification queries
CREATE INDEX IF NOT EXISTS idx_students_discord_id ON public.students(discord_id);
CREATE INDEX IF NOT EXISTS idx_students_is_verified ON public.students(is_verified);
CREATE INDEX IF NOT EXISTS idx_students_course_year ON public.students(course, year_level);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Full access for anon and authenticated API calls)
CREATE POLICY "Allow public read of verification status" 
    ON public.students FOR SELECT 
    USING (true);

CREATE POLICY "Allow all operations for anon/authenticated (Admin & Bot)" 
    ON public.students FOR ALL 
    USING (true)
    WITH CHECK (true);
`;
