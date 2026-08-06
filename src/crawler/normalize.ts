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
/**
 * 제목 키워드 → 카테고리.
 *
 * 위에서부터 먼저 맞는 규칙이 이깁니다. 그래서 오탐이 적은(= 그 단어가 나오면
 * 거의 확실한) 규칙을 위에 둡니다. 예를 들어 "파워"는 PC 부품일 수도 있고
 * "파워 업 블렌더"일 수도 있어서 "파워서플라이"로 좁혔습니다.
 */
const KEYWORD_RULES: [RegExp, string][] = [
  // 쿠폰·적립: 물건이 아니라 혜택. 다른 규칙보다 먼저 걸러야 함
  // "N멤버십무료", "무료배송" 같은 배송 문구에 걸리지 않도록 어휘를 좁게 유지
  [/쿠폰|기프티콘|기프트카드|상품권|컬쳐랜드|문화상품|\d+\s*만원권|바우처|이용권|구독권|할인권|캐시백|페이백|무료\s*배포|무료\s*나눔|네이버페이.*(?:적립|라방)|일일\s*적립/i, 'coupon'],

  // 게임·SW
  [/스팀|steam|플스|ps5|ps4|엑스박스|xbox|닌텐도|스위치\s?2|에픽게임|험블|dlc|게임\s*세일|게임패스|겜스톱|스팀덱|듀얼센스|조이콘|프로컨|ns2\b|엘든\s*링|예약판매.*에디션/i, 'game'],

  // PC·부품
  [/ssd|nvme|hdd|ddr\d|램\s?\d|메모리카드|cpu|라이젠|인텔\s|그래픽카드|rtx|gtx|rx\s?\d{3}|메인보드|파워서플라이|(?:pc|컴퓨터)\s?케이스|수랭|공랭|쿨러|모니터|기계식\s*키보드|게이밍\s*마우스|노트북|그램\s?1|맥북|데스크탑|본체|x3d|\d{4}\s?ti\b|키보드|마우스|랜카드|그래픽\s*카드|\d{4}\s*(?:ultra|super|oc)\b|주사율|\d{2,3}hz/i, 'pc'],

  // 디지털·모바일
  [/에어팟|버즈|갤럭시\s?(?:s|z|워치|탭)|아이폰|아이패드|태블릿|스마트워치|이어폰|헤드폰|헤드셋|충전기|충전\s*케이블|보조배터리|샤오미|미밴드|블루투스|공유기|외장하드|외장\s*케이스|usb|c타입|충전\s*스테이션|릴케이블|도어락|스마트\s*플러그|멀티탭/i, 'digital'],

  // 가전
  [/냉장고|김치냉장고|세탁기|건조기|에어컨|청소기|공기청정기|전자레인지|에어프라이어|\btv\b|티비|정수기|면도기|드라이기|드라이어|다이슨|믹서기|블렌더|선풍기|서큘레이터|가습기|제습기|전기포트|밥솥|인덕션|커피머신|안마|비데|토스터|식기세척기|전기장판|온수매트/i, 'appliance'],

  // 식품·건강 (블로그 유입 독자층의 주 관심사라 어휘를 넓게 잡음)
  [/삼겹살|오겹살|목살|소고기|돼지고기|한우|닭갈비|닭가슴살|족발|보쌈|곱창|전골|갈비|스테이크|햄|스팸|참치|장어|오징어|새우|연어|생선|김치|만두|라면|사발면|비빔면|짜장|짬뽕|볶음밥|밀키트|즉석|햇반|죽\b|국\b|탕\b|찌개|피자|치킨|떡볶이|버거|샌드위치|빵|파리바게뜨|뚜레쥬르|베이커리|케이크|과자|팝콘|젤리|초콜릿|아이스크림|빙수|사탕|견과|아몬드|호두|커피|원두|음료|주스|생수|삼다수|콜라|펩시|사이다|우유|요거트|치즈|계란|쌀\b|잡곡|과일|복숭아|멜론|수박|포도|사과|딸기|바나나|채소|양파|감자|고구마|김\b|고추장|된장|간장|식용유|올리브유|간식|반찬|식품|먹거리|유산균|락토핏|프로바이오틱|비타민|오메가|홍삼|프로틴|단백질|영양제|건강식품|아메리카노|라떼|에스프레소|콜드브루|환타|스프라이트|칠성|몬스터|박카스|탄산|하리보|캔디|사탕|베이글|도넛|쿠키|비스킷|크래커|누룽지|숭늉|냉면|국수|우동|칼국수|파스타|시리얼|넛츠|땅콩|캐슈|병아리콩|서리태|두부|샘물|무라벨|즉석밥|현미밥|공깃밥|누들|만두|어묵|소시지|베이컨|훈제|건조|말린|쏘팔메토|루테인|밀크씨슬|콜라겐|마그네슘|칼슘|철분|캡슐|정제/i, 'food'],

  // 생활·패션·뷰티
  [/물티슈|화장지|휴지|기저귀|세제|섬유유연제|샴푸|린스|바디워시|치약|칫솔|면도날|로션|스킨|에센스|크림|선크림|마스크팩|화장품|향수|의자|책상|가구|침대|매트리스|이불|베개|수건|주방|밀폐용기|프라이팬|냄비|텀블러|보온병|우산|가방|지갑|캐리어|옷\b|티셔츠|셔츠|바지|자켓|재킷|패딩|원피스|양말|속옷|신발|운동화|런닝화|슬리퍼|샌들|나이키|아디다스|골프|등산|캠핑|장난감|완구|피규어|반려|사료|고양이|강아지|캣\b|숨숨집|필터|건전지|파자마|잠옷|인견|슈즈|반팔티|반바지|맨투맨|후드티|레깅스|데오드란트|생리대|순면|운동복|워킹화|면도|쉐이빙|패밀리세일|굿즈|피규어|프라모델/i, 'life'],
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
// 조회수 → view_score (0~100)
//
//  사이트마다 트래픽 규모가 10배 이상 차이나므로(뽐뿌 1만 vs 퀘이사존 500)
//  조회수 절대값을 그대로 쓰면 소스 간 비교가 무의미해집니다.
//  같은 소스의 같은 수집 배치 안에서 상대화하고, 조회수 분포가 롱테일이므로
//  로그 스케일을 씁니다. 기준점은 배치의 90퍼센타일.
// ------------------------------------------------------------
export function percentile(values: number[], p: number): number {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b);
  if (!v.length) return 0;
  return v[Math.min(v.length - 1, Math.floor((v.length - 1) * p))];
}

/**
 * 한 배치의 조회수를 0~100 으로 환산.
 *  배치의 P10 을 0점, P90 을 100점으로 두고 로그 스케일에서 선형 보간.
 *  (0 기준으로 잡으면 조회수 5회짜리도 20점대가 나와 변별력이 없어짐)
 */
export function viewScoresFor(items: { viewCount?: number }[]): number[] {
  const counts = items.map((i) => i.viewCount ?? 0);
  const lo = Math.log(1 + percentile(counts, 0.1));
  const hi = Math.log(1 + percentile(counts, 0.9));
  const span = hi - lo;

  return counts.map((c) => {
    if (!c || c <= 0) return 0;
    if (span <= 0.01) return 50; // 조회수가 사실상 균일하면 중간값
    const s = ((Math.log(1 + c) - lo) / span) * 100;
    return Math.round(Math.min(100, Math.max(0, s)));
  });
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
    view_score: 0, // 배치 단위로 계산되므로 pipeline 에서 채운다
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
