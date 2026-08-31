import { Student, SystemStats, VerificationRequest, VerificationResponse } from './types';
import { getSupabaseClient } from './supabase';

// In-memory fallback masterlist. Students are added via CSV import or the API
// (no students are seeded by default).
const INITIAL_STUDENTS: Student[] = [];

// Global in-memory storage fallback
declare global {
  // eslint-disable-next-line no-var
  var __BITZY_STUDENTS__: Student[] | undefined;
}

function getMemoryStore(): Student[] {
  if (!global.__BITZY_STUDENTS__) {
    global.__BITZY_STUDENTS__ = [...INITIAL_STUDENTS];
  }
  return global.__BITZY_STUDENTS__;
}

export function formatStudentFullName(student: { first_name: string; last_name: string; middle_name?: string | null }): string {
  const mInitial = student.middle_name && student.middle_name.trim().length > 0
    ? ` ${student.middle_name.trim().charAt(0).toUpperCase()}.`
    : '';
  return `${student.last_name}, ${student.first_name}${mInitial}`;
}

export function formatNickname(student: { first_name: string; last_name: string; middle_name?: string | null }): string {
  const mInitial = student.middle_name && student.middle_name.trim().length > 0
    ? ` ${student.middle_name.trim().charAt(0).toUpperCase()}.`
    : '';
  return `${student.first_name}${mInitial} ${student.last_name}`;
}

export async function getAllStudents(): Promise<Student[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });
      if (!error && data) {
        return data as Student[];
      }
      if (error) {
        console.error('[Supabase getAllStudents ERROR]', error.message);
      }
    } catch (e) {
      console.warn('[db] Supabase getAllStudents failed, using memory store:', e);
    }
  }
  return getMemoryStore();
}

export async function getStudentById(student_id: string): Promise<Student | null> {
  const normalizedId = student_id.trim();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', normalizedId)
        .maybeSingle();
      if (!error && data) {
        return data as Student;
      }
    } catch (e) {
      console.warn('[db] Supabase getStudentById failed:', e);
    }
  }

  const list = getMemoryStore();
  return list.find(s => s.student_id.toLowerCase() === normalizedId.toLowerCase()) || null;
}

export async function findStudentByDiscordId(discord_id: string): Promise<Student | null> {
  const normalizedDiscord = discord_id.trim();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('discord_id', normalizedDiscord)
        .maybeSingle();
      if (!error && data) {
        return data as Student;
      }
    } catch (e) {
      console.warn('[db] Supabase findByDiscordId failed:', e);
    }
  }

  const list = getMemoryStore();
  return list.find(s => s.discord_id === normalizedDiscord) || null;
}

export async function upsertStudent(student: Student): Promise<Student> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('students')
      .upsert(student, { onConflict: 'student_id' })
      .select()
      .single();
    if (!error && data) {
      return data as Student;
    }
    if (error) {
      console.error('[Supabase upsertStudent ERROR]', error.message);
    }
  }

  const list = getMemoryStore();
  const index = list.findIndex(s => s.student_id.toLowerCase() === student.student_id.toLowerCase());
  if (index >= 0) {
    list[index] = { ...list[index], ...student };
    return list[index];
  } else {
    list.unshift(student);
    return student;
  }
}

