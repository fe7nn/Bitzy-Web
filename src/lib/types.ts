export interface Student {
  student_id: string;
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  course: string;
  year_level: string;
  is_verified: boolean;
  discord_id?: string | null;
  discord_tag?: string | null;
  verified_at?: string | null;
}

export interface VerificationRequest {
  student_id: string;
  discord_id: string;
  discord_tag?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  student?: {
    student_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    course: string;
    year_level: string;
    discord_id: string;
    discord_tag?: string;
    verified_at: string;
  };
  roles?: string[];
  nickname?: string;
  error_code?: 'NOT_FOUND' | 'ALREADY_VERIFIED' | 'DISCORD_ALREADY_LINKED' | 'INVALID_INPUT' | 'SERVER_ERROR';
}

export interface SystemStats {
  total_students: number;
  verified_students: number;
  unverified_students: number;
  verification_rate: number;
  by_course: Record<string, { total: number; verified: number }>;
  by_year: Record<string, { total: number; verified: number }>;
  recent_verifications: Student[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  tableName: string;
  isConnected: boolean;
  lastChecked?: string;
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'Admin';
  avatarUrl?: string;
  token?: string;
}

export interface BotStatusInfo {
  online: boolean;
  status: 'online' | 'offline' | 'unhealthy' | 'initializing';
  botUser?: string | null;
  botId?: string | null;
  isReady?: boolean;
  guilds?: number;
  ping?: number;
  uptimeSeconds?: number;
  latencyMs?: number;
  botUrl?: string;
  error?: string;
  timestamp?: string;
}

