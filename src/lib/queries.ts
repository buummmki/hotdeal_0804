import { supabase, isConfigured } from './supabase';
import { mockDeals, MOCK_SOURCES } from './mock';
import { getLiveDeals } from './liveStore';
import type { DealWithSource, Source, SortKey } from './types';

const SELECT = '*, source:source_id (id, name, color)';

export interface ListParams {
  category?: string;
  sourceId?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  query?: string;
}

export interface ListResult {
  deals: DealWithSource[];
  total: number;
  usingMock: boolean;
}

function orderFor(sort: SortKey) {
  switch (sort) {
    case 'latest':
      return { column: 'published_at', ascending: false };
    case 'comment':
      return { column: 'comment_count', ascending: false };
    case 'price':
      return { column: 'price_value', ascending: true };
    default:
      return { column: 'rank_score', ascending: false };
  }
}

function sortList(list: DealWithSource[], sort: SortKey) {
  const c = [...list];
  switch (sort) {
    case 'latest':
      return c.sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at));
    case 'comment':
      return c.sort((a, b) => b.comment_count - a.comment_count);
    case 'price':
      return c.sort((a, b) => (a.price_value ?? Infinity) - (b.price_value ?? Infinity));
    default:
      return c.sort((a, b) => b.rank_score - a.rank_score);
  }
}

export async function listDeals(p: ListParams = {}): Promise<ListResult> {
  const {
    category, sourceId, sort = 'rank', page = 1, perPage = 24, query,
  } = p;

  if (!isConfigured) {
    let list: DealWithSource[] = [];
    let usingMock = false;

    try {
      list = await getLiveDeals();
    } catch (e) {
      console.error('Failed to get live deals:', e);
    }

    if (!list || list.length === 0) {
      list = mockDeals();
      usingMock = true;
    }

    if (category && category !== 'all') list = list.filter((d) => d.category === category);
    if (sourceId) list = list.filter((d) => d.source_id === sourceId);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.summary ?? '').toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const sorted = sortList(list, sort);
    const pinned = sorted.filter((d) => d.is_pinned);
    const rest = sorted.filter((d) => !d.is_pinned);
    const merged = [...pinned, ...rest];
    return {
      deals: merged.slice((page - 1) * perPage, page * perPage),
      total,
      usingMock,
    };
  }

  const from = (page - 1) * perPage;
  let q = supabase
    .from('deal')
    .select(SELECT, { count: 'exact' })
    .eq('is_hidden', false);

  if (category && category !== 'all') q = q.eq('category', category);
  if (sourceId) q = q.eq('source_id', sourceId);
  if (query) q = q.or(`title.ilike.%${query}%,summary.ilike.%${query}%`);
  if (sort === 'price') q = q.not('price_value', 'is', null);

  const o = orderFor(sort);
  const { data, error, count } = await q
    .order('is_pinned', { ascending: false })
    .order(o.column, { ascending: o.ascending })
    .range(from, from + perPage - 1);

  if (error) throw new Error(`딜 목록 조회 실패: ${error.message}`);
  return {
    deals: (data ?? []) as unknown as DealWithSource[],
    total: count ?? 0,
    usingMock: false,
  };
}

export async function getDeal(id: string): Promise<DealWithSource | null> {
  if (!isConfigured) {
    const live = await getLiveDeals().catch(() => []);
    const found = live.find((d) => d.id === id);
    if (found) return found;
    return mockDeals().find((d) => d.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('deal')
    .select(SELECT)
    .eq('id', id)
    .eq('is_hidden', false)
    .maybeSingle();

  if (error) throw new Error(`딜 조회 실패: ${error.message}`);
  return (data as unknown as DealWithSource) ?? null;
}

export async function relatedDeals(deal: DealWithSource, limit = 6): Promise<DealWithSource[]> {
  if (!isConfigured) {
    const live = await getLiveDeals().catch(() => mockDeals());
    return live
      .filter((d) => d.category === deal.category && d.id !== deal.id)
      .sort((a, b) => b.rank_score - a.rank_score)
      .slice(0, limit);
  }
  const { data } = await supabase
    .from('deal')
    .select(SELECT)
    .eq('category', deal.category)
    .eq('is_hidden', false)
    .neq('id', deal.id)
    .order('rank_score', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as DealWithSource[];
}

export async function hotDeals(limit = 8): Promise<DealWithSource[]> {
  const { deals } = await listDeals({ sort: 'rank', perPage: limit });
  return deals;
}

export async function latestDeals(limit = 8): Promise<DealWithSource[]> {
  const { deals } = await listDeals({ sort: 'latest', perPage: limit });
  return deals;
}

export async function mostCommented(limit = 8): Promise<DealWithSource[]> {
  const { deals } = await listDeals({ sort: 'comment', perPage: limit });
  return deals;
}

/**
 * 노출용 출처 목록.
 *
 * 비활성 출처(is_active=false)는 수집이 멈춰 딜이 0건이므로 제외합니다.
 * 목록·사이트맵에 남겨두면 빈 페이지가 색인돼 사이트 품질 평가에 불리합니다.
 */
export async function listSources(): Promise<Source[]> {
  if (!isConfigured) return MOCK_SOURCES;
  const { data, error } = await supabase
    .from('source')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(`출처 조회 실패: ${error.message}`);
  return (data ?? []) as Source[];
}

export async function getSource(id: string): Promise<Source | null> {
  if (!isConfigured) return MOCK_SOURCES.find((s) => s.id === id) ?? null;
  const { data } = await supabase.from('source').select('*').eq('id', id).maybeSingle();
  return (data as Source) ?? null;
}

export async function allDealIds(limit = 1000): Promise<{ id: string; updated_at: string }[]> {
  if (!isConfigured) {
    const live = await getLiveDeals().catch(() => mockDeals());
    return live.map((d) => ({ id: d.id, updated_at: d.updated_at }));
  }
  const { data } = await supabase
    .from('deal')
    .select('id, updated_at')
    .eq('is_hidden', false)
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as { id: string; updated_at: string }[];
}