export async function bulkUpsertStudents(newStudents: Partial<Student>[]): Promise<{ inserted: number; updated: number; deleted: number; total: number }> {
  // Normalize course names to canonical values to satisfy DB check constraints
  // Coerce all courses to the canonical BSCpE value. Accept common variants like BSCPE.
  const COURSE_MAP: Record<string, string> = {
    'bscpe': 'BSCpE',
    'bsc p e': 'BSCpE',
    'bscp e': 'BSCpE',
    'bscpe.': 'BSCpE',
    'bscp.e': 'BSCpE',
  };

  function normalizeCourse(raw?: string | null): string {
    if (!raw) return 'BSCpE';
    const key = String(raw).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return COURSE_MAP[key] ?? 'BSCpE';
  }

  const year_level_map: Record<string, string> = {
    '1': '1st Year', '1st Year': '1st Year', '1st': '1st Year',
    '2': '2nd Year', '2nd Year': '2nd Year', '2nd': '2nd Year',
    '3': '3rd Year', '3rd Year': '3rd Year', '3rd': '3rd Year',
    '4': '4th Year', '4th Year': '4th Year', '4th': '4th Year',
    '5': '5th Year', '5th Year': '5th Year', '5th': '5th Year',
  };

  function normalizeYearLevel(raw?: string | null): string {
    if (!raw) return '1st Year';
    const key = String(raw).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return year_level_map[key] ?? '1st Year';
  }

  const sanitized: Student[] = newStudents
    .filter(s => s.student_id && s.last_name && s.first_name)
    .map(s => ({
      student_id: String(s.student_id).trim(),
      last_name: String(s.last_name).trim(),
      first_name: String(s.first_name).trim(),
      middle_name: s.middle_name ? String(s.middle_name).trim() : null,
      course: normalizeCourse(s.course ? String(s.course) : undefined),
      year_level: normalizeYearLevel(s.year_level ? String(s.year_level) : undefined),
      is_verified: Boolean(s.is_verified || false),
      discord_id: s.discord_id ? String(s.discord_id).trim() : null,
      discord_tag: s.discord_tag ? String(s.discord_tag).trim() : null,
      verified_at: s.verified_at ? String(s.verified_at) : null,
    }));

  if (sanitized.length === 0) {
    return { inserted: 0, updated: 0, deleted: 0, total: 0 };
  }

  // --- Masterlist Sync Rules ----------------------------------------------
  // A CSV import represents the full, authoritative masterlist for that
  // upload. Two rules apply when reconciling it against what's already
  // stored:
  //
  //   1) If a student already exists AND is verified, and they ARE still
  //      present in this new import, keep their existing verification/
  //      Discord-link data intact (is_verified, discord_id, discord_tag,
  //      verified_at) — only their name/course/year_level fields are
  //      refreshed from the CSV. This prevents a naive re-import from
  //      wiping out real verification data.
  //
  //   2) If an existing student is NOT present in this new import at all,
  //      their record is removed entirely from the masterlist (they are no
  //      longer part of the official list represented by this CSV).
  const existingStudents = await getAllStudents();
  const existingById = new Map(existingStudents.map(s => [s.student_id.toLowerCase(), s]));
  const incomingIds = new Set(sanitized.map(s => s.student_id.toLowerCase()));

  const reconciled: Student[] = sanitized.map(s => {
    const existing = existingById.get(s.student_id.toLowerCase());
    if (existing && existing.is_verified) {
      return {
        ...s,
        is_verified: existing.is_verified,
        discord_id: existing.discord_id,
        discord_tag: existing.discord_tag,
        verified_at: existing.verified_at,
      };
    }
    return s;
  });

  const toRemove: Student[] = existingStudents.filter(
    s => !incomingIds.has(s.student_id.toLowerCase())
  );
  // ------------------------------------------------------------------------

  const supabase = getSupabaseClient();

  if (supabase) {
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .in('student_id', toRemove.map(s => s.student_id));

      if (deleteError) {
        console.error('[Supabase bulkUpsert delete ERROR]', deleteError.message);
        throw new Error(`Supabase delete failed while syncing masterlist: ${deleteError.message}`);
      }
    }

    const { error } = await supabase
      .from('students')
      .upsert(reconciled, { onConflict: 'student_id' });

    if (error) {
      console.error('[Supabase bulkUpsert ERROR]', JSON.stringify(error, null, 2));
      // Throw so the API route returns the real error to the browser instead of silently succeeding
      throw new Error(`Supabase upsert failed: ${error.message} (code: ${error.code})`);
    }

    if (toRemove.length > 0) {
      console.log(`[Supabase] Removed ${toRemove.length} student(s) no longer present in the imported masterlist.`);
    }
    console.log(`[Supabase] Successfully upserted ${reconciled.length} student records.`);
    return { inserted: reconciled.length, updated: 0, deleted: toRemove.length, total: reconciled.length };
  }

  // No Supabase client configured — write to memory fallback
  console.warn('[db] No Supabase client found. Check that .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.');
  const list = getMemoryStore();
  let inserted = 0;
  let updated = 0;

  for (const s of reconciled) {
    const idx = list.findIndex(item => item.student_id.toLowerCase() === s.student_id.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...s };
      updated++;
    } else {
      list.push(s);
      inserted++;
    }
  }

  // Remove students who dropped off the imported masterlist entirely.
  let deleted = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (!incomingIds.has(list[i].student_id.toLowerCase())) {
      list.splice(i, 1);
      deleted++;
    }
  }

  if (deleted > 0) {
    console.warn(`[db] Removed ${deleted} student(s) no longer present in the imported masterlist.`);
  }

  return { inserted, updated, deleted, total: sanitized.length };
}

export async function deleteStudent(student_id: string): Promise<boolean> {
  const normalizedId = student_id.trim();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('student_id', normalizedId);
      if (!error) {
        return true;
      }
    } catch (e) {
      console.warn('[db] Supabase delete failed:', e);
    }
  }

  const list = getMemoryStore();
  const idx = list.findIndex(s => s.student_id.toLowerCase() === normalizedId.toLowerCase());
  if (idx >= 0) {
    list.splice(idx, 1);
    return true;
  }
  return false;
}

