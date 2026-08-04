/**
 * Supabase 미설정 상태에서도 화면을 확인할 수 있게 하는 폴백 데이터.
 * .env.local 에 키를 넣으면 자동으로 실제 DB를 사용합니다.
 * 내용은 supabase/02_seed.sql 과 동일합니다.
 */
import type { DealWithSource, Source } from './types';

export const MOCK_SOURCES: Source[] = [
  { id: 'ppomppu', name: '뽐뿌', type: 'community', base_url: 'https://www.ppomppu.co.kr', list_url: null, is_active: true, crawl_cycle: 5, category_map: {}, color: '#e11d48', last_crawled_at: null },
  { id: 'ruliweb', name: '루리웹', type: 'community', base_url: 'https://bbs.ruliweb.com', list_url: null, is_active: true, crawl_cycle: 10, category_map: {}, color: '#2563eb', last_crawled_at: null },
  { id: 'clien', name: '클리앙', type: 'community', base_url: 'https://www.clien.net', list_url: null, is_active: true, crawl_cycle: 10, category_map: {}, color: '#0891b2', last_crawled_at: null },
  { id: 'quasar', name: '퀘이사존', type: 'community', base_url: 'https://quasarzone.com', list_url: null, is_active: true, crawl_cycle: 15, category_map: {}, color: '#7c3aed', last_crawled_at: null },
  { id: 'coolenjoy', name: '쿨엔조이', type: 'community', base_url: 'https://coolenjoy.net', list_url: null, is_active: true, crawl_cycle: 15, category_map: {}, color: '#059669', last_crawled_at: null },
];

type Raw = [
  src: string, ext: string, title: string, summary: string | null,
  priceText: string, priceValue: number | null, shipping: string, free: boolean,
  category: string, tags: string[], img: string | null, comments: number,
  view: number, status: 'normal' | 'soldout' | 'expired', hoursAgo: number
];

