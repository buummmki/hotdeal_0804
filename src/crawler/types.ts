/** 파서가 반환하는 정규화 이전의 원시 항목 */
export interface RawItem {
  externalId: string;
  title: string;
  url: string;
  /** 원문 카테고리 라벨. source.category_map 으로 내부 슬러그에 매핑됨 */
  rawCategory?: string;
  imageUrl?: string;
  commentCount?: number;
  publishedAt?: Date;
  /** 목록에서 이미 품절/종료가 표시되는 경우 */
  soldout?: boolean;
}

/** DB insert 직전 형태 */
export interface NormalizedDeal {
  source_id: string;
  external_id: string;
  source_url: string;
  title: string;
  summary: string | null;
  price_text: string | null;
  price_value: number | null;
  shipping_text: string | null;
  shipping_free: boolean | null;
  category: string;
  tags: string[];
  image_url: string | null;
  comment_count: number;
  status: 'normal' | 'soldout' | 'expired';
  published_at: string;
  collected_at: string;
  checked_at: string;
}

export interface Parser {
  /** source.id 와 일치해야 함 */
  id: string;
  name: string;
  /** 목록 페이지 HTML → 원시 항목 배열 */
  parseList(html: string, baseUrl: string): RawItem[];
}

export interface CrawlResult {
  sourceId: string;
  found: number;
  inserted: number;
  updated: number;
  skipped: number;
  status: 'success' | 'partial' | 'failed';
  message?: string;
  durationMs: number;
}
