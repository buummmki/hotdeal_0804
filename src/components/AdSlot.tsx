'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

/**
 * AdSense 슬롯 ID 는 항상 숫자 문자열입니다.
 * 자리표시자나 오타가 들어가면 잘못된 광고 요청이 나가 빈 자리만 남으므로,
 * 형식이 맞지 않으면 아예 렌더링하지 않습니다.
 */
function isValidSlot(slot?: string): slot is string {
  return !!slot && /^\d{6,}$/.test(slot.trim());
}

type Props = {
  /** AdSense 에서 광고 단위를 만들면 나오는 data-ad-slot 값 */
  slot?: string;
  /** 'auto' = 반응형, 'fluid' = 인피드용 */
  format?: 'auto' | 'fluid' | 'rectangle';
  /** 인피드 광고 단위를 쓸 때 AdSense 가 주는 레이아웃 키 */
  layoutKey?: string;
  className?: string;
  /** 최소 높이. 광고 로드 전 레이아웃이 밀리는(CLS) 걸 막습니다 */
  minHeight?: number;
  /**
   * 같은 경로에서 목록 내용이 바뀔 때(카테고리·정렬·페이지) 새 광고를 받기 위한 구분값.
   * 예: `${cat}-${sort}-${page}`
   */
  variant?: string;
  /**
   * 고정 크기 단위(예: 300×250)일 때 지정.
   * 고정 단위는 반응형 속성(data-ad-format, full-width-responsive)을 붙이면 안 되고
   * inline-block 에 크기를 직접 줘야 합니다.
   */
  fixed?: { width: number; height: number };
};

/**
 * AdSense 광고 슬롯.
 *
 * client ID 나 slot 이 비어 있으면 아무것도 렌더링하지 않습니다.
 * 그래서 광고 단위를 아직 안 만들었어도 배포에 문제가 없습니다.
 *
 * 정책상 유의점:
 *  - 광고임을 알 수 있게 라벨을 답니다.
 *  - 콘텐츠와 충분히 떨어뜨려 오클릭을 유도하지 않습니다.
 *  - 클릭을 권유하는 문구("클릭해주세요" 등)는 넣지 않습니다. 계정 정지 사유입니다.
 */
export default function AdSlot({
  slot,
  format = 'auto',
  layoutKey,
  className = '',
  minHeight = 280,
  variant,
  fixed,
}: Props) {
  // 화면이 바뀌면 같은 ins 를 재사용하지 않고 새로 마운트해야 광고가 다시 뜬다.
  //
  // useSearchParams() 를 쓰면 이 컴포넌트를 쓰는 페이지 전체가 정적 생성에서
  // 빠지므로, 쿼리 변화는 호출부가 variant 로 넘겨준다.
  const pathname = usePathname();
  const routeKey = `${pathname}|${variant ?? ''}`;

  const pushedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!CLIENT || !isValidSlot(slot)) return;
    // 같은 화면에서 중복 push 하면 "already have ads in them" 오류가 난다
    if (pushedFor.current === routeKey) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushedFor.current = routeKey;
    } catch {
      // 광고 차단기 등으로 실패해도 페이지 동작에는 영향이 없어야 함
    }
  }, [slot, routeKey]);

  if (!CLIENT || !isValidSlot(slot)) return null;

  return (
    <div className={`my-4 ${className}`} aria-label="광고">
      <div className="mb-1 text-[11px] leading-none text-muted">광고</div>
      {fixed ? (
        <ins
          key={routeKey}
          className="adsbygoogle"
          style={{ display: 'inline-block', width: fixed.width, height: fixed.height }}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
        />
      ) : (
        <ins
          key={routeKey}
          className="adsbygoogle block"
          style={{ display: 'block', minHeight }}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-ad-layout-key={layoutKey}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}

/** 슬롯 ID 를 환경변수로 관리 — AdSense 에서 단위를 만든 뒤 채우면 됩니다 */
export const AD_SLOTS = {
  feed: process.env.NEXT_PUBLIC_AD_SLOT_FEED,
  /** 인피드 단위를 만들면 슬롯 ID 와 함께 나오는 data-ad-layout-key */
  feedLayoutKey: process.env.NEXT_PUBLIC_AD_LAYOUT_KEY_FEED,
  sidebar: process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR,
  detail: process.env.NEXT_PUBLIC_AD_SLOT_DETAIL,
};
