'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Browser-only client used for admin login/session state.
// Unlike getSupabaseClient() in supabase.ts (server-side, persistSession: false),
// this one keeps a real, auto-refreshing session in the browser so the admin
// stays logged in across page loads.
export const supabaseAuth = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'bitzy-admin-auth',
  },
});
