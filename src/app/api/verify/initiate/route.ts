import { NextRequest, NextResponse } from 'next/server';
import { processVerification } from '@/lib/db';
import { VerificationRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting map: ip -> timestamps
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string, limit = 15, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // 1. Rate Limiting Check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Please wait a minute before making another verification request.',
        },
        { status: 429 }
      );
    }

    // 2. Parse Body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_INPUT',
          message: 'Malformed JSON payload.',
        },
        { status: 400 }
      );
    }

    const { student_id, discord_id, discord_tag } = body;

    if (!student_id || !discord_id) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_INPUT',
          message: 'Both student_id and discord_id are mandatory parameters.',
        },
        { status: 400 }
      );
    }

    // 3. Process Verification
    const verificationReq: VerificationRequest = {
      student_id: String(student_id).trim(),
      discord_id: String(discord_id).trim(),
      discord_tag: discord_tag ? String(discord_tag).trim() : undefined,
    };

    const result = await processVerification(verificationReq);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        ALREADY_VERIFIED: 409,
        DISCORD_ALREADY_LINKED: 409,
        INVALID_INPUT: 400,
      };
      const status = result.error_code ? statusMap[result.error_code] || 400 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'SERVER_ERROR',
        message: 'An unexpected internal error occurred during verification.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'ICpEP.SE Bitzy Verification Gateway',
    version: '1.0.0',
    endpoint: 'POST /api/verify/initiate',
    expected_payload: {
      student_id: 'e.g. 12-3456-789',
      discord_id: 'e.g. 812938491029384756',
      discord_tag: 'e.g. juandelacruz#1234 (optional)',
    },
  });
}
