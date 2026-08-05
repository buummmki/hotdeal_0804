import { serviceClient } from '@/lib/supabase';
import { fetchHtml } from './http';
import { getParser } from './parsers';
import { normalize, normalizeTitle, similarity, viewScoresFor } from './normalize';
import type { CrawlResult, NormalizedDeal } from './types';
import type { Source } from '@/lib/types';

const DUPLICATE_THRESHOLD = 0.62;

/**
 * 중복 판별
 *  1) (source_id, external_id) 유니크 → DB 제약이 처리
 *  2) 최근 48시간 내 다른 출처의 유사 제목 → 스킵
 */
function isDuplicate(
  deal: NormalizedDeal,
  recentTitles: { title_norm: string; price_value: number | null }[]
): boolean {
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

export async function crawlSource(
  source: Source,
  /** crawlAll 이 미리 병렬로 받아둔 HTML. 없으면 여기서 직접 받는다. */
  prefetchedHtml?: string
): Promise<CrawlResult> {
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
    const html = prefetchedHtml ?? (await fetchHtml(source.list_url));
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
      .select('title_norm, price_value')
      .gte('published_at', since)
      .limit(2000);

    const recentTitles = (recent ?? []) as { title_norm: string; price_value: number | null }[];

    const deals = items.map((item) => normalize(item, source.id, source.category_map ?? {}));

    // 조회수는 사이트별 스케일이 달라 배치 안에서 상대화 (P90 = 100점 기준)
    const vs = viewScoresFor(items);
    deals.forEach((d, i) => { d.view_score = vs[i]; });

    // 기존 글 조회를 건당 1쿼리 → 소스당 1쿼리로. (Vercel maxDuration 60초 대응)
    const { data: existingRows } = await db
      .from('deal')
      .select('id, external_id, comment_count, status, view_score')
      .eq('source_id', source.id)
      .in('external_id', deals.map((d) => d.external_id));

    const existingMap = new Map(
      ((existingRows ?? []) as
        { id: string; external_id: string; comment_count: number; status: string; view_score: number }[])
        .map((r) => [r.external_id, r])
    );

    // 왕복 횟수를 줄이려고 신규 insert 와 댓글 스냅샷은 모아서 한 번에 보낸다.
    const toInsert: NormalizedDeal[] = [];
    const snapshots: { deal_id: string; comment_count: number }[] = [];

    for (const deal of deals) {
      const existing = existingMap.get(deal.external_id);

      if (existing) {
        const changed =
          existing.comment_count !== deal.comment_count ||
          existing.status !== deal.status ||
          existing.view_score !== deal.view_score;
        if (changed) {
          await db
            .from('deal')
            .update({
              comment_count: deal.comment_count,
              view_score: deal.view_score,
              status: deal.status,
              checked_at: deal.checked_at,
            })
            .eq('id', existing.id);

          snapshots.push({ deal_id: existing.id, comment_count: deal.comment_count });
          base.updated++;
        } else {
          base.skipped++;
        }
        continue;
      }

      if (isDuplicate(deal, recentTitles)) {
        base.skipped++;
        continue;
      }

      toInsert.push(deal);
      // 같은 배치 안의 뒤쪽 항목과도 중복 비교가 되도록 미리 넣어둔다
      recentTitles.push({
        title_norm: normalizeTitle(deal.title),
        price_value: deal.price_value,
      });
    }

    if (toInsert.length) {
      const { data: inserted, error } = await db.from('deal').insert(toInsert).select('id');
      if (error) {
        base.skipped += toInsert.length;
        base.status = 'partial';
        base.message = error.message;
      } else {
        base.inserted = inserted?.length ?? toInsert.length;
      }
    }

    if (snapshots.length) {
      await db.from('comment_snapshot').insert(snapshots);
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

/**
 * 활성 소스 전체 수집.
 *
 * Vercel Hobby 의 함수 실행 제한이 60초인데, 순차 실행하면 소스당 14~18초가 들어
 * 3개만 돼도 54초로 한계에 붙는다(로컬에선 3초인데 Vercel 리전이 미국이라 느림).
 * 그래서 느린 쪽인 HTML 요청만 병렬로 먼저 받고, DB 반영은 순차로 처리한다.
 *
 * 요청을 병렬로 보내도 사이트마다 도메인이 달라 개별 사이트 입장에선 동시 요청이
 * 1건뿐이므로 부하 문제는 없다.
 */
export async function crawlAll(): Promise<CrawlResult[]> {
  const db = serviceClient();
  const { data, error } = await db.from('source').select('*').eq('is_active', true);
  if (error) throw new Error(`소스 조회 실패: ${error.message}`);

  const sources = (data ?? []) as Source[];

  // 1) HTML 병렬 수신 (실패해도 여기서 죽지 않게 결과를 그대로 담아둔다)
  const pages = await Promise.all(
    sources.map(async (s) => {
      if (!s.list_url) return { source: s, html: undefined as string | undefined };
      try {
        return { source: s, html: await fetchHtml(s.list_url) };
      } catch {
        return { source: s, html: undefined as string | undefined };
      }
    })
  );

  // 2) DB 반영은 순차로 — 소스 간 중복 판별이 직전 소스의 결과를 봐야 하므로
  const results: CrawlResult[] = [];
  for (const { source, html } of pages) {
    results.push(await crawlSource(source, html));
  }
  return results;
}

/** 랭킹 점수 재계산 */
export async function rescore(): Promise<void> {
  const db = serviceClient();
  const { error } = await db.rpc('compute_rank_scores');
  if (error) throw new Error(`점수 재계산 실패: ${error.message}`);
}
