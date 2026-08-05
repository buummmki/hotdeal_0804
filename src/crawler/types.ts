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
  /** 목록에 가격이 별도 필드로 노출되는 경우 (퀘이사존 등). 제목 파싱보다 우선함 */
  priceText?: string;
  /** 목록에 배송비가 별도 필드로 노출되는 경우 */
  shippingText?: string;
  /** 목록의 조회수. 랭킹의 view_score 산출에 사용 */
  viewCount?: number;
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
  /** 0~100. 같은 소스 배치 내 상대값 (사이트마다 트래픽 규모가 달라 절대값은 비교 불가) */
  view_score: number;
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
