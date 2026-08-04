import fs from 'fs';
import path from 'path';
import { MOCK_SOURCES } from './mock';
import type { DealWithSource, Source } from './types';
import { PARSERS } from '../crawler/parsers';
import { normalize } from '../crawler/normalize';

const CACHE_FILE = path.join(process.cwd(), '.next', 'live_deals_cache.json');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

interface CacheData {
  timestamp: number;
  deals: DealWithSource[];
}

let inMemoryCache: CacheData | null = null;
let isRefreshing = false;

function computeScore(
  comments: number,
  publishedAtStr: string,
  priceValue: number | null,
  imageUrl: string | null,
  summary: string | null,
  shippingFree: boolean | null,
  status: string
) {
  const publishedAt = new Date(publishedAtStr).getTime();
  const hoursAgo = Math.max(0, (Date.now() - publishedAt) / (1000 * 3600));
  const freshness = 100 * Math.exp(-0.0289 * hoursAgo);
  const reaction = Math.min(100, Math.log(1 + comments) * 22);
  const quality =
    (priceValue !== null ? 40 : 0) +
    (imageUrl ? 30 : 0) +
    (summary ? 15 : 0) +
    (shippingFree ? 15 : 0);
  const penalty = status === 'soldout' ? -30 : status === 'expired' ? -60 : 0;
  const viewEstimate = Math.floor(comments * 8 + Math.random() * 10);

  return {
    view_score: viewEstimate,
    freshness_score: +freshness.toFixed(2),
    reaction_score: +reaction.toFixed(2),
    quality_score: quality,
    rank_score: +(reaction * 0.5 + viewEstimate * 0.2 + freshness * 0.2 + quality * 0.1 + penalty).toFixed(2),
  };
}

async function fetchHtmlWithTimeout(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

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

const LIVE_TARGETS: { id: string; name: string; listUrl: string; baseUrl: string; color: string }[] = [
  {
    id: 'ruliweb',
    name: '루리웹',
    listUrl: 'https://bbs.ruliweb.com/market/board/1020',
    baseUrl: 'https://bbs.ruliweb.com',
    color: '#2563eb',
  },
  {
    id: 'clien',
    name: '클리앙',
    listUrl: 'https://www.clien.net/service/board/jirum',
    baseUrl: 'https://www.clien.net',
    color: '#0891b2',
  },
  {
    id: 'ppomppu',
    name: '뽐뿌',
    listUrl: 'https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu',
    baseUrl: 'https://www.ppomppu.co.kr',
    color: '#e11d48',
  },
];

export async function refreshLiveDeals(): Promise<DealWithSource[]> {
  if (isRefreshing) return inMemoryCache?.deals ?? [];
  isRefreshing = true;

  try {
    const allDeals: DealWithSource[] = [];

    for (const target of LIVE_TARGETS) {
      try {
        const parser = PARSERS[target.id];
        if (!parser) continue;

        const html = await fetchHtmlWithTimeout(target.listUrl);
        const rawItems = parser.parseList(html, target.baseUrl);

        for (const item of rawItems) {
          const norm = normalize(item, target.id, {});
          const scores = computeScore(
            norm.comment_count,
            norm.published_at,
            norm.price_value,
            norm.image_url,
            norm.summary,
            norm.shipping_free,
            norm.status
          );

          const dealWithSource: DealWithSource = {
            id: `${target.id}-${norm.external_id}`,
            source_id: target.id,
            external_id: norm.external_id,
            source_url: norm.source_url,
            title: norm.title,
            title_norm: null,
            summary: norm.summary,
            price_text: norm.price_text,
            price_value: norm.price_value,
            currency: 'KRW',
            shipping_text: norm.shipping_text,
            shipping_free: norm.shipping_free,
            category: norm.category,
            tags: norm.tags,
            image_url: norm.image_url,
            buy_url: null,
            comment_count: norm.comment_count,
            view_score: scores.view_score,
            freshness_score: scores.freshness_score,
            reaction_score: scores.reaction_score,
            quality_score: scores.quality_score,
            rank_score: scores.rank_score,
            admin_boost: 0,
            is_pinned: false,
            is_hidden: false,
            is_reviewed: true,
            status: norm.status,
            published_at: norm.published_at,
            collected_at: norm.collected_at,
            checked_at: norm.checked_at,
            updated_at: norm.collected_at,
            source: {
              id: target.id,
              name: target.name,
              color: target.color,
            },
          };

          allDeals.push(dealWithSource);
        }
      } catch (e) {
        console.error(`Failed to crawl live deals for ${target.id}:`, e);
      }
    }

    if (allDeals.length > 0) {
      // Sort by published_at desc initially
      allDeals.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

      inMemoryCache = {
        timestamp: Date.now(),
        deals: allDeals,
      };

      try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(inMemoryCache, null, 2), 'utf-8');
      } catch (_) {}

      return allDeals;
    }
  } finally {
    isRefreshing = false;
  }

  return inMemoryCache?.deals ?? [];
}

export async function getLiveDeals(): Promise<DealWithSource[]> {
  // Check memory
  if (inMemoryCache && Date.now() - inMemoryCache.timestamp < CACHE_TTL_MS) {
    return inMemoryCache.deals;
  }

  // Check file cache
  if (!inMemoryCache && fs.existsSync(CACHE_FILE)) {
    try {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed: CacheData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.deals) && parsed.deals.length > 0) {
        inMemoryCache = parsed;
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.deals;
        }
      }
    } catch (_) {}
  }

  // Refresh if stale or empty
  const deals = await refreshLiveDeals();
  return deals;
}
