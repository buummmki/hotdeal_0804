import { serviceClient } from '@/lib/supabase';
import { getParser } from './parsers';
import { normalize, normalizeTitle, similarity } from './normalize';
import type { CrawlResult, NormalizedDeal } from './types';
import type { Source } from '@/lib/types';

const UA = 'HotdealBot/0.1 (+https://example.com/guide)';

const FETCH_TIMEOUT_MS = 15_000;
const POLITE_DELAY_MS = 1_500;
const DUPLICATE_THRESHOLD = 0.62;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // 일부 커뮤니티는 EUC-KR 로 응답
    const ct = res.headers.get('content-type') ?? '';
    const charset = ct.match(/charset=([\w-]+)/i)?.[1]?.toLowerCase();
    const buf = await res.arrayBuffer();
    if (charset && charset !== 'utf-8' && charset !== 'utf8') {
      return new TextDecoder(charset).decode(buf);
    }
    return new TextDecoder('utf-8').decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 중복 판별
 *  1) (source_id, external_id) 유니크 → DB 제약이 처리
 *  2) 최근 48시간 내 다른 출처의 유사 제목 → 스킵
 */
async function isDuplicate(
  db: ReturnType<typeof serviceClient>,
  deal: NormalizedDeal,
  recentTitles: { id: string; title_norm: string; price_value: number | null }[]
): Promise<boolean> {
  const norm = normalizeTitle(deal.title);
  if (norm.length < 6) return false;

  for (const r of recentTitles) {
    if (!r.title_norm) continue;
    const sim = similarity(norm, r.title_norm);
    if (sim >= DUPLICATE_THRESHOLD) {
      // 가격까지 같으면 확실한 중복
      if (deal.price_value == null || r.price_value == null || deal.price_value === r.price_value) {
        return true;
      }
    }
  }
  return false;
}

export async function crawlSource(source: Source): Promise<CrawlResult> {
  const started = Date.now();
  const base: CrawlResult = {
    sourceId: source.id,
    found: 0, inserted: 0, updated: 0, skipped: 0,
    status: 'success', durationMs: 0,
  };

  const parser = getParser(source.id);
  if (!parser) {
    return { ...base, status: 'failed', message: '등록된 파서 없음', durationMs: Date.now() - started };
  }
  if (!source.list_url) {
    return { ...base, status: 'failed', message: 'list_url 미설정', durationMs: Date.now() - started };
  }

  const db = serviceClient();

  try {
    const html = await fetchHtml(source.list_url);
    const items = parser.parseList(html, source.base_url);
    base.found = items.length;

    if (items.length === 0) {
      await logCrawl(db, { ...base, status: 'failed', message: '파싱 결과 0건 — 셀렉터 확인 필요', durationMs: Date.now() - started });
      return { ...base, status: 'failed', message: '파싱 결과 0건 — 셀렉터 확인 필요', durationMs: Date.now() - started };
    }

    // 중복 비교용: 최근 48시간 딜의 정규화 제목
    const since = new Date(Date.now() - 48 * 3600_000).toISOString();
    const { data: recent } = await db
      .from('deal')
      .select('id, title_norm, price_value')
      .gte('published_at', since)
      .limit(2000);

    const recentTitles = (recent ?? []) as { id: string; title_norm: string; price_value: number | null }[];

    for (const item of items) {
      const deal = normalize(item, source.id, source.category_map ?? {});

      // 같은 출처의 기존 글이면 반응 수치만 갱신
      const { data: existing } = await db
        .from('deal')
        .select('id, comment_count, status')
        .eq('source_id', deal.source_id)
        .eq('external_id', deal.external_id)
        .maybeSingle();

      if (existing) {
        const changed =
          existing.comment_count !== deal.comment_count || existing.status !== deal.status;
        if (changed) {
          await db
            .from('deal')
            .update({
              comment_count: deal.comment_count,
              status: deal.status,
              checked_at: deal.checked_at,
            })
            .eq('id', existing.id);

          await db.from('comment_snapshot').insert({
            deal_id: existing.id,
            comment_count: deal.comment_count,
          });
          base.updated++;
        } else {
          base.skipped++;
        }
        continue;
      }

      if (await isDuplicate(db, deal, recentTitles)) {
        base.skipped++;
        continue;
      }

      const { data: inserted, error } = await db
        .from('deal')
        .insert(deal)
        .select('id, title_norm, price_value')
        .single();

      if (error) {
        base.skipped++;
        base.status = 'partial';
        base.message = error.message;
        continue;
      }

      base.inserted++;
      if (inserted) {
        recentTitles.push(inserted as { id: string; title_norm: string; price_value: number | null });
      }
    }

    await db
      .from('source')
      .update({ last_crawled_at: new Date().toISOString() })
      .eq('id', source.id);

    base.durationMs = Date.now() - started;
    await logCrawl(db, base);
    return base;
  } catch (e) {
    const result: CrawlResult = {
      ...base,
      status: 'failed',
      message: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - started,
    };
    await logCrawl(db, result).catch(() => {});
    return result;
  }
}

async function logCrawl(db: ReturnType<typeof serviceClient>, r: CrawlResult) {
  await db.from('crawl_log').insert({
    source_id: r.sourceId,
    status: r.status,
    found: r.found,
    inserted: r.inserted,
    updated: r.updated,
    skipped: r.skipped,
    message: r.message ?? null,
    duration_ms: r.durationMs,
  });
}

/** 활성 소스를 순회하며 수집. 소스 간 간격을 둬서 부하를 주지 않음. */
export async function crawlAll(): Promise<CrawlResult[]> {
  const db = serviceClient();
  const { data, error } = await db.from('source').select('*').eq('is_active', true);
  if (error) throw new Error(`소스 조회 실패: ${error.message}`);

  const results: CrawlResult[] = [];
  for (const source of (data ?? []) as Source[]) {
    results.push(await crawlSource(source));
    await sleep(POLITE_DELAY_MS);
  }
  return results;
}

/** 랭킹 점수 재계산 */
export async function rescore(): Promise<void> {
  const db = serviceClient();
  const { error } = await db.rpc('compute_rank_scores');
  if (error) throw new Error(`점수 재계산 실패: ${error.message}`);
}