const RAW: Raw[] = [
  ['ppomppu','700101','[G마켓] 삼성 990 PRO 2TB NVMe SSD (198,000원/무료)','PS5 호환 히트싱크 미포함 모델. 카드 즉시할인 적용가.','198,000원',198000,'무료배송',true,'pc',['SSD','삼성','NVMe'],'https://picsum.photos/seed/ssd990/400/300',312,88,'normal',0.6],
  ['quasar','5501','[다나와] RTX 5070 Ti 게이밍 OC (879,000원/무료)','재고 소량. 다나와 최저가 대비 4만원 인하.','879,000원',879000,'무료배송',true,'pc',['그래픽카드','RTX','엔비디아'],'https://picsum.photos/seed/rtx5070/400/300',421,95,'normal',0.75],
  ['ppomppu','700102','[쿠팡] 곰곰 국내산 삼겹살 1kg (14,900원/로켓프레시)','와우회원 한정가. 1인 2팩 구매 제한.','14,900원',14900,'무료배송',true,'food',['삼겹살','쿠팡','로켓프레시'],'https://picsum.photos/seed/pork/400/300',147,72,'normal',1.2],
  ['ruliweb','8801','[스팀] 발더스 게이트 3 (35,700원/역대최저)','가을 세일 30% 할인. 한국어 자막 지원.','35,700원',35700,'없음',true,'game',['스팀','RPG','세일'],'https://picsum.photos/seed/bg3/400/300',289,91,'normal',2],
  ['clien','19201','[11번가] LG 그램 16 2025년형 i7/16GB/512GB (1,349,000원/무료)','11번가 슈팅데이 카드할인 중복 적용가.','1,349,000원',1349000,'무료배송',true,'pc',['노트북','LG그램','11번가'],'https://picsum.photos/seed/gram16/400/300',96,65,'normal',3],
  ['ppomppu','700103','[SSG] 스타벅스 아메리카노 T 기프티콘 (3,600원)','정가 4,500원. 유효기간 60일.','3,600원',3600,'없음',true,'coupon',['스타벅스','기프티콘'],'https://picsum.photos/seed/sbux/400/300',58,44,'normal',4],
  ['ruliweb','8802','[네이버] 다이슨 V15 디텍트 앱솔루트 (698,000원/무료)','네이버플러스 멤버십 적립 10% 별도.','698,000원',698000,'무료배송',true,'appliance',['다이슨','무선청소기'],'https://picsum.photos/seed/dyson/400/300',134,70,'normal',5],
  ['clien','19202','[알리익스프레스] 샤오미 미밴드 9 글로벌 (28,400원/무료)','해외직구. 배송 7~12일 소요.','28,400원',28400,'무료배송',true,'digital',['샤오미','스마트밴드','직구'],'https://picsum.photos/seed/miband/400/300',77,52,'normal',6],
  ['coolenjoy','3301','[하이마트] LG 스탠바이미 2세대 (999,000원/무료설치)','전시상품 아님. 새제품 재고 정리.','999,000원',999000,'무료배송',true,'appliance',['LG','스탠바이미','TV'],'https://picsum.photos/seed/standbyme/400/300',112,61,'normal',7],
  ['ppomppu','700104','[티몬] 종근당 락토핏 생유산균 골드 6통 (23,900원/무료)','6개월분. 유통기한 2027년 이후.','23,900원',23900,'무료배송',true,'food',['유산균','락토핏','건강식품'],'https://picsum.photos/seed/lacto/400/300',203,68,'normal',8],
  ['quasar','5502','[컴퓨존] 마이크론 크루셜 DDR5 32GB (2x16) 6000 (89,900원)','CL30. AMD EXPO / 인텔 XMP 지원.','89,900원',89900,'2,500원',false,'pc',['램','DDR5','마이크론'],'https://picsum.photos/seed/ddr5/400/300',88,58,'normal',9],
  ['ruliweb','8803','[플스스토어] 엘든 링 나이트레인 (39,900원/60% 할인)','디지털 다운로드. 세일 종료 3일 남음.','39,900원',39900,'없음',true,'game',['PS5','엘든링','세일'],'https://picsum.photos/seed/elden/400/300',256,84,'normal',10],
  ['clien','19203','[오늘의집] 시디즈 T50 에어 인체공학 의자 (289,000원/무료)','신규가입 쿠폰 중복 시 269,000원.','289,000원',289000,'무료배송',true,'life',['의자','시디즈','가구'],'https://picsum.photos/seed/chair/400/300',65,47,'normal',11],
  ['ppomppu','700105','[이마트몰] 하기스 매직컴포트 기저귀 4팩 (39,900원)','사이즈 선택 가능. 이마트 앱 쿠폰 적용가.','39,900원',39900,'무료배송',true,'life',['기저귀','하기스','육아'],'https://picsum.photos/seed/diaper/400/300',41,35,'soldout',12],
  ['coolenjoy','3302','[에누리] 앱코 K640 기계식 키보드 적축 (34,900원/무료)','풀배열 RGB. 한정 수량.','34,900원',34900,'무료배송',true,'pc',['키보드','기계식','앱코'],'https://picsum.photos/seed/keyboard/400/300',53,40,'normal',13],
  ['quasar','5503','[SK브로드밴드] 인터넷 500M + IPTV 신규가입 현금 45만원','3년 약정. 설치비 면제 조건 확인 필요.','현금 45만원',450000,'해당없음',true,'etc',['인터넷','가입','현금지원'],null,29,22,'normal',14],
  ['ruliweb','8804','[교보문고] 밀리의서재 12개월 이용권 (79,000원)','정가 143,880원 대비 45% 할인.','79,000원',79000,'없음',true,'coupon',['전자책','구독권','밀리의서재'],'https://picsum.photos/seed/millie/400/300',74,49,'normal',15],
  ['ppomppu','700106','[위메프] 애플 에어팟 프로 3세대 (289,000원/무료)','정품 국내 발송. 애플케어 별도.','289,000원',289000,'무료배송',true,'digital',['에어팟','애플','이어폰'],'https://picsum.photos/seed/airpods/400/300',318,89,'normal',16],
  ['clien','19204','[마켓컬리] 신선한란 특란 30구 (5,900원)','첫 구매 회원 한정. 컬리 새벽배송.','5,900원',5900,'무료배송',true,'food',['계란','마켓컬리','신선식품'],'https://picsum.photos/seed/eggs/400/300',36,28,'normal',17],
  ['coolenjoy','3303','[G마켓] 로지텍 MX Master 4 무선마우스 (109,000원)','스마트알림 지원 신형. 카드 청구할인 포함.','109,000원',109000,'무료배송',true,'pc',['마우스','로지텍','MX'],'https://picsum.photos/seed/mxmaster/400/300',91,56,'normal',18],
  ['quasar','5504','[아이코다] 시게이트 바라쿠다 8TB HDD (159,000원)','NAS 용도 권장 안 함. 일반 저장용.','159,000원',159000,'3,000원',false,'pc',['HDD','시게이트','스토리지'],'https://picsum.photos/seed/hdd8tb/400/300',47,33,'normal',19],
  ['ruliweb','8805','[닌텐도스토어] 젤다의 전설 티어스 오브 더 킹덤 (44,800원)','패키지판. 재고 한정.','44,800원',44800,'무료배송',true,'game',['닌텐도','젤다','스위치'],'https://picsum.photos/seed/zelda/400/300',168,66,'normal',20],
  ['ppomppu','700107','[홈플러스] 청정원 순창 고추장 3kg (12,900원)','온라인 단독가. 매장가 대비 40% 저렴.','12,900원',12900,'무료배송',true,'food',['고추장','청정원','장류'],'https://picsum.photos/seed/gochujang/400/300',22,19,'normal',21],
  ['clien','19205','[무신사] 나이키 에어포스1 07 화이트 (89,000원/무료)','전 사이즈 재고 있음. 무신사 적립금 별도.','89,000원',89000,'무료배송',true,'life',['나이키','운동화','무신사'],'https://picsum.photos/seed/af1/400/300',129,63,'normal',22],
  ['coolenjoy','3304','[전자랜드] 삼성 비스포크 큐브 에어 공기청정기 (259,000원)','2025년형. 무료 배송 및 설치.','259,000원',259000,'무료배송',true,'appliance',['공기청정기','삼성','비스포크'],'https://picsum.photos/seed/aircleaner/400/300',58,42,'normal',23],
  ['quasar','5505','[네이버] 벤큐 EX2710U 4K 144Hz 게이밍 모니터 (679,000원)','HDMI 2.1 지원. 콘솔 게이밍 적합.','679,000원',679000,'무료배송',true,'pc',['모니터','벤큐','4K'],'https://picsum.photos/seed/benq/400/300',103,59,'normal',25],
  ['ppomppu','700108','[옥션] 필립스 5000 시리즈 전기면도기 (79,000원/무료)','스마트클린 미포함 모델.','79,000원',79000,'무료배송',true,'appliance',['면도기','필립스'],'https://picsum.photos/seed/shaver/400/300',44,31,'normal',27],
  ['ruliweb','8806','[에픽게임즈] 시티즈 스카이라인 2 무료 배포','기간 한정 무료. 계정 영구 보관.','무료',0,'없음',true,'game',['에픽','무료배포','시뮬레이션'],'https://picsum.photos/seed/cities2/400/300',389,93,'expired',29],
  ['clien','19206','[쿠팡] 앱솔루트 유산균 사료 강아지 2kg (19,800원)','로켓배송. 정기배송 시 추가 5% 할인.','19,800원',19800,'무료배송',true,'life',['강아지','사료','반려동물'],'https://picsum.photos/seed/dogfood/400/300',31,24,'normal',31],
  ['coolenjoy','3305','[다나와] 마이크로닉스 클래식 II 850W 골드 (89,000원)','풀모듈러. 10년 무상보증.','89,000원',89000,'무료배송',true,'pc',['파워','마이크로닉스','850W'],'https://picsum.photos/seed/psu850/400/300',66,45,'normal',33],
  ['quasar','5506','[컴퓨존] AMD 라이젠 9 9950X3D (789,000원)','정품 박스. 쿨러 미포함.','789,000원',789000,'무료배송',true,'pc',['CPU','AMD','라이젠'],'https://picsum.photos/seed/ryzen/400/300',214,79,'normal',35],
  ['ppomppu','700109','[GS샵] 삼성 갤럭시 워치 8 클래식 46mm (369,000원)','자급제. 블루투스 모델.','369,000원',369000,'무료배송',true,'digital',['갤럭시워치','삼성','웨어러블'],'https://picsum.photos/seed/gwatch/400/300',97,54,'normal',37],
  ['ruliweb','8807','[배민] 배달의민족 5,000원 할인쿠폰 (전 메뉴)','최소 주문 12,000원. 오늘 자정까지.','무료',0,'해당없음',true,'coupon',['배달의민족','쿠폰'],null,183,71,'expired',39],
  ['clien','19207','[SSG] 하리보 골드베렌 1kg 대용량 (13,900원)','독일 직수입. 유통기한 2027.03.','13,900원',13900,'무료배송',true,'food',['하리보','젤리','간식'],'https://picsum.photos/seed/haribo/400/300',39,27,'normal',41],
  ['coolenjoy','3306','[하이마트] 삼성 비스포크 제트 AI 무선청소기 (549,000원)','청정스테이션 포함. 전시상품.','549,000원',549000,'무료배송',true,'appliance',['청소기','삼성','비스포크'],'https://picsum.photos/seed/jetai/400/300',72,48,'normal',43],
  ['quasar','5507','[아이코다] 커세어 4000D 에어플로우 케이스 (79,000원)','미들타워. 팬 2개 기본 포함.','79,000원',79000,'3,000원',false,'pc',['케이스','커세어','쿨링'],'https://picsum.photos/seed/case4000d/400/300',34,25,'normal',45],
  ['ppomppu','700110','[롯데온] 코카콜라 제로 355ml 24캔 (14,900원)','박스 단위. 유통기한 6개월 이상.','14,900원',14900,'무료배송',true,'food',['콜라','음료','제로'],'https://picsum.photos/seed/coke/400/300',48,32,'soldout',47],
  ['ruliweb','8808','[스팀] 사이버펑크 2077 얼티밋 에디션 (29,700원/70%)','팬텀 리버티 확장팩 포함.','29,700원',29700,'없음',true,'game',['스팀','사이버펑크','세일'],'https://picsum.photos/seed/cp2077/400/300',221,76,'normal',49],
  ['clien','19208','[교보] 아이패드 프로 13 M5 256GB 와이파이 (1,489,000원)','교육할인 적용가. 학생/교직원 인증 필요.','1,489,000원',1489000,'무료배송',true,'digital',['아이패드','애플','M5'],'https://picsum.photos/seed/ipadm5/400/300',156,69,'normal',51],
  ['coolenjoy','3307','[네이버] 브리타 마렐라 XL 정수기 필터 6개입 (32,900원)','독일 정품. 1년 사용분.','32,900원',32900,'무료배송',true,'life',['브리타','정수기','필터'],'https://picsum.photos/seed/brita/400/300',27,21,'normal',53],
];

