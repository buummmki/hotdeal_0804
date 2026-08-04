import type { RawItem, NormalizedDeal } from './types';

// ------------------------------------------------------------
// 가격 추출
//  "[G마켓] 삼성 SSD (198,000원/무료)" → { text: '198,000원', value: 198000 }
// ------------------------------------------------------------
const PRICE_PATTERNS: RegExp[] = [
  /([0-9][0-9,\.]*)\s*원/,            // 198,000원
  /[￦₩]\s*([0-9][0-9,\.]*)/,         // ￦ 990,000  (퀘이사존)
  /\$\s*([0-9][0-9,\.]*)/,            // $29.99
  /([0-9][0-9,\.]*)\s*달러/,
  /([0-9][0-9,\.]*)\s*엔/,
];

const FREE_WORDS = /(무료|free|공짜|0원)/i;

export function extractPrice(title: string): { text: string | null; value: number | null } {
  // 괄호 안쪽을 우선 탐색 (커뮤니티 관례상 가격이 괄호에 들어감)
  const paren = title.match(/[（(]([^)）]*)[)）]\s*$/)?.[1] ?? title;

  for (const re of PRICE_PATTERNS) {
    const m = paren.match(re) ?? title.match(re);
    if (m) {
      const raw = m[1].replace(/,/g, '');
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0) {
        return { text: m[0].trim(), value: Math.round(value) };
      }
    }
  }
  if (FREE_WORDS.test(paren)) return { text: '무료', value: 0 };
  return { text: null, value: null };
}

// ------------------------------------------------------------
// 배송비 추출
//  괄호 안 '/' 뒤쪽이 관례적으로 배송비: (198,000원/무료)
// ------------------------------------------------------------
export function extractShipping(title: string): { text: string | null; free: boolean | null } {
  const paren = title.match(/[（(]([^)）]*)[)）]\s*$/)?.[1];
  if (!paren) return { text: null, free: null };

  const parts = paren.split(/[\/／]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return { text: null, free: null };

  const last = parts[parts.length - 1];
  if (/무료|free|무배/i.test(last)) return { text: '무료배송', free: true };
  if (/조건|착불|별도/.test(last)) return { text: last, free: false };

  const m = last.match(/([0-9][0-9,]*)\s*원?/);
  if (m) {
    const v = Number(m[1].replace(/,/g, ''));
    return { text: `${m[1]}원`, free: v === 0 };
  }
  return { text: null, free: null };
}

/** "배송비 무료", "2,500원", "조건부 무료" 같은 독립 배송비 문자열 파싱 */
export function parseShippingText(text: string): { text: string | null; free: boolean | null } {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return { text: null, free: null };
  if (/조건/.test(t)) return { text: t, free: false };
  if (/무료|무배|free/i.test(t)) return { text: '무료배송', free: true };
  if (/착불|별도|유료/.test(t)) return { text: t, free: false };
  const m = t.match(/([0-9][0-9,]*)\s*원?/);
  if (m) {
    const v = Number(m[1].replace(/,/g, ''));
    return { text: `${m[1]}원`, free: v === 0 };
  }
  return { text: t, free: null };
}

// ------------------------------------------------------------
// 카테고리 매핑
//  1) source.category_map 우선
//  2) 실패 시 제목 키워드 규칙
// ------------------------------------------------------------
const KEYWORD_RULES: [RegExp, string][] = [
  [/ssd|nvme|hdd|ddr|램|메모리|cpu|라이젠|인텔|그래픽|rtx|rx\s?\d|메인보드|파워|케이스|쿨러|모니터|키보드|마우스|노트북|그램|맥북|컴퓨터|pc/i, 'pc'],
  [/스팀|steam|플스|ps5|ps4|엑스박스|xbox|닌텐도|스위치|게임|에픽|험블|dlc/i, 'game'],
  [/에어팟|버즈|갤럭시|아이폰|아이패드|태블릿|스마트워치|워치|이어폰|헤드폰|충전기|보조배터리|샤오미|미밴드/i, 'digital'],
  [/냉장고|세탁기|건조기|에어컨|청소기|공기청정기|전자레인지|에어프라이어|tv|티비|정수기|면도기|드라이기|다이슨/i, 'appliance'],
  [/쿠폰|기프티콘|상품권|포인트|캐시|적립|이용권|구독|멤버십|할인권/i, 'coupon'],
  [/삼겹살|고기|계란|우유|과자|라면|커피|음료|쌀|과일|채소|식품|간식|젤리|고추장|즉석|밀키트|유산균|건강식품|콜라/i, 'food'],
  [/의자|책상|가구|침대|매트리스|옷|티셔츠|바지|신발|운동화|나이키|아디다스|기저귀|세제|화장지|샴푸|사료|반려|필터/i, 'life'],
];