export async function unlinkDiscord(student_id: string): Promise<Student | null> {
  const student = await getStudentById(student_id);
  if (!student) return null;

  const updated: Student = {
    ...student,
    is_verified: false,
    discord_id: null,
    discord_tag: null,
    verified_at: null,
  };

  return await upsertStudent(updated);
}

export async function processVerification(req: VerificationRequest): Promise<VerificationResponse> {
  const { student_id, discord_id, discord_tag } = req;

  if (!student_id || !discord_id) {
    return {
      success: false,
      message: 'Missing required fields: student_id and discord_id are mandatory.',
      error_code: 'INVALID_INPUT',
    };
  }

  const normalizedId = student_id.trim();
  const normalizedDiscord = discord_id.trim();

  // 1. Check if this discord_id is already assigned to a DIFFERENT student
  const existingWithDiscord = await findStudentByDiscordId(normalizedDiscord);
  if (existingWithDiscord && existingWithDiscord.student_id.toLowerCase() !== normalizedId.toLowerCase()) {
    return {
      success: false,
      message: `This Discord account is already linked to Student ID ${existingWithDiscord.student_id} (${formatStudentFullName(existingWithDiscord)}). One account per student only.`,
      error_code: 'DISCORD_ALREADY_LINKED',
    };
  }

  // 2. Lookup student in the masterlist
  const student = await getStudentById(normalizedId);
  if (!student) {
    return {
      success: false,
      message: `Student ID "${normalizedId}" was not found in the ICpEP.SE Masterlist. Please double-check your ID or contact an officer.`,
      error_code: 'NOT_FOUND',
    };
  }

  // 3. Check if student is already verified with a DIFFERENT discord_id
  if (student.is_verified && student.discord_id && student.discord_id !== normalizedDiscord) {
    return {
      success: false,
      message: `Student ID "${student.student_id}" is already verified by another Discord account. If this is an error, please ask an Admin to unlink the previous account.`,
      error_code: 'ALREADY_VERIFIED',
    };
  }

  // 4. Update the student record
  const verified_at = new Date().toISOString();
  const updatedStudent: Student = {
    ...student,
    is_verified: true,
    discord_id: normalizedDiscord,
    discord_tag: discord_tag || student.discord_tag || null,
    verified_at,
  };

  const saved = await upsertStudent(updatedStudent);

  // 5. Determine Discord roles based on course
  const roles: string[] = ['ICpEP.SE Verified Member'];
  if (saved.course.toUpperCase() === 'BSCPE') {
    roles.push('Computer Engineering Student');
  } else if (saved.course.toUpperCase() === 'BSCS') {
    roles.push('Computer Science Student');
  } else if (saved.course.toUpperCase() === 'BSIT') {
    roles.push('Information Technology Student');
  }

  const fullNameFormatted = formatStudentFullName(saved);
  const nickname = formatNickname(saved);

  return {
    success: true,
    message: `Verification successful! Welcome to ICpEP.SE Discord Community, ${fullNameFormatted}!`,
    student: {
      student_id: saved.student_id,
      full_name: fullNameFormatted,
      first_name: saved.first_name,
      last_name: saved.last_name,
      middle_name: saved.middle_name,
      course: saved.course,
      year_level: saved.year_level,
      discord_id: saved.discord_id!,
      discord_tag: saved.discord_tag || undefined,
      verified_at: saved.verified_at!,
    },
    roles,
    nickname,
  };
}

export async function getSystemStats(): Promise<SystemStats> {
  const students = await getAllStudents();
  const total_students = students.length;
  const verified_students = students.filter(s => s.is_verified).length;
  const unverified_students = total_students - verified_students;
  const verification_rate = total_students > 0 ? Math.round((verified_students / total_students) * 100) : 0;

  const by_course: Record<string, { total: number; verified: number }> = {};
  const by_year: Record<string, { total: number; verified: number }> = {};

  for (const s of students) {
    const course = s.course || 'OTHER';
    const year = s.year_level || 'Unknown';

    if (!by_course[course]) by_course[course] = { total: 0, verified: 0 };
    by_course[course].total++;
    if (s.is_verified) by_course[course].verified++;

    if (!by_year[year]) by_year[year] = { total: 0, verified: 0 };
    by_year[year].total++;
    if (s.is_verified) by_year[year].verified++;
  }

  const recent_verifications = students
    .filter(s => s.is_verified && s.verified_at)
    .sort((a, b) => new Date(b.verified_at!).getTime() - new Date(a.verified_at!).getTime())
    .slice(0, 5);

  return {
    total_students,
    verified_students,
    unverified_students,
    verification_rate,
    by_course,
    by_year,
    recent_verifications,
  };
}