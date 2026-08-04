import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

/** 읽기 전용 공개 클라이언트. RLS 적용됨. */
export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  { auth: { persistSession: false } }
);

/**
 * 쓰기용 클라이언트. RLS 우회하므로 서버에서만 호출할 것.
 * 클라이언트 번들에 절대 포함되면 안 됨.
 */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL 이 설정되지 않았습니다.'
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
