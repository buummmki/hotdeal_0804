'use client';

import { useEffect, useRef } from 'react';

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

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
}: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // 광고 차단기 등으로 실패해도 페이지 동작에는 영향이 없어야 함
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <div className={`my-4 ${className}`} aria-label="광고">
      <div className="mb-1 text-[11px] leading-none text-muted">광고</div>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block', minHeight }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/** 슬롯 ID 를 환경변수로 관리 — AdSense 에서 단위를 만든 뒤 채우면 됩니다 */
export const AD_SLOTS = {
  feed: process.env.NEXT_PUBLIC_AD_SLOT_FEED,
  sidebar: process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR,
  detail: process.env.NEXT_PUBLIC_AD_SLOT_DETAIL,
};