/** SQL 의 compute_rank_scores() 와 동일한 공식 */
function score(comments: number, view: number, hoursAgo: number, r: Raw) {
  const freshness = 100 * Math.exp(-0.0289 * Math.max(hoursAgo, 0));
  const reaction = Math.min(100, Math.log(1 + comments) * 22);
  const quality =
    (r[5] !== null ? 40 : 0) + (r[10] ? 30 : 0) + (r[3] ? 15 : 0) + (r[6] ? 15 : 0);
  const penalty = r[13] === 'soldout' ? -30 : r[13] === 'expired' ? -60 : 0;
  return {
    freshness_score: +freshness.toFixed(2),
    reaction_score: +reaction.toFixed(2),
    quality_score: quality,
    rank_score: +(reaction * 0.5 + view * 0.2 + freshness * 0.2 + quality * 0.1 + penalty).toFixed(2),
  };
}

/** 빌드 시점이 아니라 요청 시점 기준으로 상대시간이 계산되도록 함수로 노출 */
export function mockDeals(): DealWithSource[] {
  const now = Date.now();
  return RAW.map((r, i) => {
    const s = score(r[11], r[12], r[14], r);
    const src = MOCK_SOURCES.find((x) => x.id === r[0])!;
    const published = new Date(now - r[14] * 3600_000).toISOString();
    return {
      id: `mock-${String(i + 1).padStart(3, '0')}`,
      source_id: r[0],
      source_url: `${src.base_url}/deal/${r[1]}`,
      external_id: r[1],
      title: r[2],
      title_norm: null,
      summary: r[3],
      price_text: r[4],
      price_value: r[5],
      currency: 'KRW',
      shipping_text: r[6],
      shipping_free: r[7],
      category: r[8],
      tags: r[9],
      image_url: r[10],
      buy_url: null,
      comment_count: r[11],
      view_score: r[12],
      admin_boost: 0,
      is_pinned: false,
      is_hidden: false,
      is_reviewed: true,
      status: r[13],
      published_at: published,
      collected_at: published,
      checked_at: null,
      updated_at: published,
      source: { id: src.id, name: src.name, color: src.color },
      ...s,
    } satisfies DealWithSource;
  });
}
