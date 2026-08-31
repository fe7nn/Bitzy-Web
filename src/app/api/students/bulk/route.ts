import { NextRequest, NextResponse } from 'next/server';
import { bulkUpsertStudents } from '@/lib/db';
import { Student } from '@/lib/types';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const students: Partial<Student>[] = Array.isArray(body) ? body : body.students;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Expected an array of student records to import.' },
        { status: 400 }
      );
    }

    const result = await bulkUpsertStudents(students);
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.total} student record(s).`,
      stats: result,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to perform bulk upload',
      details: error.message,
    }, { status: 500 });
  }
}