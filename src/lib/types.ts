export type DealStatus = 'normal' | 'soldout' | 'expired';
export type SourceType = 'community' | 'mall' | 'affiliate';

export interface Deal {
  id: string;
  source_id: string;
  source_url: string;
  external_id: string | null;
  title: string;
  title_norm: string | null;
  summary: string | null;
  price_text: string | null;
  price_value: number | null;
  currency: string | null;
  shipping_text: string | null;
  shipping_free: boolean | null;
  category: string;
  tags: string[];
  image_url: string | null;
  buy_url: string | null;
  comment_count: number;
  reaction_score: number;
  view_score: number;
  quality_score: number;
  freshness_score: number;
  rank_score: number;
  admin_boost: number;
  is_pinned: boolean;
  is_hidden: boolean;
  is_reviewed: boolean;
  status: DealStatus;
  published_at: string;
  collected_at: string;
  checked_at: string | null;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  base_url: string;
  list_url: string | null;
  is_active: boolean;
  crawl_cycle: number;
  category_map: Record<string, string>;
  color: string | null;
  last_crawled_at: string | null;
}

export interface DealWithSource extends Deal {
  source: Pick<Source, 'id' | 'name' | 'color'> | null;
}

export type SortKey = 'rank' | 'latest' | 'comment' | 'price';

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rank', label: '인기순' },
  { key: 'latest', label: '최신순' },
  { key: 'comment', label: '댓글순' },
  { key: 'price', label: '낮은 가격순' },
];

/**
 * 탭 노출 순서.
 *
 * 주 유입원인 네이버 블로그(생활·맛집 정보) 독자층이 50~60대 여성 중심이라,
 * 식품·생활 카테고리를 앞에 두고 PC·게임처럼 관심도가 낮은 쪽을 뒤로 보냅니다.
 */
export const CATEGORIES: { slug: string; label: string }[] = [
  { slug: 'all', label: '전체' },
  { slug: 'food', label: '식품' },
  { slug: 'life', label: '생활/패션' },
  { slug: 'appliance', label: '가전' },
  { slug: 'coupon', label: '쿠폰/상품권' },
  { slug: 'digital', label: '디지털' },
  { slug: 'pc', label: 'PC/하드웨어' },
  { slug: 'game', label: '게임' },
  { slug: 'etc', label: '기타' },
];

export const categoryLabel = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? '기타';
