/**
 * AdSense 설정값.
 *
 * ⚠️ 이 파일에 'use client' 를 넣지 마세요.
 *    'use client' 모듈에서 내보낸 값을 서버 컴포넌트가 import 하면
 *    실제 값이 아니라 클라이언트 참조가 넘어와 undefined 로 읽힙니다.
 *    page.tsx / Sidebar.tsx 같은 서버 컴포넌트가 슬롯 ID 를 읽어야 하므로
 *    설정값은 반드시 평범한 모듈에 둡니다.
 *
 * 환경변수는 붙여넣기 과정에서 앞뒤 공백이 섞이기 쉬워 항상 다듬어 씁니다.
 */
const clean = (v?: string) => v?.trim() || undefined;

export const ADSENSE_CLIENT = clean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);

export const AD_SLOTS = {
  /** 목록 인피드 */
  feed: clean(process.env.NEXT_PUBLIC_AD_SLOT_FEED),
  /** 인피드 단위를 만들면 슬롯 ID 와 함께 나오는 data-ad-layout-key */
  feedLayoutKey: clean(process.env.NEXT_PUBLIC_AD_LAYOUT_KEY_FEED),
  /** 사이드바 (고정 300×250) */
  sidebar: clean(process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR),
  /** 딜 상세 하단 (반응형) */
  detail: clean(process.env.NEXT_PUBLIC_AD_SLOT_DETAIL),
};

/**
 * AdSense 슬롯 ID 는 항상 숫자 문자열입니다.
 * 자리표시자나 오타가 들어가면 잘못된 광고 요청이 나가 빈 자리만 남으므로,
 * 형식이 맞지 않으면 아예 렌더링하지 않습니다.
 */
export function isValidSlot(slot?: string): slot is string {
  return !!slot && /^\d{6,}$/.test(slot.trim());
}
