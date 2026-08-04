import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * 관리자 액션 엔드포인트.
 *
 * ⚠️ 현재는 ADMIN_PASSWORD 단일 비밀번호 방식입니다. MVP 검증용으로는
 *    충분하지만, 실서비스 전에 Supabase Auth + RLS 기반 역할 관리로
 *    교체하는 것을 권장합니다 (README 참고).
 */
function authorized(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return req.headers.get('x-admin-password') === pw;
}

type Action =
  | { type: 'hide'; id: string; value: boolean }
  | { type: 'pin'; id: string; value: boolean }
  | { type: 'review'; id: string; value: boolean }
  | { type: 'status'; id: string; value: 'normal' | 'soldout' | 'expired' }
  | { type: 'category'; id: string; value: string }
  | { type: 'boost'; id: string; value: number }
  | { type: 'merge'; id: string; value: string }        // value = 유지할 딜 id
  | { type: 'source-active'; id: string; value: boolean }
  | { type: 'rescore' };

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let action: Action;
  try {
    action = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const db = serviceClient();

  try {
    switch (action.type) {
      case 'hide':
        await db.from('deal').update({ is_hidden: action.value }).eq('id', action.id);
        break;
      case 'pin':
        await db
          .from('deal')
          .update({ is_pinned: action.value, admin_boost: action.value ? 200 : 0 })
          .eq('id', action.id);
        break;
      case 'review':
        await db.from('deal').update({ is_reviewed: action.value }).eq('id', action.id);
        break;
      case 'status':
        await db
          .from('deal')
          .update({ status: action.value, checked_at: new Date().toISOString() })
          .eq('id', action.id);
        break;
      case 'category':
        await db.from('deal').update({ category: action.value }).eq('id', action.id);
        break;
      case 'boost':
        await db.from('deal').update({ admin_boost: action.value }).eq('id', action.id);
        break;
      case 'merge':
        // 중복으로 판정된 쪽을 숨김 처리 (원본은 보존해 재검토 가능)
        await db.from('deal').update({ is_hidden: true, is_reviewed: true }).eq('id', action.id);
        break;
      case 'source-active':
        await db.from('source').update({ is_active: action.value }).eq('id', action.id);
        break;
      case 'rescore':
        await db.rpc('compute_rank_scores');
        break;
      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

/** 검수 대기 목록 조회 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = serviceClient();
  const url = new URL(req.url);
  const filter = url.searchParams.get('filter') ?? 'unreviewed';

  let q = db
    .from('deal')
    .select('*, source:source_id (id, name, color)')
    .order('collected_at', { ascending: false })
    .limit(50);

  if (filter === 'unreviewed') q = q.eq('is_reviewed', false);
  if (filter === 'hidden') q = q.eq('is_hidden', true);
  if (filter === 'nopricce' || filter === 'noprice') q = q.is('price_value', null);

  const [{ data: deals }, { data: sources }, { data: logs }] = await Promise.all([
    q,
    db.from('source').select('*').order('name'),
    db.from('crawl_log').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  return NextResponse.json({ deals: deals ?? [], sources: sources ?? [], logs: logs ?? [] });
}
