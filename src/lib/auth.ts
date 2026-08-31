import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verifies the Supabase access token sent by the browser and returns the
 * authenticated user, or null if there isn't one.
 *
 * The frontend must send the logged-in admin's access token as:
 *   Authorization: Bearer <access_token>
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return null;

  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user;
}

/**
 * Drop this at the top of any admin-only API route handler:
 *
 *   const authError = await requireAdmin(req);
 *   if (authError) return authError;
 *
 * Returns a 401 JSON response if the request isn't authenticated,
 * or null if it's fine to continue.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Please sign in as an admin.' },
      { status: 401 }
    );
  }
  return null;
}