export function mapCategory(
  rawCategory: string | undefined,
  title: string,
  categoryMap: Record<string, string>
): string {
  if (rawCategory) {
    const direct = categoryMap[rawCategory.trim()];
    if (direct) return direct;
  }
  for (const [re, slug] of KEYWORD_RULES) {
    if (re.test(title)) return slug;
  }
  return 'etc';
}

// ------------------------------------------------------------
// 태그 추출 : 대괄호 말머리 + 브랜드 키워드
// ------------------------------------------------------------
const BRANDS = /(삼성|LG|애플|apple|샤오미|다이슨|나이키|아디다스|소니|닌텐도|마이크론|시게이트|로지텍|커세어|벤큐|필립스|쿠팡|G마켓|11번가|네이버|위메프|티몬|SSG|옥션|무신사|알리|스팀)/gi;

export function extractTags(title: string): string[] {
  const tags = new Set<string>();
  for (const m of title.matchAll(/\[([^\]]{1,14})\]/g)) tags.add(m[1].trim());
  for (const m of title.matchAll(BRANDS)) tags.add(m[1]);
  return [...tags].slice(0, 6);
}

// ------------------------------------------------------------
// 상태 판정
// ------------------------------------------------------------
export function detectStatus(item: RawItem): 'normal' | 'soldout' | 'expired' {
  if (item.soldout) return 'soldout';
  if (/품절|매진|sold\s?out|마감|종료|중단/i.test(item.title)) return 'soldout';
  if (/삭제|종료됨|기간만료/i.test(item.title)) return 'expired';
  return 'normal';
}

// ------------------------------------------------------------
// 전체 정규화
// ------------------------------------------------------------
export function normalize(
  item: RawItem,
  sourceId: string,
  categoryMap: Record<string, string>
): NormalizedDeal {
  // 목록에 가격/배송비가 별도 필드로 있으면 그쪽이 정확하므로 우선 사용
  const price = item.priceText ? extractPrice(item.priceText) : extractPrice(item.title);
  const shipping = item.shippingText
    ? parseShippingText(item.shippingText)
    : extractShipping(item.title);
  const now = new Date().toISOString();

  return {
    source_id: sourceId,
    external_id: item.externalId,
    source_url: item.url,
    title: item.title.trim().slice(0, 300),
    summary: null,
    price_text: price.text,
    price_value: price.value,
    shipping_text: shipping.text,
    shipping_free: shipping.free,
    category: mapCategory(item.rawCategory, item.title, categoryMap),
    tags: extractTags(item.title),
    image_url: item.imageUrl ?? null,
    comment_count: item.commentCount ?? 0,
    status: detectStatus(item),
    published_at: (item.publishedAt ?? new Date()).toISOString(),
    collected_at: now,
    checked_at: now,
  };
}

// ------------------------------------------------------------
// 중복 판별용 제목 정규화 (SQL normalize_title 과 동일 규칙)
// ------------------------------------------------------------
export function normalizeTitle(t: string): string {
  return t
    .replace(/\[[^\]]*\]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '');
}

/** 두 정규화 제목의 3-gram 자카드 유사도 */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const grams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
    return set;
  };
  const A = grams(a);
  const B = grams(b);
  if (!A.size || !B.size) return a === b ? 1 : 0;
  let inter = 0;
  A.forEach((g) => { if (B.has(g)) inter++; });
  return inter / (A.size + B.size - inter);
}
