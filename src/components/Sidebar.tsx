import AdSlot from './AdSlot';
import { CurationBlock } from './Curation';
import { AD_SLOTS } from '@/lib/ads';
import type { DealWithSource } from '@/lib/types';

/**
 * 데스크톱 전용 사이드바.
 *
 * 모바일에서는 이 영역이 통째로 숨겨지므로, 같은 내용을 MobileHotStrip 과
 * MobileCuration 으로 본문 흐름 안에 따로 배치합니다.
 * (유입의 대부분이 모바일이라 여기서만 보여주면 대부분의 방문자가 못 봅니다)
 */
export default function Sidebar({
  hot, latest, commented,
}: {
  hot: DealWithSource[];
  latest: DealWithSource[];
  commented: DealWithSource[];
}) {
  return (
    <aside className="hidden w-[300px] shrink-0 space-y-3 lg:block">
      <CurationBlock title="실시간 인기" deals={hot.slice(0, 7)} />
      {/* 첫 블록을 다 읽고 넘어가는 지점. 상단 고정보다 체류 후 노출이라 클릭 품질이 좋습니다. */}
      <AdSlot slot={AD_SLOTS.sidebar} fixed={{ width: 300, height: 250 }} className="!my-0" />
      <CurationBlock title="댓글 많은 딜" deals={commented.slice(0, 7)} />
      <CurationBlock title="방금 올라온 딜" deals={latest.slice(0, 7)} />
      <div className="rounded-xl border border-line bg-card p-4 text-[12px] leading-relaxed text-muted">
        <p className="mb-1 font-semibold text-fg">안내</p>
        <p>
          이 사이트는 각 커뮤니티에 게시된 특가 정보를 모아 보여줍니다. 실제 거래는 원문 및
          판매처에서 이루어지며, 가격·재고는 실시간과 다를 수 있습니다.
        </p>
      </div>
    </aside>
  );
}

/**
 * 모바일 하단 큐레이션.
 *
 * 목록을 다 본 뒤 이어서 볼 거리를 주는 자리라 이탈 대신 페이지뷰로 연결됩니다.
 * 사이드바 광고 단위(300×250)는 모바일 폭에도 그대로 들어갑니다.
 */
export function MobileCuration({
  latest, commented,
}: {
  latest: DealWithSource[];
  commented: DealWithSource[];
}) {
  return (
    <div className="mt-6 space-y-3 lg:hidden">
      <AdSlot slot={AD_SLOTS.sidebar} fixed={{ width: 300, height: 250 }} className="!my-0" />
      <CurationBlock title="댓글 많은 딜" deals={commented.slice(0, 7)} />
      <CurationBlock title="방금 올라온 딜" deals={latest.slice(0, 7)} />
      <div className="rounded-xl border border-line bg-card p-4 text-[12px] leading-relaxed text-muted">
        <p className="mb-1 font-semibold text-fg">안내</p>
        <p>
          이 사이트는 각 커뮤니티에 게시된 특가 정보를 모아 보여줍니다. 실제 거래는 원문 및
          판매처에서 이루어지며, 가격·재고는 실시간과 다를 수 있습니다.
        </p>
      </div>
    </div>
  );
}
