import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, upsertStudent, deleteStudent, unlinkDiscord } from '@/lib/db';
import { Student } from '@/lib/types';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const student = await getStudentById(params.id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: student }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const existing = await getStudentById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Special action: unlink
    if (body.action === 'unlink') {
      const unlinked = await unlinkDiscord(params.id);
      return NextResponse.json({
        success: true,
        message: `Discord unlinked for ${params.id}`,
        data: unlinked,
      });
    }

    const updated: Student = {
      ...existing,
      last_name: body.last_name !== undefined ? String(body.last_name).trim() : existing.last_name,
      first_name: body.first_name !== undefined ? String(body.first_name).trim() : existing.first_name,
      middle_name: body.middle_name !== undefined ? (body.middle_name ? String(body.middle_name).trim() : null) : existing.middle_name,
      course: body.course !== undefined ? String(body.course).trim().toUpperCase() : existing.course,
      year_level: body.year_level !== undefined ? String(body.year_level).trim() : existing.year_level,
      is_verified: body.is_verified !== undefined ? Boolean(body.is_verified) : existing.is_verified,
      discord_id: body.discord_id !== undefined ? (body.discord_id ? String(body.discord_id).trim() : null) : existing.discord_id,
      discord_tag: body.discord_tag !== undefined ? (body.discord_tag ? String(body.discord_tag).trim() : null) : existing.discord_tag,
      verified_at: body.is_verified ? (existing.verified_at || new Date().toISOString()) : null,
    };

    const saved = await upsertStudent(updated);
    return NextResponse.json({ success: true, message: 'Student updated successfully', data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const success = await deleteStudent(params.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Student not found or failed to delete' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Student ${params.id} deleted successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}