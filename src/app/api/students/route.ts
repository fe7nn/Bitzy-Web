import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents, upsertStudent, getStudentById } from '@/lib/db';
import { Student } from '@/lib/types';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const course = searchParams.get('course') || 'ALL';
    const year = searchParams.get('year') || 'ALL';
    const status = searchParams.get('status') || 'ALL';

    let students = await getAllStudents();

    if (search) {
      students = students.filter(s => {
        const fullName = `${s.first_name} ${s.last_name} ${s.middle_name || ''}`.toLowerCase();
        const id = s.student_id.toLowerCase();
        const discord = (s.discord_tag || s.discord_id || '').toLowerCase();
        return fullName.includes(search) || id.includes(search) || discord.includes(search);
      });
    }

    if (course !== 'ALL') {
      students = students.filter(s => s.course.toUpperCase() === course.toUpperCase());
    }

    if (year !== 'ALL') {
      students = students.filter(s => s.year_level === year);
    }

    if (status === 'VERIFIED') {
      students = students.filter(s => s.is_verified);
    } else if (status === 'UNVERIFIED') {
      students = students.filter(s => !s.is_verified);
    }

    return NextResponse.json({ success: true, count: students.length, data: students }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve students', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { student_id, last_name, first_name, middle_name, course, year_level, is_verified, discord_id, discord_tag } = body;

    if (!student_id || !last_name || !first_name) {
      return NextResponse.json(
        { success: false, error: 'student_id, last_name, and first_name are required' },
        { status: 400 }
      );
    }

    const student: Student = {
      student_id: String(student_id).trim(),
      last_name: String(last_name).trim(),
      first_name: String(first_name).trim(),
      middle_name: middle_name ? String(middle_name).trim() : null,
      course: course ? String(course).trim().toUpperCase() : 'BSCPE',
      year_level: year_level ? String(year_level).trim() : '1st Year',
      is_verified: Boolean(is_verified),
      discord_id: discord_id ? String(discord_id).trim() : null,
      discord_tag: discord_tag ? String(discord_tag).trim() : null,
      verified_at: is_verified ? (body.verified_at || new Date().toISOString()) : null,
    };

    const saved = await upsertStudent(student);
    return NextResponse.json({ success: true, message: 'Student saved successfully', data: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to create student', details: error.message },
      { status: 500 }
    );
  }
}