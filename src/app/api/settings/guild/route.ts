import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch current guild configuration
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: true,
          settings: {
            guild_id: 'default',
            guild_name: 'ICpEP.SE CIT - U Chapter',
            verified_role_name: 'ka-CpE',
            unverified_role_name: 'Unverified',
            verify_channel_name: 'verify',
            nickname_format: 'First M. Last',
            auto_delete_seconds: 6,
          },
        }
      );
    }

    const { data, error } = await supabase
      .from('guild_settings')
      .select('*')
      .eq('guild_id', 'default')
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const settings = data || {
      guild_id: 'default',
      guild_name: 'ICpEP.SE CIT - U Chapter',
      verified_role_name: 'ka-CpE',
      unverified_role_name: 'Unverified',
      verify_channel_name: 'verify',
      nickname_format: 'First M. Last',
      auto_delete_seconds: 6,
    };

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Update guild configuration (Admin only)
export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database client unavailable' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      verified_role_name,
      unverified_role_name,
      verify_channel_name,
      nickname_format,
      auto_delete_seconds,
    } = body;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (verified_role_name !== undefined) updatePayload.verified_role_name = verified_role_name.trim();
    if (unverified_role_name !== undefined) updatePayload.unverified_role_name = unverified_role_name.trim();
    if (verify_channel_name !== undefined) updatePayload.verify_channel_name = verify_channel_name.trim().toLowerCase();
    if (nickname_format !== undefined) updatePayload.nickname_format = nickname_format.trim();
    if (auto_delete_seconds !== undefined) updatePayload.auto_delete_seconds = Number(auto_delete_seconds) || 6;

    const { data, error } = await supabase
      .from('guild_settings')
      .upsert({
        guild_id: 'default',
        guild_name: 'ICpEP.SE CIT - U Chapter',
        ...updatePayload,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guild settings updated successfully!',
      settings: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}